import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import type {
  IsoWeekday,
  OpeningWindow,
} from "@/domain/schedule/opening-hours";
import { createPublicClient } from "@/server/db/public-client";
import { CONTENT_TAGS } from "./tags";

// ---------------------------------------------------------------------------
// Types exposed to the UI (decoupled from the database row shapes)
// ---------------------------------------------------------------------------
export type BusinessInfo = {
  name: string;
  tagline: string;
  email: string | null;
  phone: string | null;
  instagramUrl: string | null;
  logoUrl: string | null;
  address: {
    line1: string;
    line2: string | null;
    postalCode: string;
    city: string;
    countryCode: string;
  };
  geo: { latitude: number; longitude: number } | null;
  legal: { legalName: string | null; siret: string | null };
  home: HomeContent;
  policy: {
    cancellationCutoffHours: number;
    minNoticeMinutes: number;
    maxAdvanceDays: number;
  };
};

const homeContentSchema = z.object({
  heroTitle: z.string().min(1).default("Lady A Beauty"),
  heroSubtitle: z.string().default(""),
  aboutTitle: z.string().default("À propos"),
  aboutParagraphs: z.array(z.string()).default([]),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

export type Service = {
  id: string;
  slug: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number | null;
  priceIsFrom: boolean;
  depositCents: number | null;
  bookableOnline: boolean;
  isFeatured: boolean;
  variants: Array<{
    id: string;
    name: string;
    description: string;
    durationMin: number;
    priceCents: number | null;
  }>;
};

export type GalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

class ContentError extends Error {
  constructor(what: string, cause: unknown) {
    super(`Impossible de charger ${what}`, { cause });
    this.name = "ContentError";
  }
}

// ---------------------------------------------------------------------------
// Queries — cached in the static shell, invalidated by tag on admin edits
// ---------------------------------------------------------------------------
export async function getBusinessInfo(): Promise<BusinessInfo> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.settings);

  const { data, error } = await createPublicClient()
    .from("business_settings")
    .select(
      "name, tagline, email, phone, instagram_url, logo_url, address_line1, address_line2, postal_code, city, country_code, latitude, longitude, legal_name, siret, home_content, cancellation_cutoff_hours, min_notice_minutes, max_advance_days",
    )
    .single();
  if (error) throw new ContentError("les informations du studio", error);

  return {
    name: data.name,
    tagline: data.tagline,
    email: data.email,
    phone: data.phone,
    instagramUrl: data.instagram_url,
    logoUrl: data.logo_url,
    address: {
      line1: data.address_line1,
      line2: data.address_line2,
      postalCode: data.postal_code,
      city: data.city,
      countryCode: data.country_code,
    },
    geo:
      data.latitude != null && data.longitude != null
        ? { latitude: data.latitude, longitude: data.longitude }
        : null,
    legal: { legalName: data.legal_name, siret: data.siret },
    home: homeContentSchema.parse(data.home_content ?? {}),
    policy: {
      cancellationCutoffHours: data.cancellation_cutoff_hours,
      minNoticeMinutes: data.min_notice_minutes,
      maxAdvanceDays: data.max_advance_days,
    },
  };
}

export async function getOpeningHours(): Promise<OpeningWindow[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.hours);

  const { data, error } = await createPublicClient()
    .from("opening_hours")
    .select("weekday, opens, closes")
    .order("weekday")
    .order("opens");
  if (error) throw new ContentError("les horaires", error);

  return data.map((row) => ({
    weekday: row.weekday as IsoWeekday,
    opens: row.opens,
    closes: row.closes,
  }));
}

export async function getServices(): Promise<Service[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.services);

  const { data, error } = await createPublicClient()
    .from("services")
    .select(
      "id, slug, name, description, duration_min, price_cents, price_is_from, deposit_cents, bookable_online, is_featured, sort_order, service_variants (id, name, description, duration_min, price_cents, sort_order)",
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "service_variants" });
  if (error) throw new ContentError("les prestations", error);

  return data.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    durationMin: s.duration_min,
    priceCents: s.price_cents,
    priceIsFrom: s.price_is_from,
    depositCents: s.deposit_cents,
    bookableOnline: s.bookable_online,
    isFeatured: s.is_featured,
    variants: s.service_variants.map((v) => ({
      id: v.id,
      name: v.name,
      description: v.description,
      durationMin: v.duration_min ?? s.duration_min,
      priceCents: v.price_cents ?? s.price_cents,
    })),
  }));
}

export async function getGallery(): Promise<GalleryImage[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CONTENT_TAGS.gallery);

  const { data, error } = await createPublicClient()
    .from("gallery_images")
    .select("id, image_url, alt, width, height")
    .order("sort_order");
  if (error) throw new ContentError("la galerie", error);

  return data.map((img) => ({
    id: img.id,
    src: img.image_url,
    alt: img.alt,
    width: img.width,
    height: img.height,
  }));
}
