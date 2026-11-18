import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/server/env";

/** Client IP as seen by Vercel / the local proxy. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** One-way hash so that rate-limit keys never store raw IPs or emails. */
export function anonymise(value: string): string {
  return createHash("sha256")
    .update(`${env.APP_SECRET}:${value.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}
