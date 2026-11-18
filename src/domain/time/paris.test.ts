import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  isLocalDate,
  isoWeekday,
  minutesOfDay,
  parisDate,
  parisDayBounds,
  parisInstant,
  parisTime,
  toLocalTime,
} from "./paris";
import { overlaps, parseTstzRange, toTstzRange } from "./range";

describe("parisInstant — daylight saving time", () => {
  it("winter: Paris is UTC+1", () => {
    expect(parisInstant("2026-03-28", "10:00").toISOString()).toBe(
      "2026-03-28T09:00:00.000Z",
    );
    expect(parisInstant("2026-10-26", "10:00").toISOString()).toBe(
      "2026-10-26T09:00:00.000Z",
    );
  });

  it("summer: Paris is UTC+2", () => {
    expect(parisInstant("2026-03-30", "10:00").toISOString()).toBe(
      "2026-03-30T08:00:00.000Z",
    );
    expect(parisInstant("2026-10-24", "10:00").toISOString()).toBe(
      "2026-10-24T08:00:00.000Z",
    );
  });

  it("round-trips local date and time on both sides of the change", () => {
    for (const day of [
      "2026-03-28",
      "2026-03-30",
      "2026-10-24",
      "2026-10-26",
    ]) {
      for (const time of ["10:00", "14:30", "19:45"]) {
        const instant = parisInstant(day, time);
        expect(parisDate(instant)).toBe(day);
        expect(parisTime(instant)).toBe(time);
      }
    }
  });

  it("knows that DST days are 23 h and 25 h long", () => {
    const spring = parisDayBounds("2026-03-29");
    const autumn = parisDayBounds("2026-10-25");
    expect((spring.end.getTime() - spring.start.getTime()) / 3_600_000).toBe(
      23,
    );
    expect((autumn.end.getTime() - autumn.start.getTime()) / 3_600_000).toBe(
      25,
    );
  });

  it("maps a late-evening UTC instant to the next Paris day", () => {
    expect(parisDate(new Date("2026-11-23T23:30:00Z"))).toBe("2026-11-24");
  });
});

describe("calendar arithmetic", () => {
  it("weekday is ISO (Monday = 1, Sunday = 7)", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-28")).toBe(6);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });

  it("adds days across months, years and DST changes", () => {
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-11-18", "2027-01-17")).toBe(60);
  });

  it("validates dates and times", () => {
    expect(isLocalDate("2026-02-29")).toBe(false);
    expect(isLocalDate("2028-02-29")).toBe(true);
    expect(isLocalDate("2026-1-1")).toBe(false);
    expect(toLocalTime("09:05:00")).toBe("09:05");
    expect(minutesOfDay("14:30")).toBe(870);
    expect(() => parisInstant("2026-11-24", "25:00")).toThrow();
  });
});

describe("tstzrange", () => {
  it("parses the PostgREST format", () => {
    const r = parseTstzRange(
      '["2026-11-24 09:00:00+00","2026-11-24 10:45:00+00")',
    );
    expect(r.start.toISOString()).toBe("2026-11-24T09:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-11-24T10:45:00.000Z");
  });

  it("round-trips through the literal", () => {
    const r = {
      start: new Date("2026-11-24T09:00:00Z"),
      end: new Date("2026-11-24T10:45:00Z"),
    };
    expect(parseTstzRange(toTstzRange(r))).toEqual(r);
  });

  it("rejects closed ranges", () => {
    expect(() =>
      parseTstzRange('["2026-11-24 09:00:00+00","2026-11-24 10:45:00+00"]'),
    ).toThrow();
  });

  it("treats touching intervals as non-overlapping", () => {
    const a = {
      start: new Date("2026-11-24T09:00:00Z"),
      end: new Date("2026-11-24T10:45:00Z"),
    };
    const b = {
      start: new Date("2026-11-24T10:45:00Z"),
      end: new Date("2026-11-24T11:45:00Z"),
    };
    expect(overlaps(a, b)).toBe(false);
    expect(overlaps(a, { ...b, start: new Date("2026-11-24T10:44:00Z") })).toBe(
      true,
    );
  });
});
