import "server-only";
import { parseTstzRange } from "@/domain/time/range";
import { createAdminClient } from "@/server/db/admin-client";
import { requireAdmin } from "./guard";

export type ClientSummary = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  hasAccount: boolean;
};

const SUMMARY = "id, full_name, email, phone, user_id";
const toSummary = (c: {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_id: string | null;
}): ClientSummary => ({
  id: c.id,
  fullName: c.full_name,
  email: c.email,
  phone: c.phone,
  hasAccount: c.user_id != null,
});

/** Escapes the characters PostgREST filters treat specially. */
const likeTerm = (q: string) =>
  `%${q.replace(/[\\%_]/g, (m) => `\\${m}`).replace(/[,()]/g, " ")}%`;

/** Name, e-mail or phone (digits only are enough for the phone). */
export async function searchClients(
  query: string,
  limit = 30,
): Promise<ClientSummary[]> {
  await requireAdmin();
  const db = createAdminClient();
  const q = query.trim();
  let request = db
    .from("clients")
    .select(SUMMARY)
    .order("full_name")
    .limit(limit);
  if (q) {
    const term = likeTerm(q);
    const digits = q.replace(/\D/g, "");
    const filters = [`full_name.ilike.${term}`, `email.ilike.${term}`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits.slice(-9)}%`);
    request = request.or(filters.join(","));
  }
  const { data, error } = await request;
  if (error) throw error;
  return data.map(toSummary);
}

export async function getClientSummary(
  id: string,
): Promise<ClientSummary | null> {
  await requireAdmin();
  const { data, error } = await createAdminClient()
    .from("clients")
    .select(SUMMARY)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toSummary(data) : null;
}

export async function getClientFile(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  const [client, notes, appointments, waitlist] = await Promise.all([
    db
      .from("clients")
      .select(
        "id, full_name, email, phone, user_id, marketing_email, privacy_accepted_at, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    db
      .from("client_notes")
      .select("id, body, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("appointments")
      .select("id, period, status, service_name, variant_name, price_cents")
      .eq("client_id", id)
      .order("period", { ascending: false })
      .limit(100),
    db
      .from("waitlist_entries")
      .select("id, day, status, services (name)")
      .eq("client_id", id)
      .in("status", ["waiting", "notified"])
      .order("day"),
  ]);
  const failure = [client, notes, appointments, waitlist].find((r) => r.error);
  if (failure?.error) throw failure.error;
  if (!client.data) return null;
  const c = client.data;
  return {
    id: c.id,
    fullName: c.full_name,
    email: c.email,
    phone: c.phone,
    hasAccount: c.user_id != null,
    privacyAcceptedAt: c.privacy_accepted_at
      ? new Date(c.privacy_accepted_at)
      : null,
    createdAt: new Date(c.created_at),
    notes: notes.data!.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: new Date(n.created_at),
    })),
    appointments: appointments.data!.map((a) => ({
      id: a.id,
      ...parseTstzRange(a.period as string),
      status: a.status,
      serviceLabel: [a.service_name, a.variant_name]
        .filter(Boolean)
        .join(" — "),
      priceCents: a.price_cents,
    })),
    waitlist: waitlist.data!.map((w) => ({
      id: w.id,
      day: w.day,
      status: w.status,
      serviceName: w.services?.name ?? "",
    })),
  };
}

export type ClientFile = NonNullable<Awaited<ReturnType<typeof getClientFile>>>;
