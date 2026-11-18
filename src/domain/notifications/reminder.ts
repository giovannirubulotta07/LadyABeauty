import {
  type LocalTime,
  addDays,
  parisDate,
  parisInstant,
} from "@/domain/time/paris";

/**
 * Day-before reminder rule.
 * The reminder is due on the Paris day before the appointment at
 * `sendTime` (default 09:00), i.e. "the morning before, about 24 h ahead".
 * Bookings made after that moment get no reminder: their confirmation e-mail,
 * received minutes earlier, already does the job.
 */
export function reminderDueAt(start: Date, sendTime: LocalTime): Date {
  return parisInstant(addDays(parisDate(start), -1), sendTime);
}

export function isReminderDue(
  appointment: { start: Date; createdAt: Date },
  now: Date,
  sendTime: LocalTime,
): boolean {
  const due = reminderDueAt(appointment.start, sendTime);
  return now >= due && now < appointment.start && appointment.createdAt < due;
}
