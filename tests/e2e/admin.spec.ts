import { type Page, expect, test } from "@playwright/test";
import { adminLogin, uniqueEmail, waitForEmail } from "./helpers";

/** A weekday (Tuesday) about five weeks ahead: open, and rarely busy. */
function futureTuesday(weeksAhead = 5): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + weeksAhead * 7);
  while (d.getUTCDay() !== 2) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const chips = (page: Page) =>
  page.getByRole("group", { name: "Heure" }).getByRole("button");

test.describe("Administration — accès", () => {
  test("sans connexion, aucune donnée n'est affichée", async ({ page }) => {
    for (const path of [
      "/admin",
      "/admin/clientes",
      "/admin/reglages/studio",
    ]) {
      await page.goto(path);
      await expect(
        page.getByRole("heading", { level: 1, name: "Connexion" }),
      ).toBeVisible();
      await expect(page.getByText("Cliente Test")).toHaveCount(0);
    }
  });
});

test.describe("Administration — rendez-vous", () => {
  test.describe.configure({ mode: "serial" });

  test("créer pour une nouvelle cliente, déplacer puis annuler, avec e-mails", async ({
    page,
  }, testInfo) => {
    // Each project books on its own day so that runs never collide.
    const day = futureTuesday(testInfo.project.name === "mobile" ? 5 : 6);
    const name = `E2E Admin ${Date.now() % 1e6}`;
    const email = uniqueEmail("admin");
    page.on("dialog", (d) => d.accept());

    await adminLogin(page);
    await page.goto(`/admin/rdv/nouveau?jour=${day}`);

    // 1. New client
    await page.getByRole("searchbox", { name: "Cliente" }).fill(name);
    await page.getByRole("button", { name: /Nouvelle cliente/ }).click();
    await page.getByLabel("E-mail (facultatif)").fill(email);
    await page.getByLabel("Téléphone").fill("06 12 34 56 78");

    // 2. Service, 3. time: first free start
    await page
      .getByRole("combobox", { name: "Prestation", exact: true })
      .selectOption({ label: "Browlift" });
    await expect(chips(page).first()).toBeVisible({ timeout: 15_000 });
    const time = (await chips(page).first().textContent())!.trim();
    await chips(page).first().click();

    const since = Date.now();
    await page
      .getByRole("button", { name: "Enregistrer le rendez-vous" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/admin\\?jour=${day}`), {
      timeout: 15_000,
    });
    const row = page.locator(`a[href^="/admin/rdv/"]`, { hasText: name });
    await expect(row).toBeVisible();
    await expect(row).toContainText(time);
    await waitForEmail(email, /Rendez-vous confirmé/, since);

    // Move it to another free start of the same day
    await row.click();
    await expect(page.getByRole("heading", { name: "Déplacer" })).toBeVisible();
    await expect(chips(page).first()).toBeVisible({ timeout: 15_000 });
    const other = chips(page).filter({ hasNotText: time }).first();
    const newTime = (await other.textContent())!.trim();
    await other.click();
    const beforeMove = Date.now();
    await page.getByRole("button", { name: "Déplacer", exact: true }).click();
    await expect(page.getByText("Rendez-vous déplacé.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      newTime,
    );
    const moved = await waitForEmail(email, /Rendez-vous déplacé/, beforeMove);
    expect(moved.text).toContain(newTime);

    // Cancel with a message for the client
    await page
      .getByLabel("Message à la cliente (facultatif)")
      .fill("Imprévu au studio, toutes mes excuses.");
    const beforeCancel = Date.now();
    await page.getByRole("button", { name: "Annuler le rendez-vous" }).click();
    await expect(page.getByText("Annulé", { exact: true })).toBeVisible();
    const cancelled = await waitForEmail(
      email,
      /Rendez-vous annulé/,
      beforeCancel,
    );
    expect(cancelled.text).toContain("Imprévu au studio");

    // Her file keeps the history; a note can be added
    await page.getByRole("link", { name }).click();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await page.getByLabel("Nouvelle note").fill("Préfère la courbure C.");
    await page.getByRole("button", { name: "Ajouter la note" }).click();
    await expect(page.getByText("Préfère la courbure C.")).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Historique" }).getByText("Annulé"),
    ).toBeVisible();
  });

  test("bloquer un créneau puis le retirer, ouvrir le soir", async ({
    page,
  }, testInfo) => {
    const day = futureTuesday(testInfo.project.name === "mobile" ? 7 : 8);
    page.on("dialog", (d) => d.accept());
    await adminLogin(page);
    await page.goto(`/admin?jour=${day}`);

    await page.getByText("Bloquer un créneau").click();
    await page.getByLabel("De", { exact: true }).fill("10:00");
    await page.getByLabel("À", { exact: true }).fill("11:00");
    await page.getByLabel("Motif (facultatif)").fill("Formation E2E");
    await page.getByRole("button", { name: "Bloquer", exact: true }).click();
    const block = page.getByText("Formation E2E");
    await expect(block).toBeVisible();

    await page
      .getByRole("listitem")
      .filter({ hasText: "Formation E2E" })
      .getByRole("button", { name: "Retirer" })
      .click();
    await expect(block).toHaveCount(0);

    // Toggle the 18:00 rule both ways (whatever the state left by a previous run),
    // by tapping the row, as on a phone.
    const evening = page.getByRole("switch");
    const toggle = () =>
      page.locator("label", { has: page.getByRole("switch") }).click();
    const open = page.getByText("Ouverts à la réservation en ligne");
    const onRequest = page.getByText(/Sur demande : les clientes/);
    if (await evening.isChecked()) {
      await toggle();
      await expect(onRequest).toBeVisible();
      await expect(evening).toBeEnabled();
    }
    await toggle();
    await expect(open).toBeVisible();
    await expect(evening).toBeEnabled();
    await page.reload();
    await expect(page.getByRole("switch")).toBeChecked();
    await toggle();
    await expect(onRequest).toBeVisible();
    await expect(evening).toBeEnabled();
  });
});

test.describe("Administration — contenus", () => {
  test("modifier le sous-titre de l'accueil le met à jour sur le site", async ({
    page,
  }) => {
    await adminLogin(page);
    await page.goto("/admin/reglages/accueil");
    const field = page.getByLabel("Sous-titre");
    const original = await field.inputValue();
    const marker = `Test E2E ${Date.now() % 1e6}`;
    try {
      await field.fill(marker);
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("Enregistré.")).toBeVisible();
      await page.goto("/");
      await expect(page.getByText(marker)).toBeVisible();
    } finally {
      await page.goto("/admin/reglages/accueil");
      await page.getByLabel("Sous-titre").fill(original);
      await page.getByRole("button", { name: "Enregistrer" }).click();
      await expect(page.getByText("Enregistré.")).toBeVisible();
    }
  });
});

test.describe("Administration — galerie", () => {
  test.skip(
    ({ isMobile }) => isMobile,
    "Un seul envoi suffit (même code sur mobile).",
  );

  test("ajouter une photo, la voir sur le site, la supprimer", async ({
    page,
  }) => {
    page.on("dialog", (d) => d.accept());
    const alt = `Photo de test E2E ${Date.now() % 1e6}`;
    await adminLogin(page);
    await page.goto("/admin/reglages/galerie");
    await page
      .getByLabel("Photos", { exact: true })
      .setInputFiles("public/editorial/regard-01-editorial.jpg");
    await page.getByLabel("Description de la photo").fill(alt);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await expect(page.getByText("Photo enregistrée.")).toBeVisible({
      timeout: 20_000,
    });
    const card = page.getByRole("listitem").filter({
      has: page.locator(`input[value="${alt}"]`),
    });
    await expect(card).toBeVisible();

    await page.goto("/galerie");
    const image = page.getByRole("img", { name: alt });
    await expect(image).toBeVisible();
    // Served through the image optimiser from Supabase Storage, as WebP.
    expect(await image.getAttribute("src")).toContain("_next/image");

    await page.goto("/admin/reglages/galerie");
    await card.getByRole("button", { name: /Supprimer la photo/ }).click();
    await expect(card).toHaveCount(0);
  });
});
