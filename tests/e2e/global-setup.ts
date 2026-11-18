import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers";

const url = () =>
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Deterministic E2E runs on the local database:
 *  - empty rate-limit counters (tests sign in many times);
 *  - no leftover waitlist from previous runs (it would be served first);
 *  - quiet hours disabled (otherwise a run at night defers waitlist e-mails
 *    to the morning, by design). Restored in the teardown below;
 *  - a local admin account (password sign-in) for the admin tests.
 */
export default async function globalSetup() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const sql = postgres(url(), { max: 1 });
  await sql`delete from public.rate_limits`;
  await sql`update public.waitlist_offers set status = 'superseded' where status = 'offered'`;
  await sql`update public.slot_holds set released_at = now() where released_at is null`;
  await sql`update public.waitlist_entries set status = 'cancelled' where status in ('waiting', 'notified')`;
  const [settings] = await sql<{ start: string; end: string }[]>`
    select waitlist_quiet_start::text as start, waitlist_quiet_end::text as end from public.business_settings`;
  await sql`update public.business_settings set waitlist_quiet_start = '00:00', waitlist_quiet_end = '00:00'`;
  await sql.end();
  await ensureAdmin();

  return async () => {
    const restore = postgres(url(), { max: 1 });
    await restore`update public.business_settings
      set waitlist_quiet_start = ${settings!.start}, waitlist_quiet_end = ${settings!.end}`;
    await restore.end();
  };
}

/** Creates (or re-enables) the local test admin. Local stack only. */
async function ensureAdmin() {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const attributes = {
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { role: "admin" },
    user_metadata: { has_password: true },
  };
  const { error } = await db.auth.admin.createUser({
    email: ADMIN_EMAIL,
    ...attributes,
  });
  if (!error) return;
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email === ADMIN_EMAIL);
  if (!user) throw error;
  const update = await db.auth.admin.updateUserById(user.id, attributes);
  if (update.error) throw update.error;
}
