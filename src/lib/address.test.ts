import { describe, expect, it } from "vitest";
import { addressLines, instagramHandle, mapsUrl } from "./address";

const address = {
  line1: "Avenue de Verdun",
  line2: null,
  postalCode: "74100",
  city: "Annemasse",
};

describe("address helpers", () => {
  it("skips empty lines", () => {
    expect(addressLines(address)).toEqual([
      "Avenue de Verdun",
      "74100 Annemasse",
    ]);
  });
  it("builds an encoded maps link", () => {
    expect(mapsUrl("Lady A Beauty", address)).toBe(
      "https://www.google.com/maps/search/?api=1&query=Lady%20A%20Beauty%2C%20Avenue%20de%20Verdun%2C%2074100%20Annemasse",
    );
  });
  it("extracts the Instagram handle", () => {
    expect(instagramHandle("https://www.instagram.com/lady.a_beauty/")).toBe(
      "@lady.a_beauty",
    );
  });
});
