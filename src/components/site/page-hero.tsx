import type { ReactNode } from "react";

/** Dark editorial page opening (inner pages): label and giant headline on espresso. */
export function PageHero({
  label,
  title,
  intro,
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
}) {
  return (
    <section
      data-hero
      className="surface-dark relative overflow-hidden bg-espresso-950 text-ivory"
    >
      <div className="relative mx-auto w-full max-w-[90rem] px-gutter pt-40 pb-20 sm:px-8 sm:pt-48 sm:pb-28">
        <p className="hero-fade label text-sand-100">{label}</p>
        <h1 className="mt-6 font-display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.95] text-ivory">
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
