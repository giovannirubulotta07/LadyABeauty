import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { DayPicker } from "@/components/admin/agenda/day-picker";
import { DayView } from "@/components/admin/agenda/day-view";
import { WeekView } from "@/components/admin/agenda/week-view";
import { ChevronIcon, PlusIcon } from "@/components/admin/icons";
import { Loading } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { weekStart } from "@/domain/admin/agenda";
import {
  type LocalDate,
  addDays,
  isLocalDate,
  parisDate,
} from "@/domain/time/paris";
import { formatDayLong } from "@/lib/dates";
import { getAgendaDay, getAgendaWeek } from "@/server/admin/agenda";

export const metadata: Metadata = { title: "Agenda" };

export default function AgendaPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<Loading label="Chargement de l’agenda…" />}>
      <AdminGate>
        <Agenda searchParams={searchParams} />
      </AdminGate>
    </Suspense>
  );
}

const href = (day: LocalDate, view: "jour" | "semaine") =>
  `/admin?jour=${day}${view === "semaine" ? "&vue=semaine" : ""}`;

const shortDay = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const short = (day: LocalDate) => shortDay.format(new Date(`${day}T12:00:00Z`));

async function Agenda({
  searchParams,
}: Pick<PageProps<"/admin">, "searchParams">) {
  await connection(); // "today" depends on the current time
  const params = await searchParams;
  const today = parisDate(new Date());
  const day =
    typeof params.jour === "string" && isLocalDate(params.jour)
      ? params.jour
      : today;
  const view = params.vue === "semaine" ? "semaine" : "jour";
  const step = view === "semaine" ? 7 : 1;
  const monday = weekStart(day);

  const navButton =
    "inline-flex size-11 items-center justify-center rounded-control border border-sand-200 bg-ivory text-espresso-900 hover:border-espresso-900/40";

  return (
    <>
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label text-caramel-700">
              {view === "semaine"
                ? "Semaine"
                : day === today
                  ? "Aujourd’hui"
                  : "Agenda"}
            </p>
            <h1 className="mt-1 font-display text-3xl text-espresso-900 sm:text-4xl">
              {view === "semaine"
                ? `Du ${short(monday)} au ${short(addDays(monday, 6))}`
                : formatDayLong(day, { capitalize: true })}
            </h1>
          </div>
          <Link
            href={`/admin/rdv/nouveau?jour=${day}`}
            className={buttonClasses("primary", "md", "gap-2")}
          >
            <PlusIcon className="size-4" />
            Rendez-vous
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={href(addDays(day, -step), view)}
            className={navButton}
            aria-label={
              view === "semaine" ? "Semaine précédente" : "Jour précédent"
            }
          >
            <ChevronIcon direction="left" className="size-5" />
          </Link>
          <Link
            href={href(addDays(day, step), view)}
            className={navButton}
            aria-label={
              view === "semaine" ? "Semaine suivante" : "Jour suivant"
            }
          >
            <ChevronIcon className="size-5" />
          </Link>
          {day !== today ? (
            <Link
              href={href(today, view)}
              className="inline-flex min-h-11 items-center rounded-control border border-sand-200 bg-ivory px-4 text-sm text-espresso-900 hover:border-espresso-900/40"
            >
              Aujourd’hui
            </Link>
          ) : null}
          <DayPicker day={day} view={view} />
          <div
            role="group"
            aria-label="Vue"
            className="ml-auto inline-flex rounded-control border border-sand-200 bg-ivory p-1"
          >
            {(["jour", "semaine"] as const).map((v) => (
              <Link
                key={v}
                href={href(day, v)}
                aria-current={view === v ? "page" : undefined}
                className={
                  view === v
                    ? "inline-flex min-h-9 items-center rounded-[calc(var(--radius-control)-2px)] bg-espresso-900 px-4 text-sm text-ivory"
                    : "inline-flex min-h-9 items-center px-4 text-sm text-espresso-700 hover:text-espresso-900"
                }
              >
                {v === "jour" ? "Jour" : "Semaine"}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {view === "semaine" ? (
        <WeekView days={await getAgendaWeek(day)} today={today} />
      ) : (
        <DayView agenda={await getAgendaDay(day)} />
      )}
    </>
  );
}
