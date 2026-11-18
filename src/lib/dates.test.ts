import { describe, expect, it } from "vitest";
import { dayParts, formatDayLong, formatMonth, relativeDay } from "./dates";

describe("French dates", () => {
  it("formats a calendar day without timezone drift", () => {
    expect(formatDayLong("2026-11-24")).toBe("mardi 24 novembre");
    expect(
      formatDayLong("2026-11-24", { withYear: true, capitalize: true }),
    ).toBe("Mardi 24 novembre 2026");
  });
  it("splits a day for the strip", () => {
    expect(dayParts("2026-12-01")).toEqual({
      weekday: "mar.",
      day: "1",
      month: "déc.",
    });
  });
  it("formats a month", () =>
    expect(formatMonth("2027-01-04")).toBe("Janvier 2027"));
  it("says how far away a day is", () => {
    expect(relativeDay("2026-11-18", "2026-11-18")).toBe("Aujourd’hui");
    expect(relativeDay("2026-11-19", "2026-11-18")).toBe("Demain");
    expect(relativeDay("2026-11-23", "2026-11-18")).toBe("Dans 5 jours");
    // across the switch to winter time and month ends, still whole days
    expect(relativeDay("2026-11-01", "2026-10-24")).toBe("Dans 8 jours");
    expect(relativeDay("2026-12-09", "2026-11-18")).toBe("Dans 3 semaines");
    expect(relativeDay("2027-03-01", "2026-11-18")).toBe("Dans 3 mois");
  });
});
