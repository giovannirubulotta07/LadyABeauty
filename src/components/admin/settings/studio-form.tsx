"use client";

import { saveStudio } from "@/server/admin/actions/settings";
import type { StudioSettings } from "@/server/admin/settings";
import { SCheckbox, SInput, SettingsForm } from "./settings-form";

export function StudioForm({ studio }: { studio: StudioSettings["studio"] }) {
  return (
    <SettingsForm action={saveStudio}>
      <div className="grid gap-5 sm:grid-cols-2">
        <SInput
          name="name"
          label="Nom du studio"
          required
          defaultValue={studio.name}
        />
        <SInput
          name="tagline"
          label="Accroche"
          hint="Ex. : Lash maker & brow artist à Annemasse"
          defaultValue={studio.tagline}
        />
        <SInput
          name="phone"
          label="Téléphone"
          type="tel"
          defaultValue={studio.phone}
        />
        <SInput
          name="email"
          label="E-mail de contact"
          type="email"
          defaultValue={studio.email}
        />
        <SInput
          name="instagramUrl"
          label="Instagram (adresse complète)"
          type="url"
          placeholder="https://www.instagram.com/…"
          defaultValue={studio.instagramUrl}
          className="sm:col-span-2"
        />
      </div>
      <fieldset className="space-y-5 border-t border-sand-200 pt-5">
        <legend className="font-display text-lg text-espresso-900">
          Adresse
        </legend>
        <SInput
          name="addressLine1"
          label="Rue et numéro"
          required
          defaultValue={studio.addressLine1}
        />
        <SInput
          name="addressLine2"
          label="Complément"
          defaultValue={studio.addressLine2}
        />
        <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
          <SInput
            name="postalCode"
            label="Code postal"
            inputMode="numeric"
            required
            defaultValue={studio.postalCode}
          />
          <SInput
            name="city"
            label="Ville"
            required
            defaultValue={studio.city}
          />
        </div>
      </fieldset>
      <fieldset className="space-y-5 border-t border-sand-200 pt-5">
        <legend className="font-display text-lg text-espresso-900">
          Informations légales
        </legend>
        <p className="text-sm text-espresso-500">
          Affichées dans les mentions légales.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <SInput
            name="legalName"
            label="Nom légal / forme"
            defaultValue={studio.legalName}
          />
          <SInput
            name="siret"
            label="SIRET"
            inputMode="numeric"
            defaultValue={studio.siret}
          />
        </div>
      </fieldset>
      <fieldset className="space-y-3 border-t border-sand-200 pt-5">
        <legend className="font-display text-lg text-espresso-900">
          E-mails pour vous
        </legend>
        <SInput
          name="notificationEmail"
          label="Adresse qui reçoit les notifications"
          type="email"
          defaultValue={studio.notificationEmail}
        />
        <SCheckbox
          name="notifyOwnerOnBooking"
          label="Me prévenir à chaque nouvelle réservation en ligne"
          defaultChecked={studio.notifyOwnerOnBooking}
        />
        <SCheckbox
          name="notifyOwnerOnCancellation"
          label="Me prévenir quand une cliente annule"
          defaultChecked={studio.notifyOwnerOnCancellation}
        />
      </fieldset>
    </SettingsForm>
  );
}
