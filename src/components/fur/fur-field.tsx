"use client";

import { useEffect, useRef } from "react";
import type { FurPattern } from "./fur-engine";

/**
 * Interactive fur filling its parent. A still picture of the same coat
 * (public/fur/<pattern>.webp) is always there, so no device ever sees a flat
 * colour; the live WebGL coat fades in over it after the page has loaded, and
 * only while the section is near the screen — any number of sections can wear
 * fur without holding a GPU context each.
 */
export function FurField({
  pattern = "leopard",
  occludedBy,
}: {
  pattern?: FurPattern;
  /** See FurOptions.occludedBy. */
  occludedBy?: string;
}) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let canvas: HTMLCanvasElement | null = null;
    let stop: (() => void) | null = null;
    let near = false;
    let loading = false;
    let cancelled = false;

    const start = async () => {
      if (stop || loading || cancelled) return;
      loading = true;
      const { startFur } = await import("./fur-engine");
      loading = false;
      if (cancelled || !near || stop) return;
      // A fresh canvas each time: a context, once released, cannot come back.
      canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      canvas.className =
        "absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[1400ms] ease-out";
      el.appendChild(canvas);
      stop = startFur(canvas, el, {
        pattern,
        occludedBy,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      });
      if (stop) {
        const c = canvas;
        requestAnimationFrame(() =>
          c.classList.replace("opacity-0", "opacity-100"),
        );
      } else halt();
    };
    const halt = () => {
      stop?.();
      stop = null;
      canvas?.remove();
      canvas = null;
    };
    const whenSettled = () => {
      const go = () =>
        typeof window.requestIdleCallback === "function"
          ? window.requestIdleCallback(() => void start(), { timeout: 1500 })
          : setTimeout(() => void start(), 300);
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    };

    // Starts half a screen ahead, released half a screen behind.
    const io = new IntersectionObserver(
      ([entry]) => {
        near = Boolean(entry?.isIntersecting);
        if (near) whenSettled();
        else halt();
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(el);

    return () => {
      cancelled = true;
      io.disconnect();
      halt();
    };
  }, [pattern, occludedBy]);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(/fur/${pattern}.webp)` }}
    />
  );
}
