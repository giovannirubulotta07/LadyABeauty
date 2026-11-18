"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowIcon, UserIcon } from "@/components/ui/icons";
import { ACCOUNT_LINK, BOOKING_LINK } from "./navigation";

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
      <div className="mx-auto grid h-16 max-w-[90rem] grid-cols-[auto_1fr_auto] items-center gap-2 px-gutter min-[400px]:grid-cols-[1fr_auto_1fr] min-[400px]:gap-4 sm:px-8 lg:h-20">
        <div className="justify-self-start">{menu}</div>
        <Link
          href="/"
          className="justify-self-center font-sans text-[0.75rem] font-light tracking-[0.3em] whitespace-nowrap uppercase min-[400px]:text-[0.8125rem] min-[400px]:tracking-[0.42em] sm:text-sm"
          aria-label={`${name} — accueil`}
        >
          {name}
        </Link>
        <div className="flex items-center justify-self-end sm:gap-5">
          <Link
            href={ACCOUNT_LINK.href}
            aria-label={ACCOUNT_LINK.label}
            className="group inline-flex min-h-11 min-w-10 items-center justify-center gap-2 text-[0.75rem] tracking-[0.2em] uppercase"
          >
            <UserIcon width={20} height={20} />
            <span
              className="hidden link-underline xl:inline"
              aria-hidden="true"
            >
              {ACCOUNT_LINK.label}
            </span>
          </Link>
          <Link
            href={BOOKING_LINK.href}
            className="group inline-flex min-h-11 items-center gap-2 text-[0.75rem] tracking-[0.2em] uppercase"
          >
            <span className="hidden link-underline sm:inline">
              {BOOKING_LINK.label}
            </span>
            <span className="link-underline tracking-[0.14em] min-[400px]:tracking-[0.2em] sm:hidden">
              Réserver
            </span>
            <ArrowIcon
              width={16}
              height={16}
              className="hidden transition-transform duration-500 group-hover:translate-x-1 sm:block"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
