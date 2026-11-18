import { describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import { freeGaps, studioSettings, weekDays, weekStart } from "./agenda";

const at = (time: string) => parisInstant("2026-11-24", time);
const iv = (a: string, b: string) => ({ start: at(a), end: at(b) });
const fmt = (gaps: { start: Date; end: Date }[]) =>
  gaps.map((g) => [g.start.toISOString(), g.end.toISOString()]);

describe("freeGaps", () => {
  const windows = [iv("10:00", "14:00"), iv("14:30", "20:00")];

  it("returns the whole windows when nothing is booked", () => {
    expect(fmt(freeGaps(windows, []))).toEqual(fmt(windows));
  });

  it("removes appointments and blocks, in any order, even overlapping", () => {
    const busy = [
      iv("16:00", "17:00"),
      iv("10:00", "11:45"),
      iv("16:30", "18:00"),
    ];
    expect(fmt(freeGaps(windows, busy))).toEqual(
      fmt([iv("11:45", "14:00"), iv("14:30", "16:00"), iv("18:00", "20:00")]),
    );
  });

  it("ignores busy time outside the windows and drops tiny gaps", () => {
    const busy = [
      iv("08:00", "10:10"),
      iv("14:00", "14:40"),
      iv("19:50", "21:00"),
    ];
    expect(fmt(freeGaps(windows, busy))).toEqual(
      fmt([iv("10:10", "14:00"), iv("14:40", "19:50")]),
    );
    expect(
      fmt(freeGaps([iv("10:00", "10:20")], [iv("10:00", "10:10")])),
    ).toEqual([]);
  });

  it("returns nothing when a block covers the day", () => {
    expect(freeGaps(windows, [iv("00:00", "23:59")])).toEqual([]);
  });
});

describe("weeks", () => {
  it("starts on Monday, also across a month and on Sunday", () => {
    expect(weekStart("2026-11-24")).toBe("2026-11-23");
    expect(weekStart("2026-11-29")).toBe("2026-11-23");
    expect(weekStart("2026-11-23")).toBe("2026-11-23");
    expect(weekDays("2026-12-02")).toEqual([
      "2026-11-30",
      "2026-12-01",
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
      "2026-12-06",
    ]);
  });
});

describe("studioSettings", () => {
  it("lifts notice, horizon and the evening lock only", () => {
    const base = {
      minNoticeMinutes: 120,
      maxAdvanceDays: 60,
      referenceStarts: ["10:00", "12:00"],
      eveningLockFrom: "18:00",
    };
    expect(studioSettings(base)).toEqual({
      minNoticeMinutes: 0,
      maxAdvanceDays: 730,
      referenceStarts: ["10:00", "12:00"],
      eveningLockFrom: null,
    });
  });
});
