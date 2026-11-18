"use client";

import { useEffect, useRef, useState } from "react";
import type { FurPattern } from "./fur-engine";

/**
 * The interactive fur behind the home hero. Loaded after the page (it never
 * delays the first paint) and only where WebGL2 exists; otherwise the hero
 * simply keeps its solid espresso background.
 */
export function FurField({ pattern = "leopard" }: { pattern?: FurPattern }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    let stop: (() => void) | null = null;
    let cancelled = false;

    const begin = async () => {
      const { startFur } = await import("./fur-engine");
      if (cancelled) return;
      stop = startFur(el, host, {
        pattern,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      });
      if (stop) requestAnimationFrame(() => setReady(true));
    };
    const idle = () => {
      if (typeof window.requestIdleCallback === "function")
        window.requestIdleCallback(() => void begin(), { timeout: 1500 });
      else setTimeout(() => void begin(), 300);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [pattern]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full transition-opacity duration-[1800ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}
    />
  );
}
