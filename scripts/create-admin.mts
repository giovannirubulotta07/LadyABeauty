/**
 * Creates the admin account, or gives the admin role to an existing account.
 *
 *   npm run admin:create -- alessia@example.com            (she signs in with an e-mail code)
 *   npm run admin:create -- alessia@example.com MotDePasse  (also sets a password)
 *
 * The role is stored in app_metadata, which only the service role can write.
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (.env.local or env).
 */
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const [email, password] = process.argv.slice(2);
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage : npm run admin:create -- <email> [mot de passe]");
  process.exit(1);
}

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function findUserId(address: string): Promise<string | null> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const user = data.users.find(
      (u) => u.email?.toLowerCase() === address.toLowerCase(),
    );
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

const attributes = {
  app_metadata: { role: "admin" },
  email_confirm: true,
  ...(password ? { password, user_metadata: { has_password: true } } : {}),
};

const existing = await findUserId(email);
if (existing) {
  const { error } = await db.auth.admin.updateUserById(existing, attributes);
  if (error) throw error;
  console.log(`Rôle admin donné au compte existant ${email}.`);
} else {
  const { error } = await db.auth.admin.createUser({ email, ...attributes });
  if (error) throw error;
  console.log(`Compte admin créé : ${email}.`);
}
