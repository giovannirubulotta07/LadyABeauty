import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ClientForm } from "@/components/admin/clients/client-form";
import { ChevronIcon } from "@/components/admin/icons";
import {
  Badge,
  Card,
  CardTitle,
  Empty,
  Loading,
  PageTitle,
} from "@/components/admin/ui";
import { inputClasses } from "@/components/ui/form";
import { buttonClasses } from "@/components/ui/button";
import { searchClients } from "@/server/admin/clients";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientsPage({
  searchParams,
}: PageProps<"/admin/clientes">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Clients searchParams={searchParams} />
      </AdminGate>
    </Suspense>
  );
}

async function Clients({
  searchParams,
}: Pick<PageProps<"/admin/clientes">, "searchParams">) {
  await connection();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.slice(0, 120) : "";
  const clients = await searchClients(query, 60);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div>
        <PageTitle title="Clientes" />
        {/* Plain GET form: works without JavaScript, the URL keeps the search. */}
        <form
          role="search"
          action="/admin/clientes"
          className="mb-4 flex gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Rechercher une cliente</span>
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Nom, e-mail ou téléphone"
              className={inputClasses}
            />
          </label>
          <button type="submit" className={buttonClasses("primary")}>
            Rechercher
          </button>
        </form>
        {clients.length === 0 ? (
          <Empty>
            {query ? `Aucune cliente pour « ${query} ».` : "Aucune cliente."}
          </Empty>
        ) : (
          <ul className="divide-y divide-sand-200 rounded-card border border-sand-200 bg-ivory">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/clientes/${c.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-sand-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-espresso-900">
                      {c.fullName}
                    </span>
                    <span className="block truncate text-sm text-espresso-500">
                      {[c.phone, c.email].filter(Boolean).join(" · ") ||
                        "Pas de coordonnées"}
                    </span>
                  </span>
                  {c.hasAccount ? <Badge tone="muted">Compte</Badge> : null}
                  <ChevronIcon className="size-4 text-espresso-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {clients.length === 60 ? (
          <p className="mt-3 text-sm text-espresso-500">
            Seules les 60 premières sont affichées : affinez la recherche.
          </p>
        ) : null}
      </div>
      <div className="lg:pt-16">
        <Card aria-labelledby="nouvelle-titre">
          <CardTitle id="nouvelle-titre">Nouvelle cliente</CardTitle>
          <ClientForm />
        </Card>
      </div>
    </div>
  );
}
