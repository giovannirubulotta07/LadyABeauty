import { describe, expect, it } from "vitest";
import type { BusinessInfo, GalleryImage, Service } from "./queries";
import { beautySalonJsonLd } from "./structured-data";

const business = {
  name: "Lady A Beauty",
  tagline: "Lash maker & brow artist à Annemasse",
  email: null,
  phone: null,
  instagramUrl: "https://www.instagram.com/lady.a_beauty/",
  logoUrl: null,
  address: {
    line1: "49 avenue de Verdun",
    line2: null,
    postalCode: "74100",
    city: "Annemasse",
    countryCode: "FR",
  },
  geo: { latitude: 46.18, longitude: 6.24 },
  legal: { legalName: null, siret: null },
  home: {
    heroTitle: "",
    heroSubtitle: "",
    aboutTitle: "",
    aboutParagraphs: [],
  },
  policy: {
    cancellationCutoffHours: 24,
    minNoticeMinutes: 120,
    maxAdvanceDays: 60,
  },
} satisfies BusinessInfo;

const service = (over: Partial<Service>): Service => ({
  id: "x",
  slug: "s",
  name: "Service",
  description: "",
  durationMin: 60,
  priceCents: null,
  priceIsFrom: false,
  depositCents: null,
  bookableOnline: true,
  isFeatured: false,
  variants: [],
  ...over,
});

const photo: GalleryImage = {
  id: "p",
  src: "/galerie/regard-01.jpg",
  alt: "Extension de cils",
  width: 800,
  height: 1000,
};

type JsonLd = {
  image: string[];
  priceRange: string;
  logo?: string;
  geo: unknown;
  hasOfferCatalog: {
    itemListElement: Array<{
      url: string;
      itemOffered: { description?: string };
      priceSpecification?: {
        price: string;
        priceCurrency: string;
        minPrice?: string;
      };
    }>;
  };
};

describe("données structurées BeautySalon", () => {
  const data = beautySalonJsonLd(
    business,
    [],
    "https://lady-a.example",
    [
      service({
        slug: "epilation-sourcils",
        name: "Épilation sourcils",
        priceCents: 1600,
      }),
      service({
        slug: "depose",
        name: "Dépose",
        priceCents: 1000,
        priceIsFrom: true,
      }),
      service({
        slug: "extension-cils",
        name: "Extension cils",
        depositCents: 2000,
        description: "Pose sur mesure.\n\nAcompte…",
      }),
    ],
    [photo],
  ) as unknown as JsonLd;

  it("utilise les vraies photos et une fourchette de prix réelle", () => {
    expect(data.image).toEqual([
      "https://lady-a.example/galerie/regard-01.jpg",
    ]);
    expect(data.priceRange).toBe("10 € – 16 €");
    expect(data.logo).toBeUndefined();
    expect(data.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 46.18,
      longitude: 6.24,
    });
  });

  it("liste les prestations sans jamais présenter l'acompte comme un prix", () => {
    const offers = data.hasOfferCatalog.itemListElement;
    expect(offers).toHaveLength(3);
    expect(offers[0]!.priceSpecification).toMatchObject({
      price: "16.00",
      priceCurrency: "EUR",
    });
    expect(offers[1]!.priceSpecification?.minPrice).toBe("10.00");
    expect(offers[2]!.priceSpecification).toBeUndefined();
    expect(offers[2]!.itemOffered.description).toBe("Pose sur mesure.");
    expect(offers[2]!.url).toBe(
      "https://lady-a.example/reserver?prestation=extension-cils",
    );
  });
});
