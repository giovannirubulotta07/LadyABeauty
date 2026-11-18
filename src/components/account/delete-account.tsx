"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Spinner, TextInput } from "@/components/ui/form";
import { deleteMyAccount } from "@/server/actions/account";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        variant="outline"
        className="border-danger text-danger hover:bg-danger hover:text-ivory"
        onClick={() => setOpen(true)}
      >
        Supprimer mon compte
      </Button>
    );
  }

  return (
    <form
      className="space-y-4 rounded-card border border-danger/40 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await deleteMyAccount({ confirmation });
          if (!result.ok)
            setError(result.fieldErrors?.confirmation ?? result.error);
        });
      }}
    >
      <p className="text-sm leading-relaxed text-espresso-900">
        Cette action est définitive : vos rendez-vous à venir seront annulés et
        vos données personnelles effacées.
      </p>
      <Field label="Pour confirmer, saisissez SUPPRIMER" error={error}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            autoComplete="off"
            value={confirmation}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setConfirmation(e.target.value)}
          />
        )}
      </Field>
      {error && !confirmation ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="submit"
          disabled={pending || confirmation !== "SUPPRIMER"}
          className="bg-danger hover:bg-espresso-900"
        >
          {pending ? <Spinner /> : null}
          Supprimer définitivement
        </Button>
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
