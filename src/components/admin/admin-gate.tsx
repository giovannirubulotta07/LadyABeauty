import { connection } from "next/server";
import type { ReactNode } from "react";
import { LoginPanel } from "@/components/auth/login-panel";
import { signOut } from "@/server/actions/auth";
import { getSessionUser } from "@/server/auth/session";

/**
 * Renders its children only for the admin. Must sit inside a <Suspense>
 * (reads the session cookie). Children are not rendered at all otherwise.
 */
export async function AdminGate({ children }: { children: ReactNode }) {
  await connection(); // per-request: session, current time
  const user = await getSessionUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-6">
        <h1 className="font-display text-3xl text-espresso-900">Connexion</h1>
        <p className="mt-3 text-espresso-700">
          Espace réservé au studio. Connectez-vous avec votre adresse e-mail.
        </p>
        <div className="mt-8 rounded-card bg-ivory p-6 shadow-sm">
          <LoginPanel studio />
        </div>
      </div>
    );
  }
  if (!user.isAdmin) {
    return (
      <div className="mx-auto max-w-md py-6" role="alert">
        <h1 className="font-display text-3xl text-espresso-900">
          Accès réservé
        </h1>
        <p className="mt-3 text-espresso-700">
          Le compte {user.email} n’a pas accès à l’administration.
        </p>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="min-h-11 text-sm text-espresso-700 underline underline-offset-4"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    );
  }
  return children;
}
