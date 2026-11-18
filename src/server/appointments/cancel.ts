import "server-only";
import { after } from "next/server";
import { canClientCancel } from "@/domain/booking/cancellation";
import { parisDate } from "@/domain/time/paris";
import { parseTstzRange } from "@/domain/time/range";
import { getBusinessInfo } from "@/server/content/queries";
import { createAdminClient } from "@/server/db/admin-client";
import { notifyAppointmentCancelled } from "@/server/notifications/events";
import { processWaitlistDay } from "@/server/waitlist/service";

export type CancelOutcome = { ok: true } | { ok: false; error: string };

/**
 * Self-service cancellation by the client (from "Mon espace" or from the
 * signed link in her e-mails). Enforces ownership (when known), status and the
 * cancellation cut-off; then notifies after the response is sent.
 */
export async function cancelAsClient(
  appointmentId: string,
  {
    clientId,
    actorUserId,
  }: { clientId?: string; actorUserId?: string | null } = {},
): Promise<CancelOutcome> {
  const db = createAdminClient();
  let query = db
    .from("appointments")
    .select("id, period, status")
    .eq("id", appointmentId);
  if (clientId) query = query.eq("client_id", clientId);
  const { data: appointment } = await query.maybeSingle();

  if (!appointment) return { ok: false, error: "Rendez-vous introuvable." };
  if (appointment.status !== "confirmed")
    return { ok: false, error: "Ce rendez-vous est déjà annulé ou passé." };

  const { policy } = await getBusinessInfo();
  const { start } = parseTstzRange(appointment.period as string);
  if (!canClientCancel(start, new Date(), policy.cancellationCutoffHours)) {
    return {
      ok: false,
      error: `L'annulation en ligne n'est plus possible moins de ${policy.cancellationCutoffHours} h avant le rendez-vous. Contactez Alessia directement.`,
    };
  }

  const { data: updated, error } = await db
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: actorUserId ?? null,
      cancellation_reason: "Annulé par la cliente",
    })
    .eq("id", appointment.id)
    .eq("status", "confirmed")
    .select("id");
  if (error) {
    console.error("cancelAsClient", error);
    return {
      ok: false,
      error: "Une erreur est survenue. Merci de réessayer dans un instant.",
    };
  }
  if (!updated?.length)
    return { ok: false, error: "Ce rendez-vous est déjà annulé." };

  after(async () => {
    await notifyAppointmentCancelled(appointment.id, { by: "client" });
    // The freed slot goes to the waitlist straight away.
    await processWaitlistDay(parisDate(start));
  });
  return { ok: true };
}
