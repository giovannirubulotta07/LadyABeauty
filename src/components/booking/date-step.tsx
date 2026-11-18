"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { ArrowIcon } from "@/components/ui/icons";
import { dayParts, formatDayLong, formatMonth } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { DayInfo, PublicSlot } from "./types";

// ---------------------------------------------------------------------------
// Day strip
// ---------------------------------------------------------------------------
const STATUS_TEXT: Record<DayInfo["status"], string> = {
  available: "disponible",
  on_request_only: "sur demande",
  full: "complet",
  closed: "fermé",
  past: "passé",
  beyond_horizon: "pas encore ouvert",
};

function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: DayInfo[];
  selected: string | null;
  onSelect: (day: string) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "instant",
    });
  }, [selected]);

  const scrollBy = (direction: 1 | -1) =>
    scroller.current?.scrollBy({
      left: direction * scroller.current.clientWidth * 0.8,
      behavior: "smooth",
    });

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between">
        <p
          className="font-display text-xl text-espresso-900"
          aria-live="polite"
        >
          {formatMonth(selected ?? days[0]?.day ?? "2026-01-01")}
        </p>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="grid size-11 place-items-center rounded-control text-espresso-700 hover:bg-sand-50"
            aria-label="Jours précédents"
          >
            <ArrowIcon className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="grid size-11 place-items-center rounded-control text-espresso-700 hover:bg-sand-50"
            aria-label="Jours suivants"
          >
            <ArrowIcon />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="-mx-5 flex snap-x scroll-px-5 [scrollbar-width:thin] gap-2 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:scroll-px-8 sm:px-8"
        role="group"
        aria-label="Choisir un jour"
      >
        {days.map(({ day, status }) => {
          const parts = dayParts(day);
          const isSelected = day === selected;
          const closed = status === "closed";
          const muted = status === "full" || status === "on_request_only";
          return (
            <button
              key={day}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              disabled={closed}
              aria-pressed={isSelected}
              aria-label={`${formatDayLong(day)}, ${STATUS_TEXT[status]}`}
              onClick={() => onSelect(day)}
              className={clsx(
                "flex h-[5.75rem] w-[4.25rem] shrink-0 snap-start flex-col items-center justify-center rounded-card border text-center transition-colors",
                isSelected && "border-espresso-900 bg-espresso-900 text-ivory",
                !isSelected &&
                  closed &&
                  "cursor-not-allowed border-transparent bg-transparent text-espresso-500/70",
                !isSelected &&
                  muted &&
                  "border-sand-200 bg-sand-50 text-espresso-500 hover:border-caramel-500",
                !isSelected &&
                  status === "available" &&
                  "border-sand-200 bg-ivory text-espresso-900 hover:border-caramel-500",
              )}
            >
              <span className="text-[0.6875rem] tracking-[0.12em] uppercase">
                {parts.weekday.replace(".", "")}
              </span>
              <span
                className={clsx(
                  "font-display text-2xl leading-tight",
                  status === "full" && !isSelected && "line-through",
                )}
              >
                {parts.day}
              </span>
              <span
                className={clsx(
                  "mt-0.5 text-[0.625rem] leading-none",
                  status === "available" &&
                    (isSelected ? "text-caramel-300" : "text-caramel-700"),
                )}
              >
                {status === "available" ? "●" : STATUS_TEXT[status]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time grid
// ---------------------------------------------------------------------------
const PERIODS = [
  { label: "Matin", test: (t: string) => t < "14:00" },
  { label: "Après-midi", test: (t: string) => t >= "14:00" && t < "18:00" },
  { label: "Soirée", test: (t: string) => t >= "18:00" },
];

function TimeGrid({
  slots,
  selectedStart,
  onSelect,
}: {
  slots: PublicSlot[];
  selectedStart: string | null;
  onSelect: (slot: PublicSlot) => void;
}) {
  return (
    <div className="space-y-6">
      {PERIODS.map((period) => {
        const items = slots.filter((s) => period.test(s.time));
        if (items.length === 0) return null;
        return (
          <section key={period.label} aria-label={period.label}>
            <h4 className="label text-espresso-500">{period.label}</h4>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {items.map((slot) => {
                const onRequest = slot.status === "on_request";
                const selected = slot.start === selectedStart;
                return (
                  <li key={slot.start}>
                    <button
                      type="button"
                      disabled={onRequest}
                      aria-pressed={selected}
                      aria-label={
                        onRequest
                          ? `${slot.time}, sur demande uniquement`
                          : `${slot.time}`
                      }
                      onClick={() => onSelect(slot)}
                      className={clsx(
                        "flex min-h-14 w-full flex-col items-center justify-center rounded-control border text-lg tabular-nums transition-colors",
                        selected &&
                          "border-espresso-900 bg-espresso-900 text-ivory",
                        !selected &&
                          !onRequest &&
                          "border-espresso-500/40 bg-ivory text-espresso-900 hover:border-espresso-900",
                        onRequest &&
                          "cursor-not-allowed border-dashed border-espresso-500/50 bg-transparent text-espresso-500",
                      )}
                    >
                      <span>{slot.time}</span>
                      {onRequest ? (
                        <span className="text-[0.6875rem] leading-none">
                          sur demande
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------
type Props = {
  serviceLabel: string;
  durationMin: number;
  days: { data?: DayInfo[]; loading: boolean; error?: string };
  slots: { data?: PublicSlot[]; loading: boolean; error?: string };
  selectedDay: string | null;
  selectedStart: string | null;
  conflictMessage: string | null;
  instagramUrl: string | null;
  onSelectDay: (day: string) => void;
  onSelectSlot: (slot: PublicSlot) => void;
  onChangeService: () => void;
  onRetry: () => void;
};

export function DateStep(props: Props) {
  const { days, slots, selectedDay } = props;
  const bookableDays =
    days.data?.filter(
      (d) => d.status !== "past" && d.status !== "beyond_horizon",
    ) ?? [];
  const dayStatus = bookableDays.find((d) => d.day === selectedDay)?.status;
  const nextAvailable = bookableDays.find(
    (d) => d.status === "available" && d.day > (selectedDay ?? ""),
  );
  const hasAvailable = slots.data?.some((s) => s.status === "available");
  const hasOnRequest = slots.data?.some((s) => s.status === "on_request");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl text-espresso-900 sm:text-3xl">
          Choisissez une date
        </h2>
        <p className="text-sm text-espresso-500">
          {props.serviceLabel} · {formatDuration(props.durationMin)}{" "}
          <button
            type="button"
            onClick={props.onChangeService}
            className="min-h-11 px-1 text-caramel-700 underline underline-offset-4"
          >
            Modifier
          </button>
        </p>
      </div>

      {props.conflictMessage ? (
        <Alert tone="info">{props.conflictMessage}</Alert>
      ) : null}

      {days.error ? (
        <Alert tone="error" title="Disponibilités indisponibles">
          {days.error}{" "}
          <button
            type="button"
            onClick={props.onRetry}
            className="underline underline-offset-4"
          >
            Réessayer
          </button>
        </Alert>
      ) : days.loading || !days.data ? (
        <div
          aria-busy="true"
          className="flex gap-2 overflow-hidden"
          role="status"
        >
          <span className="sr-only">Chargement des disponibilités…</span>
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="h-[5.75rem] w-[4.25rem] shrink-0 rounded-card bg-sand-50"
            />
          ))}
        </div>
      ) : bookableDays.every(
          (d) => d.status === "closed" || d.status === "full",
        ) ? (
        <Alert tone="info" title="Agenda complet">
          Aucun créneau n’est disponible pour cette prestation dans les semaines
          à venir. Écrivez-moi sur Instagram pour trouver une solution.
        </Alert>
      ) : (
        <DayStrip
          days={bookableDays}
          selected={selectedDay}
          onSelect={props.onSelectDay}
        />
      )}

      {selectedDay ? (
        <section aria-labelledby="horaires-titre" className="space-y-5">
          <h3
            id="horaires-titre"
            className="text-lg font-medium text-espresso-900"
          >
            {formatDayLong(selectedDay, { capitalize: true })}
          </h3>
          {slots.error ? (
            <Alert tone="error">
              {slots.error}{" "}
              <button
                type="button"
                onClick={props.onRetry}
                className="underline underline-offset-4"
              >
                Réessayer
              </button>
            </Alert>
          ) : slots.loading || !slots.data ? (
            <div
              aria-busy="true"
              role="status"
              className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
            >
              <span className="sr-only">Chargement des horaires…</span>
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="h-14 rounded-control bg-sand-50" />
              ))}
            </div>
          ) : (
            <>
              {slots.data.length > 0 ? (
                <TimeGrid
                  slots={slots.data}
                  selectedStart={props.selectedStart}
                  onSelect={props.onSelectSlot}
                />
              ) : null}
              {!hasAvailable ? (
                <div className="space-y-4 rounded-card border border-sand-200 bg-sand-50 p-5">
                  <p className="text-espresso-700">
                    {dayStatus === "full" || slots.data.length === 0
                      ? "Plus aucun créneau ce jour-là pour cette prestation."
                      : "Ce jour-là, seuls des créneaux en soirée sont possibles, sur demande."}
                  </p>
                  {nextAvailable ? (
                    <Button
                      variant="outline"
                      onClick={() => props.onSelectDay(nextAvailable.day)}
                    >
                      Prochaine date : {formatDayLong(nextAvailable.day)}
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {hasOnRequest ? (
                <p className="text-sm leading-relaxed text-espresso-500">
                  Les rendez-vous en soirée sont possibles sur demande
                  {props.instagramUrl ? (
                    <>
                      {" "}
                      :{" "}
                      <a
                        href={props.instagramUrl}
                        className="text-caramel-700 underline underline-offset-4"
                        rel="noopener"
                      >
                        écrivez-moi sur Instagram
                      </a>
                    </>
                  ) : null}
                  .
                </p>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
