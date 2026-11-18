import clsx from "clsx";
import { type ComponentProps, type ReactNode, useId } from "react";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-espresso-900"
      >
        {label}
      </label>
      {hint ? (
        <p id={hintId} className="mt-1 text-sm text-espresso-500">
          {hint}
        </p>
      ) : null}
      <div className="mt-2">
        {children({ id, describedBy, invalid: Boolean(error) })}
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const inputClasses =
  "block min-h-12 w-full rounded-control border border-espresso-500/60 bg-ivory px-4 text-base text-ink placeholder:text-espresso-500/80 transition-colors focus:border-caramel-700 aria-[invalid=true]:border-danger";

export function TextInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(inputClasses, className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={clsx(inputClasses, "min-h-28 py-3", className)}
      {...props}
    />
  );
}

export function Checkbox({
  label,
  error,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm leading-relaxed text-espresso-700"
      >
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-espresso-900"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="mt-1 pl-8 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type AlertTone = "info" | "error" | "success";

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "rounded-card border px-4 py-3 text-sm leading-relaxed",
        tone === "error" && "border-danger/40 bg-ivory text-danger",
        tone === "info" && "border-caramel-500/50 bg-sand-50 text-espresso-700",
        tone === "success" &&
          "border-espresso-500/30 bg-sand-50 text-espresso-900",
      )}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <div className={clsx(title && "mt-1")}>{children}</div>
    </div>
  );
}

/** Invisible honeypot: real visitors never see or fill it. */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute -left-[9999px] h-px w-px overflow-hidden"
    >
      <label>
        Site web
        <input
          type="text"
          name="site_web"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
