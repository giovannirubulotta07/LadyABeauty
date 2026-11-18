"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/form";
import { cancelWithManageLink } from "@/server/actions/account";

export function CancelWithLink({ token }: { token: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="outline" onClick={() => setConfirming(true)}>
        Annuler ce rendez-vous
      </Button>
    );
  }
  return (
    <div
      className="space-y-3 rounded-card bg-sand-50 p-4"
      role="group"
      aria-label="Confirmer l'annulation"
    >
      <p className="text-sm text-espresso-900">
        Voulez-vous vraiment annuler ce rendez-vous ?
      </p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelWithManageLink({ token });
              if (result.ok) router.refresh();
              else setError(result.error);
            })
          }
        >
          {pending ? <Spinner /> : null}
          Oui, annuler
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Non, garder
        </Button>
      </div>
    </div>
  );
}
