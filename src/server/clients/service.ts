import "server-only";
import type { SessionUser } from "@/server/auth/session";
import { createAdminClient } from "@/server/db/admin-client";

export type ClientProfile = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  marketingEmail: boolean;
  privacyAcceptedAt: string | null;
  /** Her own notes for Alessia: effect, curl, length, brow style… */
  preferences: string | null;
};

type Row = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  marketing_email: boolean;
  privacy_accepted_at: string | null;
  preferences: string | null;
};

const COLUMNS =
  "id, full_name, email, phone, marketing_email, privacy_accepted_at, preferences";

const toProfile = (r: Row): ClientProfile => ({
  id: r.id,
  fullName: r.full_name,
  email: r.email,
  phone: r.phone,
  marketingEmail: r.marketing_email,
  privacyAcceptedAt: r.privacy_accepted_at,
  preferences: r.preferences,
});

/**
 * The client record of this account. On first sign-in, a record created
 * earlier with the same e-mail (e.g. by the admin after a phone call) is
 * linked to the account: the e-mail has just been verified, so it is hers.
 */
export async function findClientForUser(
  user: SessionUser,
): Promise<ClientProfile | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("clients")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : linkByEmail(user);
}

/**
 * Returns the client record for a signed-in user, linking or creating it:
 *   1. already linked to this account → update the details;
 *   2. a record with this (verified) e-mail exists, created by the admin after
 *      a phone call → link it to the account;
 *   3. otherwise → create it.
 */
export async function upsertClientForUser(
  user: SessionUser,
  details: {
    fullName: string;
    phone: string;
    acceptPrivacy: boolean;
    marketingEmail?: boolean;
  },
): Promise<ClientProfile> {
  const db = createAdminClient();
  const now = new Date().toISOString();

  const existing = await findClientForUser(user);
  if (existing) {
    const { data, error } = await db
      .from("clients")
      .update({
        full_name: details.fullName,
        phone: details.phone,
        ...(details.marketingEmail !== undefined
          ? { marketing_email: details.marketingEmail }
          : {}),
        ...(existing.privacyAcceptedAt == null && details.acceptPrivacy
          ? { privacy_accepted_at: now }
          : {}),
      })
      .eq("id", existing.id)
      .select(COLUMNS)
      .single();
    if (error) throw error;
    return toProfile(data);
  }

  const { data, error } = await db
    .from("clients")
    .insert({
      user_id: user.id,
      email: user.email,
      full_name: details.fullName,
      phone: details.phone,
      marketing_email: details.marketingEmail ?? false,
      privacy_accepted_at: details.acceptPrivacy ? now : null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return toProfile(data);
}

async function linkByEmail(user: SessionUser): Promise<ClientProfile | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("clients")
    .update({ user_id: user.id })
    .eq("email", user.email)
    .is("user_id", null)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}
