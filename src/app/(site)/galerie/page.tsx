import { FurLayer } from "@/components/fur/fur-layer";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Image from "next/image";
import { PageHero } from "@/components/site/page-hero";
import { getGallery } from "@/server/content/queries";

export const metadata: Metadata = pageMetadata({
  title: "Galerie",
  description:
    "Extensions de cils, rehaussements et sourcils réalisés par Alessia au studio Lady A Beauty, à Annemasse, près de Genève.",
  path: "/galerie",
});

export default async function GaleriePage() {
  const images = await getGallery();
  return (
    <>
      <PageHero
        label="Galerie"
        title="Les regards"
        intro="Les réalisations du studio, sans filtre."
      />
      <section className="surface-dark relative overflow-hidden bg-espresso-950 text-ivory">
        <FurLayer pattern="leopard" veil="text" />
        <div className="relative mx-auto w-full max-w-[90rem] px-gutter pt-12 pb-28 sm:px-8 sm:pt-16 sm:pb-36">
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
