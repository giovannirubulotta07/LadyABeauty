import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  errorResponse,
  json,
  localDateSchema,
  serviceQuery,
} from "@/server/availability/http";
import { getDaySlots } from "@/server/availability/service";
import { RATE_RULES, underIpLimit } from "@/server/security/rate-limit";

const query = z.object({ ...serviceQuery, jour: localDateSchema });

/** Start times for one day: GET /api/creneaux?prestation=…&jour=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  const parsed = query.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) return json({ error: "Requête invalide." }, 400);
  if (!(await underIpLimit(RATE_RULES.availabilityPerIp)))
    return json({ error: "Trop de requêtes." }, 429);

  try {
    const { slots } = await getDaySlots({
      serviceId: parsed.data.prestation,
      variantId: parsed.data.variante,
      day: parsed.data.jour,
    });
    return json({
      slots: slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
        time: s.time,
        status: s.status,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
