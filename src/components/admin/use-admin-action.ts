"use client";

import { useState, useTransition } from "react";

type Result =
  | { ok: true; data?: unknown }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Runs an admin Server Action from a client component and keeps its state
 * (pending, error, field errors). The action refreshes the views itself.
 */
export function useAdminAction<I, R extends Result>(
  action: (input: I) => Promise<R>,
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const run = (
    input: I,
    {
      onSuccess,
    }: { onSuccess?: (result: Extract<R, { ok: true }>) => void } = {},
  ) => {
    setError(undefined);
    setFieldErrors({});
    startTransition(async () => {
      const result = await action(input);
      if (result.ok) onSuccess?.(result as Extract<R, { ok: true }>);
      else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  return { run, pending, error, fieldErrors, setError };
}
