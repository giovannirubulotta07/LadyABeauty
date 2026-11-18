import { existsSync } from "node:fs";
import postgres from "postgres";

const url = () =>
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * Deterministic E2E runs on the local database:
 *  - empty rate-limit counters (tests sign in many times);
 *  - no leftover waitlist from previous runs (it would be served first);
 *  - quiet hours disabled (otherwise a run at night defers waitlist e-mails
 *    to the morning, by design). Restored in the teardown below.
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

  return async () => {
    const restore = postgres(url(), { max: 1 });
    await restore`update public.business_settings
      set waitlist_quiet_start = ${settings!.start}, waitlist_quiet_end = ${settings!.end}`;
    await restore.end();
  };
}
