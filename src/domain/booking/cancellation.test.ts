import { describe, expect, it } from "vitest";
import { canClientCancel, cancellationDeadline } from "./cancellation";

const start = new Date("2026-11-24T09:00:00Z"); // Tuesday 10:00 in Paris

describe("annulation par la cliente", () => {
  it("jusqu'à 24 h avant : oui", () => {
    expect(canClientCancel(start, new Date("2026-11-23T08:59:00Z"), 24)).toBe(
      true,
    );
    expect(canClientCancel(start, new Date("2026-11-23T09:00:00Z"), 24)).toBe(
      true,
    ); // exactly at the deadline
  });
  it("moins de 24 h avant : non", () => {
    expect(canClientCancel(start, new Date("2026-11-23T09:01:00Z"), 24)).toBe(
      false,
    );
  });
  it("rendez-vous passé : non", () => {
    expect(canClientCancel(start, new Date("2026-11-25T09:00:00Z"), 0)).toBe(
      false,
    );
  });
  it("délai configurable (48 h, 0 h)", () => {
    expect(canClientCancel(start, new Date("2026-11-23T08:00:00Z"), 48)).toBe(
      false,
    );
    expect(canClientCancel(start, new Date("2026-11-24T08:59:00Z"), 0)).toBe(
      true,
    );
  });
  it("calcule l'échéance", () => {
    expect(cancellationDeadline(start, 24).toISOString()).toBe(
      "2026-11-23T09:00:00.000Z",
    );
  });
});
