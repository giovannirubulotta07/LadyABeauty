import { describe, expect, it } from "vitest";
import type {
  AvailabilitySettings,
  BusyInterval,
} from "@/domain/availability/engine";
import type { OpeningWindow } from "@/domain/schedule/opening-hours";
import { parisInstant, parisTime } from "@/domain/time/paris";
import { type WaitlistPolicy, isQuietTime, planOffers } from "./planner";

const WEEK: OpeningWindow[] = ([1, 2, 3, 4, 5] as const).flatMap((weekday) => [
  { weekday, opens: "10:00", closes: "14:00" },
  { weekday, opens: "14:30", closes: "20:00" },
]);
const SETTINGS: AvailabilitySettings = {
  minNoticeMinutes: 120,
  maxAdvanceDays: 60,
  referenceStarts: ["10:00", "12:00", "14:30", "16:00", "18:00"],
  eveningLockFrom: "18:00",
};
const POLICY: WaitlistPolicy = {
  exclusiveMinutes: 30,
  broadcastBeforeHours: 12,
  quietStart: "21:00",
  quietEnd: "08:00",
};
const DAY = "2026-11-24"; // Tuesday

const appt = (from: string, to: string): BusyInterval => ({
  start: parisInstant(DAY, from),
  end: parisInstant(DAY, to),
  kind: "appointment",
});
/** A full day except the given gaps. */
function fullDayExcept(...free: Array<[string, string]>): BusyInterval[] {
  const marks = ["10:00", ...free.flat(), "20:00"];
  const busy: BusyInterval[] = [];
  for (let i = 0; i < marks.length; i += 2)
    if (marks[i] !== marks[i + 1]) busy.push(appt(marks[i]!, marks[i + 1]!));
  return busy;
}

const entry = (id: string, durationMin = 60, excludedStarts: Date[] = []) => ({
  id,
  durationMin,
  excludedStarts,
});
const base = (now: Date, busy: BusyInterval[]) => ({
  day: DAY,
  now,
  settings: SETTINGS,
  weeklyHours: WEEK,
  override: null,
  busy,
});
const label = (p: {
  entryId: string;
  start: Date;
  exclusiveUntil: Date | null;
}) =>
  `${p.entryId}@${parisTime(p.start)}${p.exclusiveUntil ? " (excl.)" : " (tous)"}`;

const morningBefore = parisInstant("2026-11-23", "10:00"); // the day before, office hours

describe("liste d'attente — attribution des places", () => {
  it("la première inscrite reçoit le créneau libéré, en exclusivité de 30 minutes", () => {
    const plan = planOffers(
      base(morningBefore, fullDayExcept(["12:00", "13:00"])),
      [entry("A"), entry("B")],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["A@12:00 (excl.)"]);
    expect(plan[0]!.exclusiveUntil!.getTime() - morningBefore.getTime()).toBe(
      30 * 60_000,
    );
  });

  it("deux créneaux libres : chacune le sien, dans l'ordre d'inscription", () => {
    const plan = planOffers(
      base(
        morningBefore,
        fullDayExcept(["12:00", "13:00"], ["16:00", "17:00"]),
      ),
      [entry("A"), entry("B"), entry("C")],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["A@12:00 (excl.)", "B@16:00 (excl.)"]);
  });

  it("une place trop courte pour sa prestation passe à la suivante", () => {
    const plan = planOffers(
      base(morningBefore, fullDayExcept(["12:00", "13:00"])),
      [entry("Extension", 105), entry("Rehaussement", 60)],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["Rehaussement@12:00 (excl.)"]);
  });

  it("un créneau déjà refusé (ou libre lors de l'inscription) n'est plus proposé à la même cliente", () => {
    const plan = planOffers(
      base(morningBefore, fullDayExcept(["12:00", "13:00"])),
      [entry("A", 60, [parisInstant(DAY, "12:00")]), entry("B")],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["B@12:00 (excl.)"]);
  });

  it("créneau proche (< 12 h) : toutes les inscrites sont prévenues en même temps", () => {
    const now = parisInstant(DAY, "07:00"); // 5 h before 12:00
    const plan = planOffers(
      base(now, fullDayExcept(["12:00", "13:00"])),
      [entry("A"), entry("B")],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["A@12:00 (tous)", "B@12:00 (tous)"]);
  });

  it("la nuit, pas d'e-mail pour un créneau lointain ; on attend le matin", () => {
    const night = parisInstant("2026-11-22", "23:30");
    expect(
      planOffers(
        base(night, fullDayExcept(["16:00", "17:00"])),
        [entry("A")],
        POLICY,
      ),
    ).toEqual([]);
    expect(
      planOffers(
        base(
          parisInstant("2026-11-23", "08:00"),
          fullDayExcept(["16:00", "17:00"]),
        ),
        [entry("A")],
        POLICY,
      ),
    ).toHaveLength(1);
  });

  it("…mais un créneau imminent est annoncé même la nuit", () => {
    const night = parisInstant(DAY, "06:30");
    const plan = planOffers(
      base(night, fullDayExcept(["10:00", "11:00"])),
      [entry("A")],
      POLICY,
    );
    expect(plan.map(label)).toEqual(["A@10:00 (tous)"]);
  });

  it("les créneaux « sur demande » du soir ne sont jamais proposés", () => {
    const plan = planOffers(
      base(morningBefore, fullDayExcept(["18:00", "19:00"])),
      [entry("A")],
      POLICY,
    );
    expect(plan).toEqual([]);
  });

  it("l'exclusivité se termine avant la limite de préavis du créneau", () => {
    const policy = {
      ...POLICY,
      broadcastBeforeHours: 0,
      exclusiveMinutes: 600,
    };
    const now = parisInstant(DAY, "08:30"); // 12:00 − 2 h notice = 10:00
    const [offer] = planOffers(
      base(now, fullDayExcept(["12:00", "13:00"])),
      [entry("A")],
      policy,
    );
    expect(parisTime(offer!.exclusiveUntil!)).toBe("10:00");
  });

  it("heures calmes configurables, éventuellement désactivées", () => {
    expect(isQuietTime(parisInstant(DAY, "21:00"), POLICY)).toBe(true);
    expect(isQuietTime(parisInstant(DAY, "07:59"), POLICY)).toBe(true);
    expect(isQuietTime(parisInstant(DAY, "08:00"), POLICY)).toBe(false);
    expect(
      isQuietTime(parisInstant(DAY, "03:00"), {
        quietStart: "00:00",
        quietEnd: "00:00",
      }),
    ).toBe(false);
  });
});
