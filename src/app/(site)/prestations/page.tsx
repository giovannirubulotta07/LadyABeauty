import { FurLayer } from "@/components/fur/fur-layer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { priceLabel } from "@/domain/catalog/price";
import { formatDuration } from "@/lib/format";
import { getServices } from "@/server/content/queries";

export const metadata: Metadata = pageMetadata({
  title: "Prestations & tarifs",
  description:
    "Extension de cils, remplissage, rehaussement de cils, browlift, épilation et teinture des sourcils à Annemasse, près de Genève : durées, tarifs et réservation en ligne.",
  path: "/prestations",
});

export default async function PrestationsPage() {
  const services = await getServices();

  return (
    <>
      <PageHero
        label="Prestations"
        title="Prestations & tarifs"
        intro="Chaque prestation est réalisée sur mesure, selon votre regard et vos envies."
        fur="rose"
      />
      <section className="surface-dark relative overflow-hidden bg-espresso-950 text-ivory">
        <FurLayer pattern="tiger" veil="text" />
        <div className="relative mx-auto w-full max-w-[90rem] px-gutter pt-12 pb-28 sm:px-8 sm:pt-16 sm:pb-36">
          {services.length === 0 ? (
            <p className="border-t border-ivory/15 py-16 text-center text-sand-100">
              Les prestations seront bientôt disponibles.
            </p>
          ) : (
            <ol className="border-t border-ivory/15">
              {services.map((service, i) => {
                const price = priceLabel(service);
                const paragraphs = service.description
                  .split(/\n{2,}/)
                  .filter(Boolean);
                return (
                  <li
                    key={service.id}
                    id={service.slug}
                    className="border-b border-ivory/15"
                    data-reveal="fade"
                    data-delay={Math.min(i, 6) * 0.04}
                  >
                    <details className="group">
                      <summary className="grid min-h-20 cursor-pointer list-none grid-cols-[1fr_auto] items-baseline gap-4 py-7 sm:grid-cols-[1fr_auto_auto] [&::-webkit-details-marker]:hidden">
                        <h2 className="font-display text-[clamp(1.6rem,3.6vw,3rem)] leading-tight text-ivory">
                          {service.name}
                        </h2>
                        <span className="hidden text-sm text-sand-100 sm:block">
                          {[formatDuration(service.durationMin), price]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-2xl font-light text-ivory transition-transform duration-500 group-open:rotate-45"
                        >
                          +
                        </span>
                        <span className="col-span-2 -mt-2 text-sm text-sand-100 sm:hidden">
                          {[formatDuration(service.durationMin), price]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </summary>
                      <div className="grid gap-8 pb-10 sm:grid-cols-[1fr_auto] sm:gap-4">
                        <div className="max-w-2xl space-y-3 leading-relaxed text-sand-100">
                          {paragraphs.length > 0 ? (
                            paragraphs.map((p) => <p key={p}>{p}</p>)
                          ) : (
                            <p>Sur rendez-vous, au studio.</p>
                          )}
                          {service.variants.length > 0 ? (
                            <ul className="flex flex-wrap gap-2 pt-2">
                              {service.variants.map((v) => (
                                <li
                                  key={v.id}
                                  className="rounded-pill border border-ivory/25 px-3 py-1 text-xs text-ivory"
                                >
                                  {v.name}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        {service.bookableOnline ? (
                          <Link
                            href={`/reserver?prestation=${service.slug}`}
                            className="inline-flex min-h-12 items-center gap-3 self-start justify-self-start rounded-pill border border-ivory/40 px-6 text-[0.75rem] tracking-[0.2em] uppercase transition-colors duration-500 hover:bg-ivory hover:text-espresso-950 sm:justify-self-end"
                            aria-label={`Réserver : ${service.name}`}
                          >
                            Réserver <span aria-hidden="true">→</span>
                          </Link>
                        ) : null}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </>
  );
}
