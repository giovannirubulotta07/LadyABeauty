import type { FurPattern } from "./fur-engine";
import { FurField } from "./fur-field";

/**
 * Interactive fur filling its (relative, overflow-hidden) parent, with a veil
 * that keeps the text on top readable. The veil is tinted like the coat, so a
 * pink fur stays pink and a leopard fur stays warm brown.
 */
const VEIL = {
  // Bottom-heavy: title and buttons sit low on the hero.
  hero: (c: string, k: number) =>
    `linear-gradient(to top, rgb(${c} / ${0.92 * k}) 0%, rgb(${c} / ${0.55 * k}) 38%, rgb(${c} / ${0.15 * k}) 70%, rgb(${c} / ${0.45 * k}) 100%)`,
  // Even veil for bands carrying a title.
  band: (c: string, k: number) =>
    `linear-gradient(to bottom, rgb(${c} / ${0.5 * k}), rgb(${c} / ${0.35 * k}) 45%, rgb(${c} / ${0.75 * k}))`,
  // Darker centre for a quote or a menu.
  strong: (c: string, k: number) =>
    `radial-gradient(ellipse at center, rgb(${c} / ${0.78 * k}), rgb(${c} / ${0.55 * k}) 75%)`,
} as const;

const TINT: Record<FurPattern, string> = {
  leopard: "31 19 13",
  tiger: "31 19 13",
  rose: "62 20 34",
};

/** Pink fur is light: a lighter veil keeps it pink instead of plum. */
const STRENGTH: Record<FurPattern, number> = {
  leopard: 1,
  tiger: 1,
  rose: 0.55,
};

export function FurLayer({
  pattern = "leopard",
  veil = "band",
}: {
  pattern?: FurPattern;
  veil?: keyof typeof VEIL;
}) {
  return (
    <>
      <FurField pattern={pattern} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: VEIL[veil](TINT[pattern], STRENGTH[pattern]),
        }}
      />
    </>
  );
}

export type { FurPattern };
