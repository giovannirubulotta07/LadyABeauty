import "server-only";
import { createAdminClient } from "@/server/db/admin-client";
import { requireAdmin } from "./guard";

export type StudioService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  bookableOnline: boolean;
  variants: Array<{
    id: string;
    name: string;
    durationMin: number;
    priceCents: number | null;
  }>;
};

/** Every active service, including those not bookable online (studio booking). */
export async function listStudioServices(): Promise<StudioService[]> {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("services")
    .select(
      "id, name, duration_min, price_cents, bookable_online, service_variants (id, name, duration_min, price_cents, is_active, sort_order)",
    )
    .eq("is_active", true)
    .order("sort_order")
    .order("sort_order", { referencedTable: "service_variants" });
  if (error) throw error;
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.duration_min,
    priceCents: s.price_cents,
    bookableOnline: s.bookable_online,
    variants: s.service_variants
      .filter((v) => v.is_active)
      .map((v) => ({
        id: v.id,
        name: v.name,
        durationMin: v.duration_min ?? s.duration_min,
        priceCents: v.price_cents ?? s.price_cents,
      })),
  }));
}

/** Resolves a service (and variant) for a studio booking: active is enough. */
export async function resolveStudioService(
  serviceId: string,
  variantId: string | null | undefined,
) {
  const services = await listStudioServices();
  const service = services.find((s) => s.id === serviceId);
  if (!service) return null;
  const variant = variantId
    ? service.variants.find((v) => v.id === variantId)
    : undefined;
  if (variantId && !variant) return null;
  return {
    serviceId: service.id,
    variantId: variant?.id ?? null,
    serviceName: service.name,
    variantName: variant?.name ?? null,
    durationMin: variant?.durationMin ?? service.durationMin,
    priceCents: variant?.priceCents ?? service.priceCents,
  };
}
