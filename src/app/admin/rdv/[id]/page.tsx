import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminGate } from "@/components/admin/admin-gate";
import { StatusBadge } from "@/components/admin/agenda/day-view";
import {
  CancelForm,
  MoveForm,
} from "@/components/admin/appointments/manage-forms";
import { EmailList } from "@/components/admin/email-list";
import {
  Badge,
  Card,
  CardTitle,
  Details,
  Loading,
  PageTitle,
} from "@/components/admin/ui";
import { formatDayLong } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/format";
import { setAppointmentStatus } from "@/server/admin/actions/agenda";
import { getAppointment } from "@/server/admin/agenda";
import { listEmailLog } from "@/server/admin/emails";

export const metadata: Metadata = { title: "Rendez-vous" };

export default function AppointmentPage({
  params,
}: PageProps<"/admin/rdv/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Appointment params={params} />
      </AdminGate>
    </Suspense>
  );
}

const SOURCE = {
  online: "Réservé en ligne",
  admin: "Ajouté par le studio",
  waitlist: "Liste d’attente",
} as const;

const dateTime = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

async function Appointment({
  params,
}: Pick<PageProps<"/admin/rdv/[id]">, "params">) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [appt, emails] = await Promise.all([
    getAppointment(id),
    listEmailLog({ appointmentId: id, limit: 20 }),
  ]);
  if (!appt) notFound();

  const now = new Date();
  const upcoming = appt.status === "confirmed" && appt.end > now;
  const past = appt.status !== "cancelled" && appt.start <= now;
  const hasEmail = Boolean(appt.client?.email);

  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle
        eyebrow={formatDayLong(appt.day, { capitalize: true, withYear: true })}
        title={`${appt.time} – ${appt.endTime}`}
        back={{ href: `/admin?jour=${appt.day}`, label: "Agenda" }}
      />

      <Card aria-labelledby="rdv-titre">
        <CardTitle
          id="rdv-titre"
          aside={
            appt.status === "confirmed" ? (
              <Badge tone="neutral">Confirmé</Badge>
            ) : (
              <StatusBadge status={appt.status} />
            )
          }
        >
          {appt.serviceLabel}
        </CardTitle>
        <Details
          items={[
            [
              "Cliente",
              appt.client ? (
                <Link
                  href={`/admin/clientes/${appt.client.id}`}
                  className="text-caramel-700 underline underline-offset-4"
                >
                  {appt.client.fullName}
                </Link>
              ) : (
                "Cliente supprimée"
              ),
            ],
            ...(appt.client?.phone
              ? ([
                  [
                    "Téléphone",
                    <a
                      key="tel"
                      href={`tel:${appt.client.phone}`}
                      className="text-caramel-700 underline underline-offset-4"
                    >
                      {appt.client.phone}
                    </a>,
                  ],
                ] as Array<[string, React.ReactNode]>)
              : []),
            ...(appt.client?.email
              ? ([
                  [
                    "E-mail",
                    <a
                      key="mail"
                      href={`mailto:${appt.client.email}`}
                      className="break-all text-caramel-700 underline underline-offset-4"
                    >
                      {appt.client.email}
                    </a>,
                  ],
                ] as Array<[string, React.ReactNode]>)
              : []),
            ["Durée", formatDuration(appt.durationMin)],
            [
              "Prix",
              appt.priceCents != null ? formatPrice(appt.priceCents) : "—",
            ],
            ["Origine", SOURCE[appt.source]],
            ["Créé le", dateTime.format(appt.createdAt)],
            ...(appt.note
              ? ([["Note", appt.note]] as Array<[string, string]>)
              : []),
            ...(appt.client?.preferences
              ? ([["Ses préférences", appt.client.preferences]] as Array<
                  [string, string]
                >)
              : []),
            ...(appt.cancelledAt
              ? ([
                  ["Annulé le", dateTime.format(appt.cancelledAt)],
                  ["Motif", appt.cancellationReason ?? "—"],
                ] as Array<[string, string]>)
              : []),
          ]}
        />
        {past ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {appt.status !== "completed" ? (
              <ActionButton
                action={setAppointmentStatus}
                input={{ id: appt.id, status: "completed" }}
              >
                Marquer comme terminé
              </ActionButton>
            ) : null}
            {appt.status !== "no_show" ? (
              <ActionButton
                action={setAppointmentStatus}
                input={{ id: appt.id, status: "no_show" }}
                tone="danger"
              >
                Cliente absente
              </ActionButton>
            ) : null}
            {appt.status !== "confirmed" ? (
              <ActionButton
                action={setAppointmentStatus}
                input={{ id: appt.id, status: "confirmed" }}
                tone="quiet"
              >
                Remettre en « confirmé »
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </Card>

      {upcoming ? (
        <>
          <Card aria-labelledby="deplacer-titre">
            <CardTitle id="deplacer-titre">Déplacer</CardTitle>
            <MoveForm
              id={appt.id}
              day={appt.day}
              durationMin={appt.durationMin}
              hasEmail={hasEmail}
            />
          </Card>
          <Card aria-labelledby="annuler-titre">
            <CardTitle id="annuler-titre">Annuler</CardTitle>
            <CancelForm id={appt.id} hasEmail={hasEmail} />
          </Card>
        </>
      ) : null}

      <Card aria-labelledby="emails-titre">
        <CardTitle id="emails-titre">E-mails envoyés</CardTitle>
        <EmailList emails={emails} />
      </Card>
    </div>
  );
}
