import { z } from "zod";

/** Shared input rules (French messages shown to clients). */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Adresse e-mail trop longue.")
  .pipe(z.email("Adresse e-mail invalide."));

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Le code contient 6 chiffres.");

export const passwordSchema = z
  .string()
  .min(8, "8 caractères minimum.")
  .max(72, "72 caractères maximum.");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Indiquez votre prénom et votre nom.")
  .max(120, "Nom trop long.");

/** French or Swiss mobile/landline, spaces/dots/dashes allowed; stored normalised. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s.()-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(?:\+|00)?\d{9,15}$/, "Numéro de téléphone invalide.")
      .transform((v) => (v.startsWith("00") ? `+${v.slice(2)}` : v)),
  );

/** Safe in-app redirect target ("/mon-espace", never "//evil.com" or "https://…"). */
export function safeNext(
  value: string | null | undefined,
  fallback = "/mon-espace",
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return fallback;
  return value;
}

/** "2026-11-24" — a real calendar date. */
export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")
  .refine((v) => {
    const d = new Date(`${v}T12:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Date invalide.");

/** "09:30" (24 h). */
export const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM).");

/** Empty string → undefined, for optional form fields. */
export const blankToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

/** Checkbox / "true"/"false" from FormData or JSON → boolean. */
export const booleanish = z.preprocess(
  (v) => v === true || v === "true" || v === "on" || v === "1",
  z.boolean(),
);
