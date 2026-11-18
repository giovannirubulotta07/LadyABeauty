"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/form";
import {
  declineWaitlistOffer,
  redeemWaitlistOffer,
} from "@/server/actions/waitlist";

export function OfferActions({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"book" | "decline">();

  const run = (kind: "book" | "decline") => {
    setAction(kind);
    setError(undefined);
    startTransition(async () => {
      const result =
        kind === "book"
          ? await redeemWaitlistOffer({ token })
          : await declineWaitlistOffer({ token });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" disabled={pending} onClick={() => run("book")}>
          {pending && action === "book" ? <Spinner /> : null}
          Réserver ce créneau
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={pending}
          onClick={() => run("decline")}
        >
          {pending && action === "decline" ? <Spinner /> : null}
          Laisser ma place
        </Button>
      </div>
    </div>
  );
}
