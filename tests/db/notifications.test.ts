import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { parisInstant } from "@/domain/time/paris";
import { sendDueReminders } from "@/server/jobs/tasks";
import {
  notifyAppointmentCancelled,
  notifyBookingConfirmed,
} from "@/server/notifications/events";
import {
  TEST_DAY,
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
  sql = connect(5);
  clientId = await anyClient(sql);
  service = await serviceBySlug(sql, "rehaussement-cils");
});
afterEach(async () => {
  await sql`delete from public.notification_log where idempotency_key like 'test:%'
            or appointment_id in (select id from public.appointments where period && tstzrange(${parisInstant(TEST_DAY, "00:00")}, ${parisInstant(TEST_DAY, "23:59")}))`;
  await cleanDays(sql, [TEST_DAY]);
});
afterAll(() => sql.end());

const claim = (db: Sql, key: string) =>
  db<
    { id: string | null }[]
  >`select public.claim_notification(${key}, 'test', 'email', 'x@example.test') as id`.then(
    (r) => r[0]!.id,
  );

describe("claim_notification — au plus une fois", () => {
  it("20 tentatives simultanées pour le même message : une seule obtient le droit d'envoyer", async () => {
    const pools = Array.from({ length: 20 }, () => connect());
    try {
      const key = `test:concurrent:${Date.now()}`;
      const ids = await Promise.all(pools.map((p) => claim(p, key)));
      expect(ids.filter(Boolean)).toHaveLength(1);
    } finally {
      await Promise.all(pools.map((p) => p.end()));
    }
  });

  it("un échec explicite peut être retenté (3 fois max), un envoi réussi ou incertain jamais", async () => {
    const key = `test:retry:${Date.now()}`;
    const first = await claim(sql, key);
    expect(first).toBeTruthy();
    expect(await claim(sql, key)).toBeNull(); // 'queued' = outcome unknown → never resent

    await sql`update public.notification_log set status = 'failed' where id = ${first}`;
    expect(await claim(sql, key)).toBe(first); // attempt 2
    await sql`update public.notification_log set status = 'failed' where id = ${first}`;
    expect(await claim(sql, key)).toBe(first); // attempt 3
    await sql`update public.notification_log set status = 'failed' where id = ${first}`;
    expect(await claim(sql, key)).toBeNull(); // gave up

    const sentKey = `test:sent:${Date.now()}`;
    const sent = await claim(sql, sentKey);
    await sql`update public.notification_log set status = 'sent' where id = ${sent}`;
    expect(await claim(sql, sentKey)).toBeNull();
  });

  it("n'est pas accessible aux visiteuses ni aux clientes", async () => {
    const result = await outcome(
      sql.begin(async (tx) => {
        await tx.unsafe("set local role authenticated");
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ role: "authenticated", sub: crypto.randomUUID() })}, true)`;
        await claim(tx as unknown as Sql, "test:denied");
      }),
    );
    expect(result).toMatch(/permission denied/);
  });

  it("l'adresse de notification d'Alessia reste privée", async () => {
    let rows = -1;
    await sql.begin(async (tx) => {
      await tx.unsafe("set local role anon");
      rows = (await tx`select * from public.studio_private_settings`).length;
    });
    expect(rows).toBe(0);
  });
});

describe("rappels de la veille", () => {
  const dayBefore = (time: string) => parisInstant("2031-03-03", time);

  async function reminderLogs() {
    const rows = await sql<{ n: number }[]>`
      select count(*)::int as n from public.notification_log
      where kind = 'booking_reminder' and status = 'sent'
        and appointment_id in (select id from public.appointments where period && tstzrange(${parisInstant(TEST_DAY, "00:00")}, ${parisInstant(TEST_DAY, "23:59")}))`;
    return rows[0]!.n;
  }

  it("rien avant 9:00 la veille, un seul rappel ensuite, même si le job tourne plusieurs fois en parallèle", async () => {
    await book(sql, {
      clientId,
      service,
      durationMin: 60,
      day: TEST_DAY,
      time: "10:00",
    });

    expect((await sendDueReminders(dayBefore("08:59"))).due).toBe(0);

    const runs = await Promise.all(
      Array.from({ length: 5 }, () => sendDueReminders(dayBefore("09:05"))),
    );
    expect(runs.reduce((n, r) => n + r.sent, 0)).toBe(1);
    expect((await sendDueReminders(dayBefore("14:00"))).sent).toBe(0);
    expect(await reminderLogs()).toBe(1);
  });

  it("un rendez-vous déplacé reçoit un nouveau rappel ; un rendez-vous annulé n'en reçoit pas", async () => {
    const id = await book(sql, {
      clientId,
      service,
      durationMin: 60,
      day: TEST_DAY,
      time: "12:00",
    });
    await sendDueReminders(dayBefore("09:05"));
    expect(await reminderLogs()).toBe(1);

    const moved = `[${parisInstant(TEST_DAY, "16:00").toISOString()},${parisInstant(TEST_DAY, "17:00").toISOString()})`;
    await sql`update public.appointments set period = ${moved}::tstzrange where id = ${id}`;
    expect((await sendDueReminders(dayBefore("10:00"))).sent).toBe(1);

    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${id}`;
    expect((await sendDueReminders(dayBefore("11:00"))).due).toBe(0);
  });
});

describe("e-mails de réservation et d'annulation", () => {
  it("confirmation (cliente + Alessia) envoyée une seule fois même si l'événement est rejoué", async () => {
    const id = await book(sql, {
      clientId,
      service,
      durationMin: 60,
      day: TEST_DAY,
      time: "14:30",
    });
    expect((await notifyBookingConfirmed(id)).sort()).toEqual(["sent", "sent"]);
    expect(await notifyBookingConfirmed(id)).toEqual(["skipped", "skipped"]);

    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${id}`;
    expect(
      (await notifyAppointmentCancelled(id, { by: "client" })).sort(),
    ).toEqual(["sent", "sent"]);
    // When Alessia cancels herself, only the client is told.
    const other = await book(sql, {
      clientId,
      service,
      durationMin: 60,
      day: TEST_DAY,
      time: "16:00",
    });
    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${other}`;
    expect(await notifyAppointmentCancelled(other, { by: "studio" })).toEqual([
      "sent",
    ]);
  });
});
