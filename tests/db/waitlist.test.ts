import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import {
  TEST_DAY,
  book,
  cleanDays,
  connect,
  outcome,
  serviceBySlug,
  type Sql,
} from "./helpers";

let sql: Sql;
let clients: string[];
let service: { id: string; name: string; duration_min: number };

const range = (from: string, to: string) =>
  `[${parisInstant(TEST_DAY, from).toISOString()},${parisInstant(TEST_DAY, to).toISOString()})`;

async function entry(clientId: string) {
  const [row] = await sql<{ id: string }[]>`
    insert into public.waitlist_entries (client_id, service_id, day, duration_min)
    values (${clientId}, ${service.id}, ${TEST_DAY}, 60) returning id`;
  return row!.id;
}

const offer = (
  db: Sql,
  entryId: string,
  period: string,
  exclusiveMinutes: number | null,
) =>
  db<{ id: string }[]>`
    select public.create_waitlist_offer(
      ${entryId}, ${period}::tstzrange, ${`hash-${crypto.randomUUID()}`},
      ${exclusiveMinutes === null ? null : new Date(Date.now() + exclusiveMinutes * 60_000)}
    ) as id`.then((r) => r[0]!.id);

const status = async (entryId: string) =>
  (
    await sql<{ status: string; excluded: Date[] }[]>`
    select status, excluded_starts as excluded from public.waitlist_entries where id = ${entryId}`
  )[0]!;

beforeAll(async () => {
  sql = connect(5);
  clients = (
    await sql<
      { id: string }[]
    >`select id from public.clients order by created_at limit 2`
  ).map((r) => r.id);
  service = await serviceBySlug(sql, "rehaussement-cils");
});
afterEach(() => cleanDays(sql, [TEST_DAY]));
afterAll(() => sql.end());

describe("offres de la liste d'attente", () => {
  it("une offre exclusive réserve le créneau pour sa détentrice seulement", async () => {
    const e = await entry(clients[0]!);
    const offerId = await offer(sql, e, range("10:00", "11:00"), 30);
    expect((await status(e)).status).toBe("notified");

    // Nobody else can book it during the exclusive window…
    expect(
      await outcome(
        book(sql, {
          clientId: clients[1]!,
          service,
          durationMin: 60,
          day: TEST_DAY,
          time: "10:00",
        }),
      ),
    ).toBe("SLOT_HELD");
    // …and the same entry cannot be offered twice.
    expect(await outcome(offer(sql, e, range("12:00", "13:00"), 30))).toBe(
      "ENTRY_NOT_WAITING",
    );

    const [{ id: appointmentId }] =
      (await sql`select public.redeem_waitlist_offer(${offerId}) as id`) as unknown as [
        { id: string },
      ];
    const [appt] =
      await sql`select source, client_id, service_name from public.appointments where id = ${appointmentId}`;
    expect(appt).toMatchObject({
      source: "waitlist",
      client_id: clients[0],
      service_name: service.name,
    });
    expect((await status(e)).status).toBe("booked");
    const [hold] =
      await sql`select released_at from public.slot_holds where offer_id = ${offerId}`;
    expect(hold!.released_at).not.toBeNull();
  });

  it("deux traitements en parallèle ne peuvent pas offrir le même créneau à deux clientes", async () => {
    const [a, b] = [await entry(clients[0]!), await entry(clients[1]!)];
    const pools = [connect(), connect()];
    try {
      const results = await Promise.all([
        outcome(offer(pools[0]!, a, range("14:30", "15:30"), 30)),
        outcome(offer(pools[1]!, b, range("14:30", "15:30"), 30)),
      ]);
      expect(results.sort()).toEqual(["OK", "SLOT_UNAVAILABLE"]);
    } finally {
      await Promise.all(pools.map((p) => p.end()));
    }
  });

  it("refuser l'offre libère le créneau ; ce départ ne lui sera plus proposé", async () => {
    const e = await entry(clients[0]!);
    const offerId = await offer(sql, e, range("16:00", "17:00"), 30);
    const [{ day }] =
      (await sql`select public.release_waitlist_offer(${offerId}, 'superseded') as day`) as unknown as [
        { day: Date },
      ];
    expect(day).toBeTruthy();
    const after = await status(e);
    expect(after.status).toBe("waiting");
    expect(after.excluded.map((d) => d.toISOString())).toContain(
      parisInstant(TEST_DAY, "16:00").toISOString(),
    );
    expect(
      await outcome(
        book(sql, {
          clientId: clients[1]!,
          service,
          durationMin: 60,
          day: TEST_DAY,
          time: "16:00",
        }),
      ),
    ).toBe("OK");
  });

  it("une offre « à toutes » sans réservation de créneau échoue proprement si quelqu'un a été plus rapide", async () => {
    const e = await entry(clients[0]!);
    const offerId = await offer(sql, e, range("12:00", "13:00"), null);
    await book(sql, {
      clientId: clients[1]!,
      service,
      durationMin: 60,
      day: TEST_DAY,
      time: "12:00",
    });
    expect(
      await outcome(sql`select public.redeem_waitlist_offer(${offerId})`),
    ).toBe("SLOT_TAKEN");
  });

  it("le job fait expirer les exclusivités dépassées et rend le jour à traiter", async () => {
    const e = await entry(clients[0]!);
    const offerId = await offer(sql, e, range("18:00", "19:00"), 30);
    await sql`update public.waitlist_offers set exclusive_until = now() - interval '1 minute' where id = ${offerId}`;
    expect(
      await outcome(sql`select public.redeem_waitlist_offer(${offerId})`),
    ).toBe("OFFER_EXPIRED");

    const days = await sql<
      { d: Date }[]
    >`select d from public.expire_waitlist() as d`;
    expect(days.map((r) => r.d.toISOString().slice(0, 10))).toContain(TEST_DAY);
    const [o] =
      await sql`select status from public.waitlist_offers where id = ${offerId}`;
    expect(o!.status).toBe("expired");
    expect((await status(e)).status).toBe("waiting");
  });

  it("les inscriptions d'un jour passé expirent", async () => {
    const [row] = await sql<{ id: string }[]>`
      insert into public.waitlist_entries (client_id, service_id, day, duration_min)
      values (${clients[0]!}, ${service.id}, current_date - 2, 60) returning id`;
    await sql`select public.expire_waitlist()`;
    expect((await status(row!.id)).status).toBe("expired");
    await sql`delete from public.waitlist_entries where id = ${row!.id}`;
  });

  it("aucune de ces fonctions n'est accessible depuis le navigateur", async () => {
    const result = await outcome(
      sql.begin(async (tx) => {
        await tx.unsafe("set local role authenticated");
        await tx`select public.expire_waitlist()`;
      }),
    );
    expect(result).toMatch(/permission denied/);
  });
});
