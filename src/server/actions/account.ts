"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { canClientCancel } from "@/domain/booking/cancellation";
import { parseTstzRange } from "@/domain/time/range";
import { fullNameSchema, phoneSchema } from "@/lib/validation";
import { createSessionClient } from "@/server/auth/server-client";
import { getSessionUser } from "@/server/auth/session";
import {
  findClientForUser,
  upsertClientForUser,
} from "@/server/clients/service";
import { getBusinessInfo } from "@/server/content/queries";
import { createAdminClient } from "@/server/db/admin-client";
import { RATE_RULES, underLimit } from "@/server/security/rate-limit";
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

  const db = createAdminClient();
  const { data: appointment } = await db
    .from("appointments")
    .select("id, period, status")
    .eq("id", parsed.data.appointmentId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!appointment) return fail("Rendez-vous introuvable.");
  if (appointment.status !== "confirmed")
    return fail("Ce rendez-vous est déjà annulé ou passé.");

  const { policy } = await getBusinessInfo();
  const { start } = parseTstzRange(appointment.period as string);
  if (!canClientCancel(start, new Date(), policy.cancellationCutoffHours)) {
    return fail(
      `L'annulation en ligne n'est plus possible moins de ${policy.cancellationCutoffHours} h avant le rendez-vous. Contactez Alessia directement.`,
    );
  }

  const { error } = await db
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: "Annulé par la cliente",
    })
    .eq("id", appointment.id)
    .eq("status", "confirmed");
  if (error) {
    console.error("cancelMyAppointment", error);
    return fail(GENERIC_ERROR);
  }
  return { ok: true };
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
      }
      // Notes, waitlist entries cascade; appointments keep no link to the person.
      await db.from("clients").delete().eq("id", client.id);
      if (client.email)
        await db
          .from("notification_log")
          .update({ recipient: "supprimé" })
          .eq("recipient", client.email);
    }
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
