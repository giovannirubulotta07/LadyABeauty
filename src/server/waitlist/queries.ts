import "server-only";
import type { LocalDate } from "@/domain/time/paris";
import { createSessionClient } from "@/server/auth/server-client";

export type MyWaitlistEntry = {
  id: string;
  day: LocalDate;
  status: "waiting" | "notified";
  serviceName: string;
};

/** The signed-in client's active waitlist registrations (RLS: her own rows only). */
export async function listMyWaitlist(): Promise<MyWaitlistEntry[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("id, day, status, services (name), service_variants (name)")
    .in("status", ["waiting", "notified"])
    .order("day");
  if (error) throw error;
  return data.map((e) => ({
    id: e.id,
    day: e.day,
    status: e.status as MyWaitlistEntry["status"],
    serviceName: [e.services?.name, e.service_variants?.name]
      .filter(Boolean)
      .join(" — "),
  }));
}
