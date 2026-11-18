import { describe, expect, it } from "vitest";
import { dayParts, formatDayLong, formatMonth } from "./dates";

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
});
