import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "tokens.css"), "utf8");

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i").exec(css);
  if (!match?.[1]) throw new Error(`Missing colour token: ${name}`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (i) => parseInt(hex.slice(i, i + 2), 16) / 255,
  );
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  ) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

/** Every text/background combination used by the UI. */
const TEXT_PAIRS: Array<[text: string, background: string]> = [
  ["ink", "sand-100"],
  ["ink", "sand-50"],
  ["ink", "ivory"],
  ["espresso-900", "sand-100"],
  ["espresso-900", "ivory"],
  ["espresso-700", "sand-100"],
  ["espresso-500", "sand-100"],
  ["espresso-500", "sand-50"],
  ["espresso-500", "ivory"],
  ["espresso-500", "sand-200"],
  ["caramel-700", "sand-100"],
  ["caramel-700", "ivory"],
  ["danger", "ivory"],
  ["danger", "sand-100"],
  ["ivory", "espresso-900"],
  ["ivory", "espresso-950"],
  ["ivory", "espresso-700"],
  ["sand-100", "espresso-900"],
  ["caramel-300", "espresso-900"],
  ["caramel-300", "espresso-950"],
  ["ivory", "caramel-700"],
];

/** Non-text UI (focus rings, input borders) needs 3:1 (WCAG 1.4.11). */
const UI_PAIRS: Array<[ui: string, background: string]> = [
  ["caramel-700", "sand-100"],
  ["caramel-700", "ivory"],
  ["caramel-300", "espresso-900"],
  ["espresso-500", "ivory"],
];

describe("design tokens — WCAG AA contrast", () => {
  it.each(TEXT_PAIRS)("text %s on %s ≥ 4.5:1", (text, bg) => {
    expect(contrast(token(text), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(UI_PAIRS)("ui %s on %s ≥ 3:1", (ui, bg) => {
    expect(contrast(token(ui), token(bg))).toBeGreaterThanOrEqual(3);
  });
});
