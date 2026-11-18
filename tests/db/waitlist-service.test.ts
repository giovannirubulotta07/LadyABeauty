import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import {
  expireWaitlist,
  processWaitlistDay,
  registerOnWaitlist,
} from "@/server/waitlist/service";
import {
  TEST_DAY,
  book,
  cleanDays,
  connect,
  serviceBySlug,
  type Sql,
} from "./helpers";

let sql: Sql;
let clients: string[];
let reh: { id: string; name: string; duration_min: number };

const twoDaysBefore = parisInstant("2031-03-02", "10:00");

beforeAll(async () => {
  sql = connect(3);
  clients = (
    await sql<
      { id: string }[]
    >`select id from public.clients where email is not null order by created_at limit 2`
  ).map((r) => r.id);
  reh = await serviceBySlug(sql, "rehaussement-cils");
});
afterEach(() => cleanDays(sql, [TEST_DAY]));
afterAll(() => sql.end());

/** A fully booked Tuesday; returns the id of the 12:00–13:00 appointment. */
async function fullDay() {
  const other = clients[1]!;
  await book(sql, {
    clientId: other,
    service: reh,
    durationMin: 120,
    day: TEST_DAY,
    time: "10:00",
  });
  const noon = await book(sql, {
    clientId: other,
    service: reh,
    durationMin: 60,
    day: TEST_DAY,
    time: "12:00",
  });
  await book(sql, {
    clientId: other,
    service: reh,
    durationMin: 60,
    day: TEST_DAY,
    time: "13:00",
  });
  await book(sql, {
    clientId: other,
    service: reh,
    durationMin: 330,
    day: TEST_DAY,
    time: "14:30",
  });
  return noon;
}

async function offers() {
  return sql<
    { client_id: string; status: string; exclusive: boolean; start: Date }[]
  >`
    select e.client_id, o.status, o.exclusive_until is not null as exclusive, lower(o.period) as start
    from public.waitlist_offers o join public.waitlist_entries e on e.id = o.entry_id
    where e.day = ${TEST_DAY} order by o.created_at`;
}

describe("liste d'attente de bout en bout (service + base)", () => {
  it("un créneau libéré de 2 h sert deux inscrites d'1 h (emboîtement)", async () => {
    const other = clients[1]!;
    await book(sql, {
      clientId: other,
      service: reh,
      durationMin: 120,
      day: TEST_DAY,
      time: "10:00",
    });
    const twoHours = await book(sql, {
      clientId: other,
      service: reh,
      durationMin: 120,
      day: TEST_DAY,
      time: "12:00",
    });
    await book(sql, {
      clientId: other,
      service: reh,
      durationMin: 330,
      day: TEST_DAY,
      time: "14:30",
    });
    for (const clientId of clients) {
      await registerOnWaitlist({
        clientId,
        serviceId: reh.id,
        variantId: null,
        durationMin: 60,
        day: TEST_DAY,
        now: twoDaysBefore,
      });
    }
    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${twoHours}`;
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 2,
    });
    expect((await offers()).map((o) => o.start.toISOString())).toEqual([
      parisInstant(TEST_DAY, "12:00").toISOString(),
      parisInstant(TEST_DAY, "13:00").toISOString(),
    ]);
  });

  it("annulation → la première inscrite reçoit le créneau en exclusivité, puis la suivante si elle ne répond pas", async () => {
    const noon = await fullDay();
    for (const clientId of clients) {
      const r = await registerOnWaitlist({
        clientId,
        serviceId: reh.id,
        variantId: null,
        durationMin: 60,
        day: TEST_DAY,
        now: twoDaysBefore,
      });
      expect(r).toEqual({ ok: true, alreadyRegistered: false });
    }
    // Registering twice is harmless.
    expect(
      await registerOnWaitlist({
        clientId: clients[0]!,
        serviceId: reh.id,
        variantId: null,
        durationMin: 60,
        day: TEST_DAY,
        now: twoDaysBefore,
      }),
    ).toEqual({ ok: true, alreadyRegistered: true });

    // Nothing free yet → nothing offered.
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 0,
    });

    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${noon}`;
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 1,
    });
    let list = await offers();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      client_id: clients[0],
      status: "offered",
      exclusive: true,
    });
    expect(list[0]!.start.toISOString()).toBe(
      parisInstant(TEST_DAY, "12:00").toISOString(),
    );

    // Running again does not send a second offer.
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 0,
    });

    // Her 30 minutes are over without an answer → the next client's turn.
    await sql`update public.waitlist_offers set exclusive_until = now() - interval '1 minute'
              where entry_id in (select id from public.waitlist_entries where day = ${TEST_DAY})`;
    expect(await expireWaitlist()).toContain(TEST_DAY);
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 1,
    });
    list = await offers();
    expect(list.map((o) => [o.client_id, o.status])).toEqual([
      [clients[0], "expired"],
      [clients[1], "offered"],
    ]);

    const [first] = await sql<{ status: string }[]>`
      select status from public.waitlist_entries where day = ${TEST_DAY} and client_id = ${clients[0]!}`;
    expect(first!.status).toBe("waiting"); // still interested in other slots, but never this one again

    const logged = await sql<{ n: number }[]>`
      select count(*)::int as n from public.notification_log where kind = 'waitlist_offer'
        and offer_id in (select o.id from public.waitlist_offers o join public.waitlist_entries e on e.id = o.entry_id where e.day = ${TEST_DAY})`;
    expect(logged[0]!.n).toBe(2);
  });

  it("créneau proche : toutes les inscrites sont prévenues en même temps", async () => {
    const noon = await fullDay();
    for (const clientId of clients) {
      await registerOnWaitlist({
        clientId,
        serviceId: reh.id,
        variantId: null,
        durationMin: 60,
        day: TEST_DAY,
        now: twoDaysBefore,
      });
    }
    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${noon}`;
    const sameMorning = parisInstant(TEST_DAY, "08:30");
    expect(await processWaitlistDay(TEST_DAY, sameMorning)).toEqual({
      offered: 2,
    });
    expect((await offers()).every((o) => !o.exclusive)).toBe(true);
  });

  it("les horaires libres au moment de l'inscription ne sont pas reproposés", async () => {
    // Empty day: she registers because none of the free times suit her.
    await registerOnWaitlist({
      clientId: clients[0]!,
      serviceId: reh.id,
      variantId: null,
      durationMin: 60,
      day: TEST_DAY,
      now: twoDaysBefore,
    });
    expect(await processWaitlistDay(TEST_DAY, twoDaysBefore)).toEqual({
      offered: 0,
    });
  });
});
