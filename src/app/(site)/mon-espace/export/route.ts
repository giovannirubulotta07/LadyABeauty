import { parseTstzRange } from "@/domain/time/range";
import { createSessionClient } from "@/server/auth/server-client";
import { getSessionUser } from "@/server/auth/session";

/** RGPD data export: everything stored about the signed-in client, as JSON. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response("Non connectée.", { status: 401 });

  const supabase = await createSessionClient();
  const [client, appointments, waitlist] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "full_name, email, phone, preferences, marketing_email, privacy_accepted_at, created_at",
      )
      .maybeSingle(),
    supabase
      .from("appointments")
      .select(
        "service_name, variant_name, duration_min, price_cents, period, status, client_note, created_at, cancelled_at",
      ),
    supabase
      .from("waitlist_entries")
      .select("day, duration_min, status, created_at"),
  ]);

  const body = {
    exporte_le: new Date().toISOString(),
    compte: { email: user.email },
    profil: client.data,
    rendez_vous: (appointments.data ?? []).map(({ period, ...a }) => {
      const { start, end } = parseTstzRange(period as string);
      return { ...a, debut: start.toISOString(), fin: end.toISOString() };
    }),
    liste_attente: waitlist.data ?? [],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="mes-donnees-lady-a-beauty.json"',
      "Cache-Control": "private, no-store",
    },
  });
}
