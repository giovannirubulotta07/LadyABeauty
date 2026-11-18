import type { ReactNode } from "react";
import { FurLayer, type FurPattern } from "@/components/fur/fur-layer";

/**
 * Opening of every inner page: label and Bodoni title on interactive fur.
 * "full" for the editorial pages (Prestations, Galerie), "compact" for the
 * practical ones (booking, account, legal…), followed by light content.
 */
export function PageHero({
  label,
  title,
  intro,
  fur = "leopard",
  size = "full",
}: {
  label: string;
  title: ReactNode;
  intro?: ReactNode;
  fur?: FurPattern;
  size?: "full" | "compact";
}) {
  const bg = fur === "rose" ? "bg-rose-950" : "bg-espresso-950";
  return (
    <section
      data-hero
      className={`surface-dark relative overflow-hidden ${bg} text-ivory [text-shadow:0_1px_18px_rgb(40_14_22/0.45)]`}
    >
      <FurLayer pattern={fur} veil="band" />
      <div
        className={
          size === "full"
            ? "relative mx-auto w-full max-w-[90rem] px-gutter pt-40 pb-20 sm:px-8 sm:pt-48 sm:pb-28"
            : "relative mx-auto w-full max-w-[90rem] px-gutter pt-32 pb-24 sm:px-8 sm:pt-40 sm:pb-32"
        }
      >
        <p className="hero-fade label text-sand-100">{label}</p>
        <h1
          className={
            size === "full"
              ? "mt-6 font-display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.95] text-ivory"
              : "mt-5 font-display text-[clamp(2.6rem,6vw,4.75rem)] leading-[1] text-ivory"
          }
        >
          <span className="hero-line">
            <span>{title}</span>
          </span>
        </h1>
        {intro ? (
          <div
            className="hero-fade mt-6 max-w-xl text-lg leading-relaxed text-sand-100"
            style={{ "--i": 1 } as React.CSSProperties}
          >
            {intro}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Decorative fur band (no text) opening pages whose title lives in the content. */
export function FurStrip({ fur = "leopard" }: { fur?: FurPattern }) {
  const bg = fur === "rose" ? "bg-rose-950" : "bg-espresso-950";
  return (
    <section
      data-hero
      aria-hidden="true"
      className={`surface-dark relative h-44 overflow-hidden sm:h-56 ${bg}`}
    >
      <FurLayer pattern={fur} veil="band" />
    </section>
  );
}
