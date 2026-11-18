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
