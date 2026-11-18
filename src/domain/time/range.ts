/** Half-open time interval [start, end) between UTC instants. */
export type Interval = { start: Date; end: Date };

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function contains(outer: Interval, inner: Interval): boolean {
  return outer.start <= inner.start && inner.end <= outer.end;
}

/**
 * Parses a Postgres tstzrange as returned by PostgREST, e.g.
 * `["2026-11-24 09:00:00+00","2026-11-24 10:45:00+00")`.
 * Only bounded ranges are supported (the schema forbids the others).
 */
/** Postgres timestamptz text ("2026-11-24 09:00:00+00") or ISO → Date. */
export function parsePgTimestamp(raw: string): Date {
  const iso = raw
    .trim()
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    throw new Error(`Invalid timestamp: ${raw}`);
  return date;
}

export function parseTstzRange(raw: string): Interval {
  const m = /^([[(])"?([^",]+)"?,"?([^",]+)"?([\])])$/.exec(raw.trim());
  if (!m) throw new Error(`Unsupported tstzrange: ${raw}`);
  const toIso = (s: string) =>
    s.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const start = new Date(toIso(m[2]!));
  const end = new Date(toIso(m[3]!));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error(`Unsupported tstzrange: ${raw}`);
  }
  if (m[1] !== "[" || m[4] !== ")")
    throw new Error(`Expected a half-open range: ${raw}`);
  return { start, end };
}

/** Serialises an interval as a half-open tstzrange literal. */
export function toTstzRange({ start, end }: Interval): string {
  return `[${start.toISOString()},${end.toISOString()})`;
}
