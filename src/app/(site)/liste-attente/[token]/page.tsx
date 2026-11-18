import { FurStrip } from "@/components/site/page-hero";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppointmentCard } from "@/components/site/appointment-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ClockIcon } from "@/components/ui/icons";
import { OfferActions } from "@/components/waitlist/offer-actions";
import { parisTime } from "@/domain/time/paris";
import { addressLines, mapsUrl } from "@/lib/address";
import { formatDayLong } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { icsPath } from "@/server/appointments/links";
import { getAppointmentById } from "@/server/appointments/queries";
import { getBusinessInfo } from "@/server/content/queries";
import { createLinkToken } from "@/server/security/tokens";
import { findOfferByToken } from "@/server/waitlist/service";

export const metadata: Metadata = {
  title: "Une place s’est libérée",
  robots: { index: false, follow: false },
};

/** Target of the waitlist offer e-mail. The secret link identifies the client: no login needed. */
export default function WaitlistOfferPage({
  params,
}: PageProps<"/liste-attente/[token]">) {
  return (
    <>
      <FurStrip fur="rose" />
      <Container className="relative -mt-24 max-w-2xl pb-16 sm:-mt-28 sm:pb-24">
        <div className="rounded-card bg-ivory px-6 py-10 shadow-card sm:px-10 sm:py-12">
          <p className="label text-caramel-700">Liste d’attente</p>
          <Suspense
            fallback={<p className="mt-10 text-espresso-500">Chargement…</p>}
          >
            <Offer params={params} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}

async function Offer({
  params,
}: Pick<PageProps<"/liste-attente/[token]">, "params">) {
  await connection();
  const { token } = await params;
  const [offer, business] = await Promise.all([
    findOfferByToken(token),
    getBusinessInfo(),
  ]);

  if (!offer) {
    return (
      <Message
        title="Lien invalide"
        text="Ce lien n’est pas reconnu. Retrouvez vos inscriptions dans votre espace."
      />
    );
  }

  const now = new Date();
  const dateLabel = formatDayLong(offer.day, {
    withYear: true,
    capitalize: true,
  });

  if (offer.status === "accepted") {
    const appointment = offer.appointmentId
      ? await getAppointmentById(offer.appointmentId)
      : null;
    return (
      <div className="mt-6 space-y-8">
        <h1 className="text-title text-espresso-900">C’est réservé !</h1>
        <p className="leading-relaxed text-espresso-700">
          Votre rendez-vous est confirmé, un e-mail récapitulatif vient de vous
          être envoyé.
        </p>
        {appointment ? (
          <>
            <AppointmentCard appointment={appointment}>
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={icsPath(appointment)}
                className={buttonClasses("primary", "lg")}
                download
              >
                Ajouter à mon calendrier
              </a>
              <ButtonLink
                href={`/rdv/${createLinkToken("manage", appointment.id, new Date(appointment.end.getTime() + 2 * 3_600_000))}`}
                variant="outline"
                size="lg"
              >
                Gérer mon rendez-vous
              </ButtonLink>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  const exclusiveOver =
    offer.exclusiveUntil !== null && offer.exclusiveUntil <= now;
  if (offer.status !== "offered" || exclusiveOver || offer.start <= now) {
    return (
      <Message
        title="Cette place n’est plus disponible"
        text={
          exclusiveOver || offer.status === "expired"
            ? "Le délai pour réserver ce créneau est écoulé : il a été proposé à la personne suivante. Vous restez inscrite pour les autres créneaux de cette journée."
            : "Ce créneau a été attribué. Si vous êtes toujours inscrite, vous serez prévenue si une autre place se libère."
        }
        cta={{ href: "/mon-espace", label: "Mes inscriptions" }}
      />
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <h1 className="text-title text-espresso-900">
        Une place s’est libérée{offer.firstName ? `, ${offer.firstName}` : ""} !
      </h1>
      <article className="rounded-card border border-sand-200 bg-ivory p-5 sm:p-6">
        <p className="label text-caramel-700">{dateLabel}</p>
        <h2 className="mt-2 font-display text-2xl text-espresso-900">
          {parisTime(offer.start)} · {offer.serviceName}
        </h2>
        <p className="mt-1 text-sm text-espresso-500">
          {formatDuration(offer.durationMin)} ·{" "}
          {addressLines(business.address).join(", ")}
        </p>
      </article>
      <p className="flex items-start gap-3 rounded-card bg-sand-50 p-4 text-sm leading-relaxed text-espresso-700">
        <ClockIcon className="mt-0.5 shrink-0" />
        {offer.exclusiveUntil ? (
          <span>
            Ce créneau vous est réservé{" "}
            <strong className="font-medium text-espresso-900">
              jusqu’à {parisTime(offer.exclusiveUntil)}
            </strong>
            . Passé ce délai, il sera proposé à la personne suivante.
          </span>
        ) : (
          <span>
            Plusieurs personnes ont été prévenues : la première à confirmer
            obtient le rendez-vous.
          </span>
        )}
      </p>
      <OfferActions token={token} />
    </div>
  );
}

function Message({
  title,
  text,
  cta,
}: {
  title: string;
  text: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mt-6">
      <h1 className="text-title text-espresso-900">{title}</h1>
      <p className="mt-4 leading-relaxed text-espresso-500">{text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {cta ? <ButtonLink href={cta.href}>{cta.label}</ButtonLink> : null}
        <ButtonLink href="/reserver" variant="outline">
          Prendre rendez-vous
        </ButtonLink>
      </div>
    </div>
  );
}
