import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { parisInstant } from "@/domain/time/paris";
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
let extension: { id: string; name: string; duration_min: number };
let rehaussement: { id: string; name: string; duration_min: number };

beforeAll(async () => {
  sql = connect(5);
  clientId = await anyClient(sql);
  extension = await serviceBySlug(sql, "extension-cils");
  rehaussement = await serviceBySlug(sql, "rehaussement-cils");
  await cleanDays(sql, [TEST_DAY, TEST_DAY_2]);
});

afterEach(() => cleanDays(sql, [TEST_DAY, TEST_DAY_2]));
afterAll(() => sql.end());

const ext = (time: string, day = TEST_DAY) => ({
  clientId,
  service: extension,
  durationMin: 105,
  day,
  time,
});
const reh = (time: string, day = TEST_DAY) => ({
  clientId,
  service: rehaussement,
  durationMin: 60,
  day,
  time,
});

describe("create_appointment — aucun double rendez-vous", () => {
  it("deux clientes confirment le même créneau au même instant : une seule réussit", async () => {
    const a = connect();
    const b = connect();
    try {
      // Client A's transaction books and is still open when client B tries.
      let releaseA!: () => void;
      const aHolds = new Promise<void>((resolve) => (releaseA = resolve));
      let aBooked!: () => void;
      const aDidBook = new Promise<void>((resolve) => (aBooked = resolve));

      const txA = a.begin(async (tx) => {
        await book(tx as unknown as Sql, ext("12:00"));
        aBooked();
        await aHolds; // keep the transaction (and its lock) open
      });
      await aDidBook;

      const resultB = outcome(book(b, ext("12:00"))); // blocks on the day lock
      await new Promise((r) => setTimeout(r, 300));
      releaseA(); // A commits
      await txA;

      expect(await resultB).toBe("SLOT_TAKEN");
      const [row] = await sql<{ count: number }[]>`
        select count(*)::int from public.appointments
        where period @> ${parisInstant(TEST_DAY, "12:30")}::timestamptz and status <> 'cancelled'`;
      expect(row?.count).toBe(1);
    } finally {
      await Promise.all([a.end(), b.end()]);
    }
  });

  it("20 réservations simultanées qui se chevauchent : exactement une passe", async () => {
    const pools = Array.from({ length: 20 }, () => connect());
    try {
      const starts = Array.from({ length: 20 }, (_, i) => {
        const minutes = 10 * 60 + i * 5; // 10:00, 10:05, … 11:35 — all overlap 10:00–11:45
        return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      });
      const results = await Promise.all(
        starts.map((t, i) => outcome(book(pools[i]!, ext(t)))),
      );
      expect(results.filter((r) => r === "OK")).toHaveLength(1);
      expect(results.filter((r) => r === "SLOT_TAKEN")).toHaveLength(19);
    } finally {
      await Promise.all(pools.map((p) => p.end()));
    }
  });

  it("des créneaux qui se touchent sans se chevaucher sont acceptés (11:45 → 12:45 → 13:45)", async () => {
    expect(await outcome(book(sql, ext("10:00")))).toBe("OK");
    expect(await outcome(book(sql, reh("11:45")))).toBe("OK");
    expect(await outcome(book(sql, reh("12:45")))).toBe("OK");
    expect(await outcome(book(sql, reh("12:44")))).toBe("SLOT_TAKEN");
  });

  it("un rendez-vous annulé libère le créneau", async () => {
    const id = await book(sql, ext("14:30"));
    expect(await outcome(book(sql, ext("14:30")))).toBe("SLOT_TAKEN");
    await sql`update public.appointments set status = 'cancelled', cancelled_at = now() where id = ${id}`;
    expect(await outcome(book(sql, ext("14:30")))).toBe("OK");
  });

  it("même un INSERT direct ne peut pas créer de chevauchement (contrainte EXCLUDE)", async () => {
    await book(sql, ext("16:00"));
    const range = `[${parisInstant(TEST_DAY, "17:00").toISOString()},${parisInstant(TEST_DAY, "18:00").toISOString()})`;
    const result = await outcome(sql`
      insert into public.appointments (service_name, duration_min, period, source)
      values ('Direct', 60, ${range}::tstzrange, 'admin')`);
    expect(result).toMatch(/appointments_no_overlap/);
  });

  it("refuse une durée invalide", async () => {
    expect(await outcome(book(sql, { ...ext("10:00"), durationMin: 0 }))).toBe(
      "INVALID_DURATION",
    );
  });
});

describe("blocages et créneaux retenus", () => {
  const range = (from: string, to: string, day = TEST_DAY) =>
    `[${parisInstant(day, from).toISOString()},${parisInstant(day, to).toISOString()})`;

  it("un blocage empêche la réservation", async () => {
    await sql`select public.create_block(${range("12:00", "14:00")}::tstzrange, 'Formation', null)`;
    expect(await outcome(book(sql, ext("12:00")))).toBe("SLOT_BLOCKED");
    expect(await outcome(book(sql, ext("10:00")))).toBe("OK"); // 10:00–11:45 is outside the block
  });

  it("course entre un blocage en cours et une réservation : jamais les deux (verrou par jour)", async () => {
    const admin = connect();
    const client = connect();
    try {
      let commitBlock!: () => void;
      const blockOpen = new Promise<void>((r) => (commitBlock = r));
      let blockWritten!: () => void;
      const written = new Promise<void>((r) => (blockWritten = r));

      const txBlock = admin.begin(async (tx) => {
        await tx`select public.create_block(${range("12:00", "14:00")}::tstzrange, 'Course', null)`;
        blockWritten();
        await blockOpen;
      });
      await written;
      const booking = outcome(book(client, ext("12:00"))); // must wait for the block's transaction
      await new Promise((r) => setTimeout(r, 300));
      commitBlock();
      await txBlock;
      expect(await booking).toBe("SLOT_BLOCKED");
    } finally {
      await Promise.all([admin.end(), client.end()]);
    }
  });

  it("un blocage ne peut pas masquer un rendez-vous existant", async () => {
    await book(sql, ext("10:00"));
    expect(
      await outcome(
        sql`select public.create_block(${range("09:00", "11:00")}::tstzrange, null, null)`,
      ),
    ).toBe("SLOT_TAKEN");
  });

  it("des congés sur plusieurs jours verrouillent chaque jour et bloquent tout", async () => {
    const holidays = `[${parisInstant(TEST_DAY, "00:00").toISOString()},${parisInstant(TEST_DAY_2, "23:59").toISOString()})`;
    await sql`select public.create_block(${holidays}::tstzrange, 'Congés', null)`;
    expect(await outcome(book(sql, ext("16:00", TEST_DAY_2)))).toBe(
      "SLOT_BLOCKED",
    );
  });

  describe("créneau retenu (liste d'attente)", () => {
    let offerId: string;

    // Recreated for each test: the outer cleanup deletes the day's waitlist (and its offers).
    beforeEach(async () => {
      const [entry] = await sql<{ id: string }[]>`
        insert into public.waitlist_entries (client_id, service_id, day, duration_min)
        values (${clientId}, ${extension.id}, ${TEST_DAY}, 105) returning id`;
      const [offer] = await sql<{ id: string }[]>`
        insert into public.waitlist_offers (entry_id, period, token_hash)
        values (${entry!.id}, ${range("12:00", "13:45")}::tstzrange, ${"test-" + Date.now()}) returning id`;
      offerId = offer!.id;
    });

    it("bloque les autres clientes mais pas celle qui détient l'offre", async () => {
      await sql`insert into public.slot_holds (offer_id, period, expires_at)
                values (${offerId}, ${range("12:00", "13:45")}::tstzrange, now() + interval '30 minutes')`;
      expect(await outcome(book(sql, ext("12:00")))).toBe("SLOT_HELD");
      expect(
        await outcome(book(sql, { ...ext("12:00"), holdOfferId: offerId })),
      ).toBe("OK");
    });

    it("un hold expiré ou libéré ne bloque plus", async () => {
      await sql`insert into public.slot_holds (offer_id, period, expires_at)
                values (${offerId}, ${range("12:00", "13:45")}::tstzrange, now() - interval '1 minute')`;
      expect(await outcome(book(sql, ext("12:00")))).toBe("OK");
    });
  });
});

describe("droits d'accès", () => {
  async function asRole(
    role: "anon" | "authenticated",
    claims: object,
    query: (tx: Sql) => Promise<unknown>,
  ) {
    return outcome(
      sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`);
        await tx`select set_config('request.jwt.claims', ${JSON.stringify(claims)}, true)`;
        await query(tx as unknown as Sql);
      }),
    );
  }

  it("ni un visiteur anonyme ni une cliente connectée ne peuvent appeler create_appointment", async () => {
    expect(
      await asRole("anon", { role: "anon" }, (tx) => book(tx, ext("10:00"))),
    ).toMatch(/permission denied/);
    expect(
      await asRole(
        "authenticated",
        { role: "authenticated", sub: crypto.randomUUID() },
        (tx) => book(tx, ext("10:00")),
      ),
    ).toMatch(/permission denied/);
  });

  it("une cliente connectée ne peut pas insérer un rendez-vous directement (RLS)", async () => {
    const range = `[${parisInstant(TEST_DAY, "10:00").toISOString()},${parisInstant(TEST_DAY, "11:00").toISOString()})`;
    const result = await asRole(
      "authenticated",
      { role: "authenticated", sub: crypto.randomUUID() },
      (tx) =>
        tx`insert into public.appointments (service_name, duration_min, period, source)
         values ('X', 60, ${range}::tstzrange, 'online')`,
    );
    expect(result).toMatch(/row-level security/);
  });

  it("une cliente ne voit que ses propres rendez-vous ; l'admin voit tout", async () => {
    await book(sql, ext("10:00"));
    const stranger = { role: "authenticated", sub: crypto.randomUUID() };
    let seen = -1;
    await asRole("authenticated", stranger, async (tx) => {
      const [row] = await tx<
        { n: number }[]
      >`select count(*)::int as n from public.appointments`;
      seen = row!.n;
    });
    expect(seen).toBe(0);

    const admin = {
      role: "authenticated",
      sub: crypto.randomUUID(),
      app_metadata: { role: "admin" },
    };
    await asRole("authenticated", admin, async (tx) => {
      const [row] = await tx<
        { n: number }[]
      >`select count(*)::int as n from public.appointments`;
      seen = row!.n;
    });
    expect(seen).toBeGreaterThan(0);
  });
});
