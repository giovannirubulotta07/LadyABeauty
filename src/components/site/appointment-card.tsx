import clsx from "clsx";
import type { ReactNode } from "react";
import { parisDate, parisTime } from "@/domain/time/paris";
import { formatDayLong } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import type { AppointmentView } from "@/server/appointments/queries";

/** Elegant appointment card used on the confirmation page and in "Mon espace". */
export function AppointmentCard({
  appointment,
  children,
  muted = false,
}: {
  appointment: AppointmentView;
  children?: ReactNode;
  muted?: boolean;
}) {
  const day = parisDate(appointment.start);
  return (
    <article
      className={clsx(
        "rounded-card border border-sand-200 bg-ivory p-5 sm:p-6",
        muted && "opacity-80",
      )}
    >
      <p className="label text-caramel-700">
        {formatDayLong(day, { withYear: true, capitalize: true })}
      </p>
      <h3 className="mt-2 font-display text-2xl text-espresso-900">
        {parisTime(appointment.start)} · {appointment.serviceName}
      </h3>
      <p className="mt-1 text-sm text-espresso-500">
        {[appointment.variantName, formatDuration(appointment.durationMin)]
          .filter(Boolean)
          .join(" · ")}
        {appointment.status === "cancelled" ? " · annulé" : ""}
      </p>
      {children ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}
