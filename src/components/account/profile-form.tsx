"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Checkbox,
  Field,
  Spinner,
  TextInput,
} from "@/components/ui/form";
import { saveProfile } from "@/server/actions/account";

type Props = {
  email: string;
  fullName: string;
  phone: string;
  needsPrivacy: boolean;
  submitLabel?: string;
};

export function ProfileForm({
  email,
  fullName: initialName,
  phone: initialPhone,
  needsPrivacy,
  submitLabel = "Enregistrer",
}: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  }>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(undefined);
        startTransition(async () => {
          const result = await saveProfile({ fullName, phone, acceptPrivacy });
          if (result.ok) {
            setErrors({});
            setMessage({
              tone: "success",
              text: "Vos informations sont enregistrées.",
            });
            router.refresh();
          } else {
            setErrors(result.fieldErrors ?? {});
            setMessage({ tone: "error", text: result.error });
          }
        });
      }}
    >
      <Field
        label="Adresse e-mail"
        hint="C’est votre identifiant de connexion."
      >
        {({ id, describedBy }) => (
          <TextInput
            id={id}
            aria-describedby={describedBy}
            value={email}
            readOnly
            disabled
          />
        )}
      </Field>
      <Field label="Prénom et nom" error={errors.fullName}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            autoComplete="name"
            value={fullName}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
      </Field>
      <Field label="Téléphone" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <TextInput
            id={id}
            type="tel"
            autoComplete="tel"
            value={phone}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            onChange={(e) => setPhone(e.target.value)}
          />
        )}
      </Field>
      {needsPrivacy ? (
        <Checkbox
          checked={acceptPrivacy}
          onChange={(e) => setAcceptPrivacy(e.target.checked)}
          error={errors.acceptPrivacy}
          label={
            <>
              J’accepte que mes données soient utilisées pour gérer mes
              rendez-vous, conformément à la{" "}
              <Link
                href="/confidentialite"
                className="text-caramel-700 underline underline-offset-4"
              >
                politique de confidentialité
              </Link>
              .
            </>
          }
        />
      ) : null}
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
