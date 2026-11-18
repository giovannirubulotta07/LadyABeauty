import "server-only";
import { refresh } from "next/cache";
import type { z } from "zod";
import type { SessionUser } from "@/server/auth/session";
import {
  type ActionResult,
  GENERIC_ERROR,
  fail,
} from "@/server/actions/result";
import { getAdmin } from "./guard";

export const NOT_ADMIN =
  "Votre session a expiré ou ce compte n'a pas accès à l'administration. Reconnectez-vous.";

/** Messages for the errors raised by the SQL calendar guards. */
export const CALENDAR_ERRORS: Record<string, string> = {
  SLOT_TAKEN: "Ce créneau chevauche un autre rendez-vous.",
  SLOT_BLOCKED:
    "Ce créneau est bloqué (congés ou indisponibilité). Retirez le blocage d'abord.",
  SLOT_HELD:
    "Ce créneau est réservé quelques minutes pour une cliente de la liste d'attente.",
  NOT_CONFIRMED: "Ce rendez-vous n'est plus actif (annulé ou terminé).",
  NOT_FOUND: "Rendez-vous introuvable.",
  INVALID_DURATION: "La durée doit être comprise entre 5 min et 8 h.",
  INVALID_PERIOD: "La période indiquée n'est pas valide.",
};

/**
 * Runs an admin Server Action: checks the admin session, validates the input
 * with Zod, maps unexpected errors to a generic message and refreshes the
 * admin views on success.
 */
export async function adminAction<S extends z.ZodType, T = undefined>(
  schema: S,
  input: unknown,
  run: (data: z.infer<S>, admin: SessionUser) => Promise<ActionResult<T>>,
  { refreshView = true }: { refreshView?: boolean } = {},
): Promise<ActionResult<T>> {
  const admin = await getAdmin();
  if (!admin) return fail(NOT_ADMIN);
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return fail(
      "Vérifiez les informations saisies.",
      fieldErrorsByName(parsed.error.issues),
    );
  try {
    const result = await run(parsed.data, admin);
    if (result.ok && refreshView) refresh();
    return result;
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String(error.message)
        : "";
    if (CALENDAR_ERRORS[message]) return fail(CALENDAR_ERRORS[message]);
    console.error("admin action", error);
    return fail(GENERIC_ERROR);
  }
}

/** First issue per field, keyed by the innermost field name ("newClient.email" → "email"). */
function fieldErrorsByName(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const named = issue.path.filter((p) => typeof p === "string");
    const key = String(named.at(-1) ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** FormData → plain object (repeated keys become arrays), for Zod. */
export function formObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== "string") continue;
    if (key in out) {
      const prev = out[key];
      out[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else out[key] = value;
  }
  return out;
}
