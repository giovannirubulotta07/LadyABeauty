import "server-only";
import BookingCancelledEmail, {
  bookingCancelledSubject,
} from "@/emails/booking-cancelled";
import BookingConfirmedEmail, {
  bookingConfirmedSubject,
} from "@/emails/booking-confirmed";
import BookingMovedEmail, { bookingMovedSubject } from "@/emails/booking-moved";
import BookingReminderEmail, {
  bookingReminderSubject,
} from "@/emails/booking-reminder";
import OwnerNotificationEmail, {
  type OwnerNotificationProps,
  ownerNotificationSubject,
} from "@/emails/owner-notification";
import { renderEmail } from "@/emails/render";
import type { AppointmentEmailData, EmailBrand } from "@/emails/theme";
import { priceLabel } from "@/domain/catalog/price";
import { parisDate, parisTime } from "@/domain/time/paris";
import { parseTstzRange } from "@/domain/time/range";
import { addressLines, mapsUrl } from "@/lib/address";
import { formatDayLong } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import { icsPath } from "@/server/appointments/links";
import { getBusinessInfo } from "@/server/content/queries";
import { createAdminClient } from "@/server/db/admin-client";
import { env } from "@/server/env";
import { createLinkToken } from "@/server/security/tokens";
import { type DeliveryOutcome, deliver } from "./deliver";

/**
 * Domain events → e-mails. Every function is safe to call more than once:
 * each message has its own idempotency key, so it is sent at most once.
 */

type Context = Awaited<ReturnType<typeof loadContext>>;

async function loadContext(appointmentId: string) {
  const db = createAdminClient();
  const [{ data: row, error }, business, { data: owner }] = await Promise.all([
    db
      .from("appointments")
      .select(
        "id, period, status, service_name, variant_name, duration_min, price_cents, client_note, created_at, service_id, clients (full_name, email, phone), services (slug, price_cents, price_is_from, deposit_cents)",
      )
      .eq("id", appointmentId)
      .maybeSingle(),
    getBusinessInfo(),
    db
      .from("studio_private_settings")
      .select(
        "notification_email, notify_owner_on_booking, notify_owner_on_cancellation",
      )
      .maybeSingle(),
  ]);
  if (error) throw error;
  if (!row) return null;

  const { start, end } = parseTstzRange(row.period as string);
  return {
    row,
    start,
    end,
    business,
    owner,
    client: row.clients,
    service: row.services,
  };
}

function brandOf(ctx: Context & {}): EmailBrand {
  return {
    name: ctx.business.name,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    instagramUrl: ctx.business.instagramUrl,
    addressLine: addressLines(ctx.business.address).join(", "),
  };
}

function appointmentData(
  ctx: Context & {},
  { withLinks }: { withLinks: boolean },
): AppointmentEmailData {
  const { row, start, end, business, service } = ctx;
  const site = env.NEXT_PUBLIC_SITE_URL;
  const price =
    row.price_cents != null
      ? formatPrice(row.price_cents)
      : service
        ? priceLabel({
            priceCents: service.price_cents,
            priceIsFrom: service.price_is_from,
            depositCents: service.deposit_cents,
          })
        : null;
  return {
    firstName: ctx.client?.full_name.split(" ")[0] ?? "",
    serviceName: row.service_name,
    variantName: row.variant_name,
    dateLabel: formatDayLong(parisDate(start), {
      withYear: true,
      capitalize: true,
    }),
    timeLabel: `${parisTime(start)} – ${parisTime(end)}`,
    durationLabel: formatDuration(row.duration_min),
    priceLabel: price,
    address: addressLines(business.address).join(", "),
    mapsUrl: mapsUrl(business.name, business.address),
    ...(withLinks
      ? {
          // Valid until 2 h after the start: the page then shows the appointment as past.
          manageUrl: `${site}/rdv/${createLinkToken("manage", row.id, new Date(end.getTime() + 2 * 3_600_000))}`,
          icsUrl: `${site}${icsPath({ id: row.id, end })}`,
        }
      : {}),
  };
}

function ownerProps(
  ctx: Context & {},
  kind: OwnerNotificationProps["kind"],
  cancelledBy?: "client" | "studio",
): OwnerNotificationProps {
  return {
    brand: brandOf(ctx),
    kind,
    clientName: ctx.client?.full_name ?? "Cliente supprimée",
    clientEmail: ctx.client?.email,
    clientPhone: ctx.client?.phone,
    serviceLabel: [ctx.row.service_name, ctx.row.variant_name]
      .filter(Boolean)
      .join(" — "),
    dateLabel: formatDayLong(parisDate(ctx.start), { capitalize: true }),
    timeLabel: `${parisTime(ctx.start)} – ${parisTime(ctx.end)}`,
    note: ctx.row.client_note,
    cancelledBy,
    adminUrl: `${env.NEXT_PUBLIC_SITE_URL}/admin?jour=${parisDate(ctx.start)}`,
  };
}

async function safely(
  label: string,
  run: () => Promise<DeliveryOutcome[]>,
): Promise<DeliveryOutcome[]> {
  try {
    return await run();
  } catch (error) {
    console.error(`notifications: ${label}`, error);
    return ["failed"];
  }
}

/**
 * Confirmation to the client + "new booking" to Alessia. When Alessia books
 * herself (admin), she is not notified and may choose not to e-mail the client.
 */
export function notifyBookingConfirmed(
  appointmentId: string,
  {
    notifyClient = true,
    notifyOwner = true,
  }: { notifyClient?: boolean; notifyOwner?: boolean } = {},
) {
  return safely("booking confirmed", async () => {
    const ctx = await loadContext(appointmentId);
    if (!ctx || ctx.row.status !== "confirmed") return [];
    const outcomes: Promise<DeliveryOutcome>[] = [];

    if (notifyClient && ctx.client?.email) {
      const props = {
        brand: brandOf(ctx),
        appt: appointmentData(ctx, { withLinks: true }),
        cancellationCutoffHours: ctx.business.policy.cancellationCutoffHours,
      };
      outcomes.push(
        deliver({
          key: `confirmation:${appointmentId}`,
          kind: "booking_confirmed",
          to: ctx.client.email,
          appointmentId,
          build: async () => ({
            to: ctx.client!.email!,
            subject: bookingConfirmedSubject(props),
            ...(await renderEmail(<BookingConfirmedEmail {...props} />)),
          }),
        }),
      );
    }

    if (
      notifyOwner &&
      ctx.owner?.notification_email &&
      ctx.owner.notify_owner_on_booking
    ) {
      const props = ownerProps(ctx, "new_booking");
      outcomes.push(
        deliver({
          key: `owner-booking:${appointmentId}`,
          kind: "owner_new_booking",
          to: ctx.owner.notification_email,
          appointmentId,
          build: async () => ({
            to: ctx.owner!.notification_email!,
            subject: ownerNotificationSubject(props),
            ...(await renderEmail(<OwnerNotificationEmail {...props} />)),
          }),
        }),
      );
    }
    return Promise.all(outcomes);
  });
}

/** Cancellation notice to the client (optional) and to Alessia. */
export function notifyAppointmentCancelled(
  appointmentId: string,
  {
    by,
    notifyClient = true,
    reason,
  }: {
    by: "client" | "studio";
    notifyClient?: boolean;
    reason?: string | null;
  },
) {
  return safely("appointment cancelled", async () => {
    const ctx = await loadContext(appointmentId);
    if (!ctx || ctx.row.status !== "cancelled") return [];
    const outcomes: Promise<DeliveryOutcome>[] = [];

    if (notifyClient && ctx.client?.email) {
      const slug = ctx.service?.slug;
      const props = {
        brand: brandOf(ctx),
        appt: appointmentData(ctx, { withLinks: false }),
        by,
        reason,
        rebookUrl: `${env.NEXT_PUBLIC_SITE_URL}/reserver${slug ? `?prestation=${slug}` : ""}`,
      };
      outcomes.push(
        deliver({
          key: `cancellation:${appointmentId}`,
          kind: "booking_cancelled",
          to: ctx.client.email,
          appointmentId,
          build: async () => ({
            to: ctx.client!.email!,
            subject: bookingCancelledSubject(props),
            ...(await renderEmail(<BookingCancelledEmail {...props} />)),
          }),
        }),
      );
    }

    // Alessia is told when a client cancels; when she cancels herself, she already knows.
    if (
      by === "client" &&
      ctx.owner?.notification_email &&
      ctx.owner.notify_owner_on_cancellation
    ) {
      const props = ownerProps(ctx, "cancellation", by);
      outcomes.push(
        deliver({
          key: `owner-cancellation:${appointmentId}`,
          kind: "owner_cancellation",
          to: ctx.owner.notification_email,
          appointmentId,
          build: async () => ({
            to: ctx.owner!.notification_email!,
            subject: ownerNotificationSubject(props),
            ...(await renderEmail(<OwnerNotificationEmail {...props} />)),
          }),
        }),
      );
    }
    return Promise.all(outcomes);
  });
}

/** New date and time after Alessia moved the appointment. */
export function notifyAppointmentMoved(
  appointmentId: string,
  previousStart: Date,
) {
  return safely("appointment moved", async () => {
    const ctx = await loadContext(appointmentId);
    if (!ctx || ctx.row.status !== "confirmed" || !ctx.client?.email) return [];
    const props = {
      brand: brandOf(ctx),
      appt: appointmentData(ctx, { withLinks: true }),
      previousLabel: `${formatDayLong(parisDate(previousStart))} à ${parisTime(previousStart)}`,
      cancellationCutoffHours: ctx.business.policy.cancellationCutoffHours,
    };
    return [
      await deliver({
        // One message per new start: moving twice sends twice, a retry does not.
        key: `moved:${appointmentId}:${ctx.start.toISOString()}`,
        kind: "booking_moved",
        to: ctx.client.email,
        appointmentId,
        build: async () => ({
          to: ctx.client!.email!,
          subject: bookingMovedSubject(props),
          ...(await renderEmail(<BookingMovedEmail {...props} />)),
        }),
      }),
    ];
  });
}

/** The day-before reminder. The key includes the start, so a moved appointment gets a new one. */
export async function sendReminder(
  appointmentId: string,
): Promise<DeliveryOutcome> {
  const [outcome] = await safely("reminder", async () => {
    const ctx = await loadContext(appointmentId);
    if (!ctx || ctx.row.status !== "confirmed" || !ctx.client?.email)
      return ["skipped"];
    const props = {
      brand: brandOf(ctx),
      appt: appointmentData(ctx, { withLinks: true }),
    };
    return [
      await deliver({
        key: `reminder:${appointmentId}:${ctx.start.toISOString()}`,
        kind: "booking_reminder",
        to: ctx.client.email,
        appointmentId,
        build: async () => ({
          to: ctx.client!.email!,
          subject: bookingReminderSubject(props),
          ...(await renderEmail(<BookingReminderEmail {...props} />)),
        }),
      }),
    ];
  });
  return outcome ?? "skipped";
}
