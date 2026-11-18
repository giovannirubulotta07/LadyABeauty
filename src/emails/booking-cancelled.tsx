import {
  AppointmentDetails,
  EmailLayout,
  Paragraph,
  PrimaryButton,
  Title,
} from "./components";
import type { AppointmentEmailData, EmailBrand } from "./theme";

export type BookingCancelledProps = {
  brand: EmailBrand;
  appt: AppointmentEmailData;
  by: "client" | "studio";
  reason?: string | null;
  rebookUrl: string;
};

export function bookingCancelledSubject(p: BookingCancelledProps) {
  return `Rendez-vous annulé : ${p.appt.dateLabel}`;
}

export default function BookingCancelledEmail({
  brand,
  appt,
  by,
  reason,
  rebookUrl,
}: BookingCancelledProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`Votre rendez-vous du ${appt.dateLabel} est annulé`}
    >
      <Title>Rendez-vous annulé</Title>
      <Paragraph>
        {by === "client"
          ? `Bonjour ${appt.firstName}, votre annulation est bien prise en compte.`
          : `Bonjour ${appt.firstName}, je suis désolée : je dois annuler votre rendez-vous.`}
      </Paragraph>
      {reason && by === "studio" ? (
        <Paragraph muted>« {reason} »</Paragraph>
      ) : null}
      <AppointmentDetails appt={appt} struck />
      <Paragraph>Je serai ravie de vous recevoir à une autre date.</Paragraph>
      <PrimaryButton href={rebookUrl}>Reprendre rendez-vous</PrimaryButton>
    </EmailLayout>
  );
}
