import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

const event = {
  uid: "appt-1@ladyabeauty",
  start: new Date("2026-11-24T09:00:00Z"),
  end: new Date("2026-11-24T10:45:00Z"),
  summary: "Extension cils — Lady A Beauty",
  location: "Avenue de Verdun, 74100 Annemasse",
  description: "Rendez-vous; à bientôt\nAlessia",
  stamp: new Date("2026-11-18T10:00:00Z"),
  alarmMinutesBefore: 120,
};

describe("buildIcs", () => {
  const ics = buildIcs(event);

  it("uses CRLF line endings and the required envelope", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n").every((l) => !l.includes("\n"))).toBe(true);
  });

  it("writes UTC times", () => {
    expect(ics).toContain("DTSTART:20261124T090000Z");
    expect(ics).toContain("DTEND:20261124T104500Z");
    expect(ics).toContain("DTSTAMP:20261118T100000Z");
  });

  it("escapes special characters", () => {
    expect(ics).toContain("LOCATION:Avenue de Verdun\\, 74100 Annemasse");
    expect(ics).toContain("DESCRIPTION:Rendez-vous\; à bientôt\\nAlessia");
  });

  it("adds a reminder alarm", () => {
    expect(ics).toContain("TRIGGER:-PT120M");
  });

  it("folds long lines at 75 octets without breaking characters", () => {
    const long = buildIcs({ ...event, description: "é".repeat(100) });
    for (const line of long.split("\r\n"))
      expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
    const unfolded = long.replace(/\r\n /g, "");
    expect(unfolded).toContain(`DESCRIPTION:${"é".repeat(100)}`);
  });
});
