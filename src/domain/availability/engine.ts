/**
 * Availability engine — the heart of the booking system.
 *
 * Pure and deterministic: everything (including "now") comes in as input, so
 * the same function serves the public booking flow, the final re-check at
 * confirmation, the waitlist and the admin, and is exhaustively unit-tested.
 *
 * Algorithm (docs/proposta-tecnica.md §4):
 *   1. candidates = reference starts of the day
 *                 + for every busy interval: its end, and its start − duration
 *   2. a candidate is kept when the whole service fits inside one opening
 *      window, overlaps nothing busy, respects the minimum notice and the
 *      booking horizon;
 *   3. starts at or after the evening lock time are "on request" unless the
 *      admin unlocked the evening for that day;
 *   4. results are sorted and unique.
 */
import type { OpeningWindow } from "@/domain/schedule/opening-hours";
import {
  type LocalDate,
  type LocalTime,
  daysBetween,
  isoWeekday,
  minutesOfDay,
  parisDate,
  parisInstant,
  parisTime,
  toLocalTime,
} from "@/domain/time/paris";
import { type Interval, contains, overlaps } from "@/domain/time/range";

export type AvailabilitySettings = {
  minNoticeMinutes: number;
  /** Last bookable day = today + maxAdvanceDays (inclusive). */
  maxAdvanceDays: number;
  referenceStarts: LocalTime[];
  /** Starts at or after this time are "sur demande"; null disables the rule. */
  eveningLockFrom: LocalTime | null;
};

export type DayOverride = {
  closed: boolean;
  eveningUnlocked: boolean;
  /** Replaces the weekly windows for that day when set. */
  customHours: Array<{ opens: LocalTime; closes: LocalTime }> | null;
};

export type BusyKind = "appointment" | "block" | "hold";
export type BusyInterval = Interval & { kind: BusyKind };

export type SlotStatus = "available" | "on_request";

export type Slot = {
  start: Date;
  end: Date;
  /** Paris wall-clock start, "HH:MM". */
  time: LocalTime;
  status: SlotStatus;
};

export type DayInput = {
  day: LocalDate;
  durationMin: number;
  now: Date;
  settings: AvailabilitySettings;
  weeklyHours: OpeningWindow[];
  override?: DayOverride | null;
  /** Non-cancelled appointments, blocks and active holds (excluding the caller's own hold). */
  busy: BusyInterval[];
};

export type DayStatus =
  | "past"
  | "beyond_horizon"
  | "closed"
  | "full"
  | "on_request_only"
  | "available";

const MINUTE = 60_000;

/** Effective opening windows of a day, as UTC intervals (DST-aware). */
export function openingWindows(
  day: LocalDate,
  weeklyHours: OpeningWindow[],
  override?: DayOverride | null,
): Interval[] {
  if (override?.closed) return [];
  const source =
    override?.customHours ??
    weeklyHours
      .filter((w) => w.weekday === isoWeekday(day))
      .map((w) => ({
        opens: toLocalTime(w.opens),
        closes: toLocalTime(w.closes),
      }));

  return source
    .filter((w) => minutesOfDay(w.opens) < minutesOfDay(w.closes))
    .map((w) => ({
      start: parisInstant(day, w.opens),
      end: parisInstant(day, w.closes),
    }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function horizon(
  day: LocalDate,
  now: Date,
  maxAdvanceDays: number,
): "past" | "beyond_horizon" | null {
  const offset = daysBetween(parisDate(now), day);
  if (offset < 0) return "past";
  if (offset > maxAdvanceDays) return "beyond_horizon";
  return null;
}

/** All bookable (or "on request") starts for one day and one duration. */
export function computeDaySlots(input: DayInput): Slot[] {
  const { day, durationMin, now, settings, weeklyHours, override, busy } =
    input;
  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    throw new Error(`Invalid duration: ${durationMin}`);
  }
  if (horizon(day, now, settings.maxAdvanceDays)) return [];

  const windows = openingWindows(day, weeklyHours, override);
  if (windows.length === 0) return [];

  const duration = durationMin * MINUTE;
  const dayStart = windows[0]!.start.getTime();
  const dayEnd = windows.at(-1)!.end.getTime();
  const relevantBusy = busy.filter(
    (b) => b.end.getTime() > dayStart && b.start.getTime() < dayEnd,
  );

  // 1. Candidates (a Set of epoch ms removes duplicates)
  const candidates = new Set<number>();
  for (const time of settings.referenceStarts)
    candidates.add(parisInstant(day, toLocalTime(time)).getTime());
  for (const b of relevantBusy) {
    candidates.add(b.end.getTime()); // (a) right after
    candidates.add(b.start.getTime() - duration); // (b) ends exactly when it starts
  }

  // 2–3. Validation and status
  const earliest = now.getTime() + settings.minNoticeMinutes * MINUTE;
  const lockFrom = settings.eveningLockFrom
    ? minutesOfDay(settings.eveningLockFrom)
    : null;
  const unlocked = override?.eveningUnlocked ?? false;

  const slots: Slot[] = [];
  for (const startMs of [...candidates].sort((a, b) => a - b)) {
    if (startMs < earliest) continue;
    const slot: Interval = {
      start: new Date(startMs),
      end: new Date(startMs + duration),
    };
    if (!windows.some((w) => contains(w, slot))) continue;
    if (relevantBusy.some((b) => overlaps(b, slot))) continue;

    const time = parisTime(slot.start);
    const locked =
      lockFrom !== null && !unlocked && minutesOfDay(time) >= lockFrom;
    slots.push({ ...slot, time, status: locked ? "on_request" : "available" });
  }
  return slots;
}

/** Summary used by the day strip of the booking flow. */
export function computeDayStatus(input: DayInput): DayStatus {
  const out = horizon(input.day, input.now, input.settings.maxAdvanceDays);
  if (out) return out;

  const windows = openingWindows(input.day, input.weeklyHours, input.override);
  if (windows.length === 0) return "closed";

  // Holidays: every opening window is entirely covered by admin blocks.
  const blocks = input.busy.filter((b) => b.kind === "block");
  if (windows.every((w) => isCovered(w, blocks))) return "closed";

  const slots = computeDaySlots(input);
  if (slots.some((s) => s.status === "available")) return "available";
  if (slots.length > 0) return "on_request_only";
  return "full";
}

function isCovered(target: Interval, intervals: Interval[]): boolean {
  let cursor = target.start.getTime();
  const sorted = [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  for (const i of sorted) {
    if (i.start.getTime() > cursor) break;
    cursor = Math.max(cursor, i.end.getTime());
    if (cursor >= target.end.getTime()) return true;
  }
  return cursor >= target.end.getTime();
}

/**
 * Final server-side check before writing an appointment: the requested start
 * must be one of the slots the engine offers right now.
 */
export function isSlotBookable(
  input: DayInput,
  start: Date,
  { allowOnRequest = false }: { allowOnRequest?: boolean } = {},
): boolean {
  return computeDaySlots(input).some(
    (s) =>
      s.start.getTime() === start.getTime() &&
      (s.status === "available" || allowOnRequest),
  );
}
