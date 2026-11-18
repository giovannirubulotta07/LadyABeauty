import { expect, test } from "@playwright/test";

// The animated version (no reduced motion): entrance animations must reveal
// every section while scrolling, and never leave content hidden.
test.use({ reducedMotion: "no-preference" });

test.describe("Animations", () => {
  test("le moteur démarre et chaque section apparaît en défilant", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/motion-ready/, {
      timeout: 10_000,
    });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    for (const name of [
      /Je suis Alessia/,
      /Sur mesure\s*pour votre regard/,
      /Les regards/,
      /Questions fréquentes/,
      /Venir au studio/,
    ]) {
      const heading = page.getByRole("heading", { level: 2, name });
      await heading.scrollIntoViewIfNeeded();
      await expect(heading).toBeVisible({ timeout: 5_000 });
    }
    const footerCta = page.getByRole("heading", {
      name: "Votre regard, sublimé dans le moindre détail.",
    });
    await footerCta.scrollIntoViewIfNeeded();
    await expect(footerCta).toBeVisible({ timeout: 5_000 });
  });

  test("avec « réduire les animations », tout est visible immédiatement", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bmotion\b/);
    const hidden = await page.$$eval(
      "[data-reveal]",
      (els) =>
        els.filter((e) => getComputedStyle(e).visibility === "hidden").length,
    );
    expect(hidden).toBe(0);
    await context.close();
  });
});
