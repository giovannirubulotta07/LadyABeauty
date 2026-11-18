"use client";

import { useRouter } from "next/navigation";

/** Native date picker (best on phones) that opens the chosen day. */
export function DayPicker({
  day,
  view,
}: {
  day: string;
  view: "jour" | "semaine";
}) {
  const router = useRouter();
  return (
    <label className="relative inline-flex min-h-11 items-center">
      <span className="sr-only">Aller à une date</span>
      <input
        type="date"
        value={day}
        onChange={(e) => {
          if (e.target.value)
            router.push(
              `/admin?jour=${e.target.value}${view === "semaine" ? "&vue=semaine" : ""}`,
            );
        }}
        className="min-h-11 rounded-control border border-sand-200 bg-ivory px-3 text-sm text-espresso-900"
      />
    </label>
  );
}
