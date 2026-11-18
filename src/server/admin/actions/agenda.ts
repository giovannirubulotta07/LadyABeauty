"use server";

import { after } from "next/server";
import { z } from "zod";
import { studioSettings } from "@/domain/admin/agenda";
import { computeDaySlots } from "@/domain/availability/engine";
import {
  type LocalDate,
  addDays,
  parisDate,
  parisInstant,
} from "@/domain/time/paris";
import { parseTstzRange, toTstzRange } from "@/domain/time/range";
import {
  blankToUndefined,
  booleanish,
  emailSchema,
  fullNameSchema,
  localDateSchema,
  localTimeSchema,
  phoneSchema,
} from "@/lib/validation";
import { type ActionResult, fail } from "@/server/actions/result";
import { dayInput, loadCalendar } from "@/server/availability/service";
import { createAdminClient } from "@/server/db/admin-client";
import {
  notifyAppointmentCancelled,
  notifyAppointmentMoved,
  notifyBookingConfirmed,
} from "@/server/notifications/events";
import { leaveWaitlist, processWaitlistDay } from "@/server/waitlist/service";
import { CALENDAR_ERRORS, adminAction } from "../action-utils";
import { resolveStudioService } from "../catalog";

/** SQL accepts NULL for optional arguments; the generated types do not say so. */
const sqlNull = <T>(value: T | null | undefined) => (value ?? null) as T;

/** Re-offers the freed slots of these days to the waitlist, after the response. */
function reofferDays(days: Iterable<LocalDate>) {
  const unique = [...new Set(days)];
  after(async () => {
    for (const day of unique) {
      try {
        await processWaitlistDay(day);
      } catch (error) {
        console.error("waitlist after admin change", day, error);
      }
    }
  });
}

/** Paris days touched by a period (capped: a long holiday frees nothing worth scanning). */
function daysOf(start: Date, end: Date, max = 62): LocalDate[] {
  const out: LocalDate[] = [];
  let day = parisDate(start);
  const last = parisDate(new Date(end.getTime() - 1));
  while (day <= last && out.length < max) {
    out.push(day);
    day = addDays(day, 1);
  }
  return out;
}

const durationSchema = z.coerce
  .number()
  .int("Durée invalide.")
  .min(5, "5 min minimum.")
  .max(480, "8 h maximum.");

// ---------------------------------------------------------------------------
// Suggested start times (same engine as online booking, studio rules)
// ---------------------------------------------------------------------------
const suggestSchema = z.object({
  day: localDateSchema,
  durationMin: durationSchema,
  /** When moving: the appointment's own time does not count as busy. */
  ignoreAppointmentId: z.uuid().optional(),
});

export async function suggestStarts(
  input: unknown,
): Promise<ActionResult<{ times: string[] }>> {
  return adminAction(
    suggestSchema,
    input,
    async ({ day, durationMin, ignoreAppointmentId }) => {
      const now = new Date();
      const ctx = await loadCalendar(day, day, now);
      if (ignoreAppointmentId) {
        const { data } = await createAdminClient()
          .from("appointments")
          .select("period")
          .eq("id", ignoreAppointmentId)
          .maybeSingle();
        if (data) {
          const own = parseTstzRange(data.period as string);
          ctx.busy = ctx.busy.filter(
            (b) =>
              !(
                b.kind === "appointment" &&
                b.start.getTime() === own.start.getTime() &&
                b.end.getTime() === own.end.getTime()
              ),
          );
        }
      }
      ctx.settings = studioSettings(ctx.settings);
      const slots = computeDaySlots(dayInput(ctx, day, durationMin, now));
      return { ok: true, data: { times: slots.map((s) => s.time) } };
    },
    { refreshView: false },
  );
}

// ---------------------------------------------------------------------------
// Create an appointment for a client (phone, Instagram, walk-in)
// ---------------------------------------------------------------------------
const createSchema = z
  .object({
    clientId: z.preprocess(blankToUndefined, z.uuid().optional()),
    newClient: z
      .object({
        fullName: fullNameSchema,
        email: z.preprocess(blankToUndefined, emailSchema.optional()),
        phone: z.preprocess(blankToUndefined, phoneSchema.optional()),
      })
      .optional(),
    serviceId: z.uuid("Choisissez une prestation."),
    variantId: z.preprocess(blankToUndefined, z.uuid().optional()),
    day: localDateSchema,
    time: localTimeSchema,
    durationMin: z.preprocess(blankToUndefined, durationSchema.optional()),
    note: z.preprocess(
      blankToUndefined,
      z.string().trim().max(500, "500 caractères maximum.").optional(),
    ),
    notifyClient: booleanish,
  })
  .refine((v) => v.clientId || v.newClient, {
    message: "Choisissez une cliente ou créez-la.",
    path: ["clientId"],
  });

export async function createStudioAppointment(
  input: unknown,
): Promise<ActionResult<{ id: string; day: LocalDate }>> {
  return adminAction(createSchema, input, async (data, admin) => {
    const db = createAdminClient();
    const service = await resolveStudioService(data.serviceId, data.variantId);
    if (!service)
      return fail("Cette prestation n'est plus disponible.", {
        serviceId: "Prestation introuvable.",
      });

    let clientId = data.clientId;
    if (!clientId && data.newClient) {
      const { fullName, email, phone } = data.newClient;
      if (email) {
        const { data: existing } = await db
          .from("clients")
          .select("full_name")
          .eq("email", email)
          .maybeSingle();
        if (existing)
          return fail("Cette cliente existe déjà.", {
            email: `Cette adresse appartient à ${existing.full_name} : choisissez-la dans la liste.`,
          });
      }
      const { data: created, error } = await db
        .from("clients")
        .insert({
          full_name: fullName,
          email: email ?? null,
          phone: phone ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      clientId = created.id;
    }

    const durationMin = data.durationMin ?? service.durationMin;
    const start = parisInstant(data.day, data.time);
    const { data: id, error } = await db.rpc("create_appointment", {
      p_client_id: clientId!,
      p_service_id: service.serviceId,
      p_variant_id: sqlNull(service.variantId),
      p_service_name: service.serviceName,
      p_variant_name: sqlNull(service.variantName),
      p_duration_min: durationMin,
      p_price_cents: sqlNull(service.priceCents),
      p_start: start.toISOString(),
      p_source: "admin",
      p_client_note: sqlNull(data.note ?? null),
      p_created_by: admin.id,
    });
    if (error) throw error;
    const appointmentId = id as string;

    // Her waiting registrations for that day and service are now fulfilled.
    await db
      .from("waitlist_entries")
      .update({ status: "booked" })
      .eq("client_id", clientId!)
      .eq("service_id", service.serviceId)
      .eq("day", data.day)
      .in("status", ["waiting", "notified"]);

    after(() =>
      notifyBookingConfirmed(appointmentId, {
        notifyClient: data.notifyClient,
        notifyOwner: false,
      }),
    );
    return { ok: true, data: { id: appointmentId, day: data.day } };
  });
}

// ---------------------------------------------------------------------------
// Move, cancel, status
// ---------------------------------------------------------------------------
const moveSchema = z.object({
  id: z.uuid(),
  day: localDateSchema,
  time: localTimeSchema,
  durationMin: durationSchema,
  notifyClient: booleanish,
});

export async function moveStudioAppointment(
  input: unknown,
): Promise<ActionResult<{ day: LocalDate }>> {
  return adminAction(moveSchema, input, async (data) => {
    const start = parisInstant(data.day, data.time);
    const { data: previous, error } = await createAdminClient().rpc(
      "move_appointment",
      {
        p_appointment_id: data.id,
        p_start: start.toISOString(),
        p_duration_min: data.durationMin,
      },
    );
    if (error) throw error;
    const old = parseTstzRange(previous as string);
    if (data.notifyClient)
      after(() => notifyAppointmentMoved(data.id, old.start));
    // The previous time is free again.
    reofferDays(daysOf(old.start, old.end));
    return { ok: true, data: { day: data.day } };
  });
}

const cancelSchema = z.object({
  id: z.uuid(),
  reason: z.preprocess(
    blankToUndefined,
    z.string().trim().max(500, "500 caractères maximum.").optional(),
  ),
  notifyClient: booleanish,
});

export async function cancelStudioAppointment(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(cancelSchema, input, async (data, admin) => {
    const { data: updated, error } = await createAdminClient()
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: admin.id,
        cancellation_reason: data.reason ?? "Annulé par le studio",
      })
      .eq("id", data.id)
      .eq("status", "confirmed")
      .select("period");
    if (error) throw error;
    if (!updated?.length) return fail(CALENDAR_ERRORS.NOT_CONFIRMED!);

    const { start, end } = parseTstzRange(updated[0]!.period as string);
    after(() =>
      notifyAppointmentCancelled(data.id, {
        by: "studio",
        notifyClient: data.notifyClient,
        reason: data.reason,
      }),
    );
    reofferDays(daysOf(start, end));
    return { ok: true };
  });
}

const statusSchema = z.object({
  id: z.uuid(),
  status: z.enum(["confirmed", "completed", "no_show"]),
});

/** Marks a past appointment as done / missed (or back to confirmed). */
export async function setAppointmentStatus(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(statusSchema, input, async ({ id, status }) => {
    const { data, error } = await createAdminClient()
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .neq("status", "cancelled")
      .select("id");
    if (error) throw error;
    if (!data?.length) return fail(CALENDAR_ERRORS.NOT_CONFIRMED!);
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Evening slots ("sur demande" from 18:00) and blocks
// ---------------------------------------------------------------------------
const eveningSchema = z.object({ day: localDateSchema, unlocked: booleanish });

export async function setEveningUnlocked(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(eveningSchema, input, async ({ day, unlocked }) => {
    const { error } = await createAdminClient()
      .from("day_overrides")
      .upsert({ day, evening_unlocked: unlocked }, { onConflict: "day" });
    if (error) throw error;
    // Newly opened evening times may suit someone on the waitlist.
    if (unlocked) reofferDays([day]);
    return { ok: true };
  });
}

const blockSchema = z
  .object({
    from: localDateSchema,
    to: localDateSchema,
    allDay: booleanish,
    startTime: z.preprocess(blankToUndefined, localTimeSchema.optional()),
    endTime: z.preprocess(blankToUndefined, localTimeSchema.optional()),
    reason: z.preprocess(
      blankToUndefined,
      z.string().trim().max(200, "200 caractères maximum.").optional(),
    ),
  })
  .refine((v) => v.to >= v.from, {
    message: "La fin doit être après le début.",
    path: ["to"],
  })
  .refine((v) => v.allDay || (v.startTime && v.endTime), {
    message: "Indiquez les heures, ou cochez « Journée entière ».",
    path: ["startTime"],
  })
  .refine(
    (v) =>
      v.allDay ||
      !v.startTime ||
      !v.endTime ||
      parisInstant(v.to, v.endTime) > parisInstant(v.from, v.startTime),
    { message: "La fin doit être après le début.", path: ["endTime"] },
  );

export async function createStudioBlock(input: unknown): Promise<ActionResult> {
  return adminAction(blockSchema, input, async (data, admin) => {
    const period = data.allDay
      ? {
          start: parisInstant(data.from, "00:00"),
          end: parisInstant(addDays(data.to, 1), "00:00"),
        }
      : {
          start: parisInstant(data.from, data.startTime!),
          end: parisInstant(data.to, data.endTime!),
        };
    const { error } = await createAdminClient().rpc("create_block", {
      p_period: toTstzRange(period),
      p_reason: sqlNull(data.reason ?? null),
      p_created_by: admin.id,
    });
    if (error?.message === "SLOT_TAKEN")
      return fail(
        "Des rendez-vous existent sur cette période : déplacez-les ou annulez-les d'abord.",
      );
    if (error) throw error;
    return { ok: true };
  });
}

export async function deleteStudioBlock(input: unknown): Promise<ActionResult> {
  return adminAction(z.object({ id: z.uuid() }), input, async ({ id }) => {
    const { data, error } = await createAdminClient()
      .from("blocks")
      .delete()
      .eq("id", id)
      .select("period");
    if (error) throw error;
    if (data?.[0]) {
      const { start, end } = parseTstzRange(data[0].period as string);
      reofferDays(daysOf(start, end));
    }
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------
export async function removeWaitlistEntry(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(z.object({ id: z.uuid() }), input, async ({ id }) => {
    const day = await leaveWaitlist(id, null);
    if (day) reofferDays([day]);
    return { ok: true };
  });
}

export async function offerFreedSlotsNow(
  input: unknown,
): Promise<ActionResult<{ offered: number }>> {
  return adminAction(
    z.object({ day: localDateSchema }),
    input,
    async ({ day }) => {
      const { offered } = await processWaitlistDay(day);
      return { ok: true, data: { offered } };
    },
  );
}
