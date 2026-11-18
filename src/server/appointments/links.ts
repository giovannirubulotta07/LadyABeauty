import "server-only";
import { createLinkToken } from "@/server/security/tokens";
import type { AppointmentView } from "./queries";

const DAY = 86_400_000;

/** Signed, expiring link to the appointment's .ics file (valid until 30 days after it). */
export function icsPath(
  appointment: Pick<AppointmentView, "id" | "end">,
): string {
  const token = createLinkToken(
    "ics",
    appointment.id,
    new Date(appointment.end.getTime() + 30 * DAY),
  );
  return `/api/ics/${token}`;
}
