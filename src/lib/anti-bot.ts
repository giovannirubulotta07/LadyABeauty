/**
 * Invisible anti-bot checks (no CAPTCHA): a honeypot field that humans never
 * see, and a minimum time between the form being shown and submitted.
 */
export const HONEYPOT_FIELD = "site_web";
export const MIN_FILL_MS = 2500;

export function looksLikeBot(
  input: { honeypot?: string | null; renderedAt?: number | null },
  now = Date.now(),
): boolean {
  if (input.honeypot && input.honeypot.trim() !== "") return true;
  if (!input.renderedAt || !Number.isFinite(input.renderedAt)) return true;
  const elapsed = now - input.renderedAt;
  return elapsed < MIN_FILL_MS || elapsed > 1000 * 60 * 60 * 6;
}
