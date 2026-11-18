/** Client self-service cancellation rule (configurable cut-off, default 24 h). */
export function cancellationDeadline(start: Date, cutoffHours: number): Date {
  return new Date(start.getTime() - cutoffHours * 3_600_000);
}

export function canClientCancel(
  start: Date,
  now: Date,
  cutoffHours: number,
): boolean {
  return (
    start.getTime() > now.getTime() &&
    now.getTime() <= cancellationDeadline(start, cutoffHours).getTime()
  );
}
