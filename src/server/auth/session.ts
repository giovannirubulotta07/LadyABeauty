import "server-only";
import { createSessionClient } from "./server-client";

export type SessionUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  hasPassword: boolean;
};

/**
 * The signed-in user, verified against Supabase Auth (never trusted from the
 * cookie alone), or null. Reads cookies: call it inside a <Suspense> boundary.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const meta = (data.user.app_metadata ?? {}) as { role?: string };
  const userMeta = (data.user.user_metadata ?? {}) as {
    has_password?: boolean;
  };
  return {
    id: data.user.id,
    email: data.user.email,
    isAdmin: meta.role === "admin",
    hasPassword: userMeta.has_password === true,
  };
}
