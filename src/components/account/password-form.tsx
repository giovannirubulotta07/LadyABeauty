"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Spinner, TextInput } from "@/components/ui/form";
import { setPassword } from "@/server/actions/auth";

/** Optional: lets a client log in with a password instead of an e-mailed code. */
export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  }>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(undefined);
        startTransition(async () => {
          const result = await setPassword({ password, confirm });
          if (result.ok) {
            setErrors({});
            setPasswordValue("");
            setConfirm("");
            setMessage({
              tone: "success",
              text: "Mot de passe enregistré. Vous pourrez l’utiliser à la prochaine connexion.",
            });
          } else {
            setErrors(result.fieldErrors ?? {});
            setMessage({ tone: "error", text: result.error });
          }
        });
      }}
    >
      <p className="text-sm leading-relaxed text-espresso-500">
        {hasPassword
          ? "Vous pouvez changer votre mot de passe. La connexion par code reste toujours possible."
          : "Facultatif : la connexion par code e-mail suffit. Un mot de passe vous évite d’attendre l’e-mail."}
      </p>
      <Field
        label={hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
        hint="8 caractères minimum."
        error={errors.password}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="password"
            autoComplete="new-password"
            value={password}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setPasswordValue(e.target.value)}
          />
        )}
      </Field>
      <Field label="Confirmation" error={errors.confirm}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="password"
            autoComplete="new-password"
            value={confirm}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setConfirm(e.target.value)}
          />
        )}
      </Field>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <Button type="submit" variant="outline" disabled={pending || !password}>
        {pending ? <Spinner /> : null}
        {hasPassword ? "Changer le mot de passe" : "Définir un mot de passe"}
      </Button>
    </form>
  );
}
