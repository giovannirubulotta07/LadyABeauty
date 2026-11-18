"use server";

import { after } from "next/server";
import { z } from "zod";
import { isLocalDate } from "@/domain/time/paris";
import { looksLikeBot } from "@/lib/anti-bot";
import { fullNameSchema, phoneSchema } from "@/lib/validation";
import { getSessionUser } from "@/server/auth/session";
import {
  AvailabilityError,
  resolveBookableService,
} from "@/server/availability/service";
import {
  findClientForUser,
  upsertClientForUser,
} from "@/server/clients/service";
import { notifyBookingConfirmed } from "@/server/notifications/events";
import {
  RATE_RULES,
  underIpLimit,
  underLimit,
} from "@/server/security/rate-limit";
import {
  findOfferByToken,
  leaveWaitlist,
  processWaitlistDay,
  redeemOffer,
  registerOnWaitlist,
  release,
} from "@/server/waitlist/service";
import {
  type ActionResult,
  GENERIC_ERROR,
  TOO_MANY,
  fail,
  fieldErrorsOf,
} from "./result";

const joinSchema = z.object({
  serviceId: z.uuid(),
  variantId: z.uuid().nullish(),
  day: z.string().refine(isLocalDate),
  fullName: fullNameSchema,
  phone: phoneSchema,
  acceptPrivacy: z.boolean(),
  honeypot: z.string().optional(),
  renderedAt: z.number().optional(),
});

/** Registers the signed-in client on the waitlist for one day and one service. */
export async function joinWaitlist(
  input: unknown,
): Promise<ActionResult<{ alreadyRegistered: boolean }>> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success)
    return fail(
      "Vérifiez les informations saisies.",
      fieldErrorsOf(parsed.error.issues),
    );
  const data = parsed.data;
  if (looksLikeBot(data)) return fail(GENERIC_ERROR);

  const user = await getSessionUser();
  if (!user)
    return fail("Votre session a expiré : confirmez à nouveau votre e-mail.");
  if (
    !(await underIpLimit(RATE_RULES.bookingPerIp)) ||
    !(await underLimit(RATE_RULES.bookingPerUser, user.id))
  ) {
    return fail(TOO_MANY);
  }

  try {
    const existing = await findClientForUser(user);
    if (!existing?.privacyAcceptedAt && !data.acceptPrivacy) {
      return fail("Merci d'accepter la politique de confidentialité.", {
        acceptPrivacy: "Obligatoire.",
      });
    }
    const client = await upsertClientForUser(user, {
      fullName: data.fullName,
      phone: data.phone,
      acceptPrivacy: data.acceptPrivacy,
    });
    const service = await resolveBookableService(
      data.serviceId,
      data.variantId,
    );
    const result = await registerOnWaitlist({
      clientId: client.id,
      serviceId: service.serviceId,
      variantId: service.variantId,
      durationMin: service.durationMin,
      day: data.day,
    });
    if (!result.ok) return fail(result.error);
    return { ok: true, data: { alreadyRegistered: result.alreadyRegistered } };
  } catch (error) {
    if (error instanceof AvailabilityError)
      return fail("Cette prestation n'est plus réservable en ligne.");
    console.error("joinWaitlist", error);
    return fail(GENERIC_ERROR);
  }
}

export async function leaveWaitlistEntry(
  input: unknown,
): Promise<ActionResult> {
  const parsed = z.object({ entryId: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Inscription introuvable.");
  const user = await getSessionUser();
  if (!user) return fail("Votre session a expiré. Reconnectez-vous.");
  const client = await findClientForUser(user);
  if (!client) return fail("Inscription introuvable.");

  const day = await leaveWaitlist(parsed.data.entryId, client.id);
  if (!day) return fail("Inscription introuvable ou déjà terminée.");
  after(() => processWaitlistDay(day));
  return { ok: true };
}

const tokenSchema = z.object({ token: z.string().min(20).max(200) });

export type RedeemActionResult =
  | { ok: true; appointmentId: string }
  | { ok: false; error: string; code?: "EXPIRED" | "TAKEN" | "UNAVAILABLE" };

/** "Réserver ce créneau" from the offer e-mail. The secret link identifies her: no login needed. */
export async function redeemWaitlistOffer(
  input: unknown,
): Promise<RedeemActionResult> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Lien invalide." };
  if (!(await underIpLimit(RATE_RULES.bookingPerIp)))
    return { ok: false, error: TOO_MANY };

  const offer = await findOfferByToken(parsed.data.token);
  if (!offer) return { ok: false, error: "Lien invalide." };
  try {
    const result = await redeemOffer(offer);
    if (result.ok) {
      after(() => notifyBookingConfirmed(result.appointmentId));
      return result;
    }
    if (result.day) {
      const day = result.day;
      after(() => processWaitlistDay(day));
    }
    const messages = {
      EXPIRED:
        "Le délai de réservation de ce créneau est écoulé : il a été proposé à la personne suivante.",
      TAKEN:
        "Trop tard : ce créneau vient d'être réservé. Vous restez sur la liste d'attente.",
      UNAVAILABLE: "Ce créneau n'est plus disponible.",
    } as const;
    return { ok: false, code: result.code, error: messages[result.code] };
  } catch (error) {
    console.error("redeemWaitlistOffer", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

/** "Laisser ma place": the next client is served right away. */
export async function declineWaitlistOffer(
  input: unknown,
): Promise<ActionResult> {
  const parsed = tokenSchema.safeParse(input);
  if (!parsed.success) return fail("Lien invalide.");
  const offer = await findOfferByToken(parsed.data.token);
  if (!offer || offer.status !== "offered")
    return fail("Cette proposition n'est plus active.");
  const day = await release(offer.offerId);
  if (day) after(() => processWaitlistDay(day));
  return { ok: true };
}
