import postgres from "postgres";
import { parisInstant, type LocalDate } from "@/domain/time/paris";

export const DATABASE_URL = process.env.DATABASE_URL!;

/** A fresh connection pool (one per simulated client when testing concurrency). */
export function connect(max = 1) {
  return postgres(DATABASE_URL, { max, onnotice: () => {} });
}

export type Sql = ReturnType<typeof connect>;

/** Far-future test days, isolated from seed data. Tuesday / Wednesday. */
export const TEST_DAY: LocalDate = "2031-03-04";
export const TEST_DAY_2: LocalDate = "2031-03-05";

export async function serviceBySlug(sql: Sql, slug: string) {
  const [row] = await sql<{ id: string; name: string; duration_min: number }[]>`
    select id, name, duration_min from public.services where slug = ${slug}`;
  if (!row) throw new Error(`Seed service missing: ${slug}`);
  return row;
}

export async function anyClient(sql: Sql) {
  const [row] = await sql<
    { id: string }[]
  >`select id from public.clients order by created_at limit 1`;
  if (!row) throw new Error("Seed client missing");
  return row.id;
}

/** Calls public.create_appointment as the service role would. */
export function book(
  sql: Sql,
  args: {
    clientId: string;
    service: { id: string; name: string };
    durationMin: number;
    day: LocalDate;
    time: string;
    holdOfferId?: string;
  },
) {
  return sql<{ id: string }[]>`
    select public.create_appointment(
      ${args.clientId}, ${args.service.id}, null, ${args.service.name}, null,
      ${args.durationMin}, null, ${parisInstant(args.day, args.time)}, 'online', null, null,
      ${args.holdOfferId ?? null}
    ) as id`.then((rows) => rows[0]!.id);
}

export async function cleanDays(sql: Sql, days: LocalDate[]) {
  for (const day of days) {
    const range = `[${parisInstant(day, "00:00").toISOString()},${parisInstant(day, "23:59").toISOString()})`;
    await sql`delete from public.appointments where period && ${range}::tstzrange`;
    await sql`delete from public.blocks where period && ${range}::tstzrange`;
    await sql`delete from public.waitlist_entries where day = ${day}`;
  }
}

/** Resolves to the Postgres error message, or "OK". */
export async function outcome(p: Promise<unknown>): Promise<string> {
  try {
    await p;
    return "OK";
  } catch (e) {
    return (e as { message?: string }).message ?? String(e);
  }
}
