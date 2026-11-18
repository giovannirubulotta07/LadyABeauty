import { describe, expect, it } from "vitest";
import {
  byWeekday,
  groupLabel,
  groupWeek,
  toSchemaOrg,
  type OpeningWindow,
} from "./opening-hours";

const BRIEF_HOURS: OpeningWindow[] = [
  ...([1, 2, 3, 4, 5] as const).flatMap((weekday) => [
    { weekday, opens: "14:30:00", closes: "20:00:00" },
    { weekday, opens: "10:00:00", closes: "14:00:00" },
  ]),
  { weekday: 6, opens: "10:00:00", closes: "14:30:00" },
];

describe("byWeekday", () => {
  it("sorts windows and keeps closed days", () => {
    const week = byWeekday(BRIEF_HOURS);
    expect(week).toHaveLength(7);
    expect(week[0]?.windows).toEqual([
      { opens: "10:00", closes: "14:00" },
      { opens: "14:30", closes: "20:00" },
    ]);
    expect(week[6]?.windows).toEqual([]);
  });
});

describe("groupWeek", () => {
  it("merges Monday to Friday, then Saturday, then Sunday closed", () => {
    const groups = groupWeek(BRIEF_HOURS);
    expect(groups.map((g) => groupLabel(g))).toEqual([
      "lundi – vendredi",
      "samedi",
      "dimanche",
    ]);
    expect(groups[2]?.windows).toEqual([]);
  });

  it("capitalises only the first word when asked", () => {
    expect(groupLabel(groupWeek(BRIEF_HOURS)[0]!, { capitalize: true })).toBe(
      "Lundi – vendredi",
    );
  });

  it("uses « et » for two consecutive days", () => {
    const groups = groupWeek([
      { weekday: 1, opens: "10:00", closes: "12:00" },
      { weekday: 2, opens: "10:00", closes: "12:00" },
    ]);
    expect(groupLabel(groups[0]!)).toBe("lundi et mardi");
  });

  it("does not merge days with different windows", () => {
    const groups = groupWeek([
      { weekday: 1, opens: "10:00", closes: "18:30" },
      { weekday: 2, opens: "10:00", closes: "19:45" },
    ]);
    expect(groups.slice(0, 2).map((g) => groupLabel(g))).toEqual([
      "lundi",
      "mardi",
    ]);
  });
});

describe("toSchemaOrg", () => {
  it("emits one specification per window", () => {
    const spec = toSchemaOrg(BRIEF_HOURS);
    expect(spec).toHaveLength(11);
    expect(spec[0]).toEqual({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Monday",
      opens: "10:00",
      closes: "14:00",
    });
  });
});
