import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { parisInstant } from "@/domain/time/paris";
import { TEST_DAY, cleanDays, connect, type Sql } from "./helpers";

/**
 * Admin Server Actions: refused without the admin session (nothing written),
 * validated and executed with it. The session itself is mocked; the database
 * calls are real.
 */
const session = vi.hoisted(() => ({ admin: null as null | { id: string } }));
vi.mock("@/server/admin/guard", () => ({
  getAdmin: async () =>
    session.admin && {
      ...session.admin,
      email: "admin@example.test",
      isAdmin: true,
      hasPassword: true,
    },
  requireAdmin: async () => {
    if (!session.admin) throw new Error("ADMIN_REQUIRED");
    return session.admin;
  },
}));
// `after()` needs a request context: run the callback right away instead.
vi.mock("next/server", () => ({ after: () => {} }));

const { createStudioBlock, deleteStudioBlock, setEveningUnlocked } =
  await import("@/server/admin/actions/agenda");
const { addClientNote } = await import("@/server/admin/actions/clients");
const { saveOpeningHours } = await import("@/server/admin/actions/settings");
const { NOT_ADMIN } = await import("@/server/admin/action-utils");

let sql: Sql;
/** A real auth user: blocks and notes reference auth.users (created_by). */
let adminId: string;
beforeAll(async () => {
  sql = connect(2);
  const [user] = await sql<{ id: string }[]>`
    insert into auth.users (id, aud, role, email, raw_app_meta_data)
    values (gen_random_uuid(), 'authenticated', 'authenticated',
            ${`db-test-admin-${Date.now()}@example.test`}, '{"role":"admin"}')
    returning id`;
  adminId = user!.id;
  await cleanDays(sql, [TEST_DAY]);
});
afterEach(async () => {
  session.admin = null;
  await cleanDays(sql, [TEST_DAY]);
  await sql`delete from public.day_overrides where day = ${TEST_DAY}`;
});
afterAll(async () => {
  await sql`delete from auth.users where id = ${adminId}`;
  await sql.end();
});

const blocksOnTestDay = () =>
  sql<{ id: string }[]>`select id from public.blocks
    where period && tstzrange(${parisInstant(TEST_DAY, "00:00")}, ${parisInstant(TEST_DAY, "23:59")})`;

describe("actions admin", () => {
  it("sans session admin : refus, rien n'est écrit", async () => {
    const block = await createStudioBlock({
      from: TEST_DAY,
      to: TEST_DAY,
      allDay: true,
    });
    expect(block).toEqual({ ok: false, error: NOT_ADMIN });
    expect(await blocksOnTestDay()).toHaveLength(0);

    expect(await setEveningUnlocked({ day: TEST_DAY, unlocked: true })).toEqual(
      {
        ok: false,
        error: NOT_ADMIN,
      },
    );
    expect(await saveOpeningHours({ windows: [] })).toEqual({
      ok: false,
      error: NOT_ADMIN,
    });
    expect(
      await addClientNote({
        clientId: "00000000-0000-0000-0000-000000000000",
        body: "x",
      }),
    ).toEqual({ ok: false, error: NOT_ADMIN });
  });

  it("avec la session admin : valide, écrit, puis retire", async () => {
    session.admin = { id: adminId };

    const invalid = await createStudioBlock({
      from: TEST_DAY,
      to: TEST_DAY,
      allDay: false,
      startTime: "11:00",
      endTime: "10:00",
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok)
      expect(invalid.fieldErrors?.endTime).toMatch(/après le début/);

    expect(
      await createStudioBlock({
        from: TEST_DAY,
        to: TEST_DAY,
        allDay: false,
        startTime: "10:00",
        endTime: "11:30",
        reason: "Test",
      }),
    ).toEqual({ ok: true });
    const [block] = await blocksOnTestDay();
    expect(block).toBeDefined();
    expect(await deleteStudioBlock({ id: block!.id })).toEqual({ ok: true });
    expect(await blocksOnTestDay()).toHaveLength(0);

    expect(await setEveningUnlocked({ day: TEST_DAY, unlocked: true })).toEqual(
      {
        ok: true,
      },
    );
    const [override] = await sql<{ evening_unlocked: boolean }[]>`
      select evening_unlocked from public.day_overrides where day = ${TEST_DAY}`;
    expect(override!.evening_unlocked).toBe(true);
  });

  it("refuse des horaires d'ouverture qui se chevauchent, sans rien changer", async () => {
    session.admin = { id: adminId };
    const before =
      await sql`select weekday, opens, closes from public.opening_hours order by 1, 2`;
    const result = await saveOpeningHours({
      windows: [
        { weekday: 1, opens: "10:00", closes: "14:00" },
        { weekday: 1, opens: "13:00", closes: "18:00" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.fieldErrors?.day1).toBe("Deux plages se chevauchent.");
    expect(
      await sql`select weekday, opens, closes from public.opening_hours order by 1, 2`,
    ).toEqual(before);
  });
});
