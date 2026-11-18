"use client";

import clsx from "clsx";
import { ClockIcon } from "@/components/ui/icons";
import { formatDuration } from "@/lib/format";
import type { FlowService } from "./types";

type Props = {
  services: FlowService[];
  selected: FlowService | null;
  selectedVariantId: string | null;
  onSelectService: (service: FlowService) => void;
  onSelectVariant: (variantId: string) => void;
};

function Option({
  checked,
  title,
  meta,
  onSelect,
  name,
}: {
  checked: boolean;
  title: string;
  meta: React.ReactNode;
  onSelect: () => void;
  name: string;
}) {
  return (
    <label
      className={clsx(
        "flex min-h-16 cursor-pointer items-center gap-4 rounded-card border px-4 py-3.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-caramel-700 sm:px-5",
        checked
          ? "border-espresso-900 bg-sand-50"
          : "border-sand-200 bg-ivory hover:border-caramel-500",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={clsx(
          "grid size-5 shrink-0 place-items-center rounded-full border",
          checked ? "border-espresso-900" : "border-espresso-500",
        )}
      >
        {checked ? (
          <span className="size-2.5 rounded-full bg-espresso-900" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl leading-tight text-espresso-900">
          {title}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-espresso-500">
          {meta}
        </span>
      </span>
    </label>
  );
}

const Meta = ({
  durationMin,
  priceLabel,
}: {
  durationMin: number;
  priceLabel: string | null;
}) => (
  <>
    <span className="inline-flex items-center gap-1.5">
      <ClockIcon width={15} height={15} />
      {formatDuration(durationMin)}
    </span>
    {priceLabel ? (
      <span className="font-medium text-espresso-900">{priceLabel}</span>
    ) : null}
  </>
);

export function ServiceStep({
  services,
  selected,
  selectedVariantId,
  onSelectService,
  onSelectVariant,
}: Props) {
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="font-display text-2xl text-espresso-900 sm:text-3xl">
          Choisissez votre prestation
        </legend>
        <div className="mt-5 grid gap-3">
          {services.map((service) => (
            <Option
              key={service.id}
              name="prestation"
              checked={selected?.id === service.id}
              title={service.name}
              meta={
                <Meta
                  durationMin={service.durationMin}
                  priceLabel={service.priceLabel}
                />
              }
              onSelect={() => onSelectService(service)}
            />
          ))}
        </div>
      </fieldset>

      {selected && selected.variants.length > 0 ? (
        <fieldset id="variantes">
          <legend className="font-display text-2xl text-espresso-900">
            Quel style pour « {selected.name} » ?
          </legend>
          <div className="mt-5 grid gap-3">
            {selected.variants.map((variant) => (
              <Option
                key={variant.id}
                name="variante"
                checked={selectedVariantId === variant.id}
                title={variant.name}
                meta={
                  <Meta
                    durationMin={variant.durationMin}
                    priceLabel={variant.priceLabel}
                  />
                }
                onSelect={() => onSelectVariant(variant.id)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
