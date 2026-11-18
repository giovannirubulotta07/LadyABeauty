"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextArea } from "@/components/ui/form";
import { addClientNote } from "@/server/admin/actions/clients";
import { useAdminAction } from "../use-admin-action";

export function NoteForm({ clientId }: { clientId: string }) {
  const { run, pending, error, fieldErrors } = useAdminAction(addClientNote);
  const [body, setBody] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        run({ clientId, body }, { onSuccess: () => setBody("") });
      }}
    >
      <Field
        label="Nouvelle note"
        hint="Allergies, préférences (courbure, longueur), remarques… Visible seulement par vous."
        error={fieldErrors.body}
      >
        {(ids) => (
          <TextArea
            id={ids.id}
            required
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={ids.invalid}
            aria-describedby={ids.describedBy}
          />
        )}
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button type="submit" disabled={pending || !body.trim()}>
        {pending ? "Ajout…" : "Ajouter la note"}
      </Button>
    </form>
  );
}
