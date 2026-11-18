"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextInput } from "@/components/ui/form";
import {
  createStudioClient,
  updateClient,
} from "@/server/admin/actions/clients";
import { useAdminAction } from "../use-admin-action";

type Values = { fullName: string; email: string; phone: string };

/** Create a client (then open her file) or edit her contact details. */
export function ClientForm({
  id,
  initial,
  emailLocked = false,
}: {
  id?: string;
  initial?: Partial<Values>;
  emailLocked?: boolean;
}) {
  const router = useRouter();
  const create = useAdminAction(createStudioClient);
  const update = useAdminAction(updateClient);
  const { pending, error, fieldErrors } = id ? update : create;
  const [values, setValues] = useState<Values>({
    fullName: initial?.fullName ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
  });
  const [saved, setSaved] = useState(false);
  const set = (patch: Partial<Values>) => {
    setSaved(false);
    setValues((v) => ({ ...v, ...patch }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (id)
          update.run({ id, ...values }, { onSuccess: () => setSaved(true) });
        else
          create.run(values, {
            onSuccess: ({ data }) =>
              data && router.push(`/admin/clientes/${data.id}`),
          });
      }}
    >
      <Field label="Prénom et nom" error={fieldErrors.fullName}>
        {(ids) => (
          <TextInput
            id={ids.id}
            required
            autoComplete="off"
            value={values.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
          />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Téléphone" error={fieldErrors.phone}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="tel"
              autoComplete="off"
              value={values.phone}
              onChange={(e) => set({ phone: e.target.value })}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Field
          label="E-mail"
          hint={
            emailLocked
              ? "Lié à son compte : elle seule peut le modifier."
              : undefined
          }
          error={fieldErrors.email}
        >
          {(ids) => (
            <TextInput
              id={ids.id}
              type="email"
              autoComplete="off"
              readOnly={emailLocked}
              value={values.email}
              onChange={(e) => set({ email: e.target.value })}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? <Alert tone="success">Enregistré.</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : id ? "Enregistrer" : "Créer la fiche"}
      </Button>
    </form>
  );
}
