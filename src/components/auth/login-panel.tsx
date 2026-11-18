"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Field,
  Honeypot,
  Spinner,
  TextInput,
} from "@/components/ui/form";
import { requestLoginCode, signInWithPassword } from "@/server/actions/auth";
import { CodeVerification } from "./code-verification";

type Mode = "code" | "password";

/** Login for "Mon espace": e-mail code by default, password if she set one. */
export function LoginPanel({ expiredLink = false }: { expiredLink?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const renderedAt = useRef(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const done = () => router.refresh();

  if (codeSent) {
    return (
      <CodeVerification
        email={email}
        getRenderedAt={() => renderedAt.current}
        onVerified={done}
        onChangeEmail={() => setCodeSent(false)}
      />
    );
  }

  return (
    <form
      className="relative space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        setFieldErrors({});
        startTransition(async () => {
          const result =
            mode === "code"
              ? await requestLoginCode({
                  email,
                  honeypot,
                  renderedAt: renderedAt.current,
                })
              : await signInWithPassword({
                  email,
                  password,
                  honeypot,
                  renderedAt: renderedAt.current,
                });
          if (!result.ok) {
            setError(result.error);
            setFieldErrors(result.fieldErrors ?? {});
          } else if (mode === "code") setCodeSent(true);
          else done();
        });
      }}
    >
      {expiredLink ? (
        <Alert tone="info">
          Ce lien de connexion a expiré ou a déjà été utilisé. Demandez un
          nouveau code ci-dessous.
        </Alert>
      ) : null}
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <Field label="Adresse e-mail" error={fieldErrors.email}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="email"
            autoComplete="email"
            required
            value={email}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>
      {mode === "password" ? (
        <Field label="Mot de passe" error={fieldErrors.password}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
      ) : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner /> : null}
          {mode === "code" ? "Recevoir un code" : "Se connecter"}
        </Button>
        <button
          type="button"
          className="min-h-11 px-2 text-sm text-caramel-700 underline underline-offset-4"
          onClick={() => {
            setMode(mode === "code" ? "password" : "code");
            setError(undefined);
          }}
        >
          {mode === "code"
            ? "J’ai un mot de passe"
            : "Recevoir plutôt un code par e-mail"}
        </button>
      </div>
      {mode === "code" ? (
        <p className="text-sm text-espresso-500">
          Pas encore de compte ? Il est créé automatiquement à la première
          connexion.
        </p>
      ) : null}
    </form>
  );
}
