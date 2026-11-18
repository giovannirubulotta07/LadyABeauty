"use client";

import { useRouter } from "next/navigation";
import { saveService, saveVariant } from "@/server/admin/actions/settings";
import {
  SCheckbox,
  SInput,
  SSelect,
  STextArea,
  SettingsForm,
} from "./settings-form";

const euros = (cents: number | null | undefined) =>
  cents == null ? "" : String(cents / 100).replace(".", ",");

export type EditableService = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number | null;
  price_is_from: boolean;
  deposit_cents: number | null;
  bookable_online: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

export function ServiceForm({
  service,
  categories,
}: {
  service: EditableService | null;
  categories: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  return (
    <SettingsForm
      action={saveService}
      hidden={service ? { id: service.id } : undefined}
      submitLabel={service ? "Enregistrer" : "Créer la prestation"}
      onSaved={(result) => {
        const id = (result.data as { id?: string } | undefined)?.id;
        if (!service && id) router.replace(`/admin/reglages/prestations/${id}`);
      }}
    >
      <SInput
        name="name"
        label="Nom"
        required
        maxLength={120}
        defaultValue={service?.name}
      />
      {categories.length > 1 ? (
        <SSelect
          name="categoryId"
          label="Catégorie"
          defaultValue={service?.category_id ?? categories[0]?.id}
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
      ) : (
        <input
          type="hidden"
          name="categoryId"
          value={service?.category_id ?? categories[0]?.id ?? ""}
        />
      )}
      <STextArea
        name="description"
        label="Description"
        hint="Affichée sur la page Prestations."
        maxLength={2000}
        defaultValue={service?.description}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <SInput
          name="durationMin"
          label="Durée (minutes)"
          type="number"
          inputMode="numeric"
          min={5}
          max={480}
          step={5}
          required
          defaultValue={service?.duration_min ?? 60}
        />
        <SInput
          name="price"
          label="Prix (€)"
          hint="Vide = non affiché."
          inputMode="decimal"
          defaultValue={euros(service?.price_cents)}
        />
        <SInput
          name="deposit"
          label="Acompte (€)"
          hint="Vide = pas d’acompte."
          inputMode="decimal"
          defaultValue={euros(service?.deposit_cents)}
        />
      </div>
      <div className="space-y-1">
        <SCheckbox
          name="priceIsFrom"
          label="Afficher « À partir de » devant le prix"
          defaultChecked={service?.price_is_from ?? false}
        />
        <SCheckbox
          name="bookableOnline"
          label="Réservable en ligne"
          defaultChecked={service?.bookable_online ?? true}
        />
        <SCheckbox
          name="isFeatured"
          label="Mise en avant sur la page d’accueil"
          defaultChecked={service?.is_featured ?? false}
        />
        <SCheckbox
          name="isActive"
          label="Active (décochez pour la retirer du site sans la supprimer)"
          defaultChecked={service?.is_active ?? true}
        />
      </div>
      <SInput
        name="sortOrder"
        label="Ordre d’affichage"
        hint="Les plus petits nombres en premier."
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={service?.sort_order ?? 100}
        className="max-w-xs"
      />
    </SettingsForm>
  );
}

export type EditableVariant = {
  id: string;
  name: string;
  description: string;
  duration_min: number | null;
  price_cents: number | null;
  is_active: boolean;
  sort_order: number;
};

export function VariantForm({
  serviceId,
  variant,
}: {
  serviceId: string;
  variant: EditableVariant | null;
}) {
  return (
    <SettingsForm
      action={saveVariant}
      hidden={{ serviceId, ...(variant ? { id: variant.id } : {}) }}
      submitLabel={variant ? "Enregistrer" : "Ajouter la variante"}
      resetOnSave={!variant}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
        <SInput
          name="name"
          label="Nom"
          required
          maxLength={120}
          defaultValue={variant?.name}
        />
        <SInput
          name="durationMin"
          label="Durée (min)"
          hint="Vide = idem"
          type="number"
          inputMode="numeric"
          min={5}
          max={480}
          step={5}
          defaultValue={variant?.duration_min ?? ""}
        />
        <SInput
          name="price"
          label="Prix (€)"
          hint="Vide = idem"
          inputMode="decimal"
          defaultValue={euros(variant?.price_cents)}
        />
      </div>
      <SInput
        name="description"
        label="Description courte"
        maxLength={1000}
        defaultValue={variant?.description}
      />
      <div className="flex flex-wrap items-end gap-4">
        <SCheckbox
          name="isActive"
          label="Proposée"
          defaultChecked={variant?.is_active ?? true}
        />
        <SInput
          name="sortOrder"
          label="Ordre"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={variant?.sort_order ?? 10}
          className="w-28"
        />
      </div>
    </SettingsForm>
  );
}
