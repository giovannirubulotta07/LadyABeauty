import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { FurLayer } from "@/components/fur/fur-layer";
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
  /** Dark tones for the editorial story, light ones for practical information. */
  tone?: "espresso" | "mocha" | "deep" | "rose" | "sand" | "ivory";
  className?: string;
  children: ReactNode;
}) {
  const look = {
    espresso: "surface-dark bg-espresso-900 text-ivory",
    mocha: "surface-dark bg-mocha text-ivory",
    deep: "surface-dark bg-espresso-950 text-ivory",
    rose: "surface-dark bg-rose-950 text-ivory",
    sand: "bg-sand-100 text-ink",
    ivory: "bg-ivory text-ink",
  }[tone];
  return (
    <section
      id={id}
      aria-label={label}
      className={`relative overflow-hidden ${look} ${className}`}
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
        data={beautySalonJsonLd(
          business,
          hours,
          env.NEXT_PUBLIC_SITE_URL,
          services,
          gallery,
        )}
      />

      {/* 1 · Hero ------------------------------------------------------------ */}
      <section
        data-hero
        aria-labelledby="hero-title"
        className="surface-dark relative h-svh min-h-[38rem] overflow-hidden bg-espresso-950 text-ivory"
      >
        {/* Fur that the visitor strokes with the pointer or a finger. */}
        <FurLayer pattern="leopard" veil="hero" />
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
                </span>{" "}
              </span>
            ))}
          </h1>
          <div className="mt-10 grid grid-cols-2 items-center gap-6 border-t border-ivory/20 pt-6">
            <p
              className="hero-fade text-sm tracking-[0.12em] text-sand-100 uppercase"
              style={vars({ "--i": 1 })}
            >
              {business.home.heroSubtitle}
            </p>
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

      {/* 3 · L’esprit du studio: quote and two real photos -------------- */}
      <Shell tone="rose" label="L’esprit du studio">
        {/* The pink fur: the soft accent of the page, stroked like the hero. */}
        <FurLayer pattern="rose" veil="strong" />
        <div className={`${wrap} relative py-24 sm:py-36`}>
          <p className="label text-center text-sand-100">L’esprit du studio</p>
          <blockquote className="mx-auto mt-10 max-w-5xl text-center">
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
          {gallery[2] && gallery[5] ? (
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 items-start gap-4 sm:mt-24 sm:gap-10">
              {[
                {
                  src: "/editorial/regard-03-editorial.jpg",
                  alt: gallery[2].alt,
                  position: "object-[55%_50%]",
                },
                {
                  src: "/editorial/regard-06-editorial.jpg",
                  alt: gallery[5].alt,
                  position: "object-[52%_32%]",
                },
              ].map((photo, i) => (
                <div
                  key={photo.src}
                  className={i === 1 ? "mt-12 sm:mt-24" : ""}
                  data-parallax={i === 1 ? "0.2" : undefined}
                >
                  <div
                    data-reveal="mask"
                    data-delay={i * 0.12}
                    className="relative aspect-[4/5] overflow-hidden"
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(min-width: 896px) 26rem, 46vw"
                      className={`object-cover ${photo.position}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Shell>

      {/* 5 · About -------------------------------------------------------------- */}
      <Shell
        id="a-propos"
        tone="deep"
        label="À propos"
        className="scroll-mt-16"
      >
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
                className="mt-6 max-w-3xl font-display text-[clamp(3rem,7vw,6rem)] leading-[0.95] text-ivory"
              >
                Sur mesure pour votre regard
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
          <p
            aria-hidden="true"
            className="mt-12 text-xs tracking-[0.2em] text-sand-100/80 uppercase sm:hidden"
          >
            Faites glisser →
          </p>
          <ul className="-mx-gutter mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-gutter pb-4 sm:mx-0 sm:mt-16 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0">
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
      <Shell tone="sand" label="Questions fréquentes">
        <div
          className={`${wrap} grid gap-14 py-28 sm:py-36 lg:grid-cols-[1fr_1.4fr]`}
        >
          <div>
            <p className="label text-caramel-700">Bon à savoir</p>
            <h2
              data-reveal="lines"
              className="mt-6 font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] text-espresso-900"
            >
              Questions fréquentes
            </h2>
          </div>
          <div className="border-t border-espresso-900/15">
            {faq.map((item, i) => (
              <details
                key={item.q}
                className="group border-b border-espresso-900/15"
                data-reveal="fade"
                data-delay={i * 0.05}
              >
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-xl text-espresso-900 sm:text-2xl [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="font-sans text-2xl font-light text-caramel-700 transition-transform duration-500 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 leading-relaxed text-espresso-700">
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
        tone="ivory"
        label="Le studio"
        className="scroll-mt-16 border-t border-espresso-900/10"
      >
        <div>
          <div
            className={`${wrap} grid gap-12 py-24 sm:py-32 lg:grid-cols-[1fr_1fr] lg:gap-24`}
          >
            <div>
              <p className="label text-caramel-700">Le studio</p>
              <h2
                data-reveal="lines"
                className="mt-6 font-display text-[clamp(2.6rem,5vw,4.5rem)] leading-[1] text-espresso-900"
              >
                Venir au studio
              </h2>
              <address
                data-reveal="fade"
                className="mt-10 text-xl leading-relaxed text-espresso-900 not-italic"
              >
                {addressLines(business.address).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <div
                data-reveal="fade"
                data-delay="0.2"
                className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-sm tracking-[0.2em] uppercase"
              >
                <a
                  href={mapsUrl(business.name, business.address)}
                  rel="noopener"
                  className="inline-flex min-h-11 items-center link-underline text-espresso-900"
                >
                  Itinéraire
                </a>
                {business.instagramUrl ? (
                  <a
                    href={business.instagramUrl}
                    rel="noopener"
                    className="inline-flex min-h-11 items-center link-underline text-espresso-900"
                  >
                    {instagramHandle(business.instagramUrl)}
                  </a>
                ) : null}
              </div>
            </div>
            <div data-reveal="fade" data-delay="0.1" className="lg:pt-24">
              <h3 className="label text-caramel-700">Horaires</h3>
              <OpeningHoursList hours={hours} className="mt-4 text-lg" />
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}
