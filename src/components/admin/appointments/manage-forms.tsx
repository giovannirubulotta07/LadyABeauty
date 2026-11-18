"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Checkbox,
  Field,
  TextArea,
  TextInput,
} from "@/components/ui/form";
import {
  cancelStudioAppointment,
  moveStudioAppointment,
} from "@/server/admin/actions/agenda";
import { useAdminAction } from "../use-admin-action";
import { StartTimePicker } from "./start-time-picker";

export function MoveForm({
  id,
  day: initialDay,
  durationMin: initialDuration,
  hasEmail,
}: {
  id: string;
  day: string;
  durationMin: number;
  hasEmail: boolean;
}) {
  const { run, pending, error, fieldErrors } = useAdminAction(
    moveStudioAppointment,
  );
  const [day, setDay] = useState(initialDay);
  const [time, setTime] = useState("");
  const [durationMin, setDurationMin] = useState(initialDuration);
  const [notify, setNotify] = useState(true);
  const [done, setDone] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(false);
        run(
          { id, day, time, durationMin, notifyClient: notify && hasEmail },
          { onSuccess: () => setDone(true) },
        );
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nouvelle date" error={fieldErrors.day}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="date"
              required
              value={day}
              onChange={(e) => {
                setDay(e.target.value);
                setTime("");
              }}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Field label="Durée (minutes)" error={fieldErrors.durationMin}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="number"
              inputMode="numeric"
              min={5}
              max={480}
              step={5}
              required
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
      </div>
      {day && durationMin >= 5 ? (
        <StartTimePicker
          day={day}
          durationMin={durationMin}
          value={time}
          onChange={setTime}
          ignoreAppointmentId={id}
          error={fieldErrors.time}
        />
      ) : null}
      <Checkbox
        label={
          hasEmail
            ? "Prévenir la cliente par e-mail du nouvel horaire"
            : "Pas d’e-mail : prévenez la cliente par téléphone"
        }
        checked={notify && hasEmail}
        disabled={!hasEmail}
        onChange={(e) => setNotify(e.target.checked)}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {done ? <Alert tone="success">Rendez-vous déplacé.</Alert> : null}
      <Button type="submit" disabled={pending || !time}>
        {pending ? "Déplacement…" : "Déplacer"}
      </Button>
    </form>
  );
}

export function CancelForm({
  id,
  hasEmail,
}: {
  id: string;
  hasEmail: boolean;
}) {
  const { run, pending, error, fieldErrors } = useAdminAction(
    cancelStudioAppointment,
  );
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm("Annuler ce rendez-vous ?")) return;
        run({ id, reason, notifyClient: notify && hasEmail });
      }}
    >
      <Field
        label="Message à la cliente (facultatif)"
        hint="Repris dans l’e-mail d’annulation."
        error={fieldErrors.reason}
      >
        {(ids) => (
          <TextArea
            id={ids.id}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-describedby={ids.describedBy}
          />
        )}
      </Field>
      <Checkbox
        label={
          hasEmail
            ? "Prévenir la cliente par e-mail"
            : "Pas d’e-mail : prévenez la cliente par téléphone"
        }
        checked={notify && hasEmail}
        disabled={!hasEmail}
        onChange={(e) => setNotify(e.target.checked)}
      />
      <p className="text-sm text-espresso-500">
        Le créneau libéré est aussitôt proposé à la liste d’attente.
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-control border border-danger/50 px-5 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-ivory disabled:opacity-60"
      >
        {pending ? "Annulation…" : "Annuler le rendez-vous"}
      </button>
    </form>
  );
}
