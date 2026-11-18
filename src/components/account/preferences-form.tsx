"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Spinner, TextArea } from "@/components/ui/form";
import { savePreferences } from "@/server/actions/account";

const MAX = 600;

/** Her preferences, read by Alessia before each visit. */
export function PreferencesForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  }>();
  const [pending, startTransition] = useTransition();
  const left = MAX - value.length;

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(undefined);
        startTransition(async () => {
          const result = await savePreferences({ preferences: value });
          if (result.ok) {
            setError(undefined);
            setMessage({
              tone: "success",
              text: "Merci ! Alessia en tiendra compte.",
            });
            router.refresh();
          } else {
            setError(result.fieldErrors?.preferences);
            setMessage({ tone: "error", text: result.error });
          }
        });
      }}
    >
      <Field
        label="Vos préférences"
        hint="Effet (naturel, intense…), courbure, longueur, style de sourcils… Pour une allergie ou une question de santé, parlez-en directement à Alessia."
        error={error}
      >
        {({ id, describedBy, invalid }) => (
          <>
            <TextArea
              id={id}
              name="preferences"
              rows={4}
              maxLength={MAX}
              value={value}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              placeholder="Par exemple : effet naturel, courbure C, pas trop long au coin intérieur."
              onChange={(e) => setValue(e.target.value)}
            />
            <p
              className="mt-1 text-right text-xs text-espresso-500 tabular-nums"
              aria-live="polite"
            >
              {left < 100 ? `${left} caractères restants` : null}
            </p>
          </>
        )}
      </Field>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <Button type="submit" disabled={pending || value === initial}>
        {pending ? <Spinner /> : null}
        Enregistrer
      </Button>
    </form>
  );
}
