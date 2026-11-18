import Link from "next/link";
import type { EmailLogEntry } from "@/server/admin/emails";
import { EMAIL_STATUS_LABEL } from "@/server/admin/emails";
import { Badge, Empty } from "./ui";

const when = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

const tone = {
  sent: "success",
  queued: "neutral",
  failed: "danger",
  skipped: "muted",
} as const;

export function EmailList({
  emails,
  linkAppointments = false,
}: {
  emails: EmailLogEntry[];
  linkAppointments?: boolean;
}) {
  if (emails.length === 0) return <Empty>Aucun e-mail.</Empty>;
  return (
    <ul className="divide-y divide-sand-200">
      {emails.map((e) => (
        <li
          key={e.id}
          className="flex flex-wrap items-start gap-x-4 gap-y-1 py-3 text-sm"
        >
          <span className="w-28 shrink-0 text-espresso-500 tabular-nums">
            {when.format(e.createdAt)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-espresso-900">
              {e.kindLabel}
            </span>
            <span className="block truncate text-espresso-700">
              {e.recipient}
            </span>
            {e.error ? (
              <span className="block text-danger">{e.error}</span>
            ) : null}
            {linkAppointments && e.appointmentId ? (
              <Link
                href={`/admin/rdv/${e.appointmentId}`}
                className="inline-flex min-h-11 items-center text-caramel-700 underline underline-offset-4"
              >
                Voir le rendez-vous
              </Link>
            ) : null}
          </span>
          <Badge tone={tone[e.status]}>{EMAIL_STATUS_LABEL[e.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
