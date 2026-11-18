/**
 * Waitlist offer planner — pure, deterministic, unit-tested.
 *
 * Rule chosen with the client (docs/proposta-tecnica.md §5, option b):
 *   - clients are served in order of registration;
 *   - each one is offered the earliest free start that fits her service and
 *     that she has not already turned down, with an exclusive hold of N
 *     minutes (the slot is hidden from everyone else meanwhile);
 *   - when the slot is close (< broadcastBeforeHours), there is no time for
 *     one-by-one exclusives: everyone concerned is told at once, first to
 *     confirm wins (no hold);
 *   - no e-mails at night (quiet hours) unless the slot is close.
 */
import {
  type BusyInterval,
  type DayInput,
  computeDaySlots,
} from "@/domain/availability/engine";
import { type LocalTime, minutesOfDay, parisTime } from "@/domain/time/paris";

export type WaitlistPolicy = {
  exclusiveMinutes: number;
  broadcastBeforeHours: number;
  quietStart: LocalTime;
  quietEnd: LocalTime;
};

export type WaitingEntry = {
  id: string;
  durationMin: number;
  /** Starts she already turned down (free when she registered, expired or declined offers). */
  excludedStarts: Date[];
};

export type PlannedOffer = {
  entryId: string;
  start: Date;
  end: Date;
  /** null = offered to everyone at once (no hold). */
  exclusiveUntil: Date | null;
};

const MINUTE = 60_000;

/** True between quietStart and quietEnd (Paris time, may span midnight). Equal bounds = never quiet. */
export function isQuietTime(
  now: Date,
  policy: Pick<WaitlistPolicy, "quietStart" | "quietEnd">,
): boolean {
  const t = minutesOfDay(parisTime(now));
  const start = minutesOfDay(policy.quietStart);
  const end = minutesOfDay(policy.quietEnd);
  if (start === end) return false;
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export function planOffers(
  day: Omit<DayInput, "durationMin">,
  entries: WaitingEntry[],
  policy: WaitlistPolicy,
): PlannedOffer[] {
  const busy: BusyInterval[] = [...day.busy];
  const quiet = isQuietTime(day.now, policy);
  const now = day.now.getTime();
  const plan: PlannedOffer[] = [];

  for (const entry of entries) {
    const excluded = new Set(entry.excludedStarts.map((d) => d.getTime()));
    const slot = computeDaySlots({
      ...day,
      busy,
      durationMin: entry.durationMin,
    }).find(
      (s) => s.status === "available" && !excluded.has(s.start.getTime()),
    );
    if (!slot) continue;

    // The exclusive window must close before the slot stops being bookable.
    const lastUseful =
      slot.start.getTime() - day.settings.minNoticeMinutes * MINUTE;
    const exclusiveEnd = Math.min(
      now + policy.exclusiveMinutes * MINUTE,
      lastUseful,
    );
    const urgent =
      slot.start.getTime() - now < policy.broadcastBeforeHours * 60 * MINUTE ||
      exclusiveEnd - now < 5 * MINUTE;

    if (urgent) {
      plan.push({
        entryId: entry.id,
        start: slot.start,
        end: slot.end,
        exclusiveUntil: null,
      });
      continue; // no hold: the others may be offered the same slot
    }
    if (quiet) continue; // wait for the morning

    plan.push({
      entryId: entry.id,
      start: slot.start,
      end: slot.end,
      exclusiveUntil: new Date(exclusiveEnd),
    });
    busy.push({ start: slot.start, end: slot.end, kind: "hold" });
  }
  return plan;
}
