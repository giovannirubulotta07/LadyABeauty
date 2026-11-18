import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { EmailList } from "@/components/admin/email-list";
import { Card, Loading, PageTitle } from "@/components/admin/ui";
import { listEmailLog } from "@/server/admin/emails";

export const metadata: Metadata = { title: "E-mails" };

export default function EmailsPage({
  searchParams,
}: PageProps<"/admin/emails">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Emails searchParams={searchParams} />
      </AdminGate>
    </Suspense>
  );
}

const FILTERS = [
  { value: undefined, label: "Tous" },
  { value: "failed", label: "Échecs" },
] as const;

async function Emails({
  searchParams,
}: Pick<PageProps<"/admin/emails">, "searchParams">) {
  await connection();
  const { statut } = await searchParams;
  const status = statut === "failed" ? "failed" : undefined;
  const emails = await listEmailLog({ status, limit: 150 });
  return (
    <>
      <PageTitle title="Journal des e-mails" />
      <p className="mb-6 max-w-2xl text-espresso-700">
        Les 150 derniers e-mails envoyés par le site : confirmations, rappels,
        annulations, liste d’attente. Un e-mail « Non envoyé » n’avait pas lieu
        d’être (rendez-vous annulé entre-temps, par exemple).
      </p>
      <nav aria-label="Filtrer" className="mb-4 flex gap-2">
        {FILTERS.map((f) => {
          const active = f.value === status;
          return (
            <Link
              key={f.label}
              href={
                f.value ? `/admin/emails?statut=${f.value}` : "/admin/emails"
              }
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "inline-flex min-h-11 items-center rounded-pill bg-espresso-900 px-4 text-sm text-ivory"
                  : "inline-flex min-h-11 items-center rounded-pill border border-sand-200 bg-ivory px-4 text-sm text-espresso-900"
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>
      <Card>
        <EmailList emails={emails} linkAppointments />
      </Card>
    </>
  );
}
