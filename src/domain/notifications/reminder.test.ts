import { describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import { isReminderDue, reminderDueAt } from "./reminder";

const start = parisInstant("2026-11-24", "10:00"); // Tuesday 10:00
const bookedLongAgo = parisInstant("2026-11-10", "18:00");

describe("rappel de la veille", () => {
  it("est dû la veille à 9:00 heure de Paris", () => {
    expect(reminderDueAt(start, "09:00").toISOString()).toBe(
      parisInstant("2026-11-23", "09:00").toISOString(),
    );
  });

  it("n'est pas envoyé avant 9:00 la veille", () => {
    expect(
      isReminderDue(
        { start, createdAt: bookedLongAgo },
        parisInstant("2026-11-23", "08:59"),
        "09:00",
      ),
    ).toBe(false);
  });

  it("est envoyé à partir de 9:00 la veille (cron toutes les 5 min)", () => {
    expect(
      isReminderDue(
        { start, createdAt: bookedLongAgo },
        parisInstant("2026-11-23", "09:00"),
        "09:00",
      ),
    ).toBe(true);
    expect(
      isReminderDue(
        { start, createdAt: bookedLongAgo },
        parisInstant("2026-11-23", "21:40"),
        "09:00",
      ),
    ).toBe(true);
  });

  it("n'est plus envoyé une fois le rendez-vous commencé", () => {
    expect(
      isReminderDue(
        { start, createdAt: bookedLongAgo },
        parisInstant("2026-11-24", "10:00"),
        "09:00",
      ),
    ).toBe(false);
  });

  it("n'est pas envoyé pour une réservation faite après l'heure du rappel", () => {
    const lateBooking = parisInstant("2026-11-23", "20:00");
    expect(
      isReminderDue(
        { start, createdAt: lateBooking },
        parisInstant("2026-11-23", "20:05"),
        "09:00",
      ),
    ).toBe(false);
  });

  it("le lundi pour un rendez-vous du mardi, le samedi pour un lundi", () => {
    const monday = parisInstant("2026-11-30", "14:30");
    expect(reminderDueAt(monday, "09:00").toISOString()).toBe(
      parisInstant("2026-11-29", "09:00").toISOString(),
    );
  });

  it("reste à 9:00 heure locale de part et d'autre du changement d'heure", () => {
    // Monday 30/03/2026 (summer time) → due Sunday 29/03 09:00 CEST = 07:00 UTC
    expect(
      reminderDueAt(parisInstant("2026-03-30", "10:00"), "09:00").toISOString(),
    ).toBe("2026-03-29T07:00:00.000Z");
    // Monday 26/10/2026 (winter time) → due Sunday 25/10 09:00 CET = 08:00 UTC
    expect(
      reminderDueAt(parisInstant("2026-10-26", "10:00"), "09:00").toISOString(),
    ).toBe("2026-10-25T08:00:00.000Z");
  });
});
