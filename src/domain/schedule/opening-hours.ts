/**
 * Weekly opening hours: grouping for display and schema.org output.
 * Pure functions — no I/O, no dependency on the current date.
 */

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type OpeningWindow = {
  weekday: IsoWeekday;
  /** "HH:MM" or "HH:MM:SS" (Postgres `time`). */
  opens: string;
  closes: string;
};

export type DayHours = {
  weekday: IsoWeekday;
  windows: Array<{ opens: string; closes: string }>;
};

export type GroupedHours = {
  /** Consecutive weekdays sharing the same windows. */
  from: IsoWeekday;
  to: IsoWeekday;
  windows: Array<{ opens: string; closes: string }>;
};

export const WEEKDAYS: readonly IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];

const DAY_NAMES_FR: Record<IsoWeekday, string> = {
  1: "lundi",
  2: "mardi",
  3: "mercredi",
  4: "jeudi",
  5: "vendredi",
  6: "samedi",
  7: "dimanche",
};

const SCHEMA_DAYS: Record<IsoWeekday, string> = {
  1: "https://schema.org/Monday",
  2: "https://schema.org/Tuesday",
  3: "https://schema.org/Wednesday",
  4: "https://schema.org/Thursday",
  5: "https://schema.org/Friday",
  6: "https://schema.org/Saturday",
  7: "https://schema.org/Sunday",
};

/** "10:00:00" → "10:00" */
export function hhmm(time: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(time);
  if (!match) throw new Error(`Invalid time: ${time}`);
  return `${match[1]}:${match[2]}`;
}

export function dayName(weekday: IsoWeekday): string {
  return DAY_NAMES_FR[weekday];
}

/** One entry per weekday (Monday first), windows sorted, closed days empty. */
export function byWeekday(windows: OpeningWindow[]): DayHours[] {
  return WEEKDAYS.map((weekday) => ({
    weekday,
    windows: windows
      .filter((w) => w.weekday === weekday)
      .map((w) => ({ opens: hhmm(w.opens), closes: hhmm(w.closes) }))
      .sort((a, b) => a.opens.localeCompare(b.opens)),
  }));
}

/** Merges consecutive days with identical windows: "lundi – vendredi". */
export function groupWeek(windows: OpeningWindow[]): GroupedHours[] {
  const groups: GroupedHours[] = [];
  for (const day of byWeekday(windows)) {
    const last = groups.at(-1);
    if (last && JSON.stringify(last.windows) === JSON.stringify(day.windows)) {
      last.to = day.weekday;
    } else {
      groups.push({ from: day.weekday, to: day.weekday, windows: day.windows });
    }
  }
  return groups;
}

export function groupLabel(
  group: GroupedHours,
  { capitalize = false } = {},
): string {
  const from = dayName(group.from);
  const label =
    group.from === group.to
      ? from
      : group.to - group.from === 1
        ? `${from} et ${dayName(group.to)}`
        : `${from} – ${dayName(group.to)}`;
  return capitalize ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}

/** schema.org OpeningHoursSpecification entries. */
export function toSchemaOrg(windows: OpeningWindow[]) {
  return byWeekday(windows).flatMap((day) =>
    day.windows.map((w) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAYS[day.weekday],
      opens: w.opens,
      closes: w.closes,
    })),
  );
}
