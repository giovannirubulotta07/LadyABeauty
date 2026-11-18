import { describe, expect, it } from "vitest";
import { priceLabel } from "./price";

const clean = (s: string | null) => s?.replace(/[  ]/g, " ") ?? null;

describe("priceLabel", () => {
  it("shows the full price", () => {
    expect(
      clean(
        priceLabel({
          priceCents: 1600,
          priceIsFrom: false,
          depositCents: null,
        }),
      ),
    ).toBe("16 €");
  });
  it("prefixes « À partir de » for starting prices", () => {
    expect(
      clean(
        priceLabel({ priceCents: 1000, priceIsFrom: true, depositCents: null }),
      ),
    ).toBe("À partir de 10 €");
  });
  it("falls back to the deposit when the price is unknown", () => {
    expect(
      clean(
        priceLabel({
          priceCents: null,
          priceIsFrom: false,
          depositCents: 2000,
        }),
      ),
    ).toBe("Acompte 20 €");
  });
  it("prefers the full price over the deposit", () => {
    expect(
      clean(
        priceLabel({
          priceCents: 6500,
          priceIsFrom: false,
          depositCents: 2000,
        }),
      ),
    ).toBe("65 €");
  });
  it("returns null when nothing is known", () => {
    expect(
      priceLabel({ priceCents: null, priceIsFrom: false, depositCents: null }),
    ).toBeNull();
  });
});
