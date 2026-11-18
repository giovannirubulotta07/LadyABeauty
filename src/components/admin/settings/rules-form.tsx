"use client";

import { saveBookingRules } from "@/server/admin/actions/settings";
import type { StudioSettings } from "@/server/admin/settings";
import { SInput, SettingsForm } from "./settings-form";

export function RulesForm({ rules }: { rules: StudioSettings["rules"] }) {
  return (
    <SettingsForm action={saveBookingRules}>
      <div className="grid gap-5 sm:grid-cols-2">
        <SInput
          name="minNoticeMinutes"
          label="Délai minimum avant un rendez-vous (minutes)"
          hint="120 = on ne peut pas réserver moins de 2 h à l’avance."
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={rules.minNoticeMinutes}
        />
        <SInput
          name="maxAdvanceDays"
          label="Réservation possible jusqu’à (jours)"
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          defaultValue={rules.maxAdvanceDays}
        />
        <SInput
          name="cancellationCutoffHours"
          label="Annulation en ligne jusqu’à (heures avant)"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={rules.cancellationCutoffHours}
        />
        <SInput
          name="reminderSendTime"
          label="Heure du rappel (la veille)"
          type="time"
          defaultValue={rules.reminderSendTime}
        />
      </div>
      <SInput
        name="referenceStarts"
        label="Horaires de début habituels"
        hint="Séparés par des virgules. Les autres horaires ne sont proposés que pour combler un trou."
        defaultValue={rules.referenceStarts}
      />
      <SInput
        name="eveningLockFrom"
        label="Créneaux « sur demande » à partir de"
        hint="Ces horaires ne sont réservables en ligne que les jours où vous les ouvrez dans l’agenda. Laissez vide pour désactiver."
        type="time"
        defaultValue={rules.eveningLockFrom}
        className="max-w-xs"
      />
      <fieldset className="space-y-5 border-t border-sand-200 pt-5">
        <legend className="font-display text-lg text-espresso-900">
          Liste d’attente
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SInput
            name="waitlistExclusiveMinutes"
            label="Temps réservé à chaque cliente (minutes)"
            hint="La première de la liste a ce délai pour accepter avant que la suivante soit prévenue."
            type="number"
            inputMode="numeric"
            min={5}
            defaultValue={rules.waitlistExclusiveMinutes}
          />
          <SInput
            name="waitlistBroadcastBeforeHours"
            label="Prévenir tout le monde si le créneau est dans moins de (heures)"
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={rules.waitlistBroadcastBeforeHours}
          />
          <SInput
            name="waitlistQuietStart"
            label="Pas d’e-mail de liste d’attente après"
            type="time"
            defaultValue={rules.waitlistQuietStart}
          />
          <SInput
            name="waitlistQuietEnd"
            label="… ni avant"
            type="time"
            defaultValue={rules.waitlistQuietEnd}
          />
        </div>
      </fieldset>
    </SettingsForm>
  );
}
