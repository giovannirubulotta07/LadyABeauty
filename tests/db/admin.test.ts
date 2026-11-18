import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import { parseTstzRange } from "@/domain/time/range";
import {
  TEST_DAY,
  TEST_DAY_2,
  anyClient,
  book,
  cleanDays,
  connect,
  outcome,
  serviceBySlug,
  type Sql,
} from "./helpers";

let sql: Sql;
let clientId: string;
let service: { id: string; name: string; duration_min: number };

beforeAll(async () => {
  sql = connect(4);
  clientId = await anyClient(sql);
  service = await serviceBySlug(sql, "rehaussement-cils");
  await cleanDays(sql, [TEST_DAY, TEST_DAY_2]);
});
afterEach(() => cleanDays(sql, [TEST_DAY, TEST_DAY_2]));
afterAll(() => sql.end());

const appt = (time: string, day = TEST_DAY) =>
  book(sql, { clientId, service, durationMin: 60, day, time });

const move = (db: Sql, id: string, day: string, time: string, minutes = 60) =>
  db`select public.move_appointment(${id}, ${parisInstant(day, time)}, ${minutes})::text as previous`.then(
    (r) => r[0]!.previous as string,
  );

describe("move_appointment", () => {
  it("déplace, change la durée et renvoie l'ancien horaire", async () => {
    const id = await appt("10:00");
    const previous = await move(sql, id, TEST_DAY_2, "14:30", 90);
    expect(parseTstzRange(previous).start.toISOString()).toBe(
      parisInstant(TEST_DAY, "10:00").toISOString(),
    );
    const [row] = await sql<{ start: Date; duration_min: number }[]>`
      select lower(period) as start, duration_min from public.appointments where id = ${id}`;
    expect(row!.start.toISOString()).toBe(
      parisInstant(TEST_DAY_2, "14:30").toISOString(),
    );
    expect(row!.duration_min).toBe(90);
  });

  it("peut se décaler sur son propre horaire (chevauchement avec lui-même)", async () => {
    const id = await appt("10:00");
    await move(sql, id, TEST_DAY, "10:30");
    const [row] = await sql<{ start: Date }[]>`
      select lower(period) as start from public.appointments where id = ${id}`;
    expect(row!.start.toISOString()).toBe(
      parisInstant(TEST_DAY, "10:30").toISOString(),
    );
  });

  it("refuse un créneau pris, bloqué, ou un rendez-vous annulé", async () => {
    const a = await appt("10:00");
    await appt("12:00");
    expect(await outcome(move(sql, a, TEST_DAY, "11:30"))).toBe("SLOT_TAKEN");

    await sql`insert into public.blocks (period) values (tstzrange(${parisInstant(TEST_DAY, "15:00")}, ${parisInstant(TEST_DAY, "17:00")}, '[)'))`;
    expect(await outcome(move(sql, a, TEST_DAY, "16:00"))).toBe("SLOT_BLOCKED");

    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${a}`;
    expect(await outcome(move(sql, a, TEST_DAY, "18:00"))).toBe(
      "NOT_CONFIRMED",
    );
    expect(
      await outcome(
        move(sql, "00000000-0000-0000-0000-000000000000", TEST_DAY, "18:00"),
      ),
    ).toBe("NOT_FOUND");
  });

  it("deux déplacements simultanés vers le même créneau : un seul réussit", async () => {
    const a = await appt("10:00");
    const b = await appt("12:00", TEST_DAY_2);
    const [c1, c2] = [connect(), connect()];
    try {
      const [ra, rb] = await Promise.all([
        outcome(move(c1, a, TEST_DAY, "16:00")),
        outcome(move(c2, b, TEST_DAY, "16:00")),
      ]);
      expect([ra, rb].sort()).toEqual(["OK", "SLOT_TAKEN"]);
    } finally {
      await Promise.all([c1.end(), c2.end()]);
    }
  });

  it("n'est pas appelable par un utilisateur connecté (service role uniquement)", async () => {
    const [row] = await sql<{ allowed: boolean }[]>`
      select has_function_privilege('authenticated', 'public.move_appointment(uuid, timestamptz, integer)', 'execute') as allowed`;
    expect(row!.allowed).toBe(false);
  });
});

describe("replace_opening_hours", () => {
  it("remplace tout ou rien (chevauchement refusé, horaires intacts)", async () => {
    const before =
      await sql`select weekday, opens, closes from public.opening_hours order by 1, 2`;
    await expect(
      sql`select public.replace_opening_hours(${sql.json([
        { weekday: 1, opens: "10:00", closes: "14:00" },
        { weekday: 1, opens: "13:00", closes: "18:00" },
      ])})`,
    ).rejects.toThrow();
    const after =
      await sql`select weekday, opens, closes from public.opening_hours order by 1, 2`;
    expect(after).toEqual(before);
  });

  it("enregistre la nouvelle semaine puis la restaure", async () => {
    const before = await sql<
      { weekday: number; opens: string; closes: string }[]
    >`
      select weekday, opens::text, closes::text from public.opening_hours order by 1, 2`;
    try {
      await sql`select public.replace_opening_hours(${sql.json([
        { weekday: 2, opens: "09:00", closes: "12:00" },
      ])})`;
      const rows =
        await sql`select weekday, opens::text from public.opening_hours`;
      expect(rows).toEqual([{ weekday: 2, opens: "09:00:00" }]);
    } finally {
      await sql`select public.replace_opening_hours(${sql.json(before)})`;
    }
  });
});
