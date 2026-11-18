import {
  AppointmentDetails,
  EmailLayout,
  Paragraph,
  PrimaryButton,
  Title,
} from "./components";
import type { AppointmentEmailData, EmailBrand } from "./theme";

export type WaitlistOfferProps = {
  brand: EmailBrand;
  appt: AppointmentEmailData;
  /** "10:45" when the slot is held for her; null when offered to everyone. */
  exclusiveUntil: string | null;
  bookUrl: string;
};

export function waitlistOfferSubject(p: WaitlistOfferProps) {
  return `Une place s’est libérée : ${p.appt.dateLabel} à ${p.appt.timeLabel.split(" ")[0]}`;
}

export default function WaitlistOfferEmail({
  brand,
  appt,
  exclusiveUntil,
  bookUrl,
}: WaitlistOfferProps) {
  return (
    <EmailLayout
      brand={brand}
      preview={`${appt.serviceName} : une place s’est libérée`}
    >
      <Title>Une place s’est libérée{" !"}</Title>
      <Paragraph>
        Bonjour {appt.firstName}, vous êtes sur la liste d’attente pour le{" "}
        {appt.dateLabel.toLowerCase()} : ce créneau est disponible.
      </Paragraph>
      <AppointmentDetails appt={appt} />
      <Paragraph>
        {exclusiveUntil ? (
          <>
            Il vous est réservé <strong>jusqu’à {exclusiveUntil}</strong>. Passé
            ce délai, il sera proposé à la personne suivante.
          </>
        ) : (
          <>
            Plusieurs personnes sont prévenues en même temps : la première à
            confirmer obtient le rendez-vous.
          </>
        )}
      </Paragraph>
      <PrimaryButton href={bookUrl}>Réserver ce créneau</PrimaryButton>
      <Paragraph muted>
        Ce créneau ne vous convient pas ? Le même lien vous permet de laisser
        votre place.
      </Paragraph>
    </EmailLayout>
  );
}
