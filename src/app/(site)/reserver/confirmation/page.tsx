import { FurStrip } from "@/components/site/page-hero";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";
import { AppointmentCard } from "@/components/site/appointment-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { addressLines, mapsUrl } from "@/lib/address";
import { icsPath } from "@/server/appointments/links";
import { getMyAppointment } from "@/server/appointments/queries";
import { getBusinessInfo } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Rendez-vous confirmé",
  robots: { index: false },
};

export default function ConfirmationPage({
  searchParams,
}: PageProps<"/reserver/confirmation">) {
  return (
    <>
      <FurStrip fur="rose" />
      <Container className="relative -mt-24 max-w-2xl pb-16 sm:-mt-28 sm:pb-24">
        <div className="rounded-card bg-ivory px-6 py-10 shadow-card sm:px-10 sm:py-12">
          <Suspense
            fallback={
              <p role="status" className="py-16 text-center text-espresso-500">
                Chargement de votre rendez-vous…
              </p>
            }
          >
            <Confirmation searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </>
  );
}

async function Confirmation({
  searchParams,
}: Pick<PageProps<"/reserver/confirmation">, "searchParams">) {
  const id = z.uuid().safeParse((await searchParams).rdv);
  const [appointment, business] = await Promise.all([
    id.success ? getMyAppointment(id.data) : Promise.resolve(null),
    getBusinessInfo(),
  ]);

  if (!appointment) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-title text-espresso-900">
          Rendez-vous introuvable
        </h1>
        <p className="mt-4 text-espresso-500">
          Connectez-vous à votre espace pour retrouver vos rendez-vous.
        </p>
        <ButtonLink href="/mon-espace" className="mt-8">
          Mon espace
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div
        aria-hidden="true"
        className="mx-auto flex size-16 items-center justify-center rounded-full bg-espresso-900 text-2xl text-ivory"
      >
        ✓
      </div>
      <p className="label mt-8 text-caramel-700">C’est confirmé</p>
      <h1 className="mt-3 text-title text-espresso-900">À très bientôt !</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-espresso-700">
        Votre rendez-vous est réservé. Vous le retrouverez à tout moment dans
        votre espace.
      </p>

      <div className="mt-10 text-left">
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
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a
          href={icsPath(appointment)}
          className={buttonClasses("primary", "lg")}
          download
        >
          Ajouter à mon calendrier
        </a>
        <ButtonLink href="/mon-espace" variant="outline" size="lg">
          Mes rendez-vous
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-espresso-500">
        Un empêchement ? Annulez depuis{" "}
        <Link
          href="/mon-espace"
          className="text-caramel-700 underline underline-offset-4"
        >
          votre espace
        </Link>{" "}
        jusqu’à {business.policy.cancellationCutoffHours} h avant.
      </p>
    </div>
  );
}
