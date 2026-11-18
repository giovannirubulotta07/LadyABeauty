import { formatPrice } from "@/lib/format";

type Priced = {
  priceCents: number | null;
  priceIsFrom: boolean;
  depositCents: number | null;
};

/**
 * Public price label for a service.
 * Full price when known; otherwise the deposit (the current site only shows
 * deposits for most services — see docs/decisioni.md D9).
 */
export function priceLabel(service: Priced): string | null {
  if (service.priceCents != null) {
    const price = formatPrice(service.priceCents);
    return service.priceIsFrom ? `À partir de ${price}` : price;
  }
  if (service.depositCents != null)
    return `Acompte ${formatPrice(service.depositCents)}`;
  return null;
}
