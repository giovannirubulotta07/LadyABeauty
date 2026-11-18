import "server-only";
import { isReminderDue } from "@/domain/notifications/reminder";
import { toLocalTime } from "@/domain/time/paris";
import { parseTstzRange, toTstzRange } from "@/domain/time/range";
import { createAdminClient } from "@/server/db/admin-client";
import { sendReminder } from "@/server/notifications/events";

const HOUR = 3_600_000;

/** Sends every reminder that is due now. Safe to run concurrently or repeatedly. */
export async function sendDueReminders(now = new Date()) {
  const db = createAdminClient();
  const [{ data: settings }, { data: rows, error }] = await Promise.all([
    db.from("business_settings").select("reminder_send_time").single(),
    db
      .from("appointments")
      .select("id, period, created_at")
      .eq("status", "confirmed")
      // Reminders are due at most ~39 h ahead (9:00 the day before a 20:00 appointment).
      .overlaps(
        "period",
        toTstzRange({ start: now, end: new Date(now.getTime() + 48 * HOUR) }),
      ),
  ]);
  if (error) throw error;
  const sendTime = toLocalTime(settings?.reminder_send_time ?? "09:00");

  const due = (rows ?? []).filter((r) =>
    isReminderDue(
      {
        start: parseTstzRange(r.period as string).start,
        createdAt: new Date(r.created_at),
      },
      now,
      sendTime,
    ),
  );

  const counts = { due: due.length, sent: 0, skipped: 0, failed: 0 };
  for (const row of due) counts[await sendReminder(row.id)]++;
  return counts;
}

/** Housekeeping: data retention promised in the privacy policy. */
export async function purgeExpiredData(now = new Date()) {
  const db = createAdminClient();
  const dayAgo = new Date(now.getTime() - 24 * HOUR).toISOString();
  const yearAgo = new Date(now.getTime() - 365 * 24 * HOUR).toISOString();
  const [limits, logs] = await Promise.all([
    db
      .from("rate_limits")
      .delete({ count: "exact" })
      .lt("window_start", dayAgo),
    db
      .from("notification_log")
      .delete({ count: "exact" })
      .lt("created_at", yearAgo),
  ]);
  return { rateLimits: limits.count ?? 0, notificationLogs: logs.count ?? 0 };
}

export async function runScheduledTasks(now = new Date()) {
  const reminders = await sendDueReminders(now);
  const purged = await purgeExpiredData(now);
  return { at: now.toISOString(), reminders, purged };
}
