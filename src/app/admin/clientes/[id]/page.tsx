import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminGate } from "@/components/admin/admin-gate";
import { StatusBadge } from "@/components/admin/agenda/day-view";
import { ClientForm } from "@/components/admin/clients/client-form";
import { NoteForm } from "@/components/admin/clients/note-form";
import { PlusIcon } from "@/components/admin/icons";
import {
  Badge,
  Card,
  CardTitle,
  Empty,
  Loading,
  PageTitle,
} from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { parisDate, parisTime } from "@/domain/time/paris";
import { formatDayLong } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { deleteClientNote } from "@/server/admin/actions/clients";
import { getClientFile } from "@/server/admin/clients";

export const metadata: Metadata = { title: "Fiche cliente" };

export default function ClientPage({
  params,
}: PageProps<"/admin/clientes/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <ClientFile params={params} />
      </AdminGate>
    </Suspense>
  );
}

const noteDate = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

async function ClientFile({
  params,
}: Pick<PageProps<"/admin/clientes/[id]">, "params">) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const client = await getClientFile(id);
  if (!client) notFound();

  const now = new Date();
  const upcoming = client.appointments
    .filter((a) => a.status === "confirmed" && a.end > now)
    .reverse();
  const history = client.appointments.filter(
    (a) => !(a.status === "confirmed" && a.end > now),
  );
  const visits = history.filter(
    (a) =>
      a.status === "completed" || (a.status === "confirmed" && a.end <= now),
  ).length;
  const noShows = history.filter((a) => a.status === "no_show").length;

  const line = (a: (typeof client.appointments)[number]) => (
    <li key={a.id}>
      <Link
        href={`/admin/rdv/${a.id}`}
        className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 px-1 py-2 text-sm hover:bg-sand-50"
      >
        <span className="w-44 shrink-0 text-espresso-900">
          {formatDayLong(parisDate(a.start), { capitalize: true })}{" "}
          <span className="tabular-nums">{parisTime(a.start)}</span>
        </span>
        <span className="min-w-0 flex-1 text-espresso-700">
          {a.serviceLabel}
          {a.priceCents != null ? ` · ${formatPrice(a.priceCents)}` : ""}
        </span>
        <StatusBadge status={a.status} />
      </Link>
    </li>
  );

  return (
    <div className="space-y-6">
      <PageTitle
        title={client.fullName}
        back={{ href: "/admin/clientes", label: "Clientes" }}
        actions={
          <Link
            href={`/admin/rdv/nouveau?cliente=${client.id}`}
            className={buttonClasses("primary", "md", "gap-2")}
          >
            <PlusIcon className="size-4" />
            Rendez-vous
          </Link>
        }
      />
      <p className="-mt-4 flex flex-wrap gap-2 text-sm">
        {client.phone ? (
          <a
            href={`tel:${client.phone}`}
            className="inline-flex min-h-11 items-center rounded-pill border border-sand-200 bg-ivory px-4 text-espresso-900"
          >
            Appeler
          </a>
        ) : null}
        {client.email ? (
          <a
            href={`mailto:${client.email}`}
            className="inline-flex min-h-11 items-center rounded-pill border border-sand-200 bg-ivory px-4 text-espresso-900"
          >
            Écrire
          </a>
        ) : null}
        <Badge tone="muted">
          {visits} visite{visits > 1 ? "s" : ""}
        </Badge>
        {noShows ? (
          <Badge tone="danger">
            {noShows} absence{noShows > 1 ? "s" : ""}
          </Badge>
        ) : null}
        {client.hasAccount ? <Badge tone="muted">Compte en ligne</Badge> : null}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card aria-labelledby="notes-titre">
            <CardTitle id="notes-titre">Notes</CardTitle>
            {client.notes.length ? (
              <ul className="mb-6 space-y-3">
                {client.notes.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-card bg-sand-50 px-4 py-3 text-sm"
                  >
                    <p className="whitespace-pre-line text-espresso-900">
                      {n.body}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-espresso-500">
                      <span>{noteDate.format(n.createdAt)}</span>
                      <ActionButton
                        action={deleteClientNote}
                        input={{ id: n.id }}
                        tone="quiet"
                        confirm="Supprimer cette note ?"
                        ariaLabel={`Supprimer la note du ${noteDate.format(n.createdAt)}`}
                      >
                        Supprimer
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
            <NoteForm clientId={client.id} />
          </Card>

          <Card aria-labelledby="coord-titre">
            <CardTitle id="coord-titre">Coordonnées</CardTitle>
            <ClientForm
              id={client.id}
              initial={{
                fullName: client.fullName,
                email: client.email ?? "",
                phone: client.phone ?? "",
              }}
              emailLocked={client.hasAccount}
            />
          </Card>
        </div>

        <div className="space-y-6">
          <Card aria-labelledby="avenir-titre">
            <CardTitle id="avenir-titre">À venir</CardTitle>
            {upcoming.length ? (
              <ul className="divide-y divide-sand-200">{upcoming.map(line)}</ul>
            ) : (
              <Empty>Aucun rendez-vous à venir.</Empty>
            )}
            {client.waitlist.length ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-espresso-900">
                  En liste d’attente
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-espresso-700">
                  {client.waitlist.map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/admin?jour=${w.day}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {formatDayLong(w.day, { capitalize: true })}
                      </Link>{" "}
                      · {w.serviceName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
          <Card aria-labelledby="historique-titre">
            <CardTitle id="historique-titre">Historique</CardTitle>
            {history.length ? (
              <ul className="divide-y divide-sand-200">{history.map(line)}</ul>
            ) : (
              <Empty>Pas encore de rendez-vous passé.</Empty>
            )}
          </Card>
          <p className="text-sm text-espresso-500">
            Fiche créée le {noteDate.format(client.createdAt)}
            {client.privacyAcceptedAt
              ? ` · politique de confidentialité acceptée le ${noteDate.format(client.privacyAcceptedAt)}`
              : ""}
            .
          </p>
        </div>
      </div>
    </div>
  );
}
