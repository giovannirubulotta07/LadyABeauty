import "server-only";
import { parseTstzRange } from "@/domain/time/range";
import { createSessionClient } from "@/server/auth/server-client";
import { createAdminClient } from "@/server/db/admin-client";
import type { Database } from "@/server/db/database.types";

export type AppointmentView = {
  id: string;
  serviceName: string;
  variantName: string | null;
  durationMin: number;
  priceCents: number | null;
  start: Date;
  end: Date;
  status: Database["public"]["Enums"]["appointment_status"];
  clientNote: string | null;
  cancelledAt: string | null;
};

const COLUMNS =
  "id, service_name, variant_name, duration_min, price_cents, period, status, client_note, cancelled_at";

type Row = {
  id: string;
  service_name: string;
  variant_name: string | null;
  duration_min: number;
  price_cents: number | null;
  period: unknown;
  status: AppointmentView["status"];
  client_note: string | null;
  cancelled_at: string | null;
};

function toView(row: Row): AppointmentView {
  const { start, end } = parseTstzRange(row.period as string);
  return {
    id: row.id,
    serviceName: row.service_name,
    variantName: row.variant_name,
    durationMin: row.duration_min,
    priceCents: row.price_cents,
    start,
    end,
    status: row.status,
    clientNote: row.client_note,
    cancelledAt: row.cancelled_at,
  };
}

/** One of the signed-in client's appointments (RLS guarantees ownership), or null. */
export async function getMyAppointment(
  id: string,
): Promise<AppointmentView | null> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toView(data) : null;
}

/** All of the signed-in client's appointments, most recent first. */
export async function listMyAppointments(): Promise<AppointmentView[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(COLUMNS)
    .order("period", { ascending: false });
  if (error) throw error;
  return data.map(toView);
}

/** Server-side lookup for signed links (no session). */
export async function getAppointmentById(
  id: string,
): Promise<AppointmentView | null> {
  const { data, error } = await createAdminClient()
    .from("appointments")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toView(data) : null;
}
