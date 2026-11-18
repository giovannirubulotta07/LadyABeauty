import {
  AppointmentDetails,
  EmailLayout,
  Paragraph,
  PrimaryButton,
  SmallLinks,
  Title,
} from "./components";
import type { AppointmentEmailData, EmailBrand } from "./theme";

export type BookingConfirmedProps = {
  brand: EmailBrand;
  appt: AppointmentEmailData;
  cancellationCutoffHours: number;
};

export function bookingConfirmedSubject(p: BookingConfirmedProps) {
  return `Rendez-vous confirmé : ${p.appt.dateLabel} à ${p.appt.timeLabel.split(" ")[0]}`;
}

export default function BookingConfirmedEmail({
  brand,
  appt,
  cancellationCutoffHours,
}: BookingConfirmedProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`${appt.serviceName}, ${appt.dateLabel} à ${appt.timeLabel.split(" ")[0]}`}
    >
      <Title>
        C’est confirmé, {appt.firstName}
        {"\u00a0!"}
      </Title>
      <Paragraph>
        Votre rendez-vous est bien réservé. J’ai hâte de vous retrouver au
        studio.
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
        Un empêchement ? Vous pouvez annuler en ligne jusqu’à{" "}
        {cancellationCutoffHours} h avant le rendez-vous. Un rappel vous sera
        envoyé la veille.
      </Paragraph>
    </EmailLayout>
  );
}
