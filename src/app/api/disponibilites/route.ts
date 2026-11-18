import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  json,
  localDateSchema,
  serviceQuery,
} from "@/server/availability/http";
import { getDaysOverview } from "@/server/availability/service";
import { RATE_RULES, underIpLimit } from "@/server/security/rate-limit";

const query = z.object({
  ...serviceQuery,
  du: localDateSchema,
  jours: z.coerce.number().int().min(1).max(62),
});

/** Day statuses for the booking strip: GET /api/disponibilites?prestation=…&du=YYYY-MM-DD&jours=14 */
export async function GET(request: NextRequest) {
  const parsed = query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) return json({ error: "Requête invalide." }, 400);
  if (!(await underIpLimit(RATE_RULES.availabilityPerIp)))
    return json({ error: "Trop de requêtes." }, 429);

  try {
    const days = await getDaysOverview({
      serviceId: parsed.data.prestation,
      variantId: parsed.data.variante,
      from: parsed.data.du,
      days: parsed.data.jours,
    });
    return json({ days });
  } catch (error) {
    return errorResponse(error);
  }
}
