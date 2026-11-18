/**
 * Renders every e-mail template with sample data into .email-preview/*.html.
 * Usage: npx tsx scripts/email-preview.tsx
 */
import { mkdirSync, writeFileSync } from "node:fs";
import BookingCancelledEmail from "../src/emails/booking-cancelled";
import BookingConfirmedEmail from "../src/emails/booking-confirmed";
import BookingReminderEmail from "../src/emails/booking-reminder";
import OwnerNotificationEmail from "../src/emails/owner-notification";
import { renderEmail } from "../src/emails/render";
import type { AppointmentEmailData, EmailBrand } from "../src/emails/theme";

const brand: EmailBrand = {
  name: "Lady A Beauty",
  siteUrl: process.env.PREVIEW_SITE_URL ?? "http://127.0.0.1:3000",
  instagramUrl: "https://www.instagram.com/lady.a_beauty/",
  addressLine: "49 avenue de Verdun, 74100 Annemasse",
};

const appt: AppointmentEmailData = {
  firstName: "Camille",
  serviceName: "Extension cils",
  dateLabel: "Mardi 24 novembre 2026",
  timeLabel: "10:00 – 11:45",
  durationLabel: "1 h 45",
  priceLabel: "Acompte 20 €",
  address: "49 avenue de Verdun, 74100 Annemasse",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Lady%20A%20Beauty",
  manageUrl: `${brand.siteUrl}/rdv/exemple`,
  icsUrl: `${brand.siteUrl}/api/ics/exemple`,
};

const owner = {
  brand,
  clientName: "Camille Exemple",
  clientEmail: "camille@example.test",
  clientPhone: "+33 6 00 00 00 00",
  serviceLabel: "Extension cils",
  dateLabel: appt.dateLabel,
  timeLabel: appt.timeLabel,
  adminUrl: `${brand.siteUrl}/admin`,
};

async function main() {
  mkdirSync(".email-preview", { recursive: true });
  const templates = {
    "1-confirmation": (
      <BookingConfirmedEmail
        brand={brand}
        appt={appt}
        cancellationCutoffHours={24}
      />
    ),
    "2-rappel": <BookingReminderEmail brand={brand} appt={appt} />,
    "3-annulation-cliente": (
      <BookingCancelledEmail
        brand={brand}
        appt={appt}
        by="client"
        rebookUrl={`${brand.siteUrl}/reserver`}
      />
    ),
    "4-alessia-nouveau": (
      <OwnerNotificationEmail
        {...owner}
        kind="new_booking"
        note="Première pose, cils sensibles."
      />
    ),
    "5-alessia-annulation": (
      <OwnerNotificationEmail
        {...owner}
        kind="cancellation"
        cancelledBy="client"
      />
    ),
  };
  for (const [name, element] of Object.entries(templates)) {
    const { html, text } = await renderEmail(element);
    writeFileSync(`.email-preview/${name}.html`, html);
    writeFileSync(`.email-preview/${name}.txt`, text);
    console.log(
      `.email-preview/${name}.html (${(html.length / 1024).toFixed(1)} KB)`,
    );
  }
}

void main();
