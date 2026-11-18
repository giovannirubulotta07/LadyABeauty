import { describe, expect, it } from "vitest";
import { emailSchema, otpSchema, phoneSchema, safeNext } from "./validation";

describe("validation", () => {
  it("normalises emails", () =>
    expect(emailSchema.parse("  Alessia@Example.TEST ")).toBe(
      "alessia@example.test",
    ));
  it("rejects bad emails", () =>
    expect(emailSchema.safeParse("alessia@").success).toBe(false));
  it("accepts 6-digit codes only", () => {
    expect(otpSchema.safeParse("012345").success).toBe(true);
    expect(otpSchema.safeParse("12345").success).toBe(false);
    expect(otpSchema.safeParse("12345a").success).toBe(false);
  });
  it.each([
    ["06 12 34 56 78", "0612345678"],
    ["+33 6 12 34 56 78", "+33612345678"],
    ["0041 79 123 45 67", "+41791234567"],
    ["+41 (0)79.123.45.67", "+410791234567"],
  ])("normalises phone %s", (input, expected) =>
    expect(phoneSchema.parse(input)).toBe(expected),
  );
  it("rejects bad phones", () =>
    expect(phoneSchema.safeParse("12").success).toBe(false));
  it("keeps redirects inside the site", () => {
    expect(safeNext("/reserver?x=1")).toBe("/reserver?x=1");
    expect(safeNext("//evil.com")).toBe("/mon-espace");
    expect(safeNext("https://evil.com")).toBe("/mon-espace");
    expect(safeNext("/\\evil.com")).toBe("/mon-espace");
    expect(safeNext(null)).toBe("/mon-espace");
  });
});
