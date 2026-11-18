import { Link, Text } from "@react-email/components";
import { EmailLayout, Paragraph, PrimaryButton, Title } from "./components";
import { type EmailBrand, colors } from "./theme";

/** For Alessia: a new booking or a cancellation. Short, scannable on a phone. */
export type OwnerNotificationProps = {
  brand: EmailBrand;
  kind: "new_booking" | "cancellation";
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  serviceLabel: string;
  dateLabel: string;
  timeLabel: string;
  note?: string | null;
  cancelledBy?: "client" | "studio";
  adminUrl: string;
};

export function ownerNotificationSubject(p: OwnerNotificationProps) {
  const prefix =
    p.kind === "new_booking" ? "Nouveau rendez-vous" : "Annulation";
  return `${prefix} · ${p.dateLabel} ${p.timeLabel.split(" ")[0]} · ${p.clientName}`;
}

export default function OwnerNotificationEmail(p: OwnerNotificationProps) {
  const isNew = p.kind === "new_booking";
  return (
    <EmailLayout brand={p.brand} preview={ownerNotificationSubject(p)}>
      <Title>{isNew ? "Nouveau rendez-vous" : "Rendez-vous annulé"}</Title>
      <Text
        style={{
          fontSize: 11,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: colors.caramel,
          margin: "0 0 4px",
        }}
      >
        {p.dateLabel}
      </Text>
      <Text
        style={{
          fontSize: 20,
          lineHeight: "28px",
          color: colors.espresso,
          margin: "0 0 16px",
        }}
      >
        {p.timeLabel} · {p.serviceLabel}
      </Text>
      <Paragraph>
        <strong>{p.clientName}</strong>
        {p.clientPhone ? (
          <>
            <br />
            <Link
              href={`tel:${p.clientPhone.replace(/\s/g, "")}`}
              style={{ color: colors.caramel }}
            >
              {p.clientPhone}
            </Link>
          </>
        ) : null}
        {p.clientEmail ? (
          <>
            <br />
            <Link
              href={`mailto:${p.clientEmail}`}
              style={{ color: colors.caramel }}
            >
              {p.clientEmail}
            </Link>
          </>
        ) : null}
      </Paragraph>
      {p.note ? (
        <Paragraph muted>Message de la cliente : « {p.note} »</Paragraph>
      ) : null}
      {!isNew ? (
        <Paragraph muted>
          {p.cancelledBy === "studio"
            ? "Annulé depuis l’administration."
            : "Annulé par la cliente. Le créneau est de nouveau libre."}
        </Paragraph>
      ) : null}
      <PrimaryButton href={p.adminUrl}>Ouvrir l’agenda</PrimaryButton>
    </EmailLayout>
  );
}
