"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import { after } from "next/server";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";
import { slugify } from "@/domain/catalog/slug";
import { weeklyHoursProblems } from "@/domain/schedule/opening-hours";
import {
  blankToUndefined,
  booleanish,
  emailSchema,
  localTimeSchema,
  phoneSchema,
} from "@/lib/validation";
import { type ActionResult, fail } from "@/server/actions/result";
import { CONTENT_TAGS } from "@/server/content/tags";
import { createAdminClient } from "@/server/db/admin-client";
import { processAllWaitlistDays } from "@/server/waitlist/service";
import { adminAction } from "../action-utils";

/** New opening hours or rules may free slots: offer them to the waitlist. */
function reofferWaitlist() {
  after(async () => {
    try {
      await processAllWaitlistDays();
    } catch (error) {
      console.error("waitlist after settings change", error);
    }
  });
}

const optionalText = (max: number) =>
  z.preprocess(
    blankToUndefined,
    z.string().trim().max(max, `${max} caractères maximum.`).optional(),
  );

/** "20" or "20,50" (euros) → cents; empty → null. */
const euros = z.preprocess(
  (v) =>
    typeof v === "string"
      ? v.trim() === ""
        ? null
        : Number(v.replace(",", ".").replace(/\s|€/g, ""))
      : v,
  z
    .number("Montant invalide.")
    .min(0, "Montant invalide.")
    .max(10_000, "Montant invalide.")
    .transform((n) => Math.round(n * 100))
    .nullable(),
);

const intIn = (min: number, max: number) =>
  z.coerce
    .number("Nombre invalide.")
    .int("Nombre entier attendu.")
    .min(min, `${min} minimum.`)
    .max(max, `${max} maximum.`);

// ---------------------------------------------------------------------------
// Opening hours
// ---------------------------------------------------------------------------
const hoursSchema = z
  .object({
    windows: z
      .array(
        z.object({
          weekday: z.number().int().min(1).max(7),
          opens: localTimeSchema,
          closes: localTimeSchema,
        }),
      )
      .max(28),
  })
  .superRefine(({ windows }, ctx) => {
    for (const [weekday, message] of Object.entries(
      weeklyHoursProblems(windows),
    ))
      ctx.addIssue({ code: "custom", message, path: [`day${weekday}`] });
  });

export async function saveOpeningHours(input: unknown): Promise<ActionResult> {
  return adminAction(hoursSchema, input, async ({ windows }) => {
    const { error } = await createAdminClient().rpc("replace_opening_hours", {
      p_hours: windows,
    });
    if (error) throw error;
    updateTag(CONTENT_TAGS.hours);
    reofferWaitlist();
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Booking rules
// ---------------------------------------------------------------------------
const rulesSchema = z.object({
  minNoticeMinutes: intIn(0, 10_080),
  maxAdvanceDays: intIn(1, 365),
  cancellationCutoffHours: intIn(0, 336),
  referenceStarts: z
    .string()
    .transform((v) =>
      v
        .split(/[,;\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(localTimeSchema)
        .min(1, "Indiquez au moins un horaire de début.")
        .max(20, "20 horaires maximum."),
    )
    .transform((times) => [...new Set(times)].sort()),
  eveningLockFrom: z.preprocess(blankToUndefined, localTimeSchema.optional()),
  reminderSendTime: localTimeSchema,
  waitlistExclusiveMinutes: intIn(5, 1440),
  waitlistBroadcastBeforeHours: intIn(0, 168),
  waitlistQuietStart: localTimeSchema,
  waitlistQuietEnd: localTimeSchema,
});

export async function saveBookingRules(input: unknown): Promise<ActionResult> {
  return adminAction(rulesSchema, input, async (data) => {
    const { error } = await createAdminClient()
      .from("business_settings")
      .update({
        min_notice_minutes: data.minNoticeMinutes,
        max_advance_days: data.maxAdvanceDays,
        cancellation_cutoff_hours: data.cancellationCutoffHours,
        reference_starts: data.referenceStarts,
        evening_lock_from: data.eveningLockFrom ?? null,
        reminder_send_time: data.reminderSendTime,
        waitlist_exclusive_minutes: data.waitlistExclusiveMinutes,
        waitlist_broadcast_before_hours: data.waitlistBroadcastBeforeHours,
        waitlist_quiet_start: data.waitlistQuietStart,
        waitlist_quiet_end: data.waitlistQuietEnd,
      })
      .eq("id", true);
    if (error) throw error;
    updateTag(CONTENT_TAGS.settings);
    reofferWaitlist();
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Studio details and notifications
// ---------------------------------------------------------------------------
const studioSchema = z.object({
  name: z.string().trim().min(1, "Obligatoire.").max(80),
  tagline: optionalText(160),
  phone: z.preprocess(blankToUndefined, phoneSchema.optional()),
  email: z.preprocess(blankToUndefined, emailSchema.optional()),
  instagramUrl: z.preprocess(
    blankToUndefined,
    z
      .url({ message: "Adresse invalide (https://…)." })
      .refine((v) => v.startsWith("https://"), "Adresse en https:// attendue.")
      .optional(),
  ),
  addressLine1: z.string().trim().min(1, "Obligatoire.").max(160),
  addressLine2: optionalText(160),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4,5}$/, "Code postal invalide."),
  city: z.string().trim().min(1, "Obligatoire.").max(80),
  legalName: optionalText(160),
  siret: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(/\s/g, "") : v),
    z.union([
      z.literal(""),
      z.string().regex(/^\d{14}$/, "Le SIRET contient 14 chiffres."),
    ]),
  ),
  notificationEmail: z.preprocess(blankToUndefined, emailSchema.optional()),
  notifyOwnerOnBooking: booleanish,
  notifyOwnerOnCancellation: booleanish,
});

export async function saveStudio(input: unknown): Promise<ActionResult> {
  return adminAction(studioSchema, input, async (data) => {
    const db = createAdminClient();
    const [business, owner] = await Promise.all([
      db
        .from("business_settings")
        .update({
          name: data.name,
          tagline: data.tagline ?? "",
          phone: data.phone ?? null,
          email: data.email ?? null,
          instagram_url: data.instagramUrl ?? null,
          address_line1: data.addressLine1,
          address_line2: data.addressLine2 ?? null,
          postal_code: data.postalCode,
          city: data.city,
          legal_name: data.legalName ?? null,
          siret: data.siret || null,
        })
        .eq("id", true),
      db
        .from("studio_private_settings")
        .update({
          notification_email: data.notificationEmail ?? null,
          notify_owner_on_booking: data.notifyOwnerOnBooking,
          notify_owner_on_cancellation: data.notifyOwnerOnCancellation,
        })
        .eq("id", true),
    ]);
    if (business.error) throw business.error;
    if (owner.error) throw owner.error;
    updateTag(CONTENT_TAGS.settings);
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Home page texts
// ---------------------------------------------------------------------------
const homeSchema = z.object({
  heroTitle: z.string().trim().min(1, "Obligatoire.").max(60),
  heroSubtitle: optionalText(200),
  aboutTitle: z.string().trim().min(1, "Obligatoire.").max(80),
  aboutParagraphs: z
    .string()
    .max(4000, "4000 caractères maximum.")
    .transform((v) =>
      v
        .split(/\n\s*\n/)
        .map((p) => p.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    ),
});

export async function saveHomeTexts(input: unknown): Promise<ActionResult> {
  return adminAction(homeSchema, input, async (data) => {
    const { error } = await createAdminClient()
      .from("business_settings")
      .update({
        home_content: {
          heroTitle: data.heroTitle,
          heroSubtitle: data.heroSubtitle ?? "",
          aboutTitle: data.aboutTitle,
          aboutParagraphs: data.aboutParagraphs,
        },
      })
      .eq("id", true);
    if (error) throw error;
    updateTag(CONTENT_TAGS.settings);
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Services and variants
// ---------------------------------------------------------------------------
const serviceSchema = z.object({
  id: z.preprocess(blankToUndefined, z.uuid().optional()),
  categoryId: z.uuid("Choisissez une catégorie."),
  name: z.string().trim().min(1, "Obligatoire.").max(120),
  description: z.string().trim().max(2000, "2000 caractères maximum."),
  durationMin: intIn(5, 480),
  price: euros,
  priceIsFrom: booleanish,
  deposit: euros,
  bookableOnline: booleanish,
  isFeatured: booleanish,
  isActive: booleanish,
  sortOrder: intIn(0, 999),
});

export async function saveService(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  return adminAction(serviceSchema, input, async (data) => {
    const db = createAdminClient();
    const row = {
      category_id: data.categoryId,
      name: data.name,
      description: data.description,
      duration_min: data.durationMin,
      price_cents: data.price,
      price_is_from: data.priceIsFrom,
      deposit_cents: data.deposit,
      bookable_online: data.bookableOnline,
      is_featured: data.isFeatured,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };
    let id = data.id;
    if (id) {
      // The slug stays stable: it is used in links already shared.
      const { error } = await db.from("services").update(row).eq("id", id);
      if (error) throw error;
    } else {
      const base = slugify(data.name);
      const { data: taken } = await db
        .from("services")
        .select("slug")
        .like("slug", `${base}%`);
      const used = new Set((taken ?? []).map((t) => t.slug));
      let slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      const { data: created, error } = await db
        .from("services")
        .insert({ ...row, slug })
        .select("id")
        .single();
      if (error) throw error;
      id = created.id;
    }
    updateTag(CONTENT_TAGS.services);
    return { ok: true, data: { id: id! } };
  });
}

const variantSchema = z.object({
  id: z.preprocess(blankToUndefined, z.uuid().optional()),
  serviceId: z.uuid(),
  name: z.string().trim().min(1, "Obligatoire.").max(120),
  description: z.string().trim().max(1000, "1000 caractères maximum."),
  durationMin: z.preprocess(blankToUndefined, intIn(5, 480).optional()),
  price: euros,
  isActive: booleanish,
  sortOrder: intIn(0, 999),
});

export async function saveVariant(input: unknown): Promise<ActionResult> {
  return adminAction(variantSchema, input, async (data) => {
    const db = createAdminClient();
    const row = {
      service_id: data.serviceId,
      name: data.name,
      description: data.description,
      duration_min: data.durationMin ?? null,
      price_cents: data.price,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };
    const { error } = data.id
      ? await db
          .from("service_variants")
          .update(row)
          .eq("id", data.id)
          .eq("service_id", data.serviceId)
      : await db.from("service_variants").insert(row);
    if (error?.code === "23505")
      return fail("Une variante porte déjà ce nom.", {
        name: "Nom déjà utilisé pour cette prestation.",
      });
    if (error) throw error;
    updateTag(CONTENT_TAGS.services);
    return { ok: true };
  });
}

export async function deleteVariant(input: unknown): Promise<ActionResult> {
  return adminAction(z.object({ id: z.uuid() }), input, async ({ id }) => {
    // Appointments keep their snapshot (name, duration, price): history is safe.
    const { error } = await createAdminClient()
      .from("service_variants")
      .delete()
      .eq("id", id);
    if (error) throw error;
    updateTag(CONTENT_TAGS.services);
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Images: logo and gallery (resized on the server, stored in Supabase Storage)
// ---------------------------------------------------------------------------
const MAX_UPLOAD = 4 * 1024 * 1024;

async function storeImage(
  file: File,
  folder: "gallery" | "logo",
  maxSize: number,
) {
  if (file.size === 0 || file.size > MAX_UPLOAD)
    throw new UploadError("Image trop lourde (4 Mo maximum).");
  const input = Buffer.from(await file.arrayBuffer());
  let meta: Metadata;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("Ce fichier n’est pas une image lisible.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "heif"].includes(meta.format))
    throw new UploadError("Formats acceptés : JPEG, PNG, WebP, HEIC.");

  const { data, info } = await sharp(input)
    .rotate() // apply EXIF orientation, then drop metadata (GPS…)
    .resize({
      width: maxSize,
      height: maxSize,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 84 })
    .toBuffer({ resolveWithObject: true });

  const path = `${folder}/${randomUUID()}.webp`;
  const storage = createAdminClient().storage.from("media");
  const { error } = await storage.upload(path, data, {
    contentType: "image/webp",
    cacheControl: "31536000",
  });
  if (error) throw error;
  return {
    path,
    url: storage.getPublicUrl(path).data.publicUrl,
    width: info.width,
    height: info.height,
  };
}

class UploadError extends Error {}

async function removeStored(path: string | null | undefined) {
  if (!path) return;
  const { error } = await createAdminClient()
    .storage.from("media")
    .remove([path]);
  if (error) console.error("storage remove", path, error);
}

export async function uploadGalleryImage(
  form: FormData,
): Promise<ActionResult> {
  const file = form.get("file");
  return adminAction(
    z.object({ alt: z.string().trim().max(300, "300 caractères maximum.") }),
    { alt: form.get("alt") ?? "" },
    async ({ alt }) => {
      if (!(file instanceof File)) return fail("Choisissez une photo.");
      try {
        const db = createAdminClient();
        const stored = await storeImage(file, "gallery", 1600);
        const { data: last } = await db
          .from("gallery_images")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1)
          .maybeSingle();
        const { error } = await db.from("gallery_images").insert({
          image_url: stored.url,
          storage_path: stored.path,
          alt,
          width: stored.width,
          height: stored.height,
          sort_order: (last?.sort_order ?? 0) + 10,
        });
        if (error) {
          await removeStored(stored.path);
          throw error;
        }
      } catch (error) {
        if (error instanceof UploadError) return fail(error.message);
        throw error;
      }
      updateTag(CONTENT_TAGS.gallery);
      return { ok: true };
    },
  );
}

export async function updateGalleryImage(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(
    z.object({
      id: z.uuid(),
      alt: z.string().trim().max(300, "300 caractères maximum.").optional(),
      isPublished: booleanish.optional(),
    }),
    input,
    async ({ id, alt, isPublished }) => {
      const { error } = await createAdminClient()
        .from("gallery_images")
        .update({
          ...(alt !== undefined ? { alt } : {}),
          ...(isPublished !== undefined ? { is_published: isPublished } : {}),
        })
        .eq("id", id);
      if (error) throw error;
      updateTag(CONTENT_TAGS.gallery);
      return { ok: true };
    },
  );
}

/** Moves a photo one step up or down (swaps sort orders, then renumbers). */
export async function moveGalleryImage(input: unknown): Promise<ActionResult> {
  return adminAction(
    z.object({ id: z.uuid(), direction: z.enum(["up", "down"]) }),
    input,
    async ({ id, direction }) => {
      const db = createAdminClient();
      const { data, error } = await db
        .from("gallery_images")
        .select("id")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      const ids = data.map((r) => r.id);
      const i = ids.indexOf(id);
      const j = direction === "up" ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
      [ids[i], ids[j]] = [ids[j]!, ids[i]!];
      const results = await Promise.all(
        ids.map((imageId, index) =>
          db
            .from("gallery_images")
            .update({ sort_order: (index + 1) * 10 })
            .eq("id", imageId),
        ),
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
      updateTag(CONTENT_TAGS.gallery);
      return { ok: true };
    },
  );
}

export async function deleteGalleryImage(
  input: unknown,
): Promise<ActionResult> {
  return adminAction(z.object({ id: z.uuid() }), input, async ({ id }) => {
    const { data, error } = await createAdminClient()
      .from("gallery_images")
      .delete()
      .eq("id", id)
      .select("storage_path");
    if (error) throw error;
    await removeStored(data?.[0]?.storage_path);
    updateTag(CONTENT_TAGS.gallery);
    return { ok: true };
  });
}

export async function uploadLogo(form: FormData): Promise<ActionResult> {
  const file = form.get("file");
  return adminAction(z.object({}), {}, async () => {
    if (!(file instanceof File)) return fail("Choisissez une image.");
    try {
      const db = createAdminClient();
      const { data: current } = await db
        .from("business_settings")
        .select("logo_url")
        .single();
      const stored = await storeImage(file, "logo", 512);
      const { error } = await db
        .from("business_settings")
        .update({ logo_url: stored.url })
        .eq("id", true);
      if (error) throw error;
      // Remove the previous uploaded logo (not the one shipped with the site).
      const marker = "/storage/v1/object/public/media/";
      if (current?.logo_url?.includes(marker))
        await removeStored(current.logo_url.split(marker)[1]);
    } catch (error) {
      if (error instanceof UploadError) return fail(error.message);
      throw error;
    }
    updateTag(CONTENT_TAGS.settings);
    return { ok: true };
  });
}
