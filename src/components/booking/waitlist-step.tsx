"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Alert } from "@/components/ui/form";
import { formatDayLong } from "@/lib/dates";
import { joinWaitlist } from "@/server/actions/waitlist";
import { type Details, DetailsStep } from "./details-step";
import type { FlowProfile } from "./types";

type Props = {
  serviceId: string;
  variantId: string | null;
  serviceLabel: string;
  day: string;
  profile: FlowProfile;
  details: Details;
  getRenderedAt: () => number;
  onDetailsChange: (d: Details) => void;
  onSignedIn: () => void;
  onBack: () => void;
};

/** Join the waitlist for one day: same contact/sign-in step, then one tap. */
export function WaitlistStep(props: Props) {
  const [result, setResult] = useState<{ already: boolean } | null>(null);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function join() {
    setError(undefined);
    startTransition(async () => {
      const r = await joinWaitlist({
        serviceId: props.serviceId,
        variantId: props.variantId,
        day: props.day,
        fullName: props.details.fullName,
        phone: props.details.phone,
        acceptPrivacy: props.details.acceptPrivacy,
        honeypot: props.details.honeypot,
        renderedAt: props.getRenderedAt(),
      });
      if (r.ok) setResult({ already: r.data.alreadyRegistered });
      else {
        setError(r.error);
        setFieldErrors(r.fieldErrors ?? {});
      }
    });
  }

  if (result) {
    return (
      <div className="space-y-6" role="status">
        <h2 className="font-display text-2xl text-espresso-900 sm:text-3xl">
          C’est noté !
        </h2>
        <p className="leading-relaxed text-espresso-700">
          {result.already ? "Vous étiez déjà inscrite" : "Vous êtes inscrite"}{" "}
          sur la liste d’attente pour le{" "}
          <strong className="font-medium text-espresso-900">
            {formatDayLong(props.day, { withYear: true })}
          </strong>{" "}
          ({props.serviceLabel}). Si une place se libère, vous recevrez un
          e-mail avec un lien pour la réserver en un clic.
        </p>
        <p className="text-sm leading-relaxed text-espresso-500">
          Les personnes inscrites sont prévenues dans l’ordre d’inscription ;
          chacune dispose d’un court délai pour confirmer.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/mon-espace" className={buttonClasses("primary")}>
            Mes inscriptions
          </Link>
          <button
            type="button"
            onClick={props.onBack}
            className={buttonClasses("outline")}
          >
            Choisir une autre date
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <DetailsStep
        heading="Liste d’attente"
        intro={
          <>
            {props.serviceLabel}, {formatDayLong(props.day, { withYear: true })}
            . Laissez vos coordonnées : vous serez prévenue par e-mail dès
            qu’une place se libère ce jour-là.
          </>
        }
        continueLabel="M’inscrire sur la liste d’attente"
        backLabel="Revenir aux horaires"
        busy={pending}
        profile={props.profile}
        details={props.details}
        getRenderedAt={props.getRenderedAt}
        serverErrors={fieldErrors}
        onChange={props.onDetailsChange}
        onSignedIn={() => {
          props.onSignedIn();
          join();
        }}
        onContinue={join}
        onBack={props.onBack}
      />
    </div>
  );
}
