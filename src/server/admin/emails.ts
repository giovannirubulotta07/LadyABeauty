import "server-only";
import { createAdminClient } from "@/server/db/admin-client";
import { requireAdmin } from "./guard";

export const EMAIL_KIND_LABEL: Record<string, string> = {
  booking_confirmed: "Confirmation",
  booking_reminder: "Rappel (la veille)",
  booking_cancelled: "Annulation",
  booking_moved: "Rendez-vous déplacé",
  owner_new_booking: "Nouveau rendez-vous (pour vous)",
  owner_cancellation: "Annulation (pour vous)",
  waitlist_offer: "Liste d’attente : créneau proposé",
};

export const EMAIL_STATUS_LABEL = {
  queued: "En cours",
  sent: "Envoyé",
  failed: "Échec",
  skipped: "Non envoyé",
} as const;

export type EmailLogEntry = {
  id: string;
  kind: string;
  kindLabel: string;
  recipient: string;
  status: keyof typeof EMAIL_STATUS_LABEL;
  error: string | null;
  createdAt: Date;
  sentAt: Date | null;
  appointmentId: string | null;
};

export async function listEmailLog({
  appointmentId,
  status,
  limit = 100,
}: {
  appointmentId?: string;
  status?: EmailLogEntry["status"];
  limit?: number;
} = {}): Promise<EmailLogEntry[]> {
  await requireAdmin();
  let query = createAdminClient()
    .from("notification_log")
    .select(
      "id, kind, recipient, status, error, created_at, sent_at, appointment_id",
    )
    .eq("channel", "email")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (appointmentId) query = query.eq("appointment_id", appointmentId);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    kind: row.kind,
    kindLabel: EMAIL_KIND_LABEL[row.kind] ?? row.kind,
    recipient: row.recipient,
    status: row.status,
    error: row.error,
    createdAt: new Date(row.created_at),
    sentAt: row.sent_at ? new Date(row.sent_at) : null,
    appointmentId: row.appointment_id,
  }));
}
