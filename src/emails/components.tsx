import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import {
  type AppointmentEmailData,
  type EmailBrand,
  colors,
  fonts,
} from "./theme";

export function EmailLayout({
  brand,
  preview,
  children,
}: {
  brand: EmailBrand;
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html lang="fr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "24px 12px",
          backgroundColor: colors.sand,
          fontFamily: fonts.body,
          color: colors.ink,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            width: "100%",
            backgroundColor: colors.ivory,
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              backgroundColor: colors.espresso,
              padding: "28px 32px",
              textAlign: "center",
            }}
          >
            <Link
              href={brand.siteUrl}
              style={{
                fontFamily: fonts.display,
                fontSize: 28,
                color: colors.ivory,
                textDecoration: "none",
              }}
            >
              {brand.name}
            </Link>
          </Section>
          <Section
            style={{
              height: 3,
              backgroundColor: colors.caramelLight,
              lineHeight: "3px",
            }}
          >
            &nbsp;
          </Section>
          <Section style={{ padding: "32px 32px 8px" }}>{children}</Section>
          <Section style={{ padding: "8px 32px 32px" }}>
            <Hr style={{ borderColor: colors.sandLine, margin: "16px 0" }} />
            <Text
              style={{
                fontSize: 12,
                lineHeight: "18px",
                color: colors.espressoMuted,
                margin: 0,
              }}
            >
              {brand.name} · {brand.addressLine}
              {brand.instagramUrl ? (
                <>
                  {" · "}
                  <Link
                    href={brand.instagramUrl}
                    style={{ color: colors.caramel }}
                  >
                    Instagram
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: fonts.display,
        fontSize: 30,
        lineHeight: "36px",
        color: colors.espresso,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function Paragraph({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: 15,
        lineHeight: "24px",
        color: muted ? colors.espressoMuted : colors.ink,
        margin: "0 0 16px",
      }}
    >
      {children}
    </Text>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: colors.espresso,
        color: colors.ivory,
        fontSize: 13,
        letterSpacing: "2px",
        textTransform: "uppercase",
        padding: "14px 24px",
        borderRadius: 4,
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr>
      <td
        style={{
          padding: "8px 12px 8px 0",
          fontSize: 13,
          color: colors.espressoMuted,
          verticalAlign: "top",
          width: 110,
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "8px 0",
          fontSize: 15,
          color: colors.ink,
          verticalAlign: "top",
        }}
      >
        {children}
      </td>
    </tr>
  );
}

/** The appointment card shared by confirmation, reminder and cancellation e-mails. */
export function AppointmentDetails({
  appt,
  struck = false,
}: {
  appt: AppointmentEmailData;
  struck?: boolean;
}) {
  const deco = struck ? { textDecoration: "line-through" } : {};
  return (
    <Section
      style={{
        border: `1px solid ${colors.sandLine}`,
        borderRadius: 8,
        padding: "16px 20px",
        margin: "8px 0 24px",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: colors.caramel,
          margin: "0 0 4px",
        }}
      >
        {appt.dateLabel}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 24,
          lineHeight: "30px",
          color: colors.espresso,
          margin: "0 0 8px",
          ...deco,
        }}
      >
        {appt.timeLabel} · {appt.serviceName}
      </Text>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <tbody>
          {appt.variantName ? (
            <Row label="Style">{appt.variantName}</Row>
          ) : null}
          <Row label="Durée">{appt.durationLabel}</Row>
          {appt.priceLabel ? <Row label="Tarif">{appt.priceLabel}</Row> : null}
          <Row label="Adresse">
            {appt.address}
            <br />
            <Link
              href={appt.mapsUrl}
              style={{ color: colors.caramel, fontSize: 13 }}
            >
              Voir le plan
            </Link>
          </Row>
        </tbody>
      </table>
    </Section>
  );
}

export function SmallLinks({
  links,
}: {
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <Text style={{ fontSize: 13, lineHeight: "22px", margin: "16px 0" }}>
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 ? " · " : null}
          <Link href={l.href} style={{ color: colors.caramel }}>
            {l.label}
          </Link>
        </span>
      ))}
    </Text>
  );
}
