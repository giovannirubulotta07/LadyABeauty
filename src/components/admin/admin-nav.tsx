"use client";

import clsx from "clsx";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  HourglassIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "./icons";

export const ADMIN_NAV = [
  { href: "/admin", label: "Agenda", Icon: CalendarIcon },
  { href: "/admin/clientes", label: "Clientes", Icon: UsersIcon },
  { href: "/admin/attente", label: "Attente", Icon: HourglassIcon },
  { href: "/admin/emails", label: "E-mails", Icon: MailIcon },
  { href: "/admin/reglages", label: "Réglages", Icon: SettingsIcon },
] as const;

const isActive = (pathname: string | null, href: string) =>
  pathname != null &&
  (href === "/admin"
    ? pathname === "/admin" || pathname.startsWith("/admin/rdv")
    : pathname.startsWith(href));

/**
 * Phone: fixed tab bar at the bottom (thumb reach). Desktop: side rail.
 * `pathname` is read on the client only, so the shell stays static.
 */
export function AdminNav({ placement }: { placement: "bar" | "rail" }) {
  const pathname = usePathname();
  return <AdminNavList placement={placement} pathname={pathname} />;
}

export function AdminNavList({
  placement,
  pathname,
}: {
  placement: "bar" | "rail";
  pathname: string | null;
}) {
  return (
    <ul
      className={clsx(
        placement === "bar"
          ? "grid grid-cols-5"
          : "flex flex-col gap-1 px-3 py-4",
      )}
    >
      {ADMIN_NAV.map(({ href, label, Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "transition-colors",
                placement === "bar"
                  ? "relative flex min-h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] tracking-wide"
                  : "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm",
                active
                  ? placement === "bar"
                    ? "text-ivory"
                    : "bg-ivory/10 text-ivory"
                  : "text-sand-100/75 hover:text-ivory",
              )}
            >
              <Icon className="size-6 shrink-0" />
              {label}
              {active && placement === "bar" ? (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-0.5 w-8 bg-caramel-300"
                />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
