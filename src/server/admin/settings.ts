import "server-only";
import { toLocalTime } from "@/domain/time/paris";
import { createAdminClient } from "@/server/db/admin-client";
import { requireAdmin } from "./guard";

/** Editable settings, read fresh (never from the public cache). */

export async function getWeeklyHours() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("opening_hours")
    .select("weekday, opens, closes")
    .order("weekday")
    .order("opens");
  if (error) throw error;
  return data.map((h) => ({
    weekday: h.weekday,
    opens: toLocalTime(h.opens),
    closes: toLocalTime(h.closes),
  }));
}

export async function getStudioSettings() {
  await requireAdmin();
  const db = createAdminClient();
  const [business, owner] = await Promise.all([
    db.from("business_settings").select("*").single(),
    db.from("studio_private_settings").select("*").single(),
  ]);
  if (business.error) throw business.error;
  if (owner.error) throw owner.error;
  const b = business.data;
  const home = (b.home_content ?? {}) as Record<string, unknown>;
  const t = (v: string | null) => (v ? toLocalTime(v) : "");
  return {
    studio: {
      name: b.name,
      tagline: b.tagline,
      phone: b.phone ?? "",
      email: b.email ?? "",
      instagramUrl: b.instagram_url ?? "",
      addressLine1: b.address_line1,
      addressLine2: b.address_line2 ?? "",
      postalCode: b.postal_code,
      city: b.city,
      legalName: b.legal_name ?? "",
      siret: b.siret ?? "",
      logoUrl: b.logo_url,
      notificationEmail: owner.data.notification_email ?? "",
      notifyOwnerOnBooking: owner.data.notify_owner_on_booking,
      notifyOwnerOnCancellation: owner.data.notify_owner_on_cancellation,
    },
    rules: {
      minNoticeMinutes: b.min_notice_minutes,
      maxAdvanceDays: b.max_advance_days,
      cancellationCutoffHours: b.cancellation_cutoff_hours,
      referenceStarts: b.reference_starts.map(toLocalTime).join(", "),
      eveningLockFrom: t(b.evening_lock_from),
      reminderSendTime: t(b.reminder_send_time),
      waitlistExclusiveMinutes: b.waitlist_exclusive_minutes,
      waitlistBroadcastBeforeHours: b.waitlist_broadcast_before_hours,
      waitlistQuietStart: t(b.waitlist_quiet_start),
      waitlistQuietEnd: t(b.waitlist_quiet_end),
    },
    home: {
      heroTitle: typeof home.heroTitle === "string" ? home.heroTitle : "",
      heroSubtitle:
        typeof home.heroSubtitle === "string" ? home.heroSubtitle : "",
      aboutTitle: typeof home.aboutTitle === "string" ? home.aboutTitle : "",
      aboutParagraphs: Array.isArray(home.aboutParagraphs)
        ? (home.aboutParagraphs as string[]).join("\n\n")
        : "",
    },
  };
}

export type StudioSettings = Awaited<ReturnType<typeof getStudioSettings>>;

export async function listServicesForEdit() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("services")
    .select(
      "id, name, slug, duration_min, price_cents, price_is_from, deposit_cents, bookable_online, is_featured, is_active, sort_order",
    )
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getServiceForEdit(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const [service, categories] = await Promise.all([
    db
      .from("services")
      .select(
        "*, service_variants (id, name, description, duration_min, price_cents, is_active, sort_order)",
      )
      .eq("id", id)
      .order("sort_order", { referencedTable: "service_variants" })
      .maybeSingle(),
    db.from("service_categories").select("id, name").order("sort_order"),
  ]);
  if (service.error) throw service.error;
  if (categories.error) throw categories.error;
  return { service: service.data, categories: categories.data };
}

export async function listCategories() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("service_categories")
    .select("id, name")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function listGalleryForEdit() {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("gallery_images")
    .select("id, image_url, alt, width, height, is_published, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data;
}
