import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Spinner } from "@/components/ui/form";
import { ChevronIcon } from "./icons";

/** Small building blocks shared by the admin pages (phone-first). */

export function PageTitle({
  title,
  eyebrow,
  back,
  actions,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {back ? (
        <Link
          href={back.href}
          className="-ml-2 inline-flex min-h-11 items-center gap-1 px-2 text-sm text-espresso-700 hover:text-espresso-900"
        >
          <ChevronIcon direction="left" className="size-4" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="label text-caramel-700">{eyebrow}</p> : null}
          <h1 className="mt-1 font-display text-3xl text-espresso-900 sm:text-4xl">
            {title}
          </h1>
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Card({
  className,
  ...props
}: ComponentProps<"section"> & { className?: string }) {
  return (
    <section
      className={clsx(
        "rounded-card border border-sand-200 bg-ivory p-4 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  id,
  children,
  aside,
}: {
  id?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 id={id} className="font-display text-xl text-espresso-900">
        {children}
      </h2>
      {aside}
    </div>
  );
}

type Tone = "neutral" | "accent" | "success" | "danger" | "muted";
const tones: Record<Tone, string> = {
  neutral: "bg-sand-100 text-espresso-900",
  accent: "bg-caramel-300/40 text-espresso-900",
  success: "bg-espresso-900 text-ivory",
  danger: "bg-danger/10 text-danger",
  muted: "bg-sand-50 text-espresso-500",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-sand-200 px-4 py-6 text-center text-sm text-espresso-500">
      {children}
    </p>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return (
    <p
      role="status"
      className="flex items-center gap-3 py-10 text-espresso-500"
    >
      <Spinner />
      {label}
    </p>
  );
}

/** Label / value list (client details, appointment details). */
export function Details({ items }: { items: Array<[ReactNode, ReactNode]> }) {
  return (
    <dl className="divide-y divide-sand-200">
      {items.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-espresso-500">{k}</dt>
          <dd className="min-w-0 text-right break-words text-espresso-900">
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}
