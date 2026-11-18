import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { addDays, parisInstant } from "@/domain/time/paris";
import {
  AvailabilityError,
  getDaySlots,
  getDaysOverview,
} from "@/server/availability/service";
import {
  TEST_DAY,
  TEST_DAY_2,
  anyClient,
  book,
  cleanDays,
  connect,
  serviceBySlug,
  type Sql,
} from "./helpers";

/**
 * End-to-end through the real database: what the booking flow will call.
 * "now" is fixed a few days before the (far-future) test days.
 */
const NOW = parisInstant("2031-03-01", "09:00");

let sql: Sql;
let clientId: string;
let extension: { id: string; name: string; duration_min: number };
let rehaussement: { id: string; name: string; duration_min: number };

beforeAll(async () => {
  sql = connect(3);
  clientId = await anyClient(sql);
  extension = await serviceBySlug(sql, "extension-cils");
  rehaussement = await serviceBySlug(sql, "rehaussement-cils");
  await cleanDays(sql, [TEST_DAY, TEST_DAY_2]);
});
afterEach(async () => {
  await cleanDays(sql, [TEST_DAY, TEST_DAY_2]);
  await sql`delete from public.day_overrides where day in (${TEST_DAY}, ${TEST_DAY_2})`;
});
afterAll(() => sql.end());

const labels = (slots: Array<{ time: string; status: string }>) =>
  slots.map((s) => (s.status === "on_request" ? `${s.time}*` : s.time));

describe("getDaySlots (base de données réelle)", () => {
  it("utilise les durées et horaires du seed : extension 1 h 45 un mardi vide", async () => {
    const { service, slots } = await getDaySlots({
      serviceId: extension.id,
      day: TEST_DAY,
      now: NOW,
    });
    expect(service.durationMin).toBe(105);
    expect(labels(slots)).toEqual([
      "10:00",
      "12:00",
      "14:30",
      "16:00",
      "18:00*",
    ]);
  });

  it("emboîte autour d'un rendez-vous réel et ignore les annulés", async () => {
    const id = await book(sql, {
      clientId,
      service: extension,
      durationMin: 105,
      day: TEST_DAY,
      time: "10:00",
    });
    let { slots } = await getDaySlots({
      serviceId: rehaussement.id,
      day: TEST_DAY,
      now: NOW,
    });
    expect(labels(slots).slice(0, 2)).toEqual(["11:45", "12:00"]);

    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${id}`;
    ({ slots } = await getDaySlots({
      serviceId: rehaussement.id,
      day: TEST_DAY,
      now: NOW,
    }));
    expect(labels(slots)[0]).toBe("10:00");
  });

  it("le déblocage du soir par l'admin rend 18:00 réservable", async () => {
    await sql`insert into public.day_overrides (day, evening_unlocked) values (${TEST_DAY}, true)`;
    const { slots } = await getDaySlots({
      serviceId: extension.id,
      day: TEST_DAY,
      now: NOW,
    });
    expect(labels(slots)).toContain("18:00");
    expect(labels(slots)).not.toContain("18:00*");
  });

  it("un hold de liste d'attente occupe le créneau, sauf pour sa détentrice", async () => {
    const [entry] = await sql<{ id: string }[]>`
      insert into public.waitlist_entries (client_id, service_id, day, duration_min)
      values (${clientId}, ${extension.id}, ${TEST_DAY}, 105) returning id`;
    const period = `[${parisInstant(TEST_DAY, "12:00").toISOString()},${parisInstant(TEST_DAY, "13:45").toISOString()})`;
    const [offer] = await sql<{ id: string }[]>`
      insert into public.waitlist_offers (entry_id, period, token_hash)
      values (${entry!.id}, ${period}::tstzrange, ${"svc-" + Date.now()}) returning id`;
    await sql`insert into public.slot_holds (offer_id, period, expires_at)
              values (${offer!.id}, ${period}::tstzrange, ${new Date(NOW.getTime() + 30 * 60_000)})`;

    const others = await getDaySlots({
      serviceId: extension.id,
      day: TEST_DAY,
      now: NOW,
    });
    expect(labels(others.slots)).not.toContain("12:00");
    const holder = await getDaySlots({
      serviceId: extension.id,
      day: TEST_DAY,
      now: NOW,
      ownOfferId: offer!.id,
    });
    expect(labels(holder.slots)).toContain("12:00");
  });

  it("refuse une prestation inconnue ou désactivée", async () => {
    await expect(
      getDaySlots({
        serviceId: "00000000-0000-4000-8000-000000000000",
        day: TEST_DAY,
        now: NOW,
      }),
    ).rejects.toBeInstanceOf(AvailabilityError);
  });
});

describe("getDaysOverview", () => {
  it("donne le statut de chaque jour de la semaine", async () => {
    // Fill Tuesday completely; block Wednesday (holiday).
    await book(sql, {
      clientId,
      service: extension,
      durationMin: 240,
      day: TEST_DAY,
      time: "10:00",
    });
    await book(sql, {
      clientId,
      service: extension,
      durationMin: 330,
      day: TEST_DAY,
      time: "14:30",
    });
    const holiday = `[${parisInstant(TEST_DAY_2, "00:00").toISOString()},${parisInstant(addDays(TEST_DAY_2, 1), "00:00").toISOString()})`;
    await sql`select public.create_block(${holiday}::tstzrange, 'Congés', null)`;

    const week = await getDaysOverview({
      serviceId: rehaussement.id,
      from: "2031-03-03",
      days: 7,
      now: NOW,
    });
    expect(week.map((d) => `${d.day}:${d.status}`)).toEqual([
      "2031-03-03:available", // Monday
      "2031-03-04:full", // Tuesday, fully booked
      "2031-03-05:closed", // Wednesday, holiday
      "2031-03-06:available",
      "2031-03-07:available",
      "2031-03-08:available", // Saturday
      "2031-03-09:closed", // Sunday
    ]);
  });
});
