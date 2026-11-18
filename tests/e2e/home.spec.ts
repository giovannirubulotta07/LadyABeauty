import { expect, test } from "@playwright/test";

test.describe("Accueil", () => {
  test("présente le studio et mène à la réservation", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Lady A Beauty/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Lady A Beauty" }),
    ).toBeVisible();

    const cta = page
      .getByRole("main")
      .getByRole("link", { name: "Prendre rendez-vous" })
      .first();
    await expect(cta).toHaveAttribute("href", "/reserver");

    for (const section of [
      /Je suis Alessia/,
      /Sur mesure\s*pour votre regard/,
      /Les regards/,
      /Questions fréquentes/,
      /Venir au studio/,
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name: section }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("main").getByText("Avenue de Verdun").first(),
    ).toBeVisible();
  });

  test("expose des données structurées BeautySalon valides", async ({
    page,
  }) => {
    await page.goto("/");
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    const data = JSON.parse(raw ?? "{}");
    expect(data["@type"]).toBe("BeautySalon");
    expect(data.address.addressLocality).toBe("Annemasse");
    expect(data.openingHoursSpecification).toHaveLength(11);
  });

  test("ne défile jamais horizontalement", async ({ page }) => {
    for (const path of ["/", "/prestations", "/galerie"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test.describe("Menu mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "Menu réservé aux petits écrans");

  test("s'ouvre, navigue et se referme", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const menu = page.locator("#menu-mobile");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Prestations" }).click();
    await expect(page).toHaveURL(/\/prestations$/);
    await expect(menu).toBeHidden();
    await expect(
      page.getByRole("heading", { level: 1, name: "Prestations & tarifs" }),
    ).toBeVisible();
  });
});
