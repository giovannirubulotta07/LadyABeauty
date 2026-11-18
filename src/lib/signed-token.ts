import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Compact signed tokens for links in emails (manage an appointment, download
 * the .ics, redeem a waitlist offer). No personal data in URLs: the payload
 * only carries an opaque id, a purpose and an expiry, and is HMAC-SHA256 signed.
 *
 * Format: v1.<base64url(payload)>.<base64url(signature)>
 */
export type TokenPurpose = "ics" | "manage" | "waitlist";

type Payload = { p: TokenPurpose; s: string; e: number };

const b64 = (input: Buffer | string) =>
  Buffer.from(input).toString("base64url");

function signature(secret: string, body: string): string {
  return b64(createHmac("sha256", secret).update(`v1.${body}`).digest());
}

export function signToken(
  secret: string,
  purpose: TokenPurpose,
  subject: string,
  expiresAt: Date,
): string {
  if (secret.length < 32)
    throw new Error("Token secret must be at least 32 characters");
  const body = b64(
    JSON.stringify({
      p: purpose,
      s: subject,
      e: Math.floor(expiresAt.getTime() / 1000),
    } satisfies Payload),
  );
  return `v1.${body}.${signature(secret, body)}`;
}

/** Returns the subject when the token is authentic, unexpired and for this purpose; otherwise null. */
export function verifyToken(
  secret: string,
  token: string,
  purpose: TokenPurpose,
  now = new Date(),
): string | null {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, body, sig] = parts as [string, string, string];

  const expected = Buffer.from(signature(secret, body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;

  let payload: Payload;
  try {
    payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Payload;
  } catch {
    return null;
  }
  if (payload.p !== purpose || typeof payload.s !== "string") return null;
  if (!Number.isFinite(payload.e) || payload.e * 1000 <= now.getTime())
    return null;
  return payload.s;
}
