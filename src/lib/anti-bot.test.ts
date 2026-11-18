import { describe, expect, it } from "vitest";
import { looksLikeBot } from "./anti-bot";

const now = 1_800_000_000_000;

describe("looksLikeBot", () => {
  it("lets a human through", () =>
    expect(looksLikeBot({ honeypot: "", renderedAt: now - 20_000 }, now)).toBe(
      false,
    ));
  it("catches a filled honeypot", () =>
    expect(
      looksLikeBot({ honeypot: "http://spam", renderedAt: now - 20_000 }, now),
    ).toBe(true));
  it("catches instant submissions", () =>
    expect(looksLikeBot({ honeypot: "", renderedAt: now - 500 }, now)).toBe(
      true,
    ));
  it("catches a missing timestamp", () =>
    expect(looksLikeBot({ honeypot: "" }, now)).toBe(true));
  it("catches stale forms (replay)", () =>
    expect(
      looksLikeBot({ honeypot: "", renderedAt: now - 1000 * 60 * 60 * 7 }, now),
    ).toBe(true));
});
