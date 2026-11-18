import { expect, test } from "@playwright/test";
import { pickFirstSlot, signInDuringBooking, uniqueEmail } from "./helpers";

test.describe("Réservation", () => {
  test.skip(
    ({ isMobile }) => !isMobile,
    "Parcours testé sur mobile, comme la majorité des clientes",
  );

  test("parcours complet : prestation → date → heure → code e-mail → confirmation → annulation", async ({
    page,
  }) => {
    const email = uniqueEmail("parcours");
    // Two available days ahead, so that self-service cancellation (> 24 h) is possible.
    const { time } = await pickFirstSlot(page, "rehaussement-cils", {
      availableDayIndex: 2,
    });
    await expect(
      page.getByRole("heading", { name: "Vos coordonnées" }),
    ).toBeVisible();

    await signInDuringBooking(page, email);
    const summary = page.locator("dl").filter({ hasText: "Prestation" });
    await expect(summary).toContainText(`${time} –`);
    await expect(summary).toContainText("Cliente Test E2E");
    await page
      .getByLabel("Un message pour Alessia ? (facultatif)")
      .fill("Première fois, cils sensibles.");
    await page
      .getByRole("button", { name: "Confirmer le rendez-vous" })
      .click();

    await expect(page).toHaveURL(/\/reserver\/confirmation\?rdv=/);
    await expect(
      page.getByRole("heading", { name: "À très bientôt !" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toContainText(
      `${time} · Rehaussement de cils`,
    );

    // "Ajouter à mon calendrier" serves a valid .ics through a signed link.
    const icsHref = await page
      .getByRole("link", { name: "Ajouter à mon calendrier" })
      .getAttribute("href");
    const ics = await page.request.get(icsHref!);
    expect(ics.status()).toBe(200);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    expect(await ics.text()).toContain(
      "SUMMARY:Rehaussement de cils · Lady A Beauty",
    );
    // A tampered token is refused.
    expect((await page.request.get(`${icsHref}x`)).status()).toBe(404);

    // Mon espace lists it and lets her cancel (more than 24 h ahead, or refuses politely).
    await page.getByRole("link", { name: "Mes rendez-vous" }).click();
    const upcoming = page.getByRole("region", { name: "Mes rendez-vous" });
    await expect(
      upcoming.getByRole("article", { name: "Prochain rendez-vous" }),
    ).toContainText("Rehaussement de cils");
    await expect(
      upcoming.getByRole("article", { name: "Prochain rendez-vous" }),
    ).toContainText(time);
    await upcoming
      .getByRole("button", { name: "Annuler ce rendez-vous" })
      .click();
    await upcoming.getByRole("button", { name: "Oui, annuler" }).click();
    await expect(
      upcoming.getByText("Aucun rendez-vous prévu pour le moment."),
    ).toBeVisible();
    const history = page.getByRole("region", { name: "Historique" });
    await expect(history).toContainText("annulé");

    // …and to book the same service again in one click.
    await expect(
      history.getByRole("link", { name: "Réserver à nouveau" }),
    ).toHaveAttribute("href", "/reserver?prestation=rehaussement-cils");

    // Her preferences are saved for Alessia.
    const prefs = page.getByRole("region", { name: "Mes préférences" });
    await prefs.getByLabel("Vos préférences").fill("Effet naturel, courbure C");
    await prefs.getByRole("button", { name: "Enregistrer" }).click();
    await expect(prefs.getByText("Alessia en tiendra compte")).toBeVisible();
    await page.reload();
    await expect(
      page
        .getByRole("region", { name: "Mes préférences" })
        .getByLabel("Vos préférences"),
    ).toHaveValue("Effet naturel, courbure C");

    // The header always leads back to her space.
    await page.goto("/");
    await page.getByRole("link", { name: "Mon espace" }).first().click();
    await expect(page).toHaveURL(/\/mon-espace$/);
    await expect(
      page.getByRole("region", { name: "Mes rendez-vous" }),
    ).toBeVisible();
  });

  test("conflit : deux clientes confirment le même créneau, la seconde est prévenue et voit les horaires à jour", async ({
    browser,
  }) => {
    const device = {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "fr-FR",
    };
    const alice = await browser.newPage(device);
    const bea = await browser.newPage(device);

    // Both reach the summary for the same slot.
    const a = await pickFirstSlot(alice, "browlift", { availableDayIndex: 1 });
    await signInDuringBooking(
      alice,
      uniqueEmail("alice"),
      "Cliente Test Alice",
    );
    await bea.goto(a.url);
    await signInDuringBooking(bea, uniqueEmail("bea"), "Cliente Test Béa");

    // Alice confirms first.
    await alice
      .getByRole("button", { name: "Confirmer le rendez-vous" })
      .click();
    await expect(alice).toHaveURL(/\/reserver\/confirmation/);

    // Béa confirms the same slot: kind message and refreshed times, without the taken one.
    await bea.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(
      bea.getByText("Ce créneau vient d'être réservé par quelqu'un d'autre"),
    ).toBeVisible();
    await expect(
      bea.getByRole("heading", { name: "Choisissez une date" }),
    ).toBeVisible();
    // The taken time is gone; either other times remain, or the day is now
    // full (or evening-only) and the next available date is offered.
    const available = bea.locator("section[aria-label] button:not([disabled])");
    await expect(
      available
        .or(
          bea.getByText(
            /Plus aucun créneau ce jour-là|seuls des créneaux en soirée/,
          ),
        )
        .first(),
    ).toBeVisible();
    await expect(
      available.filter({ hasText: new RegExp(`^${a.time}$`) }),
    ).toHaveCount(0);

    await alice.close();
    await bea.close();
  });
});

test.describe("Mon espace", () => {
  test.skip(({ isMobile }) => !isMobile, "Testé sur mobile");

  test("une cliente peut supprimer son compte (RGPD)", async ({ page }) => {
    const email = uniqueEmail("rgpd");
    await pickFirstSlot(page, "epilation-sourcils");
    await signInDuringBooking(page, email, "Cliente Test RGPD");
    await page
      .getByRole("button", { name: "Confirmer le rendez-vous" })
      .click();
    await expect(page).toHaveURL(/\/reserver\/confirmation/);

    await page.goto("/mon-espace");
    await page.getByRole("button", { name: "Supprimer mon compte" }).click();
    await page
      .getByLabel("Pour confirmer, saisissez SUPPRIMER")
      .fill("SUPPRIMER");
    await page
      .getByRole("button", { name: "Supprimer définitivement" })
      .click();
    await expect(page).toHaveURL(/\/compte-supprime$/);

    await page.goto("/mon-espace");
    await expect(
      page.getByRole("heading", { name: "Connexion" }),
    ).toBeVisible();
    expect((await page.request.get("/mon-espace/export")).status()).toBe(401);
  });
});
