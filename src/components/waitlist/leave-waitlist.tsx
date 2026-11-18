"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Alert, Spinner } from "@/components/ui/form";
import { leaveWaitlistEntry } from "@/server/actions/waitlist";

export function LeaveWaitlist({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await leaveWaitlistEntry({ entryId });
            if (result.ok) router.refresh();
            else setError(result.error);
          })
        }
        className="inline-flex min-h-11 items-center gap-2 text-sm text-espresso-700 underline underline-offset-4"
      >
        {pending ? <Spinner /> : null}
        Me retirer de la liste
      </button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
