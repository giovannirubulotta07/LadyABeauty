import { expect, test } from "@playwright/test";
import {
  pickFirstSlot,
  signInDuringBooking,
  uniqueEmail,
  waitForEmail,
} from "./helpers";

const OWNER = "alessiarubu98@gmail.com"; // seed: studio_private_settings.notification_email

test.describe("E-mails", () => {
  test.skip(({ isMobile }) => !isMobile, "Testé sur mobile");

  test("confirmation → lien « Gérer mon rendez-vous » → annulation, avec les e-mails à la cliente et à Alessia", async ({
    page,
    baseURL,
  }) => {
    const email = uniqueEmail("emails");
    const since = Date.now() - 1_000;
    await pickFirstSlot(page, "teinture-sourcils", { availableDayIndex: 3 });
    await signInDuringBooking(page, email, "Cliente Test Emails");
    await page
      .getByRole("button", { name: "Confirmer le rendez-vous" })
      .click();
    await expect(page).toHaveURL(/\/reserver\/confirmation/);

    const confirmation = await waitForEmail(
      email,
      /^Rendez-vous confirmé/,
      since,
    );
    expect(confirmation.text).toContain("Teinture sourcils");
    expect(confirmation.text).toContain("Avenue de Verdun");
    const owner = await waitForEmail(
      OWNER,
      /^Nouveau rendez-vous .* Cliente Test Emails$/,
      since,
    );
    expect(owner.text).toContain("0600000042"); // her phone, normalised, to call her back

    // The manage link works without being signed in.
    const manage = /\/rdv\/[^\s)]+/.exec(confirmation.text)?.[0];
    expect(manage).toBeTruthy();
    await page.context().clearCookies();
    await page.goto(`${baseURL}${manage}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "À bientôt !",
    );
    await page.getByRole("button", { name: "Annuler ce rendez-vous" }).click();
    await page.getByRole("button", { name: "Oui, annuler" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Rendez-vous annulé",
    );

    const cancelled = await waitForEmail(email, /^Rendez-vous annulé/, since);
    expect(cancelled.text).toContain("Reprendre rendez-vous");
    await waitForEmail(OWNER, /^Annulation .* Cliente Test Emails$/, since);

    // A tampered link is refused.
    await page.goto(`${baseURL}${manage}x`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Lien expiré",
    );
  });

  test("la tâche planifiée refuse les appels sans secret", async ({
    request,
  }) => {
    expect((await request.post("/api/cron/taches")).status()).toBe(401);
    expect(
      (
        await request.get("/api/cron/taches", {
          headers: { Authorization: "Bearer faux" },
        })
      ).status(),
    ).toBe(401);
  });
});
