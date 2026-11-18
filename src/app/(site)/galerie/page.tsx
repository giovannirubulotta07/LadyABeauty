import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { getGallery } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Les réalisations de Lady A Beauty : extensions de cils, rehaussement et sourcils.",
  alternates: { canonical: "/galerie" },
};

export default async function GaleriePage() {
  const images = await getGallery();
  return (
    <>
      <PageHero
        label="Galerie"
        title="Les regards"
        intro="Les réalisations du studio, sans filtre."
      />
      <section className="surface-dark bg-espresso-950 text-ivory">
        <div className="mx-auto w-full max-w-[90rem] px-gutter pb-28 sm:px-8 sm:pb-36">
          {images.length === 0 ? (
            <p className="py-16 text-center text-sand-100">
              Les photos arrivent très bientôt.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-3">
              {images.map((img, i) => (
                <li
                  key={img.id}
                  className={
                    i % 3 === 1
                      ? "lg:mt-24"
                      : i % 3 === 2
                        ? "lg:mt-10"
                        : undefined
                  }
                >
                  <figure>
                    <div
                      data-reveal="mask"
                      data-delay={(i % 3) * 0.1}
                      className="relative aspect-[3/4] overflow-hidden bg-espresso-900"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, 50vw"
                        className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-expo)] hover:scale-[1.04]"
                      />
                    </div>
                    <figcaption className="mt-3 text-xs tracking-[0.2em] text-sand-100/80 uppercase">
                      {String(i + 1).padStart(2, "0")}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
