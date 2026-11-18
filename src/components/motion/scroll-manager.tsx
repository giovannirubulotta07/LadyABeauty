"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollToHash, scrollToTop } from "./motion-provider";

/**
 * Scroll position on client navigations, made explicit (smooth scrolling and
 * the fixed header otherwise leave pages half-way down):
 *  - a new page opens at the top, or at its #anchor below the header;
 *  - back/forward keeps the position the browser restores.
 */
export function ScrollManager() {
  const pathname = usePathname();
  const first = useRef(true);
  // Where the last back/forward went: that page keeps the restored position.
  const popPath = useRef<string | null>(null);

  useEffect(() => {
    const onPop = () => {
      popPath.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPop);
    // Hash-only changes (an in-page link, or typed in the address bar).
    const onHash = () => scrollToHash({ smooth: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false; // the first load is the browser's job
      return;
    }
    // Decided on the next frame: the router may re-render inside the
    // popstate dispatch, before our own listener has recorded it.
    const frame = requestAnimationFrame(() => {
      const fromHistory = popPath.current === pathname;
      popPath.current = null; // a stale record never affects a later visit
      if (fromHistory) return;
      if (!scrollToHash()) scrollToTop();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
