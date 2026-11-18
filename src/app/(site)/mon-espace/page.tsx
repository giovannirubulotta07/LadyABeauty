import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { CancelAppointment } from "@/components/account/cancel-appointment";
import { DeleteAccount } from "@/components/account/delete-account";
import { PasswordForm } from "@/components/account/password-form";
import { PreferencesForm } from "@/components/account/preferences-form";
import { ProfileForm } from "@/components/account/profile-form";
import { LoginPanel } from "@/components/auth/login-panel";
import { PageHero } from "@/components/site/page-hero";
import { AppointmentCard } from "@/components/site/appointment-card";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowIcon, PinIcon } from "@/components/ui/icons";
import { LeaveWaitlist } from "@/components/waitlist/leave-waitlist";
import {
  canClientCancel,
  cancellationDeadline,
} from "@/domain/booking/cancellation";
import { parisDate, parisTime } from "@/domain/time/paris";
import { addressLines, mapsUrl } from "@/lib/address";
import { formatDayLong, relativeDay } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { signOut } from "@/server/actions/auth";
import { icsPath } from "@/server/appointments/links";
import {
  type AppointmentView,
  listMyAppointments,
} from "@/server/appointments/queries";
import { getSessionUser } from "@/server/auth/session";
import { findClientForUser } from "@/server/clients/service";
import { getBusinessInfo, getServices } from "@/server/content/queries";
import { listMyWaitlist } from "@/server/waitlist/queries";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false },
};

export default function MonEspacePage({
  searchParams,
}: PageProps<"/mon-espace">) {
  return (
    <>
      <PageHero size="compact" label="Espace cliente" title="Mon espace" />
      <Container className="relative -mt-14 max-w-4xl pb-16 sm:-mt-20 sm:pb-24">
        <Suspense
          fallback={
            <div
              role="status"
              className="min-h-64 rounded-card bg-ivory p-8 text-espresso-500 shadow-card"
            >
              Chargement de votre espace…
            </div>
          }
        >
          <Account searchParams={searchParams} />
        </Suspense>
      </Container>
    </>
  );
}

const SECTIONS = [
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "historique", label: "Historique" },
  { id: "preferences", label: "Préférences" },
  { id: "informations", label: "Informations" },
  { id: "donnees", label: "Mes données" },
] as const;

function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="border-t border-sand-200 pt-10"
    >
      <h2
        id={`${id}-titre`}
        className="font-display text-2xl text-espresso-900 sm:text-3xl"
      >
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-espresso-500">
          {intro}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="min-h-11 text-sm text-espresso-700 underline underline-offset-4 transition-colors hover:text-caramel-700"
      >
        Se déconnecter
      </button>
    </form>
  );
}

/** "Réserver à nouveau" for a service that can still be booked online. */
function RebookLink({ slug }: { slug: string }) {
  return (
    <Link
      href={`/reserver?prestation=${slug}`}
      className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-[0.75rem] tracking-[0.18em] text-espresso-900 uppercase"
    >
      <span className="link-underline">Réserver à nouveau</span>
      <ArrowIcon
        width={16}
        height={16}
        className="transition-transform duration-500 group-hover:translate-x-1"
      />
    </Link>
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
      <div className="grid overflow-hidden rounded-card bg-ivory shadow-card md:grid-cols-[1fr_1.1fr]">
        <div className="surface-dark bg-espresso-950 p-6 text-sand-100 sm:p-10">
          <p className="label text-caramel-300">Votre espace</p>
          <h2 className="mt-4 font-display text-3xl text-ivory">
            Vos rendez-vous, au même endroit
          </h2>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed">
            {[
              "Vos rendez-vous à venir, à ajouter à votre calendrier",
              "L’annulation en un geste, dans les délais",
              "Votre historique, pour réserver à nouveau en un clic",
              "Vos préférences, qu’Alessia retrouve avant chaque séance",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="text-caramel-300">
                  —
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-10">
          <h2 className="font-display text-2xl text-espresso-900">Connexion</h2>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-espresso-500">
            Recevez un code par e-mail : pas de mot de passe à retenir.
          </p>
          <LoginPanel expiredLink={lien === "expire"} />
        </div>
      </div>
    );
  }

  const [client, business, services] = await Promise.all([
    findClientForUser(user),
    getBusinessInfo(),
    getServices(),
  ]);

  if (!client || !client.privacyAcceptedAt) {
    return (
      <div className="rounded-card bg-ivory p-6 shadow-card sm:p-10">
        <p className="label text-caramel-700">Bienvenue</p>
        <h2 className="mt-3 font-display text-3xl text-espresso-900">
          Faisons connaissance
        </h2>
        <p className="mt-2 mb-8 max-w-lg text-sm text-espresso-500">
          Complétez vos informations : vos prochaines réservations se feront en
          un instant.
        </p>
        <div className="max-w-lg">
          <ProfileForm
            email={user.email}
            fullName={client?.fullName ?? ""}
            phone={client?.phone ?? ""}
            needsPrivacy
            submitLabel="Continuer"
          />
        </div>
        <div className="mt-8 border-t border-sand-200 pt-4">
          <SignOutButton />
        </div>
      </div>
    );
  }

  const [appointments, waitlist] = await Promise.all([
    listMyAppointments(),
    listMyWaitlist(),
  ]);
  const now = new Date();
  const today = parisDate(now);
  const bookable = new Set(
    services.filter((s) => s.bookableOnline).map((s) => s.slug),
  );
  const canRebook = (a: AppointmentView) =>
    a.serviceSlug != null && bookable.has(a.serviceSlug);

  const upcoming = appointments
    .filter((a) => a.status === "confirmed" && a.end > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  // Past ones only; a future appointment she cancelled is listed apart.
  const past = appointments.filter(
    (a) => a.start <= now && !upcoming.includes(a),
  );
  const cancelledAhead = appointments
    .filter((a) => a.status === "cancelled" && a.start > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const visits = past.filter(
    (a) => a.status === "completed" || a.status === "confirmed",
  );
  const lastVisit = visits[0] ?? null;
  const [next, ...later] = upcoming;
  const cutoff = business.policy.cancellationCutoffHours;
  const firstName = client.fullName.split(" ")[0];
  const HISTORY_SHOWN = 5;

  return (
    <div className="space-y-12">
      {/* Dashboard ---------------------------------------------------------- */}
      <div className="rounded-card bg-ivory p-6 shadow-card sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label text-caramel-700">Bonjour</p>
            <h2 className="mt-2 font-display text-4xl text-espresso-900 sm:text-5xl">
              {firstName}
            </h2>
            <p className="mt-2 text-sm text-espresso-500">{user.email}</p>
          </div>
          <ButtonLink href="/reserver" className="self-start sm:self-auto">
            Prendre rendez-vous
          </ButtonLink>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-sand-200 pt-6 text-center sm:text-left">
          <div>
            <dt className="label text-espresso-500">Prochain</dt>
            <dd className="mt-2 font-display text-lg leading-snug text-espresso-900 sm:text-2xl">
              {next ? relativeDay(parisDate(next.start), today) : "—"}
            </dd>
          </div>
          <div>
            <dt className="label text-espresso-500">Visites</dt>
            <dd className="mt-2 font-display text-lg leading-snug text-espresso-900 tabular-nums sm:text-2xl">
              {visits.length}
            </dd>
          </div>
          <div>
            <dt className="label text-espresso-500">Dernière</dt>
            <dd className="mt-2 font-display text-lg leading-snug text-espresso-900 sm:text-2xl">
              {lastVisit
                ? new Intl.DateTimeFormat("fr-FR", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Europe/Paris",
                  }).format(lastVisit.start)
                : "—"}
            </dd>
          </div>
        </dl>

        <nav
          aria-label="Sections de mon espace"
          className="-mx-2 mt-8 flex gap-1 overflow-x-auto border-t border-sand-200 pt-4"
        >
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-pill px-3 text-sm whitespace-nowrap text-espresso-700 transition-colors hover:bg-sand-50 hover:text-espresso-900"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Appointments ------------------------------------------------------- */}
      <Section id="rendez-vous" title="Mes rendez-vous">
        {next ? (
          <div className="space-y-4">
            <NextAppointment
              appointment={next}
              today={today}
              now={now}
              cutoff={cutoff}
              address={addressLines(business.address).join(", ")}
              directions={mapsUrl(business.name, business.address)}
            />
            {later.length ? (
              <ul className="space-y-4">
                {later.map((a) => (
                  <li key={a.id}>
                    <AppointmentCard appointment={a}>
                      <UpcomingActions
                        appointment={a}
                        now={now}
                        cutoff={cutoff}
                      />
                    </AppointmentCard>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-espresso-500/30 p-8 text-center">
            <p className="text-espresso-700">
              Aucun rendez-vous prévu pour le moment.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/reserver">Prendre rendez-vous</ButtonLink>
              {lastVisit && canRebook(lastVisit) ? (
                <ButtonLink
                  href={`/reserver?prestation=${lastVisit.serviceSlug}`}
                  variant="outline"
                >
                  Refaire « {lastVisit.serviceName} »
                </ButtonLink>
              ) : null}
            </div>
          </div>
        )}

        {cancelledAhead.length > 0 ? (
          <section aria-labelledby="annules-titre" className="mt-10">
            <h3 id="annules-titre" className="label text-espresso-700">
              Annulés
            </h3>
            <div className="mt-2">
              <HistoryList items={cancelledAhead} canRebook={canRebook} />
            </div>
          </section>
        ) : null}

        {waitlist.length > 0 ? (
          <section aria-labelledby="attente-titre" className="mt-10">
            <h3 id="attente-titre" className="label text-espresso-700">
              Liste d’attente
            </h3>
            <ul className="mt-4 space-y-3">
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
          </section>
        ) : null}
      </Section>

      {/* History ------------------------------------------------------------ */}
      <Section id="historique" title="Historique">
        {past.length === 0 ? (
          <p className="text-sm text-espresso-500">
            Vos rendez-vous passés apparaîtront ici.
          </p>
        ) : (
          <>
            <HistoryList
              items={past.slice(0, HISTORY_SHOWN)}
              canRebook={canRebook}
            />
            {past.length > HISTORY_SHOWN ? (
              <details className="group mt-3">
                <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-espresso-700 underline underline-offset-4">
                  Voir tout l’historique ({past.length})
                </summary>
                <HistoryList
                  items={past.slice(HISTORY_SHOWN)}
                  canRebook={canRebook}
                />
              </details>
            ) : null}
          </>
        )}
      </Section>

      {/* Preferences -------------------------------------------------------- */}
      <Section
        id="preferences"
        title="Mes préférences"
        intro="Alessia les relit avant chaque rendez-vous, pour un résultat qui vous ressemble."
      >
        <div className="max-w-xl">
          <PreferencesForm initial={client.preferences ?? ""} />
        </div>
      </Section>

      {/* Profile & security ------------------------------------------------- */}
      <Section id="informations" title="Mes informations">
        <div className="grid gap-12 md:grid-cols-2">
          <ProfileForm
            email={user.email}
            fullName={client.fullName}
            phone={client.phone ?? ""}
            needsPrivacy={false}
          />
          <div>
            <h3 className="label text-espresso-700">Mot de passe</h3>
            <div className="mt-4">
              <PasswordForm hasPassword={user.hasPassword} />
            </div>
          </div>
        </div>
      </Section>

      {/* Data --------------------------------------------------------------- */}
      <Section
        id="donnees"
        title="Mes données"
        intro="Conformément au RGPD, vous pouvez télécharger vos données ou supprimer votre compte à tout moment."
      >
        <div className="flex flex-col items-start gap-4">
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

      <div className="border-t border-sand-200 pt-6">
        <SignOutButton />
      </div>
    </div>
  );
}

function UpcomingActions({
  appointment: a,
  now,
  cutoff,
  dark = false,
}: {
  appointment: AppointmentView;
  now: Date;
  cutoff: number;
  dark?: boolean;
}) {
  const cancellable = canClientCancel(a.start, now, cutoff);
  const deadline = cancellationDeadline(a.start, cutoff);
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <a
          href={icsPath(a)}
          className={buttonClasses(dark ? "light" : "outline")}
          download
        >
          Ajouter au calendrier
        </a>
        {cancellable ? (
          <CancelAppointment
            appointmentId={a.id}
            tone={dark ? "dark" : "light"}
          />
        ) : null}
      </div>
      <p
        className={`mt-4 text-sm ${dark ? "text-sand-100/80" : "text-espresso-500"}`}
      >
        {cancellable
          ? `Annulation possible jusqu’au ${formatDayLong(parisDate(deadline))} à ${parisTime(deadline)}.`
          : `Moins de ${cutoff} h avant le rendez-vous : pour tout changement, contactez Alessia directement.`}
      </p>
    </>
  );
}

/** The next appointment, given pride of place. */
function NextAppointment({
  appointment: a,
  today,
  now,
  cutoff,
  address,
  directions,
}: {
  appointment: AppointmentView;
  today: string;
  now: Date;
  cutoff: number;
  address: string;
  directions: string;
}) {
  const day = parisDate(a.start);
  return (
    <article
      aria-label="Prochain rendez-vous"
      className="surface-dark relative overflow-hidden rounded-card bg-espresso-950 p-6 text-sand-100 shadow-card sm:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-rose-950/60 blur-3xl"
      />
      <div className="relative">
        <p className="flex flex-wrap items-center gap-3">
          <span className="label text-caramel-300">Prochain rendez-vous</span>
          <span className="rounded-pill border border-caramel-300/50 px-3 py-1 text-xs tracking-[0.12em] text-caramel-300 uppercase">
            {relativeDay(day, today)}
          </span>
        </p>
        <h3 className="mt-5 font-display text-3xl leading-tight text-ivory sm:text-5xl">
          {formatDayLong(day, { capitalize: true })}
          <span className="block text-caramel-300">{parisTime(a.start)}</span>
        </h3>
        <p className="mt-4 text-lg text-ivory">
          {a.serviceName}
          {a.variantName ? ` · ${a.variantName}` : ""}
        </p>
        <p className="mt-1 text-sm text-sand-100/80">
          {formatDuration(a.durationMin)}
        </p>
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <PinIcon width={16} height={16} className="text-caramel-300" />
            {address}
          </span>
          <a
            href={directions}
            rel="noopener"
            className="inline-flex min-h-11 items-center link-underline text-ivory"
          >
            Itinéraire
          </a>
        </p>
        <div className="mt-6 border-t border-ivory/10 pt-6">
          <UpcomingActions appointment={a} now={now} cutoff={cutoff} dark />
        </div>
      </div>
    </article>
  );
}

function HistoryList({
  items,
  canRebook,
}: {
  items: AppointmentView[];
  canRebook: (a: AppointmentView) => boolean;
}) {
  return (
    <ul className="divide-y divide-sand-200 border-y border-sand-200">
      {items.map((a) => (
        <li
          key={a.id}
          className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-sm text-espresso-500">
              {formatDayLong(parisDate(a.start), {
                withYear: true,
                capitalize: true,
              })}
              {a.status === "cancelled"
                ? " · annulé"
                : a.status === "no_show"
                  ? " · absence"
                  : ""}
            </p>
            <p className="mt-1 font-display text-xl text-espresso-900">
              {a.serviceName}
              {a.variantName ? (
                <span className="text-espresso-500"> · {a.variantName}</span>
              ) : null}
            </p>
          </div>
          {canRebook(a) ? <RebookLink slug={a.serviceSlug!} /> : null}
        </li>
      ))}
    </ul>
  );
}
