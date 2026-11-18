import "server-only";
import {
  type AvailabilitySettings,
  type BusyInterval,
  type DayInput,
  type DayOverride,
  type DayStatus,
  type Slot,
  computeDaySlots,
  computeDayStatus,
} from "@/domain/availability/engine";
import type {
  IsoWeekday,
  OpeningWindow,
} from "@/domain/schedule/opening-hours";
import {
  type LocalDate,
  addDays,
  parisInstant,
  toLocalTime,
} from "@/domain/time/paris";
import { parseTstzRange, toTstzRange } from "@/domain/time/range";
import { createAdminClient } from "@/server/db/admin-client";

/**
 * Loads everything the availability engine needs from the database and runs
 * it. Never cached: availability must reflect the calendar at this instant.
 */

export class AvailabilityError extends Error {
  constructor(
    public readonly code: "SERVICE_UNAVAILABLE" | "LOAD_FAILED",
    cause?: unknown,
  ) {
    super(code, { cause });
    this.name = "AvailabilityError";
  }
}

export type CalendarContext = {
  settings: AvailabilitySettings;
  weeklyHours: OpeningWindow[];
  overrides: Map<LocalDate, DayOverride>;
  busy: Array<BusyInterval & { offerId?: string }>;
};

export type BookableService = {
  serviceId: string;
  variantId: string | null;
  serviceName: string;
  variantName: string | null;
  durationMin: number;
  priceCents: number | null;
};

const overrideHoursSchema = (value: unknown): DayOverride["customHours"] => {
  if (!Array.isArray(value)) return null;
  return value
    .filter(
      (w): w is { opens: string; closes: string } =>
        typeof w?.opens === "string" && typeof w?.closes === "string",
    )
    .map((w) => ({
      opens: toLocalTime(w.opens),
      closes: toLocalTime(w.closes),
    }));
};

/** Loads the calendar for [from, to] (Paris days, inclusive). */
export async function loadCalendar(
  from: LocalDate,
  to: LocalDate,
  now: Date,
): Promise<CalendarContext> {
  const db = createAdminClient();
  const range = toTstzRange({
    start: parisInstant(from, "00:00"),
    end: parisInstant(addDays(to, 1), "00:00"),
  });

  const [settings, hours, overrides, appointments, blocks, holds] =
    await Promise.all([
      db
        .from("business_settings")
        .select(
          "min_notice_minutes, max_advance_days, reference_starts, evening_lock_from",
        )
        .single(),
      db.from("opening_hours").select("weekday, opens, closes"),
      db
        .from("day_overrides")
        .select("day, closed, evening_unlocked, custom_hours")
        .gte("day", from)
        .lte("day", to),
      db
        .from("appointments")
        .select("period")
        .neq("status", "cancelled")
        .overlaps("period", range),
      db.from("blocks").select("period").overlaps("period", range),
      db
        .from("slot_holds")
        .select("period, offer_id")
        .is("released_at", null)
        .gt("expires_at", now.toISOString())
        .overlaps("period", range),
    ]);

  const failure = [
    settings,
    hours,
    overrides,
    appointments,
    blocks,
    holds,
  ].find((r) => r.error);
  if (failure?.error) throw new AvailabilityError("LOAD_FAILED", failure.error);

  return {
    settings: {
      minNoticeMinutes: settings.data!.min_notice_minutes,
      maxAdvanceDays: settings.data!.max_advance_days,
      referenceStarts: settings.data!.reference_starts.map(toLocalTime),
      eveningLockFrom: settings.data!.evening_lock_from
        ? toLocalTime(settings.data!.evening_lock_from)
        : null,
    },
    weeklyHours: hours.data!.map((h) => ({
      weekday: h.weekday as IsoWeekday,
      opens: h.opens,
      closes: h.closes,
    })),
    overrides: new Map(
      overrides.data!.map((o) => [
        o.day,
        {
          closed: o.closed,
          eveningUnlocked: o.evening_unlocked,
          customHours: overrideHoursSchema(o.custom_hours),
        },
      ]),
    ),
    busy: [
      ...appointments.data!.map((a) => ({
        ...parseTstzRange(a.period as string),
        kind: "appointment" as const,
      })),
      ...blocks.data!.map((b) => ({
        ...parseTstzRange(b.period as string),
        kind: "block" as const,
      })),
      ...holds.data!.map((h) => ({
        ...parseTstzRange(h.period as string),
        kind: "hold" as const,
        offerId: h.offer_id,
      })),
    ],
  };
}

/** Engine input for one day. `ownOfferId`: the caller's waitlist hold does not block her. */
export function dayInput(
  ctx: CalendarContext,
  day: LocalDate,
  durationMin: number,
  now: Date,
  ownOfferId?: string,
): DayInput {
  return {
    day,
    durationMin,
    now,
    settings: ctx.settings,
    weeklyHours: ctx.weeklyHours,
    override: ctx.overrides.get(day) ?? null,
    busy: ctx.busy.filter(
      (b) => !(b.kind === "hold" && ownOfferId && b.offerId === ownOfferId),
    ),
  };
}

/** Resolves an active, online-bookable service (and variant) to its duration and price. */
export async function resolveBookableService(
  serviceId: string,
  variantId?: string | null,
): Promise<BookableService> {
  const db = createAdminClient();
  const { data: service, error } = await db
    .from("services")
    .select(
      "id, name, duration_min, price_cents, is_active, bookable_online, service_variants (id, name, duration_min, price_cents, is_active)",
    )
    .eq("id", serviceId)
    .maybeSingle();
  if (error) throw new AvailabilityError("LOAD_FAILED", error);
  if (!service || !service.is_active || !service.bookable_online)
    throw new AvailabilityError("SERVICE_UNAVAILABLE");

  const activeVariants = service.service_variants.filter((v) => v.is_active);
  const variant = variantId
    ? activeVariants.find((v) => v.id === variantId)
    : undefined;
  if (variantId && !variant) throw new AvailabilityError("SERVICE_UNAVAILABLE");

  return {
    serviceId: service.id,
    variantId: variant?.id ?? null,
    serviceName: service.name,
    variantName: variant?.name ?? null,
    durationMin: variant?.duration_min ?? service.duration_min,
    priceCents: variant?.price_cents ?? service.price_cents,
  };
}

export async function getDaySlots(params: {
  serviceId: string;
  variantId?: string | null;
  day: LocalDate;
  now?: Date;
  ownOfferId?: string;
}): Promise<{ service: BookableService; slots: Slot[] }> {
  const now = params.now ?? new Date();
  const service = await resolveBookableService(
    params.serviceId,
    params.variantId,
  );
  const ctx = await loadCalendar(params.day, params.day, now);
  return {
    service,
    slots: computeDaySlots(
      dayInput(ctx, params.day, service.durationMin, now, params.ownOfferId),
    ),
  };
}

export async function getDaysOverview(params: {
  serviceId: string;
  variantId?: string | null;
  from: LocalDate;
  days: number;
  now?: Date;
}): Promise<Array<{ day: LocalDate; status: DayStatus }>> {
  const now = params.now ?? new Date();
  const service = await resolveBookableService(
    params.serviceId,
    params.variantId,
  );
  const to = addDays(params.from, params.days - 1);
  const ctx = await loadCalendar(params.from, to, now);
  return Array.from({ length: params.days }, (_, i) => {
    const day = addDays(params.from, i);
    return {
      day,
      status: computeDayStatus(dayInput(ctx, day, service.durationMin, now)),
    };
  });
}
