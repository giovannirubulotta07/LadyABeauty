import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminGate } from "@/components/admin/admin-gate";
import {
  Badge,
  Card,
  CardTitle,
  Empty,
  Loading,
  PageTitle,
} from "@/components/admin/ui";
import { parisDate } from "@/domain/time/paris";
import { formatDayLong } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import {
  offerFreedSlotsNow,
  removeWaitlistEntry,
} from "@/server/admin/actions/agenda";
import { getUpcomingWaitlist } from "@/server/admin/agenda";

export const metadata: Metadata = { title: "Liste d’attente" };

export default function WaitlistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Waitlist />
      </AdminGate>
    </Suspense>
  );
}

const registered = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

async function Waitlist() {
  await connection();
  const days = await getUpcomingWaitlist(parisDate(new Date()));
  return (
    <>
      <PageTitle title="Liste d’attente" />
      <p className="mb-6 max-w-2xl text-espresso-700">
        Quand un créneau se libère (annulation, déblocage, ouverture du soir),
        il est proposé automatiquement par e-mail, dans l’ordre d’inscription.
        Ici, vous voyez qui attend, jour par jour.
      </p>
      {days.length === 0 ? (
        <Empty>Personne n’est en liste d’attente.</Empty>
      ) : (
        <div className="space-y-6">
          {days.map(({ day, entries }) => (
            <Card key={day} aria-labelledby={`j-${day}`}>
              <CardTitle
                id={`j-${day}`}
                aside={
                  <Link
                    href={`/admin?jour=${day}`}
                    className="inline-flex min-h-11 items-center text-sm text-caramel-700 underline underline-offset-4"
                  >
                    Voir la journée
                  </Link>
                }
              >
                {formatDayLong(day, { capitalize: true })}
              </CardTitle>
              <ol className="divide-y divide-sand-200">
                {entries.map((w, i) => (
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
                      <p className="text-espresso-500">
                        Inscrite le {registered.format(w.createdAt)}
                      </p>
                      {w.status === "notified" ? (
                        <Badge tone="accent">Créneau proposé</Badge>
                      ) : null}
                    </div>
                    <ActionButton
                      action={removeWaitlistEntry}
                      input={{ id: w.id }}
                      tone="quiet"
                      ariaLabel={`Retirer ${w.clientName}`}
                      confirm={`Retirer ${w.clientName} de la liste d’attente ?`}
                    >
                      Retirer
                    </ActionButton>
                  </li>
                ))}
              </ol>
              <ActionButton
                action={offerFreedSlotsNow}
                input={{ day }}
                className="mt-2"
              >
                Proposer les créneaux libres maintenant
              </ActionButton>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
