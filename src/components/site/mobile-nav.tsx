"use client";

import Image from "next/image";
import Link from "next/link";
import { FurLayer } from "@/components/fur/fur-layer";
import { useEffect, useRef, type MouseEvent } from "react";
import { getLenis } from "@/components/motion/motion-provider";
import { CloseIcon } from "@/components/ui/icons";
import type { NavLink } from "./navigation";

type Props = {
  links: NavLink[];
  account: NavLink;
  booking: NavLink;
  addressLines: string[];
  instagramUrl: string | null;
};

/**
 * Full-screen menu on the native Popover API (light-dismiss, Escape and focus
 * return handled by the browser). Opening is animated in CSS (@starting-style).
 */
export function MobileNav({
  links,
  account,
  booking,
  addressLines,
  instagramUrl,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);

  // While the menu is open the page behind it must not scroll (smooth scroll
  // paused), and the menu itself scrolls with the wheel (data-lenis-prevent).
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const onToggle = (e: Event) => {
      const open = (e as ToggleEvent).newState === "open";
      const lenis = getLenis();
      if (open) lenis?.stop();
      else lenis?.start();
      document.documentElement.style.overflow = open ? "hidden" : "";
    };
    el.addEventListener("toggle", onToggle);
    return () => {
      el.removeEventListener("toggle", onToggle);
      document.documentElement.style.overflow = "";
      getLenis()?.start();
    };
  }, []);

  function closeOnLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a"))
      panel.current?.hidePopover();
  }

  const items = [...links, account];

  return (
    <>
      <button
        type="button"
        popoverTarget="menu-mobile"
        className="group inline-flex min-h-11 items-center gap-3 text-[0.75rem] tracking-[0.2em] uppercase"
        aria-label="Ouvrir le menu"
      >
        <span aria-hidden="true" className="flex w-7 flex-col gap-[7px]">
          <span className="h-px w-full bg-current transition-transform duration-500 group-hover:translate-x-1" />
          <span className="h-px w-2/3 bg-current transition-[width] duration-500 group-hover:w-full" />
        </span>
        <span className="hidden sm:inline">Menu</span>
      </button>

      <div
        id="menu-mobile"
        ref={panel}
        popover="auto"
        data-lenis-prevent
        className="menu-panel surface-dark fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto bg-espresso-950 p-0 text-ivory"
        onClick={closeOnLink}
      >
        <FurLayer pattern="leopard" veil="strong" />
        <div className="relative mx-auto grid min-h-full max-w-[90rem] grid-rows-[auto_1fr_auto] px-gutter sm:px-8">
          <div className="flex h-16 items-center lg:h-20">
            <button
              type="button"
              popoverTarget="menu-mobile"
              popoverTargetAction="hide"
              className="inline-flex min-h-11 items-center gap-3 text-[0.75rem] tracking-[0.2em] uppercase"
              aria-label="Fermer le menu"
            >
              <CloseIcon width={22} height={22} />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          </div>

          <div className="grid items-center gap-12 py-8 lg:grid-cols-[1.4fr_1fr]">
            <nav aria-label="Menu">
              <ol className="space-y-1 sm:space-y-2">
                {items.map((link, i) => (
                  <li
                    key={link.href}
                    className="menu-item"
                    style={{ "--i": i } as React.CSSProperties}
                  >
                    <Link
                      href={link.href}
                      className="group flex items-baseline gap-4 py-1 font-display text-[clamp(2.5rem,8vw,5.5rem)] leading-[1.05] transition-colors hover:text-caramel-300"
                    >
                      <span className="transition-transform duration-700 group-hover:translate-x-3">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <div
              className="menu-item hidden lg:block"
              style={{ "--i": items.length } as React.CSSProperties}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-full">
                <Image
                  src="/editorial/ambiance-sourcils.jpg"
                  alt=""
                  fill
                  sizes="30vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-ivory/10 py-8 text-sm text-sand-100 sm:grid-cols-3 sm:items-end">
            <address className="not-italic">
              {addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            {instagramUrl ? (
              <a
                href={instagramUrl}
                rel="noopener"
                className="min-h-11 self-center justify-self-start link-underline sm:justify-self-center"
              >
                Instagram
              </a>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-4 sm:justify-self-end">
              <Link
                href={booking.href}
                className="inline-flex min-h-12 items-center rounded-pill border border-ivory/40 px-6 text-[0.75rem] tracking-[0.2em] uppercase transition-colors hover:border-caramel-300 hover:text-caramel-300"
              >
                {booking.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
