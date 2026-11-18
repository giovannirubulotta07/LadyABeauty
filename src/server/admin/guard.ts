import "server-only";
import { type SessionUser, getSessionUser } from "@/server/auth/session";

/**
 * Admin access check. The role lives in app_metadata (only the service role
 * can write it) and the session is verified against Supabase Auth.
 *
 * Every admin page renders through <AdminGate>, and every admin query and
 * Server Action calls requireAdmin() itself: layouts are not re-rendered on
 * client navigation, so they cannot be the only check.
 */
export async function getAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user?.isAdmin ? user : null;
}

export class AdminAccessError extends Error {
  constructor() {
    super("ADMIN_REQUIRED");
    this.name = "AdminAccessError";
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const admin = await getAdmin();
  if (!admin) throw new AdminAccessError();
  return admin;
}
