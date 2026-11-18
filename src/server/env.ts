import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** Signs email links and hashes rate-limit keys. At least 32 random characters. */
  APP_SECRET: z.string().min(32),
  /** Protects /api/cron/* (sent as "Authorization: Bearer …" by pg_cron / Vercel Cron). */
  CRON_SECRET: z.string().min(32),
  /** Sender, e.g. "Lady A Beauty <rendez-vous@ladyabeauty.fr>" (domain verified in Resend). */
  EMAIL_FROM: z.string().min(3),
  EMAIL_REPLY_TO: z.email().optional(),
  RESEND_API_KEY: z.string().optional(),
  /** resend (production) | mailpit (local inbox) | log (console only). Defaults: resend if a key is set, else mailpit. */
  EMAIL_TRANSPORT: z.enum(["resend", "mailpit", "log"]).optional(),
  MAILPIT_URL: z.url().default("http://127.0.0.1:54324"),
});

/** Validated server environment. Fails fast with a readable message. */
export const env = (() => {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Variables d'environnement invalides ou manquantes : ${missing}`,
    );
  }
  return parsed.data;
})();
