import type { LocalDate } from "@/domain/time/paris";

/** French date formatting. Calendar days are formatted without any timezone shift. */
const DAY_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const DAY_LONG_YEAR = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const WEEKDAY_SHORT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  timeZone: "UTC",
});
const MONTH_SHORT = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  timeZone: "UTC",
});
const MONTH_YEAR = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const asUtcNoon = (day: LocalDate) => new Date(`${day}T12:00:00Z`);
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "mardi 24 novembre" */
export const formatDayLong = (
  day: LocalDate,
  { withYear = false, capitalize = false } = {},
) => {
  const s = (withYear ? DAY_LONG_YEAR : DAY_LONG).format(asUtcNoon(day));
  return capitalize ? capitalise(s) : s;
};

/** { weekday: "mar.", day: "24", month: "nov." } for the day strip */
export const dayParts = (day: LocalDate) => ({
  weekday: WEEKDAY_SHORT.format(asUtcNoon(day)),
  day: String(Number(day.slice(8, 10))),
  month: MONTH_SHORT.format(asUtcNoon(day)),
});

/** "novembre 2026" */
export const formatMonth = (day: LocalDate) =>
  capitalise(MONTH_YEAR.format(asUtcNoon(day)));
