"use client";

import clsx from "clsx";
import {
  type ComponentProps,
  type ReactNode,
  createContext,
  use,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  Checkbox,
  Field,
  TextArea,
  TextInput,
  inputClasses,
} from "@/components/ui/form";
import { useAdminAction } from "../use-admin-action";

/**
 * Settings forms: uncontrolled inputs with `name`, sent as a plain object to
 * an admin Server Action (validated with Zod there). Errors come back per
 * field and are shown next to the matching input.
 */
const ErrorsContext = createContext<Record<string, string>>({});

type Result =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function SettingsForm({
  action,
  hidden,
  children,
  submitLabel = "Enregistrer",
  onSaved,
  resetOnSave = false,
  className,
}: {
  action: (input: Record<string, unknown>) => Promise<Result>;
  hidden?: Record<string, string>;
  children: ReactNode;
  submitLabel?: string;
  onSaved?: (result: Extract<Result, { ok: true }>) => void;
  /** Empties the form after saving (forms that add an item). */
  resetOnSave?: boolean;
  className?: string;
}) {
  const { run, pending, error, fieldErrors } = useAdminAction(action);
  const [saved, setSaved] = useState(false);
  return (
    <ErrorsContext value={fieldErrors}>
      <form
        className={clsx("space-y-5", className)}
        onChange={() => setSaved(false)}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data: Record<string, unknown> = { ...hidden };
          new FormData(form).forEach((value, key) => {
            if (typeof value === "string") data[key] = value;
          });
          run(data, {
            onSuccess: (result) => {
              setSaved(true);
              if (resetOnSave) form.reset();
              onSaved?.(result);
            },
          });
        }}
      >
        {children}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {saved ? <Alert tone="success">Enregistré.</Alert> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </form>
    </ErrorsContext>
  );
}

export function useFieldError(name: string) {
  return use(ErrorsContext)[name];
}

type InputProps = Omit<ComponentProps<"input">, "name"> & {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
};

export function SInput({ name, label, hint, className, ...props }: InputProps) {
  const error = useFieldError(name);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(ids) => (
        <TextInput
          id={ids.id}
          name={name}
          aria-invalid={ids.invalid}
          aria-describedby={ids.describedBy}
          {...props}
        />
      )}
    </Field>
  );
}

export function STextArea({
  name,
  label,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"textarea">, "name"> & {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
}) {
  const error = useFieldError(name);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(ids) => (
        <TextArea
          id={ids.id}
          name={name}
          aria-invalid={ids.invalid}
          aria-describedby={ids.describedBy}
          {...props}
        />
      )}
    </Field>
  );
}

export function SSelect({
  name,
  label,
  hint,
  options,
  className,
  ...props
}: Omit<ComponentProps<"select">, "name"> & {
  name: string;
  label: ReactNode;
  hint?: ReactNode;
  options: Array<{ value: string; label: string }>;
}) {
  const error = useFieldError(name);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(ids) => (
        <select
          id={ids.id}
          name={name}
          className={inputClasses}
          aria-invalid={ids.invalid}
          aria-describedby={ids.describedBy}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function SCheckbox({
  name,
  label,
  ...props
}: Omit<ComponentProps<"input">, "name" | "type"> & {
  name: string;
  label: ReactNode;
}) {
  const error = useFieldError(name);
  return (
    <Checkbox name={name} value="true" label={label} error={error} {...props} />
  );
}
