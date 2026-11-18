import "server-only";
import { freeGaps, weekDays } from "@/domain/admin/agenda";
import { type DayOverride, openingWindows } from "@/domain/availability/engine";
import type {
  IsoWeekday,
  OpeningWindow,
} from "@/domain/schedule/opening-hours";
import {
  type LocalDate,
  addDays,
  parisDate,
  parisInstant,
  parisTime,
  toLocalTime,
} from "@/domain/time/paris";
import {
  type Interval,
  parseTstzRange,
  toTstzRange,
} from "@/domain/time/range";
import { createAdminClient } from "@/server/db/admin-client";
import { requireAdmin } from "./guard";

export type AppointmentStatus =
  "confirmed" | "cancelled" | "completed" | "no_show";

export type AgendaAppointment = {
  id: string;
  start: Date;
  end: Date;
  time: string;
  endTime: string;
  status: AppointmentStatus;
  source: "online" | "admin" | "waitlist";
  serviceLabel: string;
  durationMin: number;
  priceCents: number | null;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  clientEmail: string | null;
  note: string | null;
};

export type AgendaBlock = {
  id: string;
  start: Date;
  end: Date;
  /** Paris times on this day ("00:00"–"24:00" when the block spans it). */
  fromTime: string;
  toTime: string;
  coversDay: boolean;
  reason: string | null;
};

export type AgendaHold = {
  start: Date;
  end: Date;
  time: string;
  endTime: string;
  clientName: string;
  expiresAt: Date;
};

export type AgendaWaitlistEntry = {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string | null;
  serviceLabel: string;
  durationMin: number;
  status: "waiting" | "notified";
  createdAt: Date;
};

export type AgendaDay = {
  day: LocalDate;
  windows: Array<{ opens: string; closes: string }>;
  eveningLockFrom: string | null;
  eveningUnlocked: boolean;
  /** Some opening time is at or after the evening lock (so the toggle matters). */
  hasEvening: boolean;
  appointments: AgendaAppointment[];
  cancelled: AgendaAppointment[];
  blocks: AgendaBlock[];
  holds: AgendaHold[];
  free: Array<{ start: Date; end: Date; time: string; endTime: string }>;
  waitlist: AgendaWaitlistEntry[];
};

const label = (service: string, variant: string | null) =>
  [service, variant].filter(Boolean).join(" — ");

const dayRange = (from: LocalDate, to: LocalDate): Interval => ({
  start: parisInstant(from, "00:00"),
  end: parisInstant(addDays(to, 1), "00:00"),
});

type CustomHours = Array<{ opens: string; closes: string }> | null;
const customHoursOf = (value: unknown): CustomHours =>
  Array.isArray(value)
    ? (value as Array<{ opens: string; closes: string }>).map((w) => ({
        opens: toLocalTime(w.opens),
        closes: toLocalTime(w.closes),
      }))
    : null;

/** Raw rows for [from, to]; shared by the day and the week views. */
async function loadRange(from: LocalDate, to: LocalDate) {
  await requireAdmin();
  const db = createAdminClient();
  const range = toTstzRange(dayRange(from, to));
  const [settings, hours, overrides, appointments, blocks, holds, waitlist] =
    await Promise.all([
      db.from("business_settings").select("evening_lock_from").single(),
      db.from("opening_hours").select("weekday, opens, closes"),
      db
        .from("day_overrides")
        .select("day, closed, evening_unlocked, custom_hours")
        .gte("day", from)
        .lte("day", to),
      db
        .from("appointments")
        .select(
          "id, period, status, source, service_name, variant_name, duration_min, price_cents, client_note, client_id, clients (full_name, phone, email)",
        )
        .overlaps("period", range)
        .order("period"),
      db
        .from("blocks")
        .select("id, period, reason")
        .overlaps("period", range)
        .order("period"),
      db
        .from("slot_holds")
        .select(
          "period, expires_at, waitlist_offers (waitlist_entries (clients (full_name)))",
        )
        .is("released_at", null)
        .gt("expires_at", new Date().toISOString())
        .overlaps("period", range),
      db
        .from("waitlist_entries")
        .select(
          "id, day, status, duration_min, created_at, client_id, clients (full_name, email), services (name), service_variants (name)",
        )
        .gte("day", from)
        .lte("day", to)
        .in("status", ["waiting", "notified"])
        .order("created_at"),
    ]);
  const failure = [
    settings,
    hours,
    overrides,
    appointments,
    blocks,
    holds,
    waitlist,
  ].find((r) => r.error);
  if (failure?.error) throw failure.error;

  const weekly: OpeningWindow[] = hours.data!.map((h) => ({
    weekday: h.weekday as IsoWeekday,
    opens: h.opens,
    closes: h.closes,
  }));
  const overrideMap = new Map<LocalDate, DayOverride>(
    overrides.data!.map((o) => [
      o.day,
      {
        closed: o.closed,
        eveningUnlocked: o.evening_unlocked,
        customHours: customHoursOf(o.custom_hours),
      },
    ]),
  );

  const appts: AgendaAppointment[] = appointments.data!.map((a) => {
    const { start, end } = parseTstzRange(a.period as string);
    return {
      id: a.id,
      start,
      end,
      time: parisTime(start),
      endTime: parisTime(end),
      status: a.status,
      source: a.source,
      serviceLabel: label(a.service_name, a.variant_name),
      durationMin: a.duration_min,
      priceCents: a.price_cents,
      clientId: a.client_id,
      clientName: a.clients?.full_name ?? "Cliente supprimée",
      clientPhone: a.clients?.phone ?? null,
      clientEmail: a.clients?.email ?? null,
      note: a.client_note,
    };
  });

  return {
    eveningLockFrom: settings.data!.evening_lock_from
      ? toLocalTime(settings.data!.evening_lock_from)
      : null,
    weekly,
    overrideMap,
    appts,
    blocks: blocks.data!.map((b) => ({
      id: b.id,
      reason: b.reason,
      ...parseTstzRange(b.period as string),
    })),
    holds: holds.data!.map((h) => ({
      ...parseTstzRange(h.period as string),
      expiresAt: new Date(h.expires_at),
      clientName:
        h.waitlist_offers?.waitlist_entries?.clients?.full_name ?? "Cliente",
    })),
    waitlist: waitlist.data!.map((w) => ({
      day: w.day,
      entry: {
        id: w.id,
        clientId: w.client_id,
        clientName: w.clients?.full_name ?? "Cliente",
        clientEmail: w.clients?.email ?? null,
        serviceLabel: label(
          w.services?.name ?? "",
          w.service_variants?.name ?? null,
        ),
        durationMin: w.duration_min,
        status: w.status as "waiting" | "notified",
        createdAt: new Date(w.created_at),
      } satisfies AgendaWaitlistEntry,
    })),
  };
}

type Loaded = Awaited<ReturnType<typeof loadRange>>;

function buildDay(day: LocalDate, data: Loaded): AgendaDay {
  const bounds = dayRange(day, day);
  const inDay = (i: Interval) => i.start < bounds.end && i.end > bounds.start;
  const override = data.overrideMap.get(day) ?? null;
  const windows = openingWindows(day, data.weekly, override);

  const dayAppts = data.appts.filter(inDay);
  const active = dayAppts.filter((a) => a.status !== "cancelled");
  const blocks = data.blocks.filter(inDay);
  const holds = data.holds.filter(inDay);

  const busy = [...active, ...blocks, ...holds];
  const hhmm = (d: Date, edge: "start" | "end") => {
    if (edge === "start" && d <= bounds.start) return "00:00";
    if (edge === "end" && d >= bounds.end) return "24:00";
    return parisTime(d);
  };

  return {
    day,
    windows: windows.map((w) => ({
      opens: parisTime(w.start),
      closes: parisTime(w.end),
    })),
    eveningLockFrom: data.eveningLockFrom,
    eveningUnlocked: override?.eveningUnlocked ?? false,
    hasEvening:
      data.eveningLockFrom != null &&
      windows.some(
        (w) => w.end > parisInstant(day, data.eveningLockFrom as string),
      ),
    appointments: active,
    cancelled: dayAppts.filter((a) => a.status === "cancelled"),
    blocks: blocks.map((b) => ({
      id: b.id,
      start: b.start,
      end: b.end,
      reason: b.reason,
      fromTime: hhmm(b.start, "start"),
      toTime: hhmm(b.end, "end"),
      coversDay: b.start <= bounds.start && b.end >= bounds.end,
    })),
    holds: holds.map((h) => ({
      ...h,
      time: parisTime(h.start),
      endTime: parisTime(h.end),
    })),
    free: freeGaps(windows, busy).map((g) => ({
      ...g,
      time: parisTime(g.start),
      endTime: parisTime(g.end),
    })),
    waitlist: data.waitlist.filter((w) => w.day === day).map((w) => w.entry),
  };
}

export async function getAgendaDay(day: LocalDate): Promise<AgendaDay> {
  return buildDay(day, await loadRange(day, day));
}

export async function getAgendaWeek(day: LocalDate): Promise<AgendaDay[]> {
  const days = weekDays(day);
  const data = await loadRange(days[0]!, days[6]!);
  return days.map((d) => buildDay(d, data));
}

/** Upcoming waitlist registrations, grouped by day (for the "Attente" page). */
export async function getUpcomingWaitlist(
  today: LocalDate,
): Promise<Array<{ day: LocalDate; entries: AgendaWaitlistEntry[] }>> {
  const data = await loadRange(today, addDays(today, 120));
  const byDay = new Map<LocalDate, AgendaWaitlistEntry[]>();
  for (const { day, entry } of data.waitlist) {
    byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, entries]) => ({ day, entries }));
}

export async function getAppointment(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("appointments")
    .select(
      "id, period, status, source, service_id, variant_id, service_name, variant_name, duration_min, price_cents, client_note, cancelled_at, cancellation_reason, created_at, client_id, clients (id, full_name, phone, email, preferences)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { start, end } = parseTstzRange(data.period as string);
  return {
    id: data.id,
    start,
    end,
    day: parisDate(start),
    time: parisTime(start),
    endTime: parisTime(end),
    status: data.status,
    source: data.source,
    serviceId: data.service_id,
    variantId: data.variant_id,
    serviceLabel: label(data.service_name, data.variant_name),
    durationMin: data.duration_min,
    priceCents: data.price_cents,
    note: data.client_note,
    cancelledAt: data.cancelled_at ? new Date(data.cancelled_at) : null,
    cancellationReason: data.cancellation_reason,
    createdAt: new Date(data.created_at),
    client: data.clients
      ? {
          id: data.clients.id,
          fullName: data.clients.full_name,
          phone: data.clients.phone,
          email: data.clients.email,
          preferences: data.clients.preferences,
        }
      : null,
  };
}

export type AdminAppointment = NonNullable<
  Awaited<ReturnType<typeof getAppointment>>
>;
