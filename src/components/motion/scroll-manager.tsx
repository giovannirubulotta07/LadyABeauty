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
  const historyNav = useRef(false);

  useEffect(() => {
    const onPop = () => {
      historyNav.current = true;
    };
    window.addEventListener("popstate", onPop);
    // Hash-only changes (typed in the address bar) on the same page.
    const onHash = () => scrollToHash();
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
    // popstate dispatch, before our own listener has flagged it.
    const frame = requestAnimationFrame(() => {
      if (historyNav.current) {
        historyNav.current = false;
        return;
      }
      if (!scrollToHash()) scrollToTop();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
