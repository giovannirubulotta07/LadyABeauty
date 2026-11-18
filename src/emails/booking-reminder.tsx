import {
  AppointmentDetails,
  EmailLayout,
  Paragraph,
  PrimaryButton,
  SmallLinks,
  Title,
} from "./components";
import type { AppointmentEmailData, EmailBrand } from "./theme";

export type BookingReminderProps = {
  brand: EmailBrand;
  appt: AppointmentEmailData;
};

export function bookingReminderSubject(p: BookingReminderProps) {
  return `À demain ! Rendez-vous à ${p.appt.timeLabel.split(" ")[0]} chez ${p.brand.name}`;
}

export default function BookingReminderEmail({
  brand,
  appt,
}: BookingReminderProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Petit rappel : ${appt.serviceName} demain à ${appt.timeLabel.split(" ")[0]}`}
    >
      <Title>
        À demain, {appt.firstName}
        {"\u00a0!"}
      </Title>
      <Paragraph>Petit rappel de votre rendez-vous :</Paragraph>
      <AppointmentDetails appt={appt} />
      <Paragraph muted>
        Pour une pose de cils, venez si possible sans maquillage sur les yeux.
        En cas de retard ou d’empêchement, merci de me prévenir au plus vite.
      </Paragraph>
      {appt.manageUrl ? (
        <PrimaryButton href={appt.manageUrl}>
          Voir mon rendez-vous
        </PrimaryButton>
      ) : null}
      <SmallLinks
        links={
          appt.icsUrl
            ? [{ href: appt.icsUrl, label: "Ajouter à mon calendrier" }]
            : []
        }
      />
    </EmailLayout>
  );
}
