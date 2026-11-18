"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { looksLikeBot } from "@/lib/anti-bot";
import { emailSchema, otpSchema, passwordSchema } from "@/lib/validation";
import { createSessionClient } from "@/server/auth/server-client";
import { getSessionUser } from "@/server/auth/session";
import {
  RATE_RULES,
  underIpLimit,
  underLimit,
} from "@/server/security/rate-limit";
import {
  type ActionResult,
  GENERIC_ERROR,
  TOO_MANY,
  fail,
  fieldErrorsOf,
} from "./result";

const botFields = {
  honeypot: z.string().optional(),
  renderedAt: z.number().optional(),
};

/** Step 1 of the passwordless login: e-mails a 6-digit code (and a magic link). */
export async function requestLoginCode(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ email: emailSchema, ...botFields })
    .safeParse(input);
  if (!parsed.success)
    return fail(
      "Vérifiez votre adresse e-mail.",
      fieldErrorsOf(parsed.error.issues),
    );
  const { email, honeypot, renderedAt } = parsed.data;

  // Bots get the same answer as humans, but nothing is sent.
  if (looksLikeBot({ honeypot, renderedAt })) return { ok: true };
  if (
    !(await underIpLimit(RATE_RULES.otpPerIp)) ||
    !(await underLimit(RATE_RULES.otpPerEmail, email))
  ) {
    return fail(TOO_MANY);
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) {
    console.error("signInWithOtp", error.status, error.code);
    return fail(
      error.status === 429
        ? TOO_MANY
        : "Impossible d'envoyer le code pour le moment. Réessayez dans un instant.",
    );
  }
  return { ok: true };
}

/** Step 2: checks the code; on success the session cookies are set. */
export async function verifyLoginCode(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ email: emailSchema, code: otpSchema })
    .safeParse(input);
  if (!parsed.success)
    return fail("Vérifiez le code reçu.", fieldErrorsOf(parsed.error.issues));
  if (!(await underIpLimit(RATE_RULES.loginPerIp))) return fail(TOO_MANY);

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.code,
    type: "email",
  });
  if (error) {
    return fail(
      "Ce code est incorrect ou a expiré. Demandez-en un nouveau si besoin.",
      {
        code: "Code incorrect ou expiré.",
      },
    );
  }
  return { ok: true };
}

/** Optional password login for clients who chose to set one. */
export async function signInWithPassword(
  input: unknown,
): Promise<ActionResult> {
  const parsed = z
    .object({
      email: emailSchema,
      password: z.string().min(1, "Saisissez votre mot de passe."),
      ...botFields,
    })
    .safeParse(input);
  if (!parsed.success)
    return fail("Vérifiez les champs.", fieldErrorsOf(parsed.error.issues));
  if (looksLikeBot(parsed.data))
    return fail("E-mail ou mot de passe incorrect.");
  if (!(await underIpLimit(RATE_RULES.loginPerIp))) return fail(TOO_MANY);

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return fail("E-mail ou mot de passe incorrect.");
  return { ok: true };
}

export async function setPassword(input: unknown): Promise<ActionResult> {
  const parsed = z
    .object({ password: passwordSchema, confirm: z.string() })
    .refine((v) => v.password === v.confirm, {
      path: ["confirm"],
      message: "Les mots de passe ne correspondent pas.",
    })
    .safeParse(input);
  if (!parsed.success)
    return fail(
      "Vérifiez le mot de passe.",
      fieldErrorsOf(parsed.error.issues),
    );

  const user = await getSessionUser();
  if (!user) return fail("Votre session a expiré. Reconnectez-vous.");
  if (!(await underLimit(RATE_RULES.accountPerUser, user.id)))
    return fail(TOO_MANY);

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { has_password: true },
  });
  if (error) {
    if (error.code === "weak_password")
      return fail("Ce mot de passe est trop faible.", {
        password: "Trop faible.",
      });
    if (error.code === "same_password")
      return fail("C'est déjà votre mot de passe actuel.");
    return fail(GENERIC_ERROR);
  }
  return { ok: true };
}

export async function signOut(): Promise<never> {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/");
}
