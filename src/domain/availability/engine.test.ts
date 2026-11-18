import { describe, expect, it } from "vitest";
import type { OpeningWindow } from "@/domain/schedule/opening-hours";
import {
  addDays,
  parisDate,
  parisInstant,
  parisTime,
  type LocalDate,
} from "@/domain/time/paris";
import {
  type AvailabilitySettings,
  type BusyInterval,
  type DayInput,
  computeDaySlots,
  computeDayStatus,
  isSlotBookable,
  openingWindows,
} from "./engine";

// ---------------------------------------------------------------------------
// Fixtures: the brief's rules and the real durations
// ---------------------------------------------------------------------------
const EXTENSION = 105; // Extension cils, 1 h 45
const REMPLISSAGE = 90; // 1 h 30
const REHAUSSEMENT = 60; // 1 h
const SOURCILS = 15;

/** Mon–Fri 10:00–14:00 & 14:30–20:00, Sat 10:00–14:30, Sun closed. */
const WEEK: OpeningWindow[] = [
  ...([1, 2, 3, 4, 5] as const).flatMap((weekday) => [
    { weekday, opens: "10:00:00", closes: "14:00:00" },
    { weekday, opens: "14:30:00", closes: "20:00:00" },
  ]),
  { weekday: 6, opens: "10:00:00", closes: "14:30:00" },
];

const SETTINGS: AvailabilitySettings = {
  minNoticeMinutes: 120,
  maxAdvanceDays: 60,
  referenceStarts: ["10:00", "12:00", "14:30", "16:00", "18:00"],
  eveningLockFrom: "18:00",
};

const TUESDAY = "2026-11-24";
const SATURDAY = "2026-11-28";
const SUNDAY = "2026-11-29";
const NOW = new Date("2026-11-18T08:00:00Z"); // Wednesday 18 Nov, 09:00 in Paris

function appointment(
  day: LocalDate,
  from: string,
  minutes: number,
): BusyInterval {
  const start = parisInstant(day, from);
  return {
    start,
    end: new Date(start.getTime() + minutes * 60_000),
    kind: "appointment",
  };
}

function busy(
  kind: BusyInterval["kind"],
  day: LocalDate,
  from: string,
  to: string,
): BusyInterval {
  return { start: parisInstant(day, from), end: parisInstant(day, to), kind };
}

function input(
  overrides: Partial<DayInput> & Pick<DayInput, "day" | "durationMin">,
): DayInput {
  return {
    now: NOW,
    settings: SETTINGS,
    weeklyHours: WEEK,
    override: null,
    busy: [],
    ...overrides,
  };
}

/** Compact view: "10:00" for available, "18:00*" for "sur demande". */
function times(day: DayInput): string[] {
  return computeDaySlots(day).map((s) =>
    s.status === "on_request" ? `${s.time}*` : s.time,
  );
}

// ---------------------------------------------------------------------------
// The brief's examples (section 5)
// ---------------------------------------------------------------------------
describe("exemples du brief", () => {
  it("jour de semaine vide, extension 1 h 45 : 10:00, 12:00, 14:30, 16:00 ; 18:00 sur demande", () => {
    expect(times(input({ day: TUESDAY, durationMin: EXTENSION }))).toEqual([
      "10:00",
      "12:00",
      "14:30",
      "16:00",
      "18:00*",
    ]);
  });

  it("extension à 10:00 (→ 11:45), prestation d'1 h : 11:45 puis 12:00 sont proposés", () => {
    const ext = appointment(TUESDAY, "10:00", EXTENSION);
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [ext] })),
    ).toEqual(["11:45", "12:00", "14:30", "16:00", "18:00*"]);
  });

  it("après réservation de 11:45–12:45, 12:45 est proposé : deux prestations d'1 h tiennent entre 11:45 et 14:00", () => {
    const ext = appointment(TUESDAY, "10:00", EXTENSION);
    const first = appointment(TUESDAY, "11:45", REHAUSSEMENT);
    const slots = times(
      input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [ext, first] }),
    );
    expect(slots).toContain("12:45");
    expect(slots).not.toContain("12:00"); // would overlap 11:45–12:45

    const second = appointment(TUESDAY, "12:45", REHAUSSEMENT);
    const after = computeDaySlots(
      input({
        day: TUESDAY,
        durationMin: REHAUSSEMENT,
        busy: [ext, first, second],
      }),
    );
    expect(after.filter((s) => s.time < "14:00")).toEqual([]); // the morning is now full
    expect(parisTime(second.end)).toBe("13:45");
  });

  it("extension à 10:00, nouvelle extension : 12:00 (12:00–13:45) est proposé, rien ne traverse la pause", () => {
    const ext = appointment(TUESDAY, "10:00", EXTENSION);
    const slots = computeDaySlots(
      input({ day: TUESDAY, durationMin: EXTENSION, busy: [ext] }),
    );
    const noon = slots.find((s) => s.time === "12:00");
    expect(noon && parisTime(noon.end)).toBe("13:45");
    // 11:45 also fits (11:45–13:30) thanks to the "right after" rule.
    expect(slots.map((s) => s.time)).toEqual([
      "11:45",
      "12:00",
      "14:30",
      "16:00",
      "18:00",
    ]);
    for (const s of slots) {
      const crossesBreak =
        s.start < parisInstant(TUESDAY, "14:30") &&
        s.end > parisInstant(TUESDAY, "14:00");
      expect(crossesBreak, s.time).toBe(false);
    }
  });

  it("emboîtement avant : un créneau qui se termine exactement au début d'un rendez-vous", () => {
    const ext = appointment(TUESDAY, "16:00", EXTENSION); // 16:00–17:45
    const slots = computeDaySlots(
      input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [ext] }),
    );
    const before = slots.find((s) => s.time === "15:00");
    expect(before, "15:00 = 16:00 − 1 h").toBeDefined();
    expect(before!.end.getTime()).toBe(ext.start.getTime());
    expect(
      slots.map((s) => (s.status === "on_request" ? `${s.time}*` : s.time)),
    ).toEqual(["10:00", "12:00", "14:30", "15:00", "17:45", "18:00*"]);
  });

  it("emboîtement avant : seul moyen de remplir la matinée sans trou", () => {
    // A remplissage booked at 11:30 (→ 13:00). Rule (b) proposes 10:00 for 1 h 30 only
    // because 11:30 − 1 h 30 = 10:00; for a 1 h service it proposes 10:30 (→ 11:30).
    const morning = appointment(TUESDAY, "11:30", REMPLISSAGE);
    const slots = times(
      input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [morning] }),
    );
    expect(slots).toContain("10:30");
    expect(slots).toContain("10:00"); // reference start, ends 11:00: also fits
    expect(slots).toContain("13:00"); // rule (a)
  });

  it("une prestation qui finirait après la pause ou après la fermeture n'est jamais proposée", () => {
    // 2 h 30: from 12:00 it would end at 14:30 (break), from 18:00 at 20:30 (closing).
    const slots = times(input({ day: TUESDAY, durationMin: 150 }));
    expect(slots).toEqual(["10:00", "14:30", "16:00"]);
    // Busy edges must not create a start that crosses the break either.
    const late = appointment(TUESDAY, "14:30", REHAUSSEMENT); // b: 14:30 − 1 h 45 = 12:45 → ends 14:30
    expect(
      times(input({ day: TUESDAY, durationMin: EXTENSION, busy: [late] })),
    ).not.toContain("12:45");
  });

  it("samedi : rien au-delà de la fermeture (14:30)", () => {
    expect(times(input({ day: SATURDAY, durationMin: EXTENSION }))).toEqual([
      "10:00",
      "12:00",
    ]);
    expect(times(input({ day: SATURDAY, durationMin: REHAUSSEMENT }))).toEqual([
      "10:00",
      "12:00",
    ]);
    expect(times(input({ day: SATURDAY, durationMin: 180 }))).toEqual([
      "10:00",
    ]);
    for (const s of computeDaySlots(
      input({ day: SATURDAY, durationMin: REMPLISSAGE }),
    )) {
      expect(s.end <= parisInstant(SATURDAY, "14:30")).toBe(true);
    }
  });

  it("jour avec 18:00 débloqué : 18:00 devient réservable", () => {
    const override = {
      closed: false,
      eveningUnlocked: true,
      customHours: null,
    };
    expect(
      times(input({ day: TUESDAY, durationMin: EXTENSION, override })),
    ).toEqual(["10:00", "12:00", "14:30", "16:00", "18:00"]);
  });

  it("dimanche : fermé", () => {
    expect(times(input({ day: SUNDAY, durationMin: SOURCILS }))).toEqual([]);
    expect(
      computeDayStatus(input({ day: SUNDAY, durationMin: SOURCILS })),
    ).toBe("closed");
  });
});

// ---------------------------------------------------------------------------
// Daylight saving time
// ---------------------------------------------------------------------------
describe("changement d'heure", () => {
  const now = new Date("2026-03-20T08:00:00Z");

  it("passage à l'heure d'été (29/03) : mêmes horaires locaux, instants UTC décalés d'une heure", () => {
    const before = computeDaySlots(
      input({ day: "2026-03-28", durationMin: EXTENSION, now }),
    );
    const after = computeDaySlots(
      input({ day: "2026-03-30", durationMin: EXTENSION, now }),
    );
    expect(before.map((s) => s.time)).toEqual(["10:00", "12:00"]); // Saturday
    expect(after.map((s) => s.time)).toEqual([
      "10:00",
      "12:00",
      "14:30",
      "16:00",
      "18:00",
    ]);
    expect(before[0]!.start.toISOString()).toBe("2026-03-28T09:00:00.000Z"); // UTC+1
    expect(after[0]!.start.toISOString()).toBe("2026-03-30T08:00:00.000Z"); // UTC+2
  });

  it("un rendez-vous stocké en UTC après le changement est lu à la bonne heure locale", () => {
    const stored: BusyInterval = {
      start: new Date("2026-03-30T08:00:00Z"),
      end: new Date("2026-03-30T09:45:00Z"),
      kind: "appointment",
    };
    expect(
      times(
        input({
          day: "2026-03-30",
          durationMin: REHAUSSEMENT,
          now,
          busy: [stored],
        }),
      ),
    ).toEqual(["11:45", "12:00", "14:30", "16:00", "18:00*"]);
  });

  it("passage à l'heure d'hiver (25/10) : idem dans l'autre sens", () => {
    const octNow = new Date("2026-10-15T08:00:00Z");
    const sat = computeDaySlots(
      input({ day: "2026-10-24", durationMin: EXTENSION, now: octNow }),
    );
    const mon = computeDaySlots(
      input({ day: "2026-10-26", durationMin: EXTENSION, now: octNow }),
    );
    expect(sat[0]!.start.toISOString()).toBe("2026-10-24T08:00:00.000Z"); // UTC+2
    expect(mon[0]!.start.toISOString()).toBe("2026-10-26T09:00:00.000Z"); // UTC+1
    const stored: BusyInterval = {
      start: new Date("2026-10-26T09:00:00Z"),
      end: new Date("2026-10-26T10:45:00Z"),
      kind: "appointment",
    };
    expect(
      times(
        input({
          day: "2026-10-26",
          durationMin: REHAUSSEMENT,
          now: octNow,
          busy: [stored],
        }),
      )[0],
    ).toBe("11:45");
  });

  it("le préavis minimum se calcule en temps absolu, même la veille du changement", () => {
    // Saturday 28/03 at 08:30 Paris (UTC+1): with 2 h notice, 10:00 is too early, 12:00 is fine.
    const satMorning = new Date("2026-03-28T07:30:00Z");
    expect(
      times(
        input({
          day: "2026-03-28",
          durationMin: REHAUSSEMENT,
          now: satMorning,
        }),
      ),
    ).toEqual(["12:00"]);
  });
});

// ---------------------------------------------------------------------------
// Notice, horizon, overrides, blocks, holds
// ---------------------------------------------------------------------------
describe("préavis et horizon de réservation", () => {
  it("respecte le préavis minimum le jour même", () => {
    const now = parisInstant(TUESDAY, "10:30"); // 10:30 + 2 h = 12:30
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, now })),
    ).toEqual(["14:30", "16:00", "18:00*"]);
  });

  it("accepte un départ pile à la limite du préavis", () => {
    const now = parisInstant(TUESDAY, "10:00"); // 10:00 + 2 h = 12:00
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, now }))[0],
    ).toBe("12:00");
  });

  it("un préavis configurable change le résultat", () => {
    const now = parisInstant(TUESDAY, "08:00");
    const settings = { ...SETTINGS, minNoticeMinutes: 0 };
    expect(
      times(
        input({ day: TUESDAY, durationMin: REHAUSSEMENT, now, settings }),
      )[0],
    ).toBe("10:00");
  });

  it("refuse les jours passés", () => {
    const day = addDays(parisDate(NOW), -1);
    expect(times(input({ day, durationMin: SOURCILS }))).toEqual([]);
    expect(computeDayStatus(input({ day, durationMin: SOURCILS }))).toBe(
      "past",
    );
  });

  it("ouvre jusqu'à J+60 inclus, pas au-delà", () => {
    const last = addDays(parisDate(NOW), 60); // 2027-01-17 (Sunday)
    const lastWeekday = addDays(parisDate(NOW), 59); // Saturday 2027-01-16
    expect(
      times(input({ day: lastWeekday, durationMin: REHAUSSEMENT })),
    ).toEqual(["10:00", "12:00"]);
    expect(
      computeDayStatus(input({ day: last, durationMin: REHAUSSEMENT })),
    ).toBe("closed");
    const beyond = addDays(parisDate(NOW), 61);
    expect(times(input({ day: beyond, durationMin: REHAUSSEMENT }))).toEqual(
      [],
    );
    expect(
      computeDayStatus(input({ day: beyond, durationMin: REHAUSSEMENT })),
    ).toBe("beyond_horizon");
  });

  it("calcule « aujourd'hui » en heure de Paris, pas en UTC", () => {
    // 23:30 UTC on Monday 23/11 is already Tuesday 24/11 at 00:30 in Paris.
    const now = new Date("2026-11-23T23:30:00Z");
    expect(
      computeDayStatus(
        input({ day: "2026-11-23", durationMin: SOURCILS, now }),
      ),
    ).toBe("past");
    expect(times(input({ day: TUESDAY, durationMin: SOURCILS, now }))[0]).toBe(
      "10:00",
    );
  });
});

describe("ajustements de l'admin", () => {
  it("jour fermé exceptionnellement", () => {
    const override = {
      closed: true,
      eveningUnlocked: false,
      customHours: null,
    };
    expect(
      times(input({ day: TUESDAY, durationMin: SOURCILS, override })),
    ).toEqual([]);
    expect(
      computeDayStatus(
        input({ day: TUESDAY, durationMin: SOURCILS, override }),
      ),
    ).toBe("closed");
  });

  it("horaires spéciaux pour un jour", () => {
    const override = {
      closed: false,
      eveningUnlocked: false,
      customHours: [{ opens: "11:00", closes: "15:00" }],
    };
    // Only 12:00 (a reference start) fits a 1 h 45 service inside 11:00–15:00.
    expect(
      times(input({ day: TUESDAY, durationMin: EXTENSION, override })),
    ).toEqual(["12:00"]);
  });

  it("congés : un blocage sur toute la journée ferme le jour", () => {
    const holiday = busy("block", TUESDAY, "00:00", "23:59");
    expect(
      times(input({ day: TUESDAY, durationMin: SOURCILS, busy: [holiday] })),
    ).toEqual([]);
    expect(
      computeDayStatus(
        input({ day: TUESDAY, durationMin: SOURCILS, busy: [holiday] }),
      ),
    ).toBe("closed");
  });

  it("congés sur plusieurs jours (blocage qui déborde)", () => {
    const holidays: BusyInterval = {
      start: parisInstant("2026-11-23", "00:00"),
      end: parisInstant("2026-11-28", "00:00"),
      kind: "block",
    };
    expect(
      computeDayStatus(
        input({ day: TUESDAY, durationMin: SOURCILS, busy: [holidays] }),
      ),
    ).toBe("closed");
    expect(
      computeDayStatus(
        input({ day: SATURDAY, durationMin: SOURCILS, busy: [holidays] }),
      ),
    ).toBe("available");
  });

  it("une plage bloquée crée des départs d'emboîtement autour d'elle", () => {
    const block = busy("block", TUESDAY, "14:30", "15:30");
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [block] })),
    ).toEqual([
      "10:00",
      "12:00",
      "15:30", // right after the block
      "16:00",
      "18:00*",
    ]);
  });

  it("un créneau retenu pour la liste d'attente est occupé pour les autres", () => {
    const hold = busy("hold", TUESDAY, "12:00", "13:45");
    expect(
      times(input({ day: TUESDAY, durationMin: EXTENSION, busy: [hold] })),
    ).not.toContain("12:00");
    // …but the client holding it sees it (the caller excludes her own hold).
    expect(times(input({ day: TUESDAY, durationMin: EXTENSION }))).toContain(
      "12:00",
    );
  });

  it("le verrou du soir peut être désactivé (null)", () => {
    const settings = { ...SETTINGS, eveningLockFrom: null };
    expect(
      times(input({ day: TUESDAY, durationMin: EXTENSION, settings })),
    ).toContain("18:00");
  });

  it("le verrou s'applique aussi aux départs d'emboîtement après 18:00", () => {
    const evening = appointment(TUESDAY, "18:00", 30); // ends 18:30
    expect(
      times(
        input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: [evening] }),
      ),
    ).toContain("18:30*");
  });

  it("les départs de référence sont configurables", () => {
    const settings = {
      ...SETTINGS,
      referenceStarts: ["10:00", "13:00", "15:00"],
    };
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, settings })),
    ).toEqual(["10:00", "13:00", "15:00"]);
  });
});

describe("statut du jour", () => {
  it("complet quand plus rien ne rentre", () => {
    const day = [
      appointment(TUESDAY, "10:00", 240), // 10:00–14:00
      appointment(TUESDAY, "14:30", 330), // 14:30–20:00
    ];
    expect(
      computeDayStatus(
        input({ day: TUESDAY, durationMin: SOURCILS, busy: day }),
      ),
    ).toBe("full");
  });

  it("« sur demande uniquement » quand seul le soir reste", () => {
    const day = [
      appointment(TUESDAY, "10:00", 240),
      appointment(TUESDAY, "14:30", 210),
    ]; // → 18:00
    expect(
      times(input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: day })),
    ).toEqual(["18:00*"]);
    expect(
      computeDayStatus(
        input({ day: TUESDAY, durationMin: REHAUSSEMENT, busy: day }),
      ),
    ).toBe("on_request_only");
  });
});

describe("contrôle final avant écriture", () => {
  it("n'accepte qu'un départ proposé et disponible", () => {
    const day = input({ day: TUESDAY, durationMin: EXTENSION });
    expect(isSlotBookable(day, parisInstant(TUESDAY, "12:00"))).toBe(true);
    expect(isSlotBookable(day, parisInstant(TUESDAY, "12:05"))).toBe(false); // not a candidate
    expect(isSlotBookable(day, parisInstant(TUESDAY, "18:00"))).toBe(false); // on request
    expect(
      isSlotBookable(day, parisInstant(TUESDAY, "18:00"), {
        allowOnRequest: true,
      }),
    ).toBe(true); // admin
  });

  it("refuse un créneau qui vient d'être pris", () => {
    const taken = appointment(TUESDAY, "12:00", EXTENSION);
    expect(
      isSlotBookable(
        input({ day: TUESDAY, durationMin: EXTENSION, busy: [taken] }),
        parisInstant(TUESDAY, "12:00"),
      ),
    ).toBe(false);
  });

  it("rejette une durée invalide", () => {
    expect(() =>
      computeDaySlots(input({ day: TUESDAY, durationMin: 0 })),
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Property test: invariants on thousands of random days
// ---------------------------------------------------------------------------
describe("invariants (journées aléatoires)", () => {
  function prng(seed: number) {
    let a = seed;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("aucun créneau ne sort des horaires, ne chevauche, ne viole le préavis ; triés et uniques", () => {
    const rand = prng(42);
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
    const days = Array.from({ length: 70 }, (_, i) =>
      addDays("2026-03-01", i * 5),
    ); // spans both DST changes
    let checked = 0;

    for (let run = 0; run < 3000; run++) {
      const day = pick(days);
      const durationMin = 5 * (1 + Math.floor(rand() * 60)); // 5 min … 5 h
      const now = parisInstant(
        addDays(day, -Math.floor(rand() * 3)),
        pick(["07:00", "10:10", "13:00", "17:59"]),
      );
      const busyList: BusyInterval[] = [];
      for (let k = Math.floor(rand() * 5); k > 0; k--) {
        const from = `${String(9 + Math.floor(rand() * 11)).padStart(2, "0")}:${pick(["00", "15", "30", "45", "50"])}`;
        busyList.push({
          ...appointment(day, from, 5 * (1 + Math.floor(rand() * 30))),
          kind: pick(["appointment", "block", "hold"] as const),
        });
      }
      const override =
        rand() < 0.2
          ? { closed: false, eveningUnlocked: rand() < 0.5, customHours: null }
          : null;
      const dayInput = input({
        day,
        durationMin,
        now,
        busy: busyList,
        override,
      });

      const windows = openingWindows(day, WEEK, override);
      const slots = computeDaySlots(dayInput);
      let previous = -Infinity;
      for (const s of slots) {
        expect(s.end.getTime() - s.start.getTime()).toBe(durationMin * 60_000);
        expect(windows.some((w) => w.start <= s.start && s.end <= w.end)).toBe(
          true,
        );
        expect(busyList.some((b) => b.start < s.end && s.start < b.end)).toBe(
          false,
        );
        expect(s.start.getTime()).toBeGreaterThanOrEqual(
          now.getTime() + SETTINGS.minNoticeMinutes * 60_000,
        );
        expect(s.start.getTime()).toBeGreaterThan(previous);
        expect(parisDate(s.start)).toBe(day);
        expect(s.status === "on_request").toBe(
          s.time >= "18:00" && !override?.eveningUnlocked,
        );
        previous = s.start.getTime();
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(3000); // the property was exercised, not vacuously true
  });
});
