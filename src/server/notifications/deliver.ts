import "server-only";
import { createAdminClient } from "@/server/db/admin-client";
import { type EmailMessage, emailChannel } from "./channels";

export type NotificationKind =
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_cancelled"
  | "owner_new_booking"
  | "owner_cancellation"
  | "booking_moved"
  | "waitlist_offer";

export type Delivery = {
  /** Unique per logical message, e.g. "reminder:<appointment id>:<start>". */
  key: string;
  kind: NotificationKind;
  to: string;
  appointmentId?: string;
  offerId?: string;
  /** Built only once the right to send has been claimed. */
  build: () => Promise<EmailMessage> | EmailMessage;
};

export type DeliveryOutcome = "sent" | "skipped" | "failed";

/**
 * Sends one e-mail at most once. The claim is atomic in Postgres, so two
 * concurrent cron runs (or a double click) can never send the same message
 * twice. Failures are logged and never propagate to the caller: a booking
 * must not fail because an e-mail could not be sent.
 */
export async function deliver(d: Delivery): Promise<DeliveryOutcome> {
  const db = createAdminClient();
  const { data: logId, error: claimError } = await db.rpc(
    "claim_notification",
    {
      p_key: d.key,
      p_kind: d.kind,
      p_channel: "email",
      p_recipient: d.to,
      p_appointment_id: (d.appointmentId ?? null) as string,
      p_offer_id: (d.offerId ?? null) as string,
    },
  );
  if (claimError) {
    console.error("claim_notification", claimError.message);
    return "failed";
  }
  if (!logId) return "skipped";

  try {
    const message = await d.build();
    const { providerId } = await emailChannel().send({ ...message, to: d.to });
    await db
      .from("notification_log")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerId,
        subject: message.subject,
      })
      .eq("id", logId);
    return "sent";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`notification ${d.key} failed:`, message);
    await db
      .from("notification_log")
      .update({ status: "failed", error: message.slice(0, 1000) })
      .eq("id", logId);
    return "failed";
  }
}
