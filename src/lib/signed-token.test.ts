import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "./signed-token";

const SECRET = "a".repeat(32);
const OTHER = "b".repeat(32);
const now = new Date("2026-11-18T10:00:00Z");
const later = new Date("2026-11-25T10:00:00Z");

describe("signed tokens", () => {
  it("round-trips the subject", () => {
    const t = signToken(SECRET, "ics", "appt-123", later);
    expect(verifyToken(SECRET, t, "ics", now)).toBe("appt-123");
  });

  it("rejects another purpose", () => {
    const t = signToken(SECRET, "ics", "appt-123", later);
    expect(verifyToken(SECRET, t, "manage", now)).toBeNull();
  });

  it("rejects an expired token", () => {
    const t = signToken(SECRET, "manage", "appt-123", now);
    expect(verifyToken(SECRET, t, "manage", now)).toBeNull();
  });

  it("rejects a token signed with another secret or tampered with", () => {
    const t = signToken(SECRET, "ics", "appt-123", later);
    expect(verifyToken(OTHER, t, "ics", now)).toBeNull();
    const [v, body, sig] = t.split(".");
    const forged = Buffer.from(
      JSON.stringify({ p: "ics", s: "appt-999", e: 9_999_999_999 }),
    ).toString("base64url");
    expect(verifyToken(SECRET, `${v}.${forged}.${sig}`, "ics", now)).toBeNull();
    expect(verifyToken(SECRET, `${v}.${body}.x${sig}`, "ics", now)).toBeNull();
    expect(verifyToken(SECRET, "garbage", "ics", now)).toBeNull();
  });

  it("contains no personal data, only the opaque subject", () => {
    const t = signToken(SECRET, "ics", "6c0b1d2e-uuid", later);
    const payload = Buffer.from(t.split(".")[1]!, "base64url").toString();
    expect(payload).toBe(
      `{"p":"ics","s":"6c0b1d2e-uuid","e":${Math.floor(later.getTime() / 1000)}}`,
    );
  });

  it("refuses a weak secret", () => {
    expect(() => signToken("short", "ics", "x", later)).toThrow();
  });
});
