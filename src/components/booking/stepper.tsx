import clsx from "clsx";
import { STEPS, type Step } from "./types";

/** Progress bars + the current step written in full (labels under each bar from tablet up). */
export function Stepper({ current }: { current: Step }) {
  const index = STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Étapes de la réservation">
      <ol className="flex gap-2 sm:gap-3">
        {STEPS.map((step, i) => (
          <li
            key={step.id}
            className="flex min-w-0 flex-1 flex-col gap-2"
            aria-current={i === index ? "step" : undefined}
          >
            <span
              aria-hidden="true"
              className={clsx(
                "h-0.5 w-full rounded-full",
                i <= index ? "bg-espresso-900" : "bg-sand-200",
              )}
            />
            <span
              className={clsx(
                "hidden text-xs font-medium tracking-[0.12em] uppercase sm:block",
                i === index ? "text-espresso-900" : "text-espresso-500",
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs font-medium tracking-[0.12em] text-espresso-700 uppercase sm:hidden">
        Étape {index + 1} sur {STEPS.length} · {STEPS[index]?.label}
      </p>
    </nav>
  );
}
