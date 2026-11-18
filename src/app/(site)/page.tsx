import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ServiceRows } from "@/components/home/service-rows";
import { BOOKING_LINK } from "@/components/site/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { OpeningHoursList } from "@/components/site/opening-hours-list";
import { priceLabel } from "@/domain/catalog/price";
import { addressLines, instagramHandle, mapsUrl } from "@/lib/address";
import { formatDuration } from "@/lib/format";
import {
  getBusinessInfo,
  getGallery,
  getOpeningHours,
  getServices,
} from "@/server/content/queries";
import { beautySalonJsonLd } from "@/server/content/structured-data";
import { env } from "@/server/env";

const vars = (v: Record<string, number>) => v as CSSProperties;

function Shell({
  id,
  label,
  tone = "espresso",
  className = "",
  children,
}: {
  id?: string;
  label?: string;
  tone?: "espresso" | "mocha" | "deep";
  className?: string;
  children: ReactNode;
}) {
  const bg = {
    espresso: "bg-espresso-900",
    mocha: "bg-mocha",
    deep: "bg-espresso-950",
  }[tone];
  return (
    <section
      id={id}
      aria-label={label}
      className={`surface-dark relative overflow-hidden ${bg} text-ivory ${className}`}
    >
      {children}
    </section>
  );
}

const wrap = "mx-auto w-full max-w-[90rem] px-gutter sm:px-8";

export default async function HomePage() {
  const [business, hours, services, gallery] = await Promise.all([
    getBusinessInfo(),
    getOpeningHours(),
    getServices(),
    getGallery(),
  ]);
  const featured = services.filter((s) => s.isFeatured);
  const words = business.home.heroTitle.split(" ");
  const titleLines =
    words.length > 1 ? [words.slice(0, -1).join(" "), words.at(-1)!] : words;
  const cutoff = business.policy.cancellationCutoffHours;

  const faq = [
    {
      q: "Quand faut-il prévoir un remplissage ?",
      a: "Le remplissage se fait dans les trois semaines suivant la pose complète. Au-delà, une nouvelle pose complète est nécessaire.",
    },
    {
      q: "Je porte déjà des extensions posées ailleurs.",
      a: "Une dépose est alors proposée (20 €). Si elle est suivie d’une nouvelle pose, son prix est réduit à 10 €.",
    },
    {
      q: "Puis-je annuler ou déplacer mon rendez-vous ?",
      a: `Oui, depuis votre espace ou le lien reçu par e-mail, jusqu’à ${cutoff} h avant le rendez-vous. Au-delà, contactez directement Alessia.`,
    },
    {
      q: "Aucun créneau ne me convient, que faire ?",
      a: "Inscrivez-vous sur la liste d’attente du jour souhaité : si une place se libère, vous êtes prévenue par e-mail et pouvez la réserver en un clic.",
    },
    {
      q: "Proposez-vous des rendez-vous en soirée ?",
      a: "Les créneaux à partir de 18 h sont possibles sur demande : écrivez-moi sur Instagram.",
    },
  ];

  return (
    <>
      <JsonLd
        data={beautySalonJsonLd(business, hours, env.NEXT_PUBLIC_SITE_URL)}
      />

      {/* 1 · Hero ------------------------------------------------------------ */}
      <section
        data-hero
        aria-labelledby="hero-title"
        className="surface-dark relative h-svh min-h-[38rem] overflow-hidden bg-espresso-950 text-ivory"
      >
        {gallery[0] ? (
          <div
            className="absolute top-[13%] right-[7vw] w-[40vw] max-w-[22rem] sm:w-[28vw] lg:top-[17%] lg:right-[6vw] lg:w-[19vw]"
            data-parallax="-0.25"
          >
            {/* CSS entrance on the inner element, GSAP parallax on the outer one: never both on one transform. */}
            <div className="hero-fade" style={vars({ "--i": 2 })}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-t-full ring-1 ring-caramel-300/30">
                <Image
                  src="/editorial/regard-01-editorial.jpg"
                  alt={gallery[0].alt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 19vw, (min-width: 640px) 28vw, 40vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-4 hidden text-right text-xs tracking-[0.2em] text-sand-100 uppercase sm:block">
                Extension de cils · le studio
              </p>
            </div>
          </div>
        ) : null}

        <div
          className={`${wrap} relative flex h-full flex-col justify-end pt-24 pb-8 sm:pb-12`}
        >
          <p
            className="hero-fade label text-sand-100"
            style={vars({ "--i": 0 })}
          >
            Annemasse · Genève
          </p>
          <h1
            id="hero-title"
            className="mt-5 font-display text-mega text-ivory"
          >
            {titleLines.map((line, i) => (
              <span key={line} className="hero-line">
                <span
                  style={vars({ "--i": i })}
                  className={i === 1 ? "pl-[14vw]" : undefined}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <div className="mt-10 grid grid-cols-2 items-center gap-6 border-t border-ivory/20 pt-6 sm:grid-cols-3">
            <p
              className="hero-fade text-sm tracking-[0.12em] text-sand-100 uppercase"
              style={vars({ "--i": 1 })}
            >
              {business.home.heroSubtitle}
            </p>
            <div
              className="hero-fade hidden flex-col items-center gap-3 sm:flex"
              style={vars({ "--i": 2 })}
              aria-hidden="true"
            >
              <span className="text-[0.6875rem] tracking-[0.3em] text-sand-100 uppercase">
                Défiler
              </span>
              <span className="block h-10 w-px overflow-hidden bg-ivory/20">
                <span className="block h-full w-full animate-scroll-cue bg-ivory" />
              </span>
            </div>
            <Link
              href={BOOKING_LINK.href}
              aria-label={BOOKING_LINK.label}
              className="hero-fade group inline-flex min-h-12 items-center gap-3 justify-self-end rounded-pill border border-ivory/40 px-5 text-[0.75rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:bg-ivory hover:text-espresso-950 sm:px-7"
              style={vars({ "--i": 3 })}
            >
              <span className="hidden sm:inline">{BOOKING_LINK.label}</span>
              <span className="sm:hidden">Réserver</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2 · Marquee ---------------------------------------------------------- */}
      <div
        className="surface-dark overflow-hidden border-y border-ivory/10 bg-espresso-950 py-5 text-sand-100"
        aria-label="Prestations phares"
      >
        <div className="flex w-max animate-marquee">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              aria-hidden={copy === 1}
              className="flex shrink-0 items-center"
            >
              {[...featured.map((s) => s.name), "Annemasse — Genève"].map(
                (item) => (
                  <li
                    key={item}
                    className="flex items-center font-sans text-[clamp(1.1rem,2.2vw,1.6rem)] font-light tracking-[0.18em] whitespace-nowrap uppercase"
                  >
                    <span className="px-8">{item}</span>
                    <span aria-hidden="true" className="text-caramel-500">
                      ✦
                    </span>
                  </li>
                ),
              )}
            </ul>
          ))}
        </div>
      </div>

      {/* 3 · Manifesto -------------------------------------------------------- */}
      <Shell tone="mocha" label="L’esprit du studio">
        <div className={`${wrap} py-28 text-center sm:py-40`}>
          <p className="label text-sand-100">L’esprit du studio</p>
          <blockquote className="mx-auto mt-10 max-w-5xl">
            <p
              data-reveal="lines"
              className="font-display text-quote text-ivory"
            >
              « Sublimer votre regard, à l’écoute de vos envies, dans une
              atmosphère douce et chaleureuse. »
            </p>
            <footer
              data-reveal="fade"
              data-delay="0.3"
              className="mt-8 text-sm tracking-[0.3em] text-sand-100 uppercase"
            >
              Alessia
            </footer>
          </blockquote>
        </div>
      </Shell>

      {/* 4 · Parallax collage -------------------------------------------------- */}
      <Shell tone="mocha" label="L’art du regard" className="min-h-[115svh]">
        {gallery[5] ? (
          <div
            className="absolute top-[9%] right-[6%] w-[36vw] sm:w-[19vw]"
            data-parallax="0.6"
          >
            <div
              data-reveal="mask"
              className="relative aspect-[4/5] overflow-hidden"
            >
              <Image
                src="/editorial/regard-06-editorial.jpg"
                alt={gallery[5].alt}
                fill
                sizes="(min-width: 640px) 19vw, 36vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
        {gallery[2] ? (
          <div
            className="absolute bottom-[12%] left-[6%] w-[34vw] sm:w-[17vw]"
            data-parallax="0.35"
          >
            <div
              data-reveal="mask"
              className="relative aspect-[3/4] overflow-hidden"
            >
              <Image
                src="/editorial/regard-03-editorial.jpg"
                alt={gallery[2].alt}
                fill
                sizes="(min-width: 640px) 17vw, 34vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
        <div className="relative flex min-h-[115svh] items-center justify-center px-gutter text-center">
          <h2
            data-reveal="lines"
            className="font-sans text-headline font-light tracking-[0.04em] text-ivory uppercase"
          >
            L’art
            <br />
            du regard
          </h2>
        </div>
      </Shell>

      {/* 5 · About -------------------------------------------------------------- */}
      <Shell
        id="a-propos"
        tone="deep"
        label="À propos"
        className="scroll-mt-16"
      >
        <p
          aria-hidden="true"
          data-parallax-x="0.12"
          className="pointer-events-none absolute top-[8%] left-0 font-display text-[22vw] leading-none whitespace-nowrap text-ivory/[0.05] select-none"
        >
          Alessia
        </p>
        <div
          className={`${wrap} relative grid items-center gap-16 py-28 sm:py-40 lg:grid-cols-[1fr_1.1fr] lg:gap-24`}
        >
          <div
            className="relative mx-auto w-full max-w-md"
            data-parallax="0.15"
          >
            <div
              data-reveal="mask"
              className="relative aspect-[3/4] overflow-hidden rounded-t-full"
            >
              <Image
                src="/editorial/regard-04-editorial.jpg"
                alt={gallery[3]?.alt ?? ""}
                fill
                sizes="(min-width: 1024px) 28rem, 90vw"
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <p className="label text-sand-100">À propos</p>
            <h2
              data-reveal="lines"
              className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] text-ivory"
            >
              {business.home.aboutTitle}
            </h2>
            <div className="mt-10 max-w-xl space-y-5 text-lg leading-relaxed text-sand-100">
              {business.home.aboutParagraphs.map((p, i) => (
                <p key={p} data-reveal="fade" data-delay={i * 0.1}>
                  {p}
                </p>
              ))}
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-8 border-t border-ivory/15 pt-8">
              <div data-reveal="fade">
                <dt className="font-display text-5xl text-caramel-300">2019</dt>
                <dd className="mt-2 text-sm text-sand-100">
                  Diplômée dans le secteur de l’esthétique
                </dd>
              </div>
              <div data-reveal="fade" data-delay="0.1">
                <dt className="font-display text-5xl text-caramel-300">2021</dt>
                <dd className="mt-2 text-sm text-sand-100">
                  Spécialisée dans la beauté du regard, en Italie
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </Shell>

      {/* 6 · Services --------------------------------------------------------- */}
      <Shell id="prestations" tone="espresso" label="Prestations">
        <div className={`${wrap} py-28 sm:py-36`}>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label text-sand-100">Prestations</p>
              <h2
                data-reveal="lines"
                className="mt-6 font-sans text-headline font-light tracking-[0.04em] text-ivory uppercase"
              >
                Sur mesure
                <br />
                pour votre regard
              </h2>
            </div>
            <Link
              href="/prestations"
              className="min-h-11 shrink-0 self-start link-underline text-sm tracking-[0.2em] text-sand-100 uppercase sm:self-end"
            >
              Toutes les prestations ({services.length})
            </Link>
          </div>
          <div className="mt-16">
            <ServiceRows
              rows={featured.map((s, i) => ({
                slug: s.slug,
                name: s.name,
                meta: [formatDuration(s.durationMin), priceLabel(s)]
                  .filter(Boolean)
                  .join(" · "),
                image: gallery.length ? gallery[i % gallery.length]!.src : null,
              }))}
            />
          </div>
        </div>
      </Shell>

      {/* 7 · Gallery ---------------------------------------------------------- */}
      <Shell tone="deep" label="Galerie">
        <div className={`${wrap} py-28 sm:py-36`}>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label text-sand-100">Galerie</p>
              <h2
                data-reveal="lines"
                className="mt-6 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] text-ivory"
              >
                Les regards
              </h2>
            </div>
            <Link
              href="/galerie"
              className="min-h-11 shrink-0 self-start link-underline text-sm tracking-[0.2em] text-sand-100 uppercase sm:self-end"
            >
              Voir la galerie
            </Link>
          </div>
          <ul className="-mx-gutter mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0">
            {gallery.slice(0, 3).map((img, i) => (
              <li
                key={img.id}
                className={`w-[75%] shrink-0 snap-center sm:w-auto ${i === 1 ? "sm:mt-24" : ""}`}
                data-parallax={i === 1 ? "0.25" : undefined}
              >
                <div
                  data-reveal="mask"
                  data-delay={i * 0.12}
                  className="relative aspect-[3/4] overflow-hidden"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 640px) 30vw, 75vw"
                    className="object-cover"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Shell>

      {/* 8 · FAQ -------------------------------------------------------------- */}
      <Shell tone="mocha" label="Questions fréquentes">
        <div
          className={`${wrap} grid gap-14 py-28 sm:py-36 lg:grid-cols-[1fr_1.4fr]`}
        >
          <div>
            <p className="label text-sand-100">Bon à savoir</p>
            <h2
              data-reveal="lines"
              className="mt-6 font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] text-ivory"
            >
              Questions fréquentes
            </h2>
          </div>
          <div className="border-t border-ivory/20">
            {faq.map((item, i) => (
              <details
                key={item.q}
                className="group border-b border-ivory/20"
                data-reveal="fade"
                data-delay={i * 0.05}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-sans text-sm tracking-[0.14em] text-ivory uppercase [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-xl font-light transition-transform duration-500 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 leading-relaxed text-sand-100">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Shell>

      {/* 9 · Studio ----------------------------------------------------------- */}
      <Shell
        id="studio"
        tone="espresso"
        label="Le studio"
        className="scroll-mt-16"
      >
        <div className="grid lg:grid-cols-2">
          <div
            aria-hidden="true"
            className="relative flex min-h-[44svh] items-end overflow-hidden bg-mocha px-gutter pb-10 sm:px-12 lg:min-h-[90svh] lg:px-20 lg:pb-20"
          >
            <p
              data-parallax="0.15"
              className="font-display text-[clamp(10rem,34vw,26rem)] leading-[0.8] text-ivory/90"
            >
              {business.address.line1.match(/^\d+/)?.[0] ?? "A"}
            </p>
          </div>
          <div className="flex flex-col justify-center px-gutter py-24 sm:px-12 lg:px-20">
            <p className="label text-sand-100">Le studio</p>
            <h2
              data-reveal="lines"
              className="mt-6 font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] text-ivory"
            >
              Venir au studio
            </h2>
            <address
              data-reveal="fade"
              className="mt-10 text-xl leading-relaxed text-ivory not-italic"
            >
              {addressLines(business.address).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <div data-reveal="fade" data-delay="0.1" className="mt-10 max-w-md">
              <OpeningHoursList hours={hours} tone="dark" />
            </div>
            <div
              data-reveal="fade"
              data-delay="0.2"
              className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm tracking-[0.2em] uppercase"
            >
              <a
                href={mapsUrl(business.name, business.address)}
                rel="noopener"
                className="inline-flex min-h-11 items-center link-underline text-ivory"
              >
                Itinéraire
              </a>
              {business.instagramUrl ? (
                <a
                  href={business.instagramUrl}
                  rel="noopener"
                  className="inline-flex min-h-11 items-center link-underline text-ivory"
                >
                  {instagramHandle(business.instagramUrl)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}
