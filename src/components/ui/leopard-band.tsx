import clsx from "clsx";

/** Thin decorative leopard separator. Purely ornamental: hidden from assistive tech. */
export function LeopardBand({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("leopard leopard-band h-3 w-full sm:h-3.5", className)}
    />
  );
}
