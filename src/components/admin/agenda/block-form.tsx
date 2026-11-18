"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Checkbox, Field, TextInput } from "@/components/ui/form";
import { createStudioBlock } from "@/server/admin/actions/agenda";
import { useAdminAction } from "../use-admin-action";

/** Holidays (whole days) or an unavailable time range. */
export function BlockForm({ day }: { day: string }) {
  const { run, pending, error, fieldErrors } =
    useAdminAction(createStudioBlock);
  const [allDay, setAllDay] = useState(false);
  const [from, setFrom] = useState(day);
  const [to, setTo] = useState(day);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(false);
        run(
          { from, to, allDay, startTime, endTime, reason },
          {
            onSuccess: () => {
              setDone(true);
              setReason("");
            },
          },
        );
      }}
    >
      <Checkbox
        label="Journée(s) entière(s) — congés, fermeture"
        checked={allDay}
        onChange={(e) => setAllDay(e.target.checked)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Du" error={fieldErrors.from}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="date"
              required
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                if (e.target.value > to) setTo(e.target.value);
              }}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Field label="Au" error={fieldErrors.to}>
          {(ids) => (
            <TextInput
              id={ids.id}
              type="date"
              required
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        {allDay ? null : (
          <>
            <Field label="De" error={fieldErrors.startTime}>
              {(ids) => (
                <TextInput
                  id={ids.id}
                  type="time"
                  step={900}
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  aria-invalid={ids.invalid}
                  aria-describedby={ids.describedBy}
                />
              )}
            </Field>
            <Field label="À" error={fieldErrors.endTime}>
              {(ids) => (
                <TextInput
                  id={ids.id}
                  type="time"
                  step={900}
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  aria-invalid={ids.invalid}
                  aria-describedby={ids.describedBy}
                />
              )}
            </Field>
          </>
        )}
      </div>
      <Field
        label="Motif (facultatif)"
        hint="Visible seulement ici."
        error={fieldErrors.reason}
      >
        {(ids) => (
          <TextInput
            id={ids.id}
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-describedby={ids.describedBy}
          />
        )}
      </Field>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {done ? <Alert tone="success">Blocage enregistré.</Alert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Bloquer"}
      </Button>
    </form>
  );
}
