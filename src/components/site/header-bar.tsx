"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { BOOKING_LINK } from "./navigation";

/**
 * Header shell. Solid espresso bar by default; on pages with a full-screen
 * hero ([data-hero]) it floats transparent over it until the page scrolls
 * (see .site-header in globals.css — pure CSS, no route detection needed).
 */
export function HeaderBar({
  name,
  menu,
}: {
  name: string;
  menu: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () =>
      ref.current?.toggleAttribute("data-scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={ref}
      className="site-header surface-dark sticky inset-x-0 top-0 z-40 border-b border-ivory/10 bg-espresso-950 text-ivory backdrop-blur-md transition-[background-color,border-color,backdrop-filter] duration-500"
    >
      <div className="mx-auto grid h-16 max-w-[90rem] grid-cols-[1fr_auto_1fr] items-center gap-4 px-gutter sm:px-8 lg:h-20">
        <div className="justify-self-start">{menu}</div>
        <Link
          href="/"
          className="font-sans text-[0.8125rem] font-light tracking-[0.42em] whitespace-nowrap uppercase sm:text-sm"
          aria-label={`${name} — accueil`}
        >
          {name}
        </Link>
        <Link
          href={BOOKING_LINK.href}
          className="group inline-flex min-h-11 items-center gap-2 justify-self-end text-[0.75rem] tracking-[0.2em] uppercase"
        >
          <span className="hidden link-underline sm:inline">
            {BOOKING_LINK.label}
          </span>
          <span className="link-underline sm:hidden">Réserver</span>
          <ArrowIcon
            width={16}
            height={16}
            className="hidden transition-transform duration-500 group-hover:translate-x-1 sm:block"
          />
        </Link>
      </div>
    </header>
  );
}
