import { type Page, expect } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export const uniqueEmail = (label: string) =>
  `e2e.${label}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@example.test`;

/** Reads the 6-digit code from the newest login e-mail received after `since` (Mailpit API). */
export async function loginCode(email: string, since: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=20`,
    );
    const { messages = [] } = (await res.json()) as {
      messages?: Array<{ ID: string; Created: string }>;
    };
    const fresh = messages
      .filter((m) => new Date(m.Created).getTime() >= since)
      .sort((a, b) => Date.parse(b.Created) - Date.parse(a.Created))[0];
    if (fresh) {
      const message = (await (
        await fetch(`${MAILPIT}/api/v1/message/${fresh.ID}`)
      ).json()) as { Text: string };
      const code = /\b(\d{6})\b/.exec(message.Text)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No login code received for ${email}`);
}

/**
 * Opens the booking flow for a service and picks the first available start
 * time, optionally on a later available day (`availableDayIndex`, 0 = first).
 */
export async function pickFirstSlot(
  page: Page,
  slug: string,
  { availableDayIndex = 0 } = {},
): Promise<{ time: string; url: string }> {
  await page.goto(`/reserver?prestation=${slug}`);
  if (availableDayIndex > 0) {
    const day = page
      .getByRole("group", { name: "Choisir un jour" })
      .getByRole("button", { name: /disponible/ })
      .nth(availableDayIndex);
    const label = (await day.getAttribute("aria-label"))!.split(",")[0]!; // "samedi 21 novembre"
    await day.click();
    await expect(page.locator("#horaires-titre")).toHaveText(
      new RegExp(label, "i"),
    );
  }
  const times = page.locator("section[aria-label] button:not([disabled])");
  // The strip pre-selects the first day with availability; wait for its times.
  await expect(times.first()).toBeVisible({ timeout: 20_000 });
  const time = (await times.first().textContent())?.trim() ?? "";
  await times.first().click();
  return { time, url: page.url() };
}

/** Fills the details step, requests the code and types it. */
export async function signInDuringBooking(
  page: Page,
  email: string,
  name = "Cliente Test E2E",
) {
  await page.getByLabel("Prénom et nom").fill(name);
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Téléphone").fill("06 00 00 00 42");
  await page.getByRole("checkbox").check();
  await page.waitForTimeout(2_600); // the anti-bot check rejects instant submissions
  const since = Date.now() - 1_000;
  await page.getByRole("button", { name: "Recevoir mon code" }).click();
  await page
    .getByLabel("Code reçu par e-mail")
    .fill(await loginCode(email, since));
  await expect(
    page.getByRole("heading", { name: "Récapitulatif" }),
  ).toBeVisible({ timeout: 20_000 });
}

/** Waits for an e-mail to `to` whose subject matches, received after `since`. Returns its text. */
export async function waitForEmail(
  to: string,
  subject: RegExp,
  since: number,
): Promise<{ subject: string; text: string }> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const res = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}&limit=50`,
    );
    const { messages = [] } = (await res.json()) as {
      messages?: Array<{ ID: string; Created: string; Subject: string }>;
    };
    const match = messages.find(
      (m) => Date.parse(m.Created) >= since && subject.test(m.Subject),
    );
    if (match) {
      const full = (await (
        await fetch(`${MAILPIT}/api/v1/message/${match.ID}`)
      ).json()) as { Text: string };
      return { subject: match.Subject, text: full.Text };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No e-mail "${subject}" for ${to}`);
}
