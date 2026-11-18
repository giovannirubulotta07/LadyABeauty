"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Field, Spinner, TextInput } from "@/components/ui/form";
import { findClients } from "@/server/admin/actions/clients";
import type { ClientSummary } from "@/server/admin/clients";

export type NewClient = { fullName: string; email: string; phone: string };

/** Pick an existing client (search by name, e-mail or phone) or create one. */
export function ClientPicker({
  selected,
  onSelect,
  newClient,
  onNewClient,
  errors,
}: {
  selected: ClientSummary | null;
  onSelect: (client: ClientSummary | null) => void;
  newClient: NewClient | null;
  onNewClient: (client: NewClient | null) => void;
  errors: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSummary[]>([]);
  const [pending, startTransition] = useTransition();
  const listId = useId();

  useEffect(() => {
    if (selected || newClient) return;
    let stale = false;
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await findClients({ query });
        if (!stale && result.ok) setResults(result.data.clients);
      });
    }, 200);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [query, selected, newClient]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-espresso-900/30 bg-sand-50 px-4 py-3">
        <div className="min-w-0 text-sm">
          <p className="font-medium text-espresso-900">{selected.fullName}</p>
          <p className="truncate text-espresso-500">
            {[selected.phone, selected.email].filter(Boolean).join(" · ") ||
              "Pas de coordonnées"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="min-h-11 shrink-0 px-2 text-sm text-caramel-700 underline underline-offset-4"
        >
          Changer
        </button>
      </div>
    );
  }

  if (newClient) {
    const set = (patch: Partial<NewClient>) =>
      onNewClient({ ...newClient, ...patch });
    return (
      <div className="space-y-4 rounded-card border border-sand-200 bg-sand-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-espresso-900">
            Nouvelle cliente
          </p>
          <button
            type="button"
            onClick={() => onNewClient(null)}
            className="min-h-11 px-2 text-sm text-caramel-700 underline underline-offset-4"
          >
            Chercher plutôt
          </button>
        </div>
        <Field label="Prénom et nom" error={errors.fullName}>
          {(ids) => (
            <TextInput
              id={ids.id}
              required
              autoComplete="off"
              value={newClient.fullName}
              onChange={(e) => set({ fullName: e.target.value })}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Field label="Téléphone" error={errors.phone}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="tel"
              autoComplete="off"
              value={newClient.phone}
              onChange={(e) => set({ phone: e.target.value })}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Field
          label="E-mail (facultatif)"
          hint="Pour lui envoyer la confirmation et le rappel."
          error={errors.email}
        >
          {(ids) => (
            <TextInput
              id={ids.id}
              type="email"
              autoComplete="off"
              value={newClient.email}
              onChange={(e) => set({ email: e.target.value })}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
      </div>
    );
  }

  return (
    <div>
      <Field
        label="Cliente"
        hint="Nom, e-mail ou téléphone."
        error={errors.clientId}
      >
        {(ids) => (
          <TextInput
            id={ids.id}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls={listId}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
          />
        )}
      </Field>
      <div id={listId} aria-live="polite" className="mt-2">
        {pending && results.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-espresso-500">
            <Spinner /> Recherche…
          </p>
        ) : (
          <ul className="divide-y divide-sand-200 rounded-card border border-sand-200 bg-ivory">
            {results.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  className="flex min-h-12 w-full flex-col items-start px-4 py-2 text-left hover:bg-sand-50"
                >
                  <span className="text-sm font-medium text-espresso-900">
                    {c.fullName}
                  </span>
                  <span className="text-sm text-espresso-500">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  // Pre-fill whichever field the search looks like.
                  const q = query.trim();
                  const isEmail = q.includes("@");
                  const isPhone = /^[\d +.()-]{6,}$/.test(q);
                  onNewClient({
                    fullName: isEmail || isPhone ? "" : q,
                    email: isEmail ? q : "",
                    phone: isPhone ? q : "",
                  });
                }}
                className="flex min-h-12 w-full items-center px-4 text-left text-sm font-medium text-caramel-700 hover:bg-sand-50"
              >
                + Nouvelle cliente{query ? ` « ${query} »` : ""}
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
