/**
 * Europe/Paris calendar helpers.
 *
 * Rule of the project: instants are stored and compared in UTC (`Date`), while
 * business rules (opening hours, reference starts, "today") are expressed in
 * Paris wall-clock time. Every conversion between the two goes through this
 * module, which never depends on the machine's own timezone.
 */
import { TZDate } from "@date-fns/tz";

export const TIMEZONE = "Europe/Paris";

/** Calendar day in Paris, "YYYY-MM-DD". */
export type LocalDate = string;
/** Wall-clock time in Paris, "HH:MM". */
export type LocalTime = string;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{2}):(\d{2})(?::\d{2})?$/;

function parseDate(day: LocalDate): [number, number, number] {
  const m = DATE_RE.exec(day);
  if (!m) throw new Error(`Invalid local date: ${day}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseTime(time: LocalTime): [number, number] {
  const m = TIME_RE.exec(time);
  if (!m) throw new Error(`Invalid local time: ${time}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Invalid local time: ${time}`);
  return [h, min];
}

const pad = (n: number) => String(n).padStart(2, "0");

export function isLocalDate(value: string): value is LocalDate {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === mo - 1 &&
    probe.getUTCDate() === d
  );
}

/** Normalises "10:00:00" (Postgres) to "10:00". */
export function toLocalTime(time: string): LocalTime {
  const [h, m] = parseTime(time);
  return `${pad(h)}:${pad(m)}`;
}

/** The UTC instant of a Paris wall-clock time on a given day (DST-aware). */
export function parisInstant(day: LocalDate, time: LocalTime): Date {
  const [y, mo, d] = parseDate(day);
  const [h, min] = parseTime(time);
  return new Date(new TZDate(y, mo - 1, d, h, min, 0, TIMEZONE).getTime());
}

function inParis(instant: Date): TZDate {
  return new TZDate(instant.getTime(), TIMEZONE);
}

/** Paris calendar day of an instant. */
export function parisDate(instant: Date): LocalDate {
  const z = inParis(instant);
  return `${z.getFullYear()}-${pad(z.getMonth() + 1)}-${pad(z.getDate())}`;
}

/** Paris wall-clock time of an instant, "HH:MM". */
export function parisTime(instant: Date): LocalTime {
  const z = inParis(instant);
  return `${pad(z.getHours())}:${pad(z.getMinutes())}`;
}

/** ISO weekday of a calendar day: 1 = Monday … 7 = Sunday. */
export function isoWeekday(day: LocalDate): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const [y, mo, d] = parseDate(day);
  const js = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  return (js === 0 ? 7 : js) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

/** Calendar arithmetic on days (no timezone involved). */
export function addDays(day: LocalDate, days: number): LocalDate {
  const [y, mo, d] = parseDate(day);
  const t = new Date(Date.UTC(y, mo - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** Whole days from `a` to `b` (b − a). */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  const [ya, ma, da] = parseDate(a);
  const [yb, mb, db] = parseDate(b);
  return Math.round(
    (Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86_400_000,
  );
}

/** [start of day, start of next day) in UTC for a Paris calendar day (23/24/25 h). */
export function parisDayBounds(day: LocalDate): { start: Date; end: Date } {
  return {
    start: parisInstant(day, "00:00"),
    end: parisInstant(addDays(day, 1), "00:00"),
  };
}

/** "10:30" → 630 */
export function minutesOfDay(time: LocalTime): number {
  const [h, m] = parseTime(time);
  return h * 60 + m;
}
