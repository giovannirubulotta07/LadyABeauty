"use client";

import { useEffect, useState } from "react";

type State<T> = { key: string | null; data?: T; error?: string };

/**
 * Fetches JSON for `url` (null = idle). `loading` is derived from whether the
 * stored result belongs to the current URL, so no state is set synchronously
 * inside the effect. `reloadKey` forces a refetch of the same URL.
 */
export function useJson<T>(url: string | null, reloadKey = 0) {
  const key = url ? `${url}#${reloadKey}` : null;
  const [state, setState] = useState<State<T>>({ key: null });

  useEffect(() => {
    if (!url || !key) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as T & {
          error?: string;
        };
        if (!res.ok) throw new Error(body.error ?? "Erreur de chargement.");
        setState({ key, data: body });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key,
          error: err instanceof Error ? err.message : "Erreur de chargement.",
        });
      });
    return () => controller.abort();
  }, [url, key]);

  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: Boolean(key) && !current,
  };
}
