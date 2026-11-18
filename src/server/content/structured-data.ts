import {
  toSchemaOrg,
  type OpeningWindow,
} from "@/domain/schedule/opening-hours";
import { mapsUrl } from "@/lib/address";
import type { BusinessInfo, GalleryImage, Service } from "./queries";

const euros = (cents: number) => (cents / 100).toFixed(2);

/** schema.org BeautySalon (a LocalBusiness) for the home page. */
export function beautySalonJsonLd(
  business: BusinessInfo,
  hours: OpeningWindow[],
  siteUrl: string,
  services: Service[] = [],
  gallery: GalleryImage[] = [],
) {
  const absolute = (path: string) => new URL(path, siteUrl).toString();
  // Real photos of Alessia's work (Google asks for an image of the business).
  const images = gallery.slice(0, 3).map((img) => absolute(img.src));
  const prices = services
    .map((s) => s.priceCents)
    .filter((p): p is number => p != null);
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteUrl}/#salon`,
    name: business.name,
    description: business.tagline,
    url: siteUrl,
    ...(business.logoUrl ? { logo: absolute(business.logoUrl) } : {}),
    ...(images.length ? { image: images } : {}),
    ...(prices.length
      ? {
          priceRange: `${Math.round(Math.min(...prices) / 100)} € – ${Math.round(Math.max(...prices) / 100)} €`,
        }
      : {}),
    currenciesAccepted: "EUR",
    ...(business.phone ? { telephone: business.phone } : {}),
    ...(business.email ? { email: business.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: [business.address.line1, business.address.line2]
        .filter(Boolean)
        .join(", "),
      postalCode: business.address.postalCode,
      addressLocality: business.address.city,
      addressCountry: business.address.countryCode,
    },
    ...(business.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: business.geo.latitude,
            longitude: business.geo.longitude,
          },
        }
      : {}),
    hasMap: mapsUrl(business.name, business.address),
    openingHoursSpecification: toSchemaOrg(hours),
    ...(business.instagramUrl ? { sameAs: [business.instagramUrl] } : {}),
    areaServed: ["Annemasse", "Genève"],
    ...(services.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Prestations",
            itemListElement: services.map((s) => ({
              "@type": "Offer",
              url: absolute(`/reserver?prestation=${s.slug}`),
              itemOffered: {
                "@type": "Service",
                name: s.name,
                ...(s.description
                  ? { description: s.description.split("\n")[0] }
                  : {}),
              },
              // Only real prices: a deposit is not the price of the service.
              ...(s.priceCents != null
                ? {
                    priceSpecification: {
                      "@type": "PriceSpecification",
                      price: euros(s.priceCents),
                      priceCurrency: "EUR",
                      ...(s.priceIsFrom
                        ? { minPrice: euros(s.priceCents) }
                        : {}),
                    },
                  }
                : {}),
            })),
          },
        }
      : {}),
  };
}
