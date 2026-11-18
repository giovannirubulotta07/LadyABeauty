"use client";

import { Button } from "@/components/ui/button";
import { Alert, Field, Spinner, TextArea } from "@/components/ui/form";
import { formatDayLong } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { FlowBusiness, PublicSlot } from "./types";

type Props = {
  serviceName: string;
  variantName: string | null;
  priceLabel: string | null;
  durationMin: number;
  day: string;
  slot: PublicSlot;
  contact: { fullName: string; email: string | null; phone: string };
  business: FlowBusiness;
  note: string;
  pending: boolean;
  error: string | null;
  onNoteChange: (note: string) => void;
  onEditDetails: () => void;
  onConfirm: () => void;
};

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm text-espresso-500">{label}</dt>
      <dd className="text-espresso-900">{children}</dd>
    </div>
  );
}

export function SummaryStep(props: Props) {
  const end = new Date(props.slot.end);
  const endTime = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(end);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl text-espresso-900 sm:text-3xl">
        Récapitulatif
      </h2>

      <dl className="divide-y divide-sand-200 border-y border-sand-200">
        <Row label="Prestation">
          {props.serviceName}
          {props.variantName ? (
            <span className="block text-sm text-espresso-500">
              {props.variantName}
            </span>
          ) : null}
        </Row>
        <Row label="Date">
          {formatDayLong(props.day, { withYear: true, capitalize: true })}
        </Row>
        <Row label="Heure">
          {props.slot.time} – {endTime}{" "}
          <span className="text-sm text-espresso-500">
            ({formatDuration(props.durationMin)})
          </span>
        </Row>
        {props.priceLabel ? <Row label="Tarif">{props.priceLabel}</Row> : null}
        <Row label="Adresse">
          {props.business.addressLines.join(", ")}
          <a
            href={props.business.mapsUrl}
            rel="noopener"
            className="ml-2 text-sm text-caramel-700 underline underline-offset-4"
          >
            Plan
          </a>
        </Row>
        <Row label="Vos coordonnées">
          {props.contact.fullName}
          {props.contact.email ? (
            <span className="block text-sm break-all text-espresso-500">
              {props.contact.email}
            </span>
          ) : null}
          <span className="block text-sm text-espresso-500">
            {props.contact.phone}
          </span>
          <button
            type="button"
            onClick={props.onEditDetails}
            className="min-h-11 text-sm text-caramel-700 underline underline-offset-4"
          >
            Modifier
          </button>
        </Row>
      </dl>

      <Field
        label="Un message pour Alessia ? (facultatif)"
        hint="Par exemple : la pose souhaitée, une allergie…"
      >
        {({ id, describedBy }) => (
          <TextArea
            id={id}
            aria-describedby={describedBy}
            maxLength={500}
            value={props.note}
            onChange={(e) => props.onNoteChange(e.target.value)}
          />
        )}
      </Field>

      <p className="text-sm leading-relaxed text-espresso-500">
        Vous pourrez annuler depuis votre espace jusqu’à{" "}
        {props.business.cancellationCutoffHours} h avant le rendez-vous.
      </p>

      {props.error ? <Alert tone="error">{props.error}</Alert> : null}

      <Button
        size="lg"
        className="w-full"
        disabled={props.pending}
        onClick={props.onConfirm}
      >
        {props.pending ? <Spinner /> : null}
        {props.pending ? "Confirmation…" : "Confirmer le rendez-vous"}
      </Button>
    </div>
  );
}
