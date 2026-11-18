"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Checkbox,
  Field,
  TextArea,
  TextInput,
  inputClasses,
} from "@/components/ui/form";
import { formatDuration, formatPrice } from "@/lib/format";
import { createStudioAppointment } from "@/server/admin/actions/agenda";
import type { StudioService } from "@/server/admin/catalog";
import type { ClientSummary } from "@/server/admin/clients";
import { useAdminAction } from "../use-admin-action";
import { ClientPicker, type NewClient } from "./client-picker";
import { StartTimePicker } from "./start-time-picker";

/** New appointment taken by Alessia (phone, Instagram, at the studio). */
export function AppointmentForm({
  services,
  initialDay,
  initialTime,
  initialClient,
}: {
  services: StudioService[];
  initialDay: string;
  initialTime: string;
  initialClient: ClientSummary | null;
}) {
  const router = useRouter();
  const { run, pending, error, fieldErrors } = useAdminAction(
    createStudioAppointment,
  );
  const [client, setClient] = useState<ClientSummary | null>(initialClient);
  const [newClient, setNewClient] = useState<NewClient | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [day, setDay] = useState(initialDay);
  const [time, setTime] = useState(initialTime);
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);

  const service = services.find((s) => s.id === serviceId);
  const variant = service?.variants.find((v) => v.id === variantId);
  const hasEmail = Boolean(client?.email || newClient?.email);

  const chooseService = (id: string) => {
    setServiceId(id);
    setVariantId("");
    const s = services.find((x) => x.id === id);
    if (s) setDurationMin(s.durationMin);
  };
  const chooseVariant = (id: string) => {
    setVariantId(id);
    const v = service?.variants.find((x) => x.id === id);
    setDurationMin(v?.durationMin ?? service?.durationMin ?? durationMin);
  };

  const price = variant?.priceCents ?? service?.priceCents;

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        run(
          {
            clientId: client?.id ?? "",
            ...(newClient ? { newClient } : {}),
            serviceId,
            variantId,
            day,
            time,
            durationMin,
            note,
            notifyClient: notify && hasEmail,
          },
          {
            onSuccess: ({ data }) =>
              router.push(`/admin?jour=${data?.day ?? day}`),
          },
        );
      }}
    >
      <section aria-labelledby="f-cliente" className="space-y-3">
        <h2 id="f-cliente" className="font-display text-xl text-espresso-900">
          1. Cliente
        </h2>
        <ClientPicker
          selected={client}
          onSelect={setClient}
          newClient={newClient}
          onNewClient={setNewClient}
          errors={fieldErrors}
        />
      </section>

      <section aria-labelledby="f-prestation" className="space-y-4">
        <h2
          id="f-prestation"
          className="font-display text-xl text-espresso-900"
        >
          2. Prestation
        </h2>
        <Field label="Prestation" error={fieldErrors.serviceId}>
          {(ids) => (
            <select
              id={ids.id}
              required
              value={serviceId}
              onChange={(e) => chooseService(e.target.value)}
              className={inputClasses}
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            >
              <option value="" disabled>
                Choisir…
              </option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.bookableOnline ? "" : " (au studio uniquement)"}
                </option>
              ))}
            </select>
          )}
        </Field>
        {service?.variants.length ? (
          <Field label="Variante" error={fieldErrors.variantId}>
            {(ids) => (
              <select
                id={ids.id}
                value={variantId}
                onChange={(e) => chooseVariant(e.target.value)}
                className={inputClasses}
                aria-describedby={ids.describedBy}
              >
                <option value="">Sans précision</option>
                {service.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {formatDuration(v.durationMin)}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}
        <Field
          label="Durée (minutes)"
          hint={
            service
              ? `Durée habituelle : ${formatDuration(variant?.durationMin ?? service.durationMin)}${price != null ? ` · ${formatPrice(price)}` : ""}`
              : undefined
          }
          error={fieldErrors.durationMin}
        >
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
              className="max-w-36"
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
      </section>

      <section aria-labelledby="f-date" className="space-y-4">
        <h2 id="f-date" className="font-display text-xl text-espresso-900">
          3. Date et heure
        </h2>
        <Field label="Date" error={fieldErrors.day}>
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
              className="max-w-52"
              aria-invalid={ids.invalid}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        {service && durationMin >= 5 && day ? (
          <StartTimePicker
            day={day}
            durationMin={durationMin}
            value={time}
            onChange={setTime}
            error={fieldErrors.time}
          />
        ) : (
          <p className="text-sm text-espresso-500">
            Choisissez d’abord la prestation pour voir les horaires libres.
          </p>
        )}
      </section>

      <section aria-labelledby="f-fin" className="space-y-4">
        <h2 id="f-fin" className="font-display text-xl text-espresso-900">
          4. Finaliser
        </h2>
        <Field
          label="Note (facultatif)"
          hint="Visible dans le rendez-vous et dans l’e-mail à Alessia."
          error={fieldErrors.note}
        >
          {(ids) => (
            <TextArea
              id={ids.id}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby={ids.describedBy}
            />
          )}
        </Field>
        <Checkbox
          label={
            hasEmail
              ? "Envoyer la confirmation par e-mail à la cliente"
              : "Pas d’e-mail : la cliente ne recevra ni confirmation ni rappel"
          }
          checked={notify && hasEmail}
          disabled={!hasEmail}
          onChange={(e) => setNotify(e.target.checked)}
        />
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full sm:w-auto"
      >
        {pending ? "Enregistrement…" : "Enregistrer le rendez-vous"}
      </Button>
    </form>
  );
}
