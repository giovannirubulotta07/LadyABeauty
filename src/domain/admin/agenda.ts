import type { AvailabilitySettings } from "@/domain/availability/engine";
import { type LocalDate, addDays, isoWeekday } from "@/domain/time/paris";
import type { Interval } from "@/domain/time/range";

/**
 * Pure helpers for the admin agenda: free gaps between what is booked, week
 * boundaries, and the relaxed rules that apply when Alessia books herself.
 */

const MINUTE = 60_000;

/**
 * Free time inside the opening windows once every busy interval is removed.
 * Gaps shorter than `minMinutes` are dropped (too short to be useful).
 */
export function freeGaps(
  windows: Interval[],
  busy: Interval[],
  minMinutes = 15,
): Interval[] {
  const sorted = [...busy].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const gaps: Interval[] = [];
  for (const window of windows) {
    let cursor = window.start.getTime();
    const end = window.end.getTime();
    for (const b of sorted) {
      const bs = b.start.getTime();
      const be = b.end.getTime();
      if (be <= cursor || bs >= end) continue;
      if (bs > cursor)
        gaps.push({ start: new Date(cursor), end: new Date(bs) });
      cursor = Math.max(cursor, be);
      if (cursor >= end) break;
    }
    if (cursor < end)
      gaps.push({ start: new Date(cursor), end: new Date(end) });
  }
  return gaps.filter(
    (g) => g.end.getTime() - g.start.getTime() >= minMinutes * MINUTE,
  );
}

/** Monday of the ISO week containing `day`. */
export const weekStart = (day: LocalDate): LocalDate =>
  addDays(day, 1 - isoWeekday(day));

/** The 7 days (Monday → Sunday) of the week containing `day`. */
export const weekDays = (day: LocalDate): LocalDate[] => {
  const monday = weekStart(day);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

/**
 * When the studio books on behalf of a client, the online-only rules do not
 * apply: no minimum notice, no horizon, evening times are open. Opening hours,
 * blocks, holds and existing appointments still do.
 */
export const studioSettings = (
  settings: AvailabilitySettings,
): AvailabilitySettings => ({
  ...settings,
  minNoticeMinutes: 0,
  maxAdvanceDays: 730,
  eveningLockFrom: null,
});
