"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import { buttonClasses } from "@/components/ui/button";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import type { NavLink } from "./navigation";

type Props = { links: NavLink[]; account: NavLink; booking: NavLink };

/**
 * Full-screen menu built on the native Popover API: light-dismiss, Escape and
 * focus return are handled by the browser. JS only closes it after a link click.
 */
export function MobileNav({ links, account, booking }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  function closeOnLink(event: MouseEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a"))
      panel.current?.hidePopover();
  }

  return (
    <>
      <button
        type="button"
        popoverTarget="menu-mobile"
        className="inline-flex size-11 items-center justify-center rounded-control text-ivory lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <MenuIcon width={24} height={24} />
      </button>

      <div
        id="menu-mobile"
        ref={panel}
        popover="auto"
        className="surface-dark fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-espresso-950 p-0 text-ivory backdrop:bg-espresso-950/60"
        onClick={closeOnLink}
      >
        <div className="flex h-full flex-col px-gutter pt-3 pb-10">
          <div className="flex justify-end">
            <button
              type="button"
              popoverTarget="menu-mobile"
              popoverTargetAction="hide"
              className="inline-flex size-11 items-center justify-center rounded-control"
              aria-label="Fermer le menu"
            >
              <CloseIcon width={24} height={24} />
            </button>
          </div>
          <nav aria-label="Menu" className="mt-8 flex-1">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-3 font-display text-4xl text-ivory transition-colors hover:text-caramel-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={account.href}
                  className="block py-3 font-display text-4xl text-ivory transition-colors hover:text-caramel-300"
                >
                  {account.label}
                </Link>
              </li>
            </ul>
          </nav>
          <Link
            href={booking.href}
            className={buttonClasses("light", "lg", "w-full")}
          >
            {booking.label}
          </Link>
        </div>
      </div>
    </>
  );
}
