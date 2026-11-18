"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, TextInput } from "@/components/ui/form";
import { saveOpeningHours } from "@/server/admin/actions/settings";
import { useAdminAction } from "../use-admin-action";

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

type Window = { opens: string; closes: string };

/** Weekly opening hours: one or more time ranges per day (breaks between). */
export function HoursEditor({
  initial,
}: {
  initial: Array<{ weekday: number; opens: string; closes: string }>;
}) {
  const { run, pending, error, fieldErrors } = useAdminAction(saveOpeningHours);
  const [saved, setSaved] = useState(false);
  const [week, setWeek] = useState<Window[][]>(() =>
    DAYS.map((_, i) =>
      initial
        .filter((w) => w.weekday === i + 1)
        .map(({ opens, closes }) => ({ opens, closes })),
    ),
  );
  const update = (day: number, windows: Window[]) => {
    setSaved(false);
    setWeek((w) => w.map((d, i) => (i === day ? windows : d)));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(
          {
            windows: week.flatMap((windows, i) =>
              windows.map((w) => ({ weekday: i + 1, ...w })),
            ),
          },
          { onSuccess: () => setSaved(true) },
        );
      }}
      className="space-y-5"
    >
      <ul className="divide-y divide-sand-200">
        {DAYS.map((name, day) => {
          const windows = week[day]!;
          const problem = fieldErrors[`day${day + 1}`];
          return (
            <li key={name} className="py-4">
              <fieldset>
                <div className="flex items-center justify-between gap-3">
                  <legend className="font-medium text-espresso-900">
                    {name}
                  </legend>
                  {windows.length === 0 ? (
                    <span className="text-sm text-espresso-500">Fermé</span>
                  ) : null}
                </div>
                <ul className="mt-2 space-y-2">
                  {windows.map((w, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`h-${day}-${i}-o`}>
                        {name}, plage {i + 1} : début
                      </label>
                      <TextInput
                        id={`h-${day}-${i}-o`}
                        type="time"
                        step={300}
                        required
                        value={w.opens}
                        onChange={(e) =>
                          update(
                            day,
                            windows.map((x, j) =>
                              j === i ? { ...x, opens: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-36!"
                      />
                      <span aria-hidden="true">–</span>
                      <label className="sr-only" htmlFor={`h-${day}-${i}-c`}>
                        {name}, plage {i + 1} : fin
                      </label>
                      <TextInput
                        id={`h-${day}-${i}-c`}
                        type="time"
                        step={300}
                        required
                        value={w.closes}
                        onChange={(e) =>
                          update(
                            day,
                            windows.map((x, j) =>
                              j === i ? { ...x, closes: e.target.value } : x,
                            ),
                          )
                        }
                        className="w-36!"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            day,
                            windows.filter((_, j) => j !== i),
                          )
                        }
                        className="min-h-11 px-2 text-sm text-espresso-700 underline underline-offset-4"
                        aria-label={`Supprimer la plage ${i + 1} du ${name.toLowerCase()}`}
                      >
                        Supprimer
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    update(day, [
                      ...windows,
                      windows.length
                        ? { opens: windows.at(-1)!.closes, closes: "20:00" }
                        : { opens: "10:00", closes: "14:00" },
                    ])
                  }
                  className="mt-2 min-h-11 text-sm font-medium text-caramel-700"
                >
                  + Ajouter une plage
                </button>
                {problem ? (
                  <p role="alert" className="text-sm text-danger">
                    {problem}
                  </p>
                ) : null}
              </fieldset>
            </li>
          );
        })}
      </ul>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {saved ? (
        <Alert tone="success">
          Horaires enregistrés : le site et la réservation sont à jour.
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer les horaires"}
      </Button>
    </form>
  );
}
