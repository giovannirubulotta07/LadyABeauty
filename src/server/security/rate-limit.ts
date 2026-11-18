import "server-only";
import { createAdminClient } from "@/server/db/admin-client";
import { anonymise, clientIp } from "./request";

export type RateRule = { name: string; limit: number; windowSeconds: number };

export const RATE_RULES = {
  otpPerIp: { name: "otp-ip", limit: 8, windowSeconds: 600 },
  otpPerEmail: { name: "otp-email", limit: 4, windowSeconds: 600 },
  loginPerIp: { name: "login-ip", limit: 10, windowSeconds: 600 },
  bookingPerIp: { name: "booking-ip", limit: 10, windowSeconds: 600 },
  bookingPerUser: { name: "booking-user", limit: 5, windowSeconds: 600 },
  availabilityPerIp: { name: "availability-ip", limit: 240, windowSeconds: 60 },
  accountPerUser: { name: "account-user", limit: 20, windowSeconds: 600 },
} as const satisfies Record<string, RateRule>;

/** True while under the limit. Fails open if the limiter itself is unavailable. */
export async function underLimit(
  rule: RateRule,
  identity: string,
): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
    p_key: `${rule.name}:${anonymise(identity)}`,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    console.error("rate limiter unavailable", error.message);
    return true;
  }
  return data === true;
}

export async function underIpLimit(rule: RateRule): Promise<boolean> {
  return underLimit(rule, await clientIp());
}
