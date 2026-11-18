"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Agency-style motion, loaded after first paint so it never costs LCP.
 *
 * Pages stay plain server components and opt in with data attributes:
 *   data-reveal="lines"   text revealed line by line (SplitText, masked)
 *   data-reveal="fade"    fade + rise
 *   data-reveal="mask"    image wrapper opened like a curtain, image settling from 1.2×
 *   data-parallax="0.2"   vertical parallax (fraction of its height; negative = opposite)
 *   data-parallax-x="-0.3" horizontal drift while the section scrolls by
 *   data-delay="0.2"      extra delay (seconds)
 *
 * Accessibility: nothing runs with prefers-reduced-motion; smooth scrolling
 * (Lenis) only on desktop pointers; content stays visible without JS
 * (see globals.css: html.motion / html.motion-off).
 */
type Gsap = typeof import("gsap").gsap;
type Engine = {
  gsap: Gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  SplitText: typeof import("gsap/SplitText").SplitText;
  lenis: import("lenis").default | null;
};

let enginePromise: Promise<Engine> | null = null;
let activeLenis: Engine["lenis"] = null;

/** The smooth-scroll instance (desktop only), e.g. to pause it under a menu. */
export function getLenis() {
  return activeLenis;
}

/**
 * Scrolls to the element named in the URL hash (below the fixed header), or
 * returns false when there is none. Works with or without smooth scrolling.
 */
export function scrollToHash({ smooth = false } = {}): boolean {
  const raw = window.location.hash.slice(1);
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch {
    // a malformed hash (#50%) is used as is
  }
  const target = id ? document.getElementById(id) : null;
  if (!target) return false;
  if (activeLenis) {
    activeLenis.resize(); // the page may have grown since Lenis measured it
    activeLenis.scrollTo(target, { immediate: !smooth, force: true });
  } else target.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  return true;
}

/** Puts the page (and the smooth scroll) at the top immediately. */
export function scrollToTop() {
  activeLenis?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

/** Resolves once the page has loaded and the main thread is idle, so the
 * animation engine never competes with the first render (LCP, TBT). */
function whenIdleAfterLoad(): Promise<void> {
  return new Promise((resolve) => {
    const idle = () =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => resolve(), { timeout: 1200 })
        : setTimeout(resolve, 200);
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  });
}

function loadEngine(): Promise<Engine> {
  enginePromise ??= (async () => {
    await whenIdleAfterLoad();
    const [{ gsap }, { ScrollTrigger }, { SplitText }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("gsap/SplitText"),
    ]);
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let lenis: Engine["lenis"] = null;
    if (window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches) {
      const { default: Lenis } = await import("lenis");
      // anchors: in-page links (#studio…) glide to their target; the offset
      // below the fixed header comes from html { scroll-padding-top }.
      lenis = new Lenis({
        lerp: 0.09,
        wheelMultiplier: 0.9,
        anchors: true,
      });
      activeLenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis!.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
    return { gsap, ScrollTrigger, SplitText, lenis };
  })();
  return enginePromise;
}

function bind({ gsap, ScrollTrigger, SplitText }: Engine) {
  // Whole page: header menu, main content and footer all use reveals.
  const root = document.body;
  const delayOf = (el: Element) =>
    Number((el as HTMLElement).dataset.delay ?? 0);
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  return gsap.context(() => {
    root
      .querySelectorAll<HTMLElement>('[data-reveal="lines"]')
      .forEach((el) => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "reveal-line",
          // Lines keep the text in reading order, so no aria-label is needed
          // (aria-label is not allowed on <p>/<h2> without a role).
          aria: "none",
        });
        gsap.set(el, { visibility: "visible" });
        gsap.from(split.lines, {
          yPercent: 110,
          duration: 1.25,
          ease: "expo.out",
          stagger: 0.09,
          delay: delayOf(el),
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });

    root.querySelectorAll<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.3,
          ease: "expo.out",
          delay: delayOf(el),
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    });

    root.querySelectorAll<HTMLElement>('[data-reveal="mask"]').forEach((el) => {
      const media = el.querySelector("img");
      gsap.set(el, { visibility: "visible" });
      const tl = gsap.timeline({
        delay: delayOf(el),
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
      tl.fromTo(
        el,
        { clipPath: "inset(100% 0% 0% 0%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" },
      );
      if (media)
        tl.fromTo(
          media,
          { scale: 1.22 },
          { scale: 1, duration: 2, ease: "expo.out" },
          0.2,
        );
    });

    root.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
      const amount = Number(el.dataset.parallax) * (isMobile ? 0.5 : 1);
      gsap.fromTo(
        el,
        { yPercent: amount * 50 },
        {
          yPercent: -amount * 50,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    root.querySelectorAll<HTMLElement>("[data-parallax-x]").forEach((el) => {
      const amount = Number(el.dataset.parallaxX);
      gsap.fromTo(
        el,
        { xPercent: amount * 50 },
        {
          xPercent: -amount * 50,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("section") ?? el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    });

    ScrollTrigger.refresh();
  }, root);
}

export function MotionProvider() {
  const pathname = usePathname();
  const ctx = useRef<ReturnType<typeof bind> | null>(null);
  const firstBind = useRef(true);
  const touched = useRef(false);

  // Whether the visitor has scrolled by herself before the engine started.
  useEffect(() => {
    const mark = () => {
      touched.current = true;
    };
    const events = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const e of events)
      window.addEventListener(e, mark, { passive: true, once: true });
    return () => {
      for (const e of events) window.removeEventListener(e, mark);
    };
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (
      !html.classList.contains("motion") ||
      html.classList.contains("motion-off")
    )
      return;
    let cancelled = false;

    loadEngine()
      .then(async (engine) => {
        await document.fonts?.ready; // SplitText needs final line breaks
        if (cancelled) return;
        // Never force the scroll position: the visitor may already be reading,
        // and the browser restores it on back/forward (later navigations are
        // ScrollManager's job). Only a first load with an #anchor needs help,
        // as the layout may have moved since the browser jumped to it.
        ctx.current?.revert();
        ctx.current = bind(engine);
        engine.lenis?.resize();
        if (firstBind.current && !touched.current) scrollToHash();
        firstBind.current = false;
        html.classList.add("motion-ready");
      })
      .catch(() => html.classList.add("motion-off"));

    return () => {
      cancelled = true;
      ctx.current?.revert();
      ctx.current = null;
    };
  }, [pathname]);

  return null;
}
