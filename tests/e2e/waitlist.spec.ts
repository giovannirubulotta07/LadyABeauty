import { expect, test } from "@playwright/test";
import {
  fillDetailsAndCode,
  pickFirstSlot,
  signInDuringBooking,
  uniqueEmail,
  waitForEmail,
} from "./helpers";

test.describe("Liste d'attente", () => {
  test.skip(({ isMobile }) => !isMobile, "Testé sur mobile");

  test("une annulation prévient l'inscrite, qui réserve la place en un clic depuis l'e-mail", async ({
    browser,
    baseURL,
  }) => {
    const device = {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      locale: "fr-FR",
      baseURL,
    };
    const alice = await browser.newPage(device);
    const bea = await browser.newPage(device);
    const beaEmail = uniqueEmail("bea-attente");

    // 1. Alice books a slot a few days ahead.
    const { url } = await pickFirstSlot(alice, "rehaussement-cils", {
      availableDayIndex: 2,
    });
    const day = new URL(url).searchParams.get("jour")!;
    await signInDuringBooking(
      alice,
      uniqueEmail("alice-attente"),
      "Cliente Test Alice",
    );
    await alice
      .getByRole("button", { name: "Confirmer le rendez-vous" })
      .click();
    await expect(alice).toHaveURL(/\/reserver\/confirmation/);

    // 2. Béa wants that day, but none of the remaining times suit her: she joins the waitlist.
    await bea.goto(`/reserver?prestation=rehaussement-cils&jour=${day}`);
    await bea
      .getByRole("button", { name: /Être prévenue si une place se libère/ })
      .click();
    await expect(
      bea.getByRole("heading", { name: "Liste d’attente" }),
    ).toBeVisible();
    await fillDetailsAndCode(bea, beaEmail, "Cliente Test Béa");
    await expect(
      bea.getByRole("heading", { name: "C’est noté !" }),
    ).toBeVisible({ timeout: 20_000 });

    // She sees her registration in "Mon espace".
    await bea.getByRole("link", { name: "Mes inscriptions" }).click();
    await expect(
      bea.getByRole("region", { name: "Liste d’attente" }),
    ).toContainText("Rehaussement de cils");

    // 3. Alice cancels → the freed slot is offered to Béa by e-mail.
    const since = Date.now() - 1_000;
    await alice.goto("/mon-espace");
    const upcoming = alice.getByRole("region", { name: "À venir" });
    await upcoming
      .getByRole("button", { name: "Annuler ce rendez-vous" })
      .click();
    await upcoming.getByRole("button", { name: "Oui, annuler" }).click();
    await expect(
      upcoming.getByText("Aucun rendez-vous prévu pour le moment."),
    ).toBeVisible();

    const offer = await waitForEmail(
      beaEmail,
      /^Une place s’est libérée/,
      since,
    );
    expect(offer.text).toContain("Rehaussement de cils");
    expect(offer.text).toMatch(
      /réservé jusqu’à \d{2}:\d{2}|Plusieurs personnes sont prévenues/,
    );
    const link = /\/liste-attente\/[A-Za-z0-9_-]+/.exec(offer.text)?.[0];
    expect(link).toBeTruthy();

    // 4. One tap from the e-mail books it, no login needed.
    await bea.context().clearCookies();
    await bea.goto(link!);
    await expect(bea.getByRole("heading", { level: 1 })).toContainText(
      "Une place s’est libérée",
    );
    await bea.getByRole("button", { name: "Réserver ce créneau" }).click();
    await expect(bea.getByRole("heading", { level: 1 })).toHaveText(
      "C’est réservé !",
    );
    await expect(
      bea.getByRole("link", { name: "Ajouter à mon calendrier" }),
    ).toBeVisible();
    await waitForEmail(beaEmail, /^Rendez-vous confirmé/, since);

    // The link cannot be used twice.
    await bea.reload();
    await expect(bea.getByRole("heading", { level: 1 })).toHaveText(
      "C’est réservé !",
    );
    await expect(
      bea.getByRole("button", { name: "Réserver ce créneau" }),
    ).toHaveCount(0);

    await alice.close();
    await bea.close();
  });
});
