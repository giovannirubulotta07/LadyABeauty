/** Uniform result for Server Actions consumed by client forms. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const fail = (error: string, fieldErrors?: Record<string, string>) =>
  ({ ok: false, error, ...(fieldErrors ? { fieldErrors } : {}) }) as const;

/** First Zod issue per field, for inline form messages. */
export function fieldErrorsOf(
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>,
) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export const GENERIC_ERROR =
  "Une erreur est survenue. Merci de réessayer dans un instant.";
export const TOO_MANY =
  "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.";
