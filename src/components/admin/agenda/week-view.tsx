import clsx from "clsx";
import Link from "next/link";
import { Badge } from "@/components/admin/ui";
import { dayParts } from "@/lib/dates";
import type { AgendaDay } from "@/server/admin/agenda";

/** Seven day cards: stacked on phones, a 7-column board on large screens. */
export function WeekView({
  days,
  today,
}: {
  days: AgendaDay[];
  today: string;
}) {
  return (
    <ol className="grid gap-3 lg:grid-cols-7 lg:gap-2">
      {days.map((d) => {
        const parts = dayParts(d.day);
        const closed = d.windows.length === 0;
        const fullDayBlock = d.blocks.some((b) => b.coversDay);
        return (
          <li key={d.day}>
            <Link
              href={`/admin?jour=${d.day}`}
              aria-current={d.day === today ? "date" : undefined}
              className={clsx(
                "flex h-full min-h-24 flex-col rounded-card border bg-ivory p-3 transition-colors hover:border-espresso-900/40",
                d.day === today ? "border-espresso-900" : "border-sand-200",
                (closed || fullDayBlock) && "bg-sand-100/60",
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-espresso-700 capitalize">
                  {parts.weekday}{" "}
                  <span className="font-display text-xl text-espresso-900">
                    {parts.day}
                  </span>{" "}
                  {parts.month}
                </span>
                {d.waitlist.length ? (
                  <Badge tone="accent">{d.waitlist.length} en attente</Badge>
                ) : null}
              </span>
              {closed ? (
                <span className="mt-2 text-sm text-espresso-500">Fermé</span>
              ) : fullDayBlock ? (
                <span className="mt-2 text-sm text-espresso-500">
                  Bloqué
                  {d.blocks.find((b) => b.coversDay)?.reason
                    ? ` · ${d.blocks.find((b) => b.coversDay)?.reason}`
                    : ""}
                </span>
              ) : d.appointments.length === 0 ? (
                <span className="mt-2 text-sm text-espresso-500">
                  Aucun rendez-vous
                </span>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {d.appointments.map((a) => (
                    <li key={a.id} className="text-sm leading-snug">
                      <span className="font-medium text-espresso-900 tabular-nums">
                        {a.time}
                      </span>{" "}
                      <span className="text-espresso-900">{a.clientName}</span>
                      <span className="block truncate text-espresso-500">
                        {a.serviceLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!closed && !fullDayBlock && d.free.length ? (
                <span className="mt-auto pt-2 text-xs text-caramel-700">
                  {d.free.length} plage{d.free.length > 1 ? "s" : ""} libre
                  {d.free.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
