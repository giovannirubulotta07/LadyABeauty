import "server-only";
import { z } from "zod";
import { isLocalDate } from "@/domain/time/paris";
import { AvailabilityError } from "./service";

export const serviceQuery = {
  prestation: z.uuid(),
  variante: z.uuid().nullish(),
};

export const localDateSchema = z.string().refine(isLocalDate, "Date invalide.");

const NO_STORE = { "Cache-Control": "no-store" };

export function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE });
}

/** Maps errors to safe JSON responses (no internals leaked). */
export function errorResponse(error: unknown) {
  if (
    error instanceof AvailabilityError &&
    error.code === "SERVICE_UNAVAILABLE"
  ) {
    return json(
      { error: "Cette prestation n'est pas réservable en ligne." },
      404,
    );
  }
  console.error("availability", error);
  return json(
    { error: "Les disponibilités sont momentanément indisponibles." },
    503,
  );
}
