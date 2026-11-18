import "server-only";
import { signToken, verifyToken, type TokenPurpose } from "@/lib/signed-token";
import { env } from "@/server/env";

export function createLinkToken(
  purpose: TokenPurpose,
  subject: string,
  expiresAt: Date,
): string {
  return signToken(env.APP_SECRET, purpose, subject, expiresAt);
}

export function readLinkToken(
  token: string,
  purpose: TokenPurpose,
  now = new Date(),
): string | null {
  return verifyToken(env.APP_SECRET, token, purpose, now);
}
