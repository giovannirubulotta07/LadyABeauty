import Image from "next/image";
import type { ReactNode } from "react";

/** Dark editorial page opening (inner pages): label, giant headline, silk texture. */
export function PageHero({
  label,
  title,
  intro,
  image = "/editorial/soie-espresso-2.jpg",
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
}) {
  return (
    <section
      data-hero
      className="surface-dark relative overflow-hidden bg-espresso-950 text-ivory"
    >
      <div
        data-parallax="0.2"
        className="absolute inset-x-0 -inset-y-[10%] opacity-70"
      >
        <Image
          src={image}
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-espresso-950/60 to-espresso-950"
      />
      <div className="relative mx-auto w-full max-w-[90rem] px-gutter pt-40 pb-20 sm:px-8 sm:pt-48 sm:pb-28">
        <p className="hero-fade label text-sand-100">{label}</p>
        <h1 className="mt-6 font-sans text-headline font-light tracking-[0.04em] text-ivory uppercase">
          <span className="hero-line">
            <span>{title}</span>
          </span>
        </h1>
        {intro ? (
          <div
            className="hero-fade mt-8 max-w-xl text-lg leading-relaxed text-sand-100"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {intro}
          </div>
        ) : null}
      </div>
    </section>
  );
}
