import { describe, expect, it } from "vitest";
import BookingCancelledEmail, {
  bookingCancelledSubject,
} from "./booking-cancelled";
import BookingConfirmedEmail, {
  bookingConfirmedSubject,
} from "./booking-confirmed";
import BookingReminderEmail, {
  bookingReminderSubject,
} from "./booking-reminder";
import BookingMovedEmail, { bookingMovedSubject } from "./booking-moved";
import OwnerNotificationEmail, {
  ownerNotificationSubject,
} from "./owner-notification";
import { renderEmail } from "./render";
import type { AppointmentEmailData, EmailBrand } from "./theme";

const brand: EmailBrand = {
  name: "Lady A Beauty",
  siteUrl: "https://example.test",
  instagramUrl: "https://www.instagram.com/lady.a_beauty/",
  addressLine: "Avenue de Verdun, 74100 Annemasse",
};
const appt: AppointmentEmailData = {
  firstName: "Camille",
  serviceName: "Extension cils",
  variantName: "Volume russe",
  dateLabel: "Mardi 24 novembre 2026",
  timeLabel: "10:00 – 11:45",
  durationLabel: "1 h 45",
  priceLabel: "Acompte 20 €",
  address: "Avenue de Verdun, 74100 Annemasse",
  mapsUrl: "https://maps.example/x",
  manageUrl: "https://example.test/rdv/TOKEN",
  icsUrl: "https://example.test/api/ics/TOKEN",
};

describe("templates e-mail", () => {
  it("confirmation : toutes les informations et les liens", async () => {
    const { html, text } = await renderEmail(
      <BookingConfirmedEmail
        brand={brand}
        appt={appt}
        cancellationCutoffHours={24}
      />,
    );
    for (const expected of [
      "Camille",
      "Extension cils",
      "Volume russe",
      "Mardi 24 novembre 2026",
      "10:00 – 11:45",
      "1 h 45",
      "Avenue de Verdun",
    ]) {
      expect(text).toContain(expected);
    }
    expect(html).toContain("https://example.test/rdv/TOKEN");
    expect(html).toContain("https://example.test/api/ics/TOKEN");
    expect(html).toContain('lang="fr"');
    expect(text).toContain("24 h avant");
    expect(
      bookingConfirmedSubject({ brand, appt, cancellationCutoffHours: 24 }),
    ).toBe("Rendez-vous confirmé : Mardi 24 novembre 2026 à 10:00");
  });

  it("rappel, annulation et notifications d'Alessia", async () => {
    const reminder = await renderEmail(
      <BookingReminderEmail brand={brand} appt={appt} />,
    );
    expect(reminder.text).toContain("À demain, Camille");
    expect(bookingReminderSubject({ brand, appt })).toBe(
      "À demain ! Rendez-vous à 10:00 chez Lady A Beauty",
    );

    const cancelled = await renderEmail(
      <BookingCancelledEmail
        brand={brand}
        appt={appt}
        by="studio"
        reason="Imprévu"
        rebookUrl="https://example.test/reserver"
      />,
    );
    expect(cancelled.text).toContain("je dois annuler");
    expect(cancelled.text).toContain("Imprévu");
    expect(
      bookingCancelledSubject({ brand, appt, by: "client", rebookUrl: "" }),
    ).toBe("Rendez-vous annulé : Mardi 24 novembre 2026");

    const owner = {
      brand,
      kind: "new_booking" as const,
      clientName: "Camille Exemple",
      clientPhone: "+33 6 00 00 00 00",
      clientEmail: "camille@example.test",
      serviceLabel: "Extension cils",
      dateLabel: "Mardi 24 novembre",
      timeLabel: "10:00 – 11:45",
      adminUrl: "https://example.test/admin",
    };
    const ownerMail = await renderEmail(
      <OwnerNotificationEmail {...owner} note="Cils sensibles" />,
    );
    expect(ownerMail.html).toContain("tel:+33600000000");
    expect(ownerMail.text).toContain("Cils sensibles");
    expect(ownerNotificationSubject(owner)).toBe(
      "Nouveau rendez-vous · Mardi 24 novembre 10:00 · Camille Exemple",
    );
  });

  it("déplacement : ancien et nouvel horaire, liens", async () => {
    const props = {
      brand,
      appt,
      previousLabel: "lundi 23 novembre à 14:30",
      cancellationCutoffHours: 24,
    };
    const { html, text } = await renderEmail(<BookingMovedEmail {...props} />);
    expect(text).toContain("lundi 23 novembre à 14:30");
    expect(text).toContain("Mardi 24 novembre 2026");
    expect(html).toContain("https://example.test/rdv/TOKEN");
    expect(bookingMovedSubject(props)).toBe(
      "Rendez-vous déplacé : Mardi 24 novembre 2026 à 10:00",
    );
  });

  it("n'affiche jamais « undefined » ni « null »", async () => {
    const minimal = {
      ...appt,
      variantName: null,
      priceLabel: null,
      manageUrl: undefined,
      icsUrl: undefined,
    };
    for (const element of [
      <BookingConfirmedEmail
        key="c"
        brand={brand}
        appt={minimal}
        cancellationCutoffHours={24}
      />,
      <BookingReminderEmail
        key="r"
        brand={{ ...brand, instagramUrl: null }}
        appt={minimal}
      />,
    ]) {
      const { html, text } = await renderEmail(element);
      expect(`${html}${text}`).not.toMatch(/undefined|null/);
    }
  });
});
