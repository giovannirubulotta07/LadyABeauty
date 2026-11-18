import {
  toSchemaOrg,
  type OpeningWindow,
} from "@/domain/schedule/opening-hours";
import { mapsUrl } from "@/lib/address";
import type { BusinessInfo } from "./queries";

/** schema.org BeautySalon (a LocalBusiness) for the home page. */
export function beautySalonJsonLd(
  business: BusinessInfo,
  hours: OpeningWindow[],
  siteUrl: string,
) {
  const absolute = (path: string) => new URL(path, siteUrl).toString();
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "@id": `${siteUrl}/#salon`,
    name: business.name,
    description: business.tagline,
    url: siteUrl,
    ...(business.logoUrl
      ? { logo: absolute(business.logoUrl), image: absolute(business.logoUrl) }
      : {}),
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
  };
}
