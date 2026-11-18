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

/** "Aujourd’hui", "Demain", "Dans 5 jours", "Dans 3 semaines" (days ahead of today). */
export function relativeDay(day: LocalDate, today: LocalDate): string {
  const n = Math.round(
    (asUtcNoon(day).getTime() - asUtcNoon(today).getTime()) / 86_400_000,
  );
  if (n <= 0) return "Aujourd’hui";
  if (n === 1) return "Demain";
  if (n < 14) return `Dans ${n} jours`;
  if (n < 60) return `Dans ${Math.floor(n / 7)} semaines`;
  return `Dans ${Math.floor(n / 30)} mois`;
}
