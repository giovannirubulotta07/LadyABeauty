"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/form";
import { useAdminAction } from "./use-admin-action";

/**
 * One-click admin action (remove a block, mark as done…), with an optional
 * confirmation and the error shown right below the button.
 */
export function ActionButton<I>({
  action,
  input,
  children,
  confirm,
  tone = "outline",
  className,
  ariaLabel,
}: {
  action: (input: I) => Promise<{ ok: true } | { ok: false; error: string }>;
  input: I;
  children: ReactNode;
  confirm?: string;
  tone?: "outline" | "primary" | "danger" | "quiet";
  className?: string;
  ariaLabel?: string;
}) {
  const { run, pending, error } = useAdminAction(action);
  return (
    <span className={clsx("inline-flex flex-col items-start", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          run(input);
        }}
        className={clsx(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors disabled:opacity-60",
          tone === "outline" &&
            "border border-espresso-900/30 text-espresso-900 hover:border-espresso-900",
          tone === "primary" &&
            "bg-espresso-900 text-ivory hover:bg-caramel-700",
          tone === "danger" &&
            "border border-danger/40 text-danger hover:bg-danger hover:text-ivory",
          tone === "quiet" &&
            "px-2 text-espresso-700 underline underline-offset-4 hover:text-espresso-900",
        )}
      >
        {pending ? <Spinner /> : null}
        {children}
      </button>
      {error ? (
        <span role="alert" className="mt-1 text-sm text-danger">
          {error}
        </span>
      ) : null}
    </span>
  );
}
