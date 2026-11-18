"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CodeVerification } from "@/components/auth/code-verification";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Checkbox,
  Field,
  Honeypot,
  Spinner,
  TextInput,
} from "@/components/ui/form";
import { requestLoginCode } from "@/server/actions/auth";
import type { FlowProfile } from "./types";

export type Details = {
  fullName: string;
  email: string;
  phone: string;
  acceptPrivacy: boolean;
  honeypot: string;
};

type Props = {
  profile: FlowProfile;
  details: Details;
  getRenderedAt: () => number;
  serverErrors: Record<string, string>;
  onChange: (details: Details) => void;
  onSignedIn: () => void;
  onContinue: () => void;
  onBack: () => void;
  /** Reused by the waitlist step. */
  heading?: string;
  intro?: React.ReactNode;
  continueLabel?: string;
  backLabel?: string;
  busy?: boolean;
};

function localErrors(d: Details, profile: FlowProfile): Record<string, string> {
  const errors: Record<string, string> = {};
  if (d.fullName.trim().length < 2)
    errors.fullName = "Indiquez votre prénom et votre nom.";
  if (d.phone.replace(/[\s.()-]/g, "").length < 9)
    errors.phone = "Indiquez un numéro de téléphone valide.";
  if (!profile.signedIn && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim()))
    errors.email = "Adresse e-mail invalide.";
  if (profile.needsPrivacy && !d.acceptPrivacy)
    errors.acceptPrivacy = "Obligatoire pour réserver.";
  return errors;
}

export function DetailsStep({
  profile,
  details,
  getRenderedAt,
  serverErrors,
  onChange,
  onSignedIn,
  onContinue,
  onBack,
  heading = "Vos coordonnées",
  intro,
  continueLabel = "Continuer",
  backLabel = "Changer d’horaire",
  busy = false,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [pending, startTransition] = useTransition();
  const shown = { ...serverErrors, ...errors };
  const set = (patch: Partial<Details>) => onChange({ ...details, ...patch });

  if (awaitingCode && !profile.signedIn) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-espresso-900 sm:text-3xl">
          Vérifiez votre e-mail
        </h2>
        <CodeVerification
          email={details.email.trim().toLowerCase()}
          getRenderedAt={getRenderedAt}
          onVerified={onSignedIn}
          onChangeEmail={() => setAwaitingCode(false)}
        />
      </div>
    );
  }

  function submit() {
    const found = localErrors(details, profile);
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length > 0) return;
    if (profile.signedIn) return onContinue();

    startTransition(async () => {
      const result = await requestLoginCode({
        email: details.email,
        honeypot: details.honeypot,
        renderedAt: getRenderedAt(),
      });
      if (result.ok) setAwaitingCode(true);
      else {
        setFormError(result.error);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form
      className="relative space-y-6"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div>
        <h2 className="font-display text-2xl text-espresso-900 sm:text-3xl">
          {heading}
        </h2>
        {intro ? (
          <div className="mt-2 text-sm leading-relaxed text-espresso-700">
            {intro}
          </div>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-espresso-500">
          {profile.signedIn ? (
            <>
              Connectée en tant que{" "}
              <strong className="font-medium text-espresso-900">
                {profile.email}
              </strong>
              .
            </>
          ) : (
            "Nous vous enverrons un code par e-mail pour confirmer votre adresse : votre espace est créé automatiquement."
          )}
        </p>
      </div>

      <Honeypot
        value={details.honeypot}
        onChange={(honeypot) => set({ honeypot })}
      />

      <Field label="Prénom et nom" error={shown.fullName}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            autoComplete="name"
            value={details.fullName}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => set({ fullName: e.target.value })}
          />
        )}
      </Field>

      {!profile.signedIn ? (
        <Field label="Adresse e-mail" error={shown.email}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={details.email}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              onChange={(e) => set({ email: e.target.value })}
            />
          )}
        </Field>
      ) : null}

      <Field
        label="Téléphone"
        hint="Pour vous prévenir en cas d’imprévu."
        error={shown.phone}
      >
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={details.phone}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => set({ phone: e.target.value })}
          />
        )}
      </Field>

      {profile.needsPrivacy ? (
        <Checkbox
          checked={details.acceptPrivacy}
          onChange={(e) => set({ acceptPrivacy: e.target.checked })}
          error={shown.acceptPrivacy}
          label={
            <>
              J’accepte que mes données soient utilisées pour gérer mes
              rendez-vous, conformément à la{" "}
              <Link
                href="/confidentialite"
                target="_blank"
                className="text-caramel-700 underline underline-offset-4"
              >
                politique de confidentialité
              </Link>
              .
            </>
          }
        />
      ) : null}

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 px-1 text-sm text-espresso-700 underline underline-offset-4"
        >
          {backLabel}
        </button>
        <Button type="submit" size="lg" disabled={pending || busy}>
          {pending || busy ? <Spinner /> : null}
          {profile.signedIn ? continueLabel : "Recevoir mon code"}
        </Button>
      </div>
    </form>
  );
}
