"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Spinner } from "@/components/ui/form";
import { setEveningUnlocked } from "@/server/admin/actions/agenda";

/** The 18:00 rule: evening times are "sur demande" until Alessia opens them. */
export function EveningToggle({
  day,
  unlocked,
  from,
}: {
  day: string;
  unlocked: boolean;
  from: string;
}) {
  const [pending, startTransition] = useTransition();
  // Moves at once; falls back to the saved value if saving fails.
  const [on, setOn] = useOptimistic(unlocked);
  const [error, setError] = useState<string>();

  return (
    <div>
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-espresso-900">
            Créneaux à partir de {from}
          </span>
          <span className="block text-sm text-espresso-500">
            {on
              ? "Ouverts à la réservation en ligne ce jour-là."
              : "Sur demande : les clientes ne peuvent pas les réserver en ligne."}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {pending ? <Spinner className="text-espresso-500" /> : null}
          <input
            type="checkbox"
            role="switch"
            checked={on}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.checked;
              setError(undefined);
              startTransition(async () => {
                setOn(next);
                const result = await setEveningUnlocked({
                  day,
                  unlocked: next,
                });
                if (!result.ok) setError(result.error);
              });
            }}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-7 w-12 rounded-pill bg-sand-200 transition-colors peer-checked:bg-espresso-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-caramel-700 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-ivory after:shadow after:transition-transform peer-checked:after:translate-x-5"
          />
        </span>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
