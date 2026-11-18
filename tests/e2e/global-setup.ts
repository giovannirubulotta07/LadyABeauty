import { existsSync } from "node:fs";
import postgres from "postgres";

/** Starts every E2E run with empty rate-limit counters (tests sign in many times). */
export default async function globalSetup() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const sql = postgres(
    process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    { max: 1 },
  );
  await sql`delete from public.rate_limits`;
  await sql.end();
}
