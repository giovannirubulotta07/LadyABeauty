import type { Metadata } from "next";
import type { ReactNode } from "react";
import { connection } from "next/server";
import { Suspense } from "react";
import { CancelAppointment } from "@/components/account/cancel-appointment";
import { DeleteAccount } from "@/components/account/delete-account";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { AppointmentCard } from "@/components/site/appointment-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  canClientCancel,
  cancellationDeadline,
} from "@/domain/booking/cancellation";
import { parisDate, parisTime } from "@/domain/time/paris";
import { formatDayLong } from "@/lib/dates";
import { signOut } from "@/server/actions/auth";
import { icsPath } from "@/server/appointments/links";
import { listMyAppointments } from "@/server/appointments/queries";
import { listMyWaitlist } from "@/server/waitlist/queries";
import { LeaveWaitlist } from "@/components/waitlist/leave-waitlist";
import { getSessionUser } from "@/server/auth/session";
import { findClientForUser } from "@/server/clients/service";
import { getBusinessInfo } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false },
};

export default function MonEspacePage({
  searchParams,
}: PageProps<"/mon-espace">) {
  return (
    <Container className="max-w-3xl py-12 sm:py-16">
      <header>
        <p className="label text-caramel-700">Mon espace</p>
        <h1 className="mt-3 text-title text-espresso-900">Mes rendez-vous</h1>
      </header>
      <Suspense
        fallback={
          <p role="status" className="mt-10 text-espresso-500">
            Chargement de votre espace…
          </p>
        }
      >
        <Account searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-sand-200 pt-10">
      <h2
        id={id}
        className="font-display text-2xl text-espresso-900 sm:text-3xl"
      >
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

async function Account({
  searchParams,
}: Pick<PageProps<"/mon-espace">, "searchParams">) {
  await connection(); // compares appointments with the current time
  const user = await getSessionUser();

  if (!user) {
    const { lien } = await searchParams;
    return (
      <div className="mt-10 rounded-card bg-ivory p-6 shadow-card sm:p-8">
        <h2 className="font-display text-2xl text-espresso-900">Connexion</h2>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-espresso-500">
          Retrouvez vos rendez-vous, annulez-les ou modifiez vos informations.
        </p>
        <LoginPanel expiredLink={lien === "expire"} />
      </div>
    );
  }

  const [client, business] = await Promise.all([
    findClientForUser(user),
    getBusinessInfo(),
  ]);

  if (!client || !client.privacyAcceptedAt) {
    return (
      <div className="mt-10 space-y-8">
        <div className="rounded-card bg-ivory p-6 shadow-card sm:p-8">
          <h2 className="font-display text-2xl text-espresso-900">
            Bienvenue !
          </h2>
          <p className="mt-2 mb-6 text-sm text-espresso-500">
            Complétez vos informations pour réserver en un instant.
          </p>
          <ProfileForm
            email={user.email}
            fullName={client?.fullName ?? ""}
            phone={client?.phone ?? ""}
            needsPrivacy
            submitLabel="Continuer"
          />
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 text-sm text-espresso-700 underline underline-offset-4"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }

  const [appointments, waitlist] = await Promise.all([
    listMyAppointments(),
    listMyWaitlist(),
  ]);
  const now = new Date();
  const upcoming = appointments
    .filter((a) => a.status === "confirmed" && a.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const past = appointments.filter((a) => !upcoming.includes(a));
  const cutoff = business.policy.cancellationCutoffHours;

  return (
    <div className="mt-10 space-y-12">
      <p className="text-espresso-700">
        Bonjour {client.fullName.split(" ")[0]}{" "}
        <span aria-hidden="true">·</span>{" "}
        <span className="text-sm text-espresso-500">{user.email}</span>
      </p>

      <Section id="a-venir" title="À venir">
        {upcoming.length === 0 ? (
          <div className="rounded-card border border-dashed border-sand-200 p-8 text-center">
            <p className="text-espresso-500">
              Aucun rendez-vous prévu pour le moment.
            </p>
            <ButtonLink href="/reserver" className="mt-6">
              Prendre rendez-vous
            </ButtonLink>
          </div>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((a) => {
              const deadline = cancellationDeadline(a.start, cutoff);
              return (
                <li key={a.id}>
                  <AppointmentCard appointment={a}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                      <a
                        href={icsPath(a)}
                        className={buttonClasses("outline")}
                        download
                      >
                        Ajouter au calendrier
                      </a>
                      {canClientCancel(a.start, now, cutoff) ? (
                        <CancelAppointment appointmentId={a.id} />
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-espresso-500">
                      {canClientCancel(a.start, now, cutoff)
                        ? `Annulation possible jusqu’au ${formatDayLong(parisDate(deadline))} à ${parisTime(deadline)}.`
                        : `Moins de ${cutoff} h avant le rendez-vous : pour tout changement, contactez Alessia directement.`}
                    </p>
                  </AppointmentCard>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {waitlist.length > 0 ? (
        <Section id="liste-attente" title="Liste d’attente">
          <ul className="space-y-3">
            {waitlist.map((w) => (
              <li
                key={w.id}
                className="rounded-card border border-sand-200 bg-ivory p-5"
              >
                <p className="label text-caramel-700">
                  {formatDayLong(w.day, { withYear: true, capitalize: true })}
                </p>
                <p className="mt-2 font-display text-xl text-espresso-900">
                  {w.serviceName}
                </p>
                <p className="mt-1 text-sm text-espresso-500">
                  {w.status === "notified"
                    ? "Une place vous a été proposée : consultez vos e-mails pour la réserver."
                    : "En attente : vous serez prévenue par e-mail si une place se libère."}
                </p>
                <div className="mt-3">
                  <LeaveWaitlist entryId={w.id} />
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {past.length > 0 ? (
        <Section id="historique" title="Historique">
          <ul className="space-y-3">
            {past.map((a) => (
              <li key={a.id}>
                <AppointmentCard appointment={a} muted />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="informations" title="Mes informations">
        <ProfileForm
          email={user.email}
          fullName={client.fullName}
          phone={client.phone ?? ""}
          needsPrivacy={false}
        />
      </Section>

      <Section id="securite" title="Mot de passe">
        <PasswordForm hasPassword={user.hasPassword} />
      </Section>

      <Section id="donnees" title="Mes données">
        <div className="space-y-6">
          <p className="text-sm leading-relaxed text-espresso-500">
            Conformément au RGPD, vous pouvez télécharger vos données ou
            supprimer votre compte à tout moment.
          </p>
          <a
            href="/mon-espace/export"
            className={buttonClasses("outline")}
            download
          >
            Télécharger mes données
          </a>
          <DeleteAccount />
        </div>
      </Section>

      <form action={signOut} className="border-t border-sand-200 pt-8">
        <button
          type="submit"
          className="min-h-11 text-sm text-espresso-700 underline underline-offset-4"
        >
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
