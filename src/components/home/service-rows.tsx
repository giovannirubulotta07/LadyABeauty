"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ServiceRow = {
  slug: string;
  name: string;
  meta: string;
  /** A real photo of Alessia’s work, shown next to the cursor on desktop. */
  image: string | null;
};

/**
 * Editorial numbered list. On desktop pointers, an image follows the cursor
 * while a row is hovered (transform only, rAF-smoothed). Rows are plain links,
 * fully usable with keyboard and on touch screens.
 */
export function ServiceRows({ rows }: { rows: ServiceRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const floating = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const query = window.matchMedia(
      "(pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );
    const update = () => setEnabled(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.14;
      current.current.y += (target.current.y - current.current.y) * 0.14;
      if (floating.current) {
        floating.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled]);

  return (
    <div
      className="relative"
      onPointerMove={(e) => {
        target.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerLeave={() => setActive(null)}
    >
      <ol className="border-t border-ivory/15">
        {rows.map((row, i) => (
          <li
            key={row.slug}
            className="border-b border-ivory/15"
            data-reveal="fade"
            data-delay={i * 0.06}
          >
            <Link
              href={`/reserver?prestation=${row.slug}`}
              onPointerEnter={() => setActive(i)}
              className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-7 transition-colors duration-500 sm:grid-cols-[4rem_1fr_auto_auto] sm:py-9"
            >
              <span className="font-sans text-xs tracking-[0.2em] text-sand-100/70">
                {String(i + 1).padStart(3, "0")}
              </span>
              <span className="font-sans text-[clamp(1.5rem,4vw,3.25rem)] leading-tight font-light tracking-wide text-ivory uppercase transition-transform duration-700 ease-[var(--ease-expo)] group-hover:translate-x-3">
                {row.name}
              </span>
              <span className="hidden text-sm text-sand-100 sm:block">
                {row.meta}
              </span>
              <span
                aria-hidden="true"
                className="text-xl text-ivory transition-transform duration-500 group-hover:translate-x-1"
              >
                →
              </span>
              <span className="col-span-2 col-start-2 -mt-2 text-sm text-sand-100 sm:hidden">
                {row.meta}
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {enabled ? (
        <div
          ref={floating}
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-30 h-[22rem] w-[17rem] overflow-hidden rounded-t-full"
        >
          {rows.map((row, i) =>
            row.image ? (
              <Image
                key={row.slug}
                src={row.image}
                alt=""
                fill
                sizes="272px"
                className={clsx(
                  "object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-expo)]",
                  active === i
                    ? "scale-100 opacity-100"
                    : "scale-110 opacity-0",
                )}
              />
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
