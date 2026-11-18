import {
  AppointmentDetails,
  EmailLayout,
  Paragraph,
  PrimaryButton,
  SmallLinks,
  Title,
} from "./components";
import type { AppointmentEmailData, EmailBrand } from "./theme";

export type BookingMovedProps = {
  brand: EmailBrand;
  appt: AppointmentEmailData;
  /** "Mardi 24 novembre à 10:00": the previous date, for reference. */
  previousLabel: string;
  cancellationCutoffHours: number;
};

export function bookingMovedSubject(p: BookingMovedProps) {
  return `Rendez-vous déplacé : ${p.appt.dateLabel} à ${p.appt.timeLabel.split(" ")[0]}`;
}

export default function BookingMovedEmail({
  brand,
  appt,
  previousLabel,
  cancellationCutoffHours,
}: BookingMovedProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Nouvel horaire : ${appt.dateLabel} à ${appt.timeLabel.split(" ")[0]}`}
    >
      <Title>Votre rendez-vous a été déplacé</Title>
      <Paragraph>
        Bonjour {appt.firstName}, comme convenu, votre rendez-vous initialement
        prévu le {previousLabel} a été déplacé. Voici le nouvel horaire :
      </Paragraph>
      <AppointmentDetails appt={appt} />
      {appt.manageUrl ? (
        <PrimaryButton href={appt.manageUrl}>
          Gérer mon rendez-vous
        </PrimaryButton>
      ) : null}
      <SmallLinks
        links={[
          ...(appt.icsUrl
            ? [{ href: appt.icsUrl, label: "Ajouter à mon calendrier" }]
            : []),
          { href: `${brand.siteUrl}/mon-espace`, label: "Mon espace" },
        ]}
      />
      <Paragraph muted>
        Cet horaire ne vous convient pas ? Vous pouvez annuler en ligne jusqu’à{" "}
        {cancellationCutoffHours} h avant le rendez-vous, ou me répondre
        directement.
      </Paragraph>
    </EmailLayout>
  );
}
