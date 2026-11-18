import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("handles accents, punctuation and symbols", () => {
    expect(slugify("Épilation sourcils")).toBe("epilation-sourcils");
    expect(slugify("Extension cils — remplissage")).toBe(
      "extension-cils-remplissage",
    );
    expect(slugify("Shading / Microblading")).toBe("shading-microblading");
    expect(slugify("Brow & lash")).toBe("brow-et-lash");
    expect(slugify("  !!  ")).toBe("prestation");
  });
});
