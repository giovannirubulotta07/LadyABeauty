import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { PhoneIcon, PlusIcon } from "@/components/admin/icons";
import { Badge, Card, CardTitle, Empty } from "@/components/admin/ui";
import { formatDuration } from "@/lib/format";
import {
  deleteStudioBlock,
  offerFreedSlotsNow,
  removeWaitlistEntry,
} from "@/server/admin/actions/agenda";
import type { AgendaAppointment, AgendaDay } from "@/server/admin/agenda";
import { BlockForm } from "./block-form";
import { EveningToggle } from "./evening-toggle";

const SOURCE_LABEL: Record<AgendaAppointment["source"], string> = {
  online: "En ligne",
  admin: "Studio",
  waitlist: "Liste d’attente",
};

export function StatusBadge({
  status,
}: {
  status: AgendaAppointment["status"];
}) {
  if (status === "completed") return <Badge tone="success">Terminé</Badge>;
  if (status === "no_show") return <Badge tone="danger">Absente</Badge>;
  if (status === "cancelled") return <Badge tone="muted">Annulé</Badge>;
  return null;
}

type Row =
  | { kind: "appointment"; at: number; item: AgendaAppointment }
  | { kind: "block"; at: number; item: AgendaDay["blocks"][number] }
  | { kind: "hold"; at: number; item: AgendaDay["holds"][number] }
  | { kind: "free"; at: number; item: AgendaDay["free"][number] };

function Timeline({ agenda }: { agenda: AgendaDay }) {
  const rows: Row[] = [
    ...agenda.appointments.map((item) => ({
      kind: "appointment" as const,
      at: item.start.getTime(),
      item,
    })),
    ...agenda.blocks.map((item) => ({
      kind: "block" as const,
      at: item.start.getTime(),
      item,
    })),
    ...agenda.holds.map((item) => ({
      kind: "hold" as const,
      at: item.start.getTime(),
      item,
    })),
    ...agenda.free.map((item) => ({
      kind: "free" as const,
      at: item.start.getTime(),
      item,
    })),
  ].sort((a, b) => a.at - b.at);

  if (rows.length === 0)
    return (
      <Empty>Aucun rendez-vous et aucune plage d’ouverture ce jour-là.</Empty>
    );

  return (
    <ol className="space-y-2">
      {rows.map((row) => (
        <li
          key={`${row.kind}-${row.at}-${"id" in row.item ? row.item.id : ""}`}
        >
          {row.kind === "appointment" ? (
            <AppointmentRow appt={row.item} />
          ) : row.kind === "block" ? (
            <TimeRow
              time={
                row.item.coversDay
                  ? "Journée"
                  : `${row.item.fromTime} – ${row.item.toTime}`
              }
              className="border-dashed bg-sand-100/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-espresso-700">
                  <span className="font-medium text-espresso-900">Bloqué</span>
                  {row.item.reason ? ` · ${row.item.reason}` : null}
                </p>
                <ActionButton
                  action={deleteStudioBlock}
                  input={{ id: row.item.id }}
                  tone="quiet"
                  confirm="Retirer ce blocage ? Les créneaux redeviendront réservables."
                >
                  Retirer
                </ActionButton>
              </div>
            </TimeRow>
          ) : row.kind === "hold" ? (
            <TimeRow
              time={`${row.item.time} – ${row.item.endTime}`}
              className="bg-caramel-300/15"
            >
              <p className="text-sm text-espresso-700">
                Proposé à{" "}
                <span className="font-medium text-espresso-900">
                  {row.item.clientName}
                </span>{" "}
                (liste d’attente), réservé pour elle jusqu’à{" "}
                {row.item.expiresAt.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Paris",
                })}
              </p>
            </TimeRow>
          ) : (
            <Link
              href={`/admin/rdv/nouveau?jour=${agenda.day}&heure=${row.item.time}`}
              className="group flex min-h-12 items-center gap-4 rounded-card border border-transparent px-4 py-2 text-sm text-espresso-500 transition-colors hover:border-sand-200 hover:bg-ivory"
            >
              <span className="w-24 shrink-0 tabular-nums">
                {row.item.time} – {row.item.endTime}
              </span>
              <span className="flex-1">
                Libre ·{" "}
                {formatDuration(
                  (row.item.end.getTime() - row.item.start.getTime()) / 60_000,
                )}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-caramel-700 group-hover:text-espresso-900">
                <PlusIcon className="size-4" />
                Ajouter
              </span>
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

function TimeRow({
  time,
  className,
  children,
}: {
  time: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex gap-4 rounded-card border border-sand-200 px-4 py-3",
        className,
      )}
    >
      <span className="w-24 shrink-0 text-sm text-espresso-700 tabular-nums">
        {time}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function AppointmentRow({ appt }: { appt: AgendaAppointment }) {
  return (
    <div className="flex items-stretch gap-2 rounded-card border border-sand-200 bg-ivory shadow-xs">
      <Link
        href={`/admin/rdv/${appt.id}`}
        className="flex min-w-0 flex-1 gap-4 rounded-card px-4 py-3 hover:bg-sand-50"
      >
        <span className="w-24 shrink-0 tabular-nums">
          <span className="block font-medium text-espresso-900">
            {appt.time}
          </span>
          <span className="block text-sm text-espresso-500">
            → {appt.endTime}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-espresso-900">
            {appt.clientName}
          </span>
          <span className="block text-sm text-espresso-700">
            {appt.serviceLabel}
          </span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            <Badge tone="muted">{SOURCE_LABEL[appt.source]}</Badge>
            <StatusBadge status={appt.status} />
            {appt.note ? <Badge tone="accent">Note</Badge> : null}
          </span>
        </span>
      </Link>
      {appt.clientPhone ? (
        <a
          href={`tel:${appt.clientPhone}`}
          aria-label={`Appeler ${appt.clientName}`}
          className="flex w-12 shrink-0 items-center justify-center rounded-r-card border-l border-sand-200 text-espresso-700 hover:bg-sand-50 hover:text-espresso-900"
        >
          <PhoneIcon className="size-5" />
        </a>
      ) : null}
    </div>
  );
}

export function DayView({ agenda }: { agenda: AgendaDay }) {
  const closed = agenda.windows.length === 0;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Card aria-labelledby="planning-titre">
          <CardTitle
            id="planning-titre"
            aside={
              <span className="text-sm text-espresso-500">
                {closed
                  ? "Fermé"
                  : agenda.windows
                      .map((w) => `${w.opens}–${w.closes}`)
                      .join(" · ")}
              </span>
            }
          >
            Planning
          </CardTitle>
          <Timeline agenda={agenda} />
          {agenda.cancelled.length ? (
            <details className="mt-4 text-sm">
              <summary className="min-h-11 cursor-pointer py-2 text-espresso-700">
                Annulés ({agenda.cancelled.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {agenda.cancelled.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/admin/rdv/${a.id}`}
                      className="flex min-h-11 items-center gap-4 rounded-control px-2 text-espresso-500 line-through hover:bg-sand-100"
                    >
                      <span className="w-24 tabular-nums">{a.time}</span>
                      {a.clientName} · {a.serviceLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </Card>
      </div>

      <div className="space-y-6">
        {agenda.hasEvening && agenda.eveningLockFrom ? (
          <Card aria-label="Créneaux du soir">
            <EveningToggle
              day={agenda.day}
              unlocked={agenda.eveningUnlocked}
              from={agenda.eveningLockFrom}
            />
          </Card>
        ) : null}

        <Card aria-labelledby="attente-titre">
          <CardTitle id="attente-titre">Liste d’attente</CardTitle>
          {agenda.waitlist.length === 0 ? (
            <p className="text-sm text-espresso-500">
              Personne n’attend ce jour-là.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-sand-200">
                {agenda.waitlist.map((w, i) => (
                  <li key={w.id} className="flex items-start gap-3 py-3">
                    <span className="mt-0.5 w-5 text-sm text-espresso-500 tabular-nums">
                      {i + 1}.
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <Link
                        href={`/admin/clientes/${w.clientId}`}
                        className="font-medium text-espresso-900 underline-offset-4 hover:underline"
                      >
                        {w.clientName}
                      </Link>
                      <p className="text-espresso-700">
                        {w.serviceLabel} · {formatDuration(w.durationMin)}
                      </p>
                      {w.status === "notified" ? (
                        <Badge tone="accent">Créneau proposé</Badge>
                      ) : null}
                    </div>
                    <ActionButton
                      action={removeWaitlistEntry}
                      input={{ id: w.id }}
                      tone="quiet"
                      ariaLabel={`Retirer ${w.clientName} de la liste d’attente`}
                      confirm={`Retirer ${w.clientName} de la liste d’attente ?`}
                    >
                      Retirer
                    </ActionButton>
                  </li>
                ))}
              </ul>
              {agenda.free.length ? (
                <ActionButton
                  action={offerFreedSlotsNow}
                  input={{ day: agenda.day }}
                  className="mt-3"
                >
                  Proposer les créneaux libres
                </ActionButton>
              ) : null}
            </>
          )}
        </Card>

        <Card aria-labelledby="bloquer-titre">
          <details>
            <summary className="flex min-h-11 cursor-pointer items-center font-display text-xl text-espresso-900">
              <span id="bloquer-titre">Bloquer un créneau</span>
            </summary>
            <p className="mt-2 mb-4 text-sm text-espresso-500">
              Congés, rendez-vous personnel, formation… Les clientes ne pourront
              plus réserver sur cette période.
            </p>
            <BlockForm day={agenda.day} />
          </details>
        </Card>
      </div>
    </div>
  );
}
