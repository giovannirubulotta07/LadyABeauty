import { buildIcs } from "@/lib/ics";
import { addressLines } from "@/lib/address";
import { getAppointmentById } from "@/server/appointments/queries";
import { getBusinessInfo } from "@/server/content/queries";
import { env } from "@/server/env";
import { readLinkToken } from "@/server/security/tokens";

/** "Ajouter à mon calendrier": GET /api/ics/<signed token> */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/ics/[token]">,
) {
  const { token } = await params;
  const id = readLinkToken(token, "ics");
  if (!id) return new Response("Lien invalide ou expiré.", { status: 404 });

  const appointment = await getAppointmentById(id);
  if (!appointment)
    return new Response("Rendez-vous introuvable.", { status: 404 });
  if (appointment.status === "cancelled")
    return new Response("Ce rendez-vous a été annulé.", { status: 410 });

  const business = await getBusinessInfo();
  const title = [appointment.serviceName, appointment.variantName]
    .filter(Boolean)
    .join(" — ");
  const ics = buildIcs({
    uid: `${appointment.id}@lady-a-beauty`,
    start: appointment.start,
    end: appointment.end,
    summary: `${title} · ${business.name}`,
    location: [business.name, ...addressLines(business.address)].join(", "),
    description: `Rendez-vous chez ${business.name}. Gérer ou annuler : ${env.NEXT_PUBLIC_SITE_URL}/mon-espace`,
    url: `${env.NEXT_PUBLIC_SITE_URL}/mon-espace`,
    alarmMinutesBefore: 120,
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="rendez-vous-lady-a-beauty.ics"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
