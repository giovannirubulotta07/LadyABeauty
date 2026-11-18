"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { parseTstzRange } from "@/domain/time/range";
import { fullNameSchema, phoneSchema } from "@/lib/validation";
import { createSessionClient } from "@/server/auth/server-client";
import { getSessionUser } from "@/server/auth/session";
import {
  findClientForUser,
  upsertClientForUser,
} from "@/server/clients/service";
import { cancelAsClient } from "@/server/appointments/cancel";
import { createAdminClient } from "@/server/db/admin-client";
import { notifyAppointmentCancelled } from "@/server/notifications/events";
import { readLinkToken } from "@/server/security/tokens";
import { processAllWaitlistDays } from "@/server/waitlist/service";
import {
  RATE_RULES,
  underIpLimit,
  underLimit,
} from "@/server/security/rate-limit";
import {
  type ActionResult,
  GENERIC_ERROR,
  TOO_MANY,
  fail,
  fieldErrorsOf,
} from "./result";

const SESSION_EXPIRED = "Votre session a expiré. Reconnectez-vous.";

async function requireUser() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!(await underLimit(RATE_RULES.accountPerUser, user.id)))
    return "limited" as const;
  return user;
}

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      fullName: fullNameSchema,
      phone: phoneSchema,
      acceptPrivacy: z.boolean().optional(),
    })
    .safeParse(input);
  if (!parsed.success)
    return fail("Vérifiez les champs.", fieldErrorsOf(parsed.error.issues));

  const user = await requireUser();
  if (!user) return fail(SESSION_EXPIRED);
  if (user === "limited") return fail(TOO_MANY);

  const existing = await findClientForUser(user);
  if (!existing?.privacyAcceptedAt && !parsed.data.acceptPrivacy) {
    return fail("Merci d'accepter la politique de confidentialité.", {
      acceptPrivacy: "Obligatoire.",
    });
  }
  try {
    await upsertClientForUser(user, {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      acceptPrivacy: parsed.data.acceptPrivacy ?? false,
    });
    return { ok: true };
  } catch (error) {
    console.error("saveProfile", error);
    return fail(GENERIC_ERROR);
  }
}

/** Her preferences for Alessia (effect, curl, length…), on her own row. */
export async function savePreferences(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({
      preferences: z.string().trim().max(600, "600 caractères au maximum."),
    })
    .safeParse(input);
  if (!parsed.success)
    return fail("Vérifiez le texte.", fieldErrorsOf(parsed.error.issues));

  const user = await requireUser();
  if (!user) return fail(SESSION_EXPIRED);
  if (user === "limited") return fail(TOO_MANY);

  try {
    // Session client: RLS (own row) and the column grant both apply.
    const supabase = await createSessionClient();
    const { data, error } = await supabase
      .from("clients")
      .update({ preferences: parsed.data.preferences || null })
      .eq("user_id", user.id)
      .select("id");
    if (error) throw error;
    if (!data.length) return fail("Complétez d’abord vos informations.");
    return { ok: true };
  } catch (error) {
    console.error("savePreferences", error);
    return fail(GENERIC_ERROR);
  }
}

export async function cancelMyAppointment(
  input: unknown,
): Promise<ActionResult> {
  const parsed = z.object({ appointmentId: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Rendez-vous introuvable.");

  const user = await requireUser();
  if (!user) return fail(SESSION_EXPIRED);
  if (user === "limited") return fail(TOO_MANY);

  const client = await findClientForUser(user);
  if (!client) return fail("Rendez-vous introuvable.");

  const result = await cancelAsClient(parsed.data.appointmentId, {
    clientId: client.id,
    actorUserId: user.id,
  });
  return result.ok ? { ok: true } : fail(result.error);
}

/** Cancellation from the signed "Gérer mon rendez-vous" link in e-mails (no login needed). */
export async function cancelWithManageLink(
  input: unknown,
): Promise<ActionResult> {
  const parsed = z
    .object({ token: z.string().min(10).max(1000) })
    .safeParse(input);
  if (!parsed.success) return fail("Lien invalide.");
  const appointmentId = readLinkToken(parsed.data.token, "manage");
  if (!appointmentId)
    return fail(
      "Ce lien a expiré. Connectez-vous à votre espace pour gérer vos rendez-vous.",
    );
  if (!(await underIpLimit(RATE_RULES.loginPerIp))) return fail(TOO_MANY);

  const result = await cancelAsClient(appointmentId);
  return result.ok ? { ok: true } : fail(result.error);
}

/**
 * RGPD: deletes the account and the client's personal data. Future
 * appointments are cancelled; past ones are kept anonymised (no name, no
 * contact) for the studio's accounting.
 */
export async function deleteMyAccount(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ confirmation: z.literal("SUPPRIMER") })
    .safeParse(input);
  if (!parsed.success)
    return fail("Saisissez SUPPRIMER pour confirmer.", {
      confirmation: "Saisissez SUPPRIMER.",
    });

  const user = await requireUser();
  if (!user) return fail(SESSION_EXPIRED);
  if (user === "limited") return fail(TOO_MANY);

  const db = createAdminClient();
  try {
    const client = await findClientForUser(user);
    if (client) {
      const now = new Date().toISOString();
      const { data: upcoming } = await db
        .from("appointments")
        .select("id, period")
        .eq("client_id", client.id)
        .eq("status", "confirmed");
      const futureIds = (upcoming ?? [])
        .filter((a) => parseTstzRange(a.period as string).start > new Date())
        .map((a) => a.id);
      if (futureIds.length > 0) {
        await db
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_at: now,
            cancellation_reason: "Compte supprimé par la cliente",
          })
          .in("id", futureIds);
        // Tell Alessia now, while the client's name is still known; then
        // offer the freed slots to the waitlist.
        await Promise.all(
          futureIds.map((id) =>
            notifyAppointmentCancelled(id, {
              by: "client",
              notifyClient: false,
            }),
          ),
        );
      }
      // Notes, waitlist entries cascade; appointments keep no link to the person.
      await db.from("clients").delete().eq("id", client.id);
      if (client.email)
        await db
          .from("notification_log")
          .update({ recipient: "supprimé" })
          .eq("recipient", client.email);
    }
    after(() => processAllWaitlistDays());
    const { error } = await db.auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (error) {
    console.error("deleteMyAccount", error);
    return fail(GENERIC_ERROR);
  }

  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/compte-supprime");
}
