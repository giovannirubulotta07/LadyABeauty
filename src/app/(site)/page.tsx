import Image from "next/image";
import Link from "next/link";
import { BOOKING_LINK } from "@/components/site/navigation";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { JsonLd } from "@/components/site/json-ld";
import { OpeningHoursList } from "@/components/site/opening-hours-list";
import { ServiceCard } from "@/components/site/service-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  ArrowIcon,
  ClockIcon,
  InstagramIcon,
  PinIcon,
} from "@/components/ui/icons";
import { LeopardBand } from "@/components/ui/leopard-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { addressLines, instagramHandle, mapsUrl } from "@/lib/address";
import {
  getBusinessInfo,
  getGallery,
  getOpeningHours,
  getServices,
} from "@/server/content/queries";
import { beautySalonJsonLd } from "@/server/content/structured-data";
import { env } from "@/server/env";

export default async function HomePage() {
  const [business, hours, services, gallery] = await Promise.all([
    getBusinessInfo(),
    getOpeningHours(),
    getServices(),
    getGallery(),
  ]);
  const featured = services.filter((s) => s.isFeatured);
  const heroImage = gallery[0];
  const aboutImage = gallery[3] ?? gallery[1];

  return (
    <>
      <JsonLd
        data={beautySalonJsonLd(business, hours, env.NEXT_PUBLIC_SITE_URL)}
      />

      {/* Hero ------------------------------------------------------------- */}
      <section
        aria-labelledby="hero-title"
        className="surface-dark overflow-hidden bg-espresso-900 text-ivory"
      >
        <Container className="grid items-center gap-12 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-24">
          <div>
            <p className="label text-caramel-300">Annemasse · Genève</p>
            <h1
              id="hero-title"
              className="mt-6 animate-settle text-display text-ivory"
            >
              {business.home.heroTitle}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-sand-100">
              {business.home.heroSubtitle}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={BOOKING_LINK.href} variant="light" size="lg">
                {BOOKING_LINK.label}
              </ButtonLink>
              <ButtonLink href="/prestations" variant="outline-light" size="lg">
                Voir les prestations
              </ButtonLink>
            </div>
          </div>

          {heroImage ? (
            <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-t-full border border-caramel-300/50"
              />
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={heroImage.width}
                height={heroImage.height}
                sizes="(min-width: 1024px) 28rem, (min-width: 640px) 24rem, 90vw"
                preload
                className="relative aspect-[3/4] h-auto w-full rounded-t-full object-cover"
              />
            </div>
          ) : null}
        </Container>
      </section>
      <LeopardBand />

      {/* Prestations -------------------------------------------------------- */}
      <section aria-labelledby="prestations-title" className="py-section">
        <Container>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="prestations-title"
              label="Prestations"
              title="La beauté du regard"
              intro="Extensions, rehaussement, browlift : des prestations sur mesure, réalisées avec soin."
            />
            <Link
              href="/prestations"
              className="label inline-flex min-h-11 shrink-0 items-center gap-2 text-caramel-700 transition-colors hover:text-espresso-900"
            >
              Toutes les prestations
              <ArrowIcon width={16} height={16} />
            </Link>
          </div>
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((service) => (
              <li key={service.id}>
                <ServiceCard service={service} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* À propos ---------------------------------------------------------- */}
      <section
        id="a-propos"
        aria-labelledby="about-title"
        className="scroll-mt-20 bg-sand-50 py-section"
      >
        <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {aboutImage ? (
            <div className="relative order-last mx-auto w-full max-w-sm lg:order-first">
              <div
                aria-hidden="true"
                className="absolute top-4 -right-4 bottom-[-1rem] left-4 rounded-card border border-caramel-500"
              />
              <Image
                src={aboutImage.src}
                alt={aboutImage.alt}
                width={aboutImage.width}
                height={aboutImage.height}
                sizes="(min-width: 1024px) 24rem, 90vw"
                className="relative aspect-[3/4] h-auto w-full rounded-card object-cover"
              />
            </div>
          ) : null}
          <div>
            <SectionHeading
              id="about-title"
              label="À propos"
              title={business.home.aboutTitle}
            />
            <div className="mt-8 max-w-prose space-y-5 text-lg leading-relaxed text-espresso-700">
              {business.home.aboutParagraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Galerie ------------------------------------------------------------ */}
      <section aria-labelledby="galerie-title" className="py-section">
        <Container>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              id="galerie-title"
              label="Galerie"
              title="Les regards"
            />
            <Link
              href="/galerie"
              className="label inline-flex min-h-11 shrink-0 items-center gap-2 text-caramel-700 transition-colors hover:text-espresso-900"
            >
              Voir la galerie
              <ArrowIcon width={16} height={16} />
            </Link>
          </div>
          <div className="mt-12">
            <GalleryGrid images={gallery.slice(0, 3)} layout="strip" />
          </div>
        </Container>
      </section>

      {/* Studio: horaires & adresse ---------------------------------------- */}
      <LeopardBand />
      <section
        id="studio"
        aria-labelledby="studio-title"
        className="surface-dark scroll-mt-20 bg-espresso-900 py-section text-ivory"
      >
        <Container>
          <SectionHeading
            id="studio-title"
            label="Le studio"
            title="Venir au studio"
            tone="dark"
          />
          <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-16">
            <div>
              <h3 className="flex items-center gap-3 font-sans text-sm font-medium tracking-[0.16em] text-caramel-300 uppercase">
                <PinIcon /> Adresse
              </h3>
              <address className="mt-4 text-lg leading-relaxed not-italic">
                {addressLines(business.address).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <a
                href={mapsUrl(business.name, business.address)}
                className={buttonClasses("outline-light", "md", "mt-6")}
                rel="noopener"
              >
                Itinéraire
              </a>
            </div>

            <div className="lg:col-span-2">
              <h3 className="flex items-center gap-3 font-sans text-sm font-medium tracking-[0.16em] text-caramel-300 uppercase">
                <ClockIcon /> Horaires
              </h3>
              <OpeningHoursList
                hours={hours}
                tone="dark"
                className="mt-2 max-w-lg text-lg"
              />
            </div>
          </div>

          {business.instagramUrl ? (
            <div className="mt-16 flex flex-col items-start gap-6 border-t border-sand-100/15 pt-10 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-2xl text-ivory sm:text-3xl">
                Suivez les dernières poses sur Instagram
              </p>
              <a
                href={business.instagramUrl}
                className={buttonClasses("light", "md")}
                rel="noopener"
              >
                <InstagramIcon />
                {instagramHandle(business.instagramUrl)}
              </a>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
