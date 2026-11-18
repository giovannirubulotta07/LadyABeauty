"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Spinner, TextInput } from "@/components/ui/form";
import { requestLoginCode, verifyLoginCode } from "@/server/actions/auth";

const RESEND_SECONDS = 30;

type Props = {
  email: string;
  getRenderedAt: () => number;
  onVerified: () => void;
  onChangeEmail: () => void;
};

/** Second half of the passwordless login: type the 6-digit code received by e-mail. */
export function CodeVerification({
  email,
  getRenderedAt,
  onVerified,
  onChangeEmail,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  function verify(value: string) {
    setError(undefined);
    startTransition(async () => {
      const result = await verifyLoginCode({ email, code: value });
      if (result.ok) onVerified();
      else setError(result.fieldErrors?.code ?? result.error);
    });
  }

  function resend() {
    setError(undefined);
    startTransition(async () => {
      const result = await requestLoginCode({
        email,
        renderedAt: getRenderedAt(),
      });
      if (result.ok) {
        setNotice("Un nouveau code vient de vous être envoyé.");
        setResendIn(RESEND_SECONDS);
      } else setError(result.error);
    });
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        verify(code);
      }}
    >
      <p className="text-sm leading-relaxed text-espresso-700">
        Un code à 6 chiffres vient d’être envoyé à{" "}
        <strong className="font-medium text-espresso-900">{email}</strong>.
        Pensez à vérifier vos courriers indésirables.
      </p>
      <Field label="Code reçu par e-mail" error={error}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="••••••"
            className="max-w-48 text-center text-2xl tracking-[0.5em]"
            value={code}
            autoFocus
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(value);
              if (value.length === 6) verify(value);
            }}
          />
        )}
      </Field>
      {notice && !error ? <Alert tone="success">{notice}</Alert> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending || code.length !== 6}>
          {pending ? <Spinner /> : null}
          Valider le code
        </Button>
        <button
          type="button"
          onClick={resend}
          disabled={pending || resendIn > 0}
          className="min-h-11 px-2 text-sm text-caramel-700 underline underline-offset-4 disabled:text-espresso-500 disabled:no-underline"
        >
          {resendIn > 0
            ? `Renvoyer le code (${resendIn} s)`
            : "Renvoyer le code"}
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="min-h-11 px-2 text-sm text-espresso-700 underline underline-offset-4"
        >
          Modifier l’e-mail
        </button>
      </div>
    </form>
  );
}
