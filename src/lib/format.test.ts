import { describe, expect, it } from "vitest";
import { formatDuration, formatPrice, isoDuration } from "./format";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("formatPrice", () => {
  it("drops decimals for whole euros", () =>
    expect(nbsp(formatPrice(1600))).toBe("16 €"));
  it("keeps cents when needed", () =>
    expect(nbsp(formatPrice(1050))).toBe("10,50 €"));
  it("formats zero", () => expect(nbsp(formatPrice(0))).toBe("0 €"));
});

describe("formatDuration", () => {
  it.each([
    [10, "10 min"],
    [45, "45 min"],
    [60, "1 h"],
    [70, "1 h 10"],
    [105, "1 h 45"],
    [120, "2 h"],
  ])("%i min → %s", (min, expected) =>
    expect(formatDuration(min)).toBe(expected),
  );
});

describe("isoDuration", () => {
  it.each([
    [45, "PT45M"],
    [60, "PT1H"],
    [105, "PT1H45M"],
    [0, "PT0M"],
  ])("%i → %s", (min, expected) => expect(isoDuration(min)).toBe(expected));
});
