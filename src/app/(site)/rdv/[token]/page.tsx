import { FurStrip } from "@/components/site/page-hero";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { CancelWithLink } from "@/components/account/cancel-with-link";
import { AppointmentCard } from "@/components/site/appointment-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  canClientCancel,
  cancellationDeadline,
} from "@/domain/booking/cancellation";
import { parisDate, parisTime } from "@/domain/time/paris";
import { addressLines, mapsUrl } from "@/lib/address";
import { formatDayLong } from "@/lib/dates";
import { icsPath } from "@/server/appointments/links";
import { getAppointmentById } from "@/server/appointments/queries";
import { getBusinessInfo } from "@/server/content/queries";
import { readLinkToken } from "@/server/security/tokens";

export const metadata: Metadata = {
  title: "Mon rendez-vous",
  robots: { index: false, follow: false },
};

/** Target of "Gérer mon rendez-vous" in e-mails: works without signing in (signed link). */
export default function ManageAppointmentPage({
  params,
}: PageProps<"/rdv/[token]">) {
  return (
    <>
      <FurStrip fur="leopard" />
      <Container className="relative -mt-24 max-w-2xl pb-16 sm:-mt-28 sm:pb-24">
        <div className="rounded-card bg-ivory px-6 py-10 shadow-card sm:px-10 sm:py-12">
          <p className="label text-caramel-700">Mon rendez-vous</p>
          <Suspense
            fallback={<p className="mt-10 text-espresso-500">Chargement…</p>}
          >
            <Manage params={params} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}

async function Manage({ params }: Pick<PageProps<"/rdv/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const id = readLinkToken(token, "manage");
  const [appointment, business] = await Promise.all([
    id ? getAppointmentById(id) : null,
    getBusinessInfo(),
  ]);

  if (!appointment) {
    return (
      <div className="mt-6">
        <h1 className="text-title text-espresso-900">Lien expiré</h1>
        <p className="mt-4 text-espresso-500">
          Ce lien n’est plus valable. Connectez-vous à votre espace pour
          retrouver vos rendez-vous.
        </p>
        <ButtonLink href="/mon-espace" className="mt-8">
          Mon espace
        </ButtonLink>
      </div>
    );
  }

  const now = new Date();
  const cutoff = business.policy.cancellationCutoffHours;
  const upcoming = appointment.status === "confirmed" && appointment.end > now;
  const cancellable =
    upcoming && canClientCancel(appointment.start, now, cutoff);
  const deadline = cancellationDeadline(appointment.start, cutoff);

  return (
    <div className="mt-6 space-y-8">
      <h1 className="text-title text-espresso-900">
        {appointment.status === "cancelled"
          ? "Rendez-vous annulé"
          : upcoming
            ? "À bientôt !"
            : "Rendez-vous passé"}
      </h1>
      <AppointmentCard appointment={appointment} muted={!upcoming}>
        <address className="text-sm leading-relaxed text-espresso-700 not-italic">
          {business.name} — {addressLines(business.address).join(", ")}{" "}
          <a
            href={mapsUrl(business.name, business.address)}
            rel="noopener"
            className="text-caramel-700 underline underline-offset-4"
          >
            Plan
          </a>
        </address>
      </AppointmentCard>

      {upcoming ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
            <a
              href={icsPath(appointment)}
              className={buttonClasses("outline")}
              download
            >
              Ajouter au calendrier
            </a>
            {cancellable ? <CancelWithLink token={token} /> : null}
          </div>
          <p className="text-sm text-espresso-500">
            {cancellable
              ? `Annulation possible jusqu’au ${formatDayLong(parisDate(deadline))} à ${parisTime(deadline)}.`
              : `Moins de ${cutoff} h avant le rendez-vous : pour tout changement, contactez Alessia directement.`}
          </p>
        </div>
      ) : (
        <ButtonLink href="/reserver">Prendre un nouveau rendez-vous</ButtonLink>
      )}
    </div>
  );
}
