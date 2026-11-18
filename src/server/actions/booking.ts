"use server";

import { z } from "zod";
import {
  type Slot,
  computeDaySlots,
  isSlotBookable,
} from "@/domain/availability/engine";
import { parisDate } from "@/domain/time/paris";
import { looksLikeBot } from "@/lib/anti-bot";
import { fullNameSchema, phoneSchema } from "@/lib/validation";
import { getSessionUser } from "@/server/auth/session";
import {
  AvailabilityError,
  dayInput,
  loadCalendar,
  resolveBookableService,
} from "@/server/availability/service";
import {
  findClientForUser,
  upsertClientForUser,
} from "@/server/clients/service";
import { createAdminClient } from "@/server/db/admin-client";
import {
  RATE_RULES,
  underIpLimit,
  underLimit,
} from "@/server/security/rate-limit";
import { GENERIC_ERROR, TOO_MANY, fieldErrorsOf } from "./result";

const bookingSchema = z.object({
  serviceId: z.uuid(),
  variantId: z.uuid().nullish(),
  start: z.iso.datetime({ offset: true }).transform((v) => new Date(v)),
  fullName: fullNameSchema,
  phone: phoneSchema,
  acceptPrivacy: z.boolean(),
  note: z.string().trim().max(500, "500 caractères maximum.").optional(),
  honeypot: z.string().optional(),
  renderedAt: z.number().optional(),
});

export type PublicSlot = {
  start: string;
  end: string;
  time: string;
  status: Slot["status"];
};

export type BookingResult =
  | { ok: true; appointmentId: string }
  | {
      ok: false;
      code:
        | "AUTH_REQUIRED"
        | "INVALID"
        | "SLOT_UNAVAILABLE"
        | "SERVICE_UNAVAILABLE"
        | "RATE_LIMITED"
        | "ERROR";
      error: string;
      fieldErrors?: Record<string, string>;
      /** Up-to-date start times for the same day, when the slot was just taken. */
      slots?: PublicSlot[];
    };

const SLOT_TAKEN_MESSAGE =
  "Ce créneau vient d'être réservé par quelqu'un d'autre. Voici les horaires mis à jour : choisissez-en un autre.";

/** The generated RPC types mark every SQL argument as required, but the function accepts NULL. */
const sqlNull = <T>(value: T | null | undefined) => (value ?? null) as T;

const toPublic = (slots: Slot[]): PublicSlot[] =>
  slots.map((s) => ({
    start: s.start.toISOString(),
    end: s.end.toISOString(),
    time: s.time,
    status: s.status,
  }));

/**
 * Confirms a booking. Everything is re-validated on the server: session,
 * consent, input, and availability (same engine as the slots shown), then the
 * SQL guard writes under a per-day lock.
 */
export async function confirmBooking(input: unknown): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID",
      error: "Vérifiez les informations saisies.",
      fieldErrors: fieldErrorsOf(parsed.error.issues),
    };
  }
  const data = parsed.data;
  if (looksLikeBot(data))
    return { ok: false, code: "ERROR", error: GENERIC_ERROR };

  const user = await getSessionUser();
  if (!user)
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      error: "Votre session a expiré : confirmez à nouveau votre e-mail.",
    };

  if (
    !(await underIpLimit(RATE_RULES.bookingPerIp)) ||
    !(await underLimit(RATE_RULES.bookingPerUser, user.id))
  ) {
    return { ok: false, code: "RATE_LIMITED", error: TOO_MANY };
  }

  try {
    const existing = await findClientForUser(user);
    if (!existing?.privacyAcceptedAt && !data.acceptPrivacy) {
      return {
        ok: false,
        code: "INVALID",
        error:
          "Merci d'accepter la politique de confidentialité pour réserver.",
        fieldErrors: { acceptPrivacy: "Obligatoire pour réserver." },
      };
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
    const now = new Date();
    const day = parisDate(data.start);
    const freshSlots = async () => {
      const ctx = await loadCalendar(day, day, now);
      return computeDaySlots(dayInput(ctx, day, service.durationMin, now));
    };

    // Final re-check with the very same engine that produced the slots.
    const ctx = await loadCalendar(day, day, now);
    if (
      !isSlotBookable(dayInput(ctx, day, service.durationMin, now), data.start)
    ) {
      return {
        ok: false,
        code: "SLOT_UNAVAILABLE",
        error: SLOT_TAKEN_MESSAGE,
        slots: toPublic(await freshSlots()),
      };
    }

    const db = createAdminClient();
    const { data: appointmentId, error } = await db.rpc("create_appointment", {
      p_client_id: client.id,
      p_service_id: service.serviceId,
      p_variant_id: sqlNull(service.variantId),
      p_service_name: service.serviceName,
      p_variant_name: sqlNull(service.variantName),
      p_duration_min: service.durationMin,
      p_price_cents: sqlNull(service.priceCents),
      p_start: data.start.toISOString(),
      p_source: "online",
      p_client_note: sqlNull(data.note || null),
      p_created_by: user.id,
    });

    if (error) {
      if (["SLOT_TAKEN", "SLOT_BLOCKED", "SLOT_HELD"].includes(error.message)) {
        // A double click by the same client is not a conflict.
        const { data: mine } = await db
          .from("appointments")
          .select("id")
          .eq("client_id", client.id)
          .eq("status", "confirmed")
          .eq("duration_min", service.durationMin)
          .filter(
            "period",
            "cs",
            `[${data.start.toISOString()},${data.start.toISOString()}]`,
          )
          .maybeSingle();
        if (mine) return { ok: true, appointmentId: mine.id };
        return {
          ok: false,
          code: "SLOT_UNAVAILABLE",
          error: SLOT_TAKEN_MESSAGE,
          slots: toPublic(await freshSlots()),
        };
      }
      throw error;
    }

    return { ok: true, appointmentId: appointmentId as string };
  } catch (error) {
    if (
      error instanceof AvailabilityError &&
      error.code === "SERVICE_UNAVAILABLE"
    ) {
      return {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        error: "Cette prestation n'est plus réservable en ligne.",
      };
    }
    console.error("confirmBooking", error);
    return { ok: false, code: "ERROR", error: GENERIC_ERROR };
  }
}
