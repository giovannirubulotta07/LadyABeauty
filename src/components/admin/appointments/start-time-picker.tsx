"use client";

import clsx from "clsx";
import { useEffect, useState, useTransition } from "react";
import { Spinner, TextInput } from "@/components/ui/form";
import { suggestStarts } from "@/server/admin/actions/agenda";

/**
 * Start time: the free times of the day as chips (same engine as the site,
 * without the online-only rules), or any other time typed by hand.
 */
export function StartTimePicker({
  day,
  durationMin,
  value,
  onChange,
  ignoreAppointmentId,
  error,
}: {
  day: string;
  durationMin: number;
  value: string;
  onChange: (time: string) => void;
  ignoreAppointmentId?: string;
  error?: string;
}) {
  const [times, setTimes] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!day || !durationMin) return;
    let stale = false;
    startTransition(async () => {
      const result = await suggestStarts({
        day,
        durationMin,
        ...(ignoreAppointmentId ? { ignoreAppointmentId } : {}),
      });
      if (stale) return;
      setLoadError(!result.ok);
      setTimes(result.ok ? result.data.times : []);
    });
    return () => {
      stale = true;
    };
  }, [day, durationMin, ignoreAppointmentId]);

  const custom = value !== "" && times != null && !times.includes(value);

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-espresso-900">
        Heure
      </legend>
      <div className="mt-2 min-h-11" aria-live="polite">
        {pending || times == null ? (
          <p className="flex items-center gap-2 py-2 text-sm text-espresso-500">
            <Spinner /> Recherche des horaires libres…
          </p>
        ) : loadError ? (
          <p className="text-sm text-danger">
            Impossible de charger les horaires : saisissez l’heure.
          </p>
        ) : times.length === 0 ? (
          <p className="py-2 text-sm text-espresso-500">
            Aucun horaire libre pour cette durée. Vous pouvez saisir une heure
            ci-dessous.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {times.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  aria-pressed={value === t}
                  onClick={() => onChange(t)}
                  className={clsx(
                    "min-h-11 min-w-18 rounded-control border px-3 text-sm tabular-nums transition-colors",
                    value === t
                      ? "border-espresso-900 bg-espresso-900 text-ivory"
                      : "border-sand-200 bg-ivory text-espresso-900 hover:border-espresso-900/50",
                  )}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <label className="mt-3 flex items-center gap-3 text-sm text-espresso-700">
        Autre heure
        <TextInput
          type="time"
          step={300}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-36"
          aria-invalid={error ? true : undefined}
        />
      </label>
      {custom ? (
        <p className="mt-2 text-sm text-caramel-700">
          Horaire hors des créneaux libres : il sera accepté s’il ne chevauche
          aucun rendez-vous ni blocage.
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </fieldset>
  );
}
