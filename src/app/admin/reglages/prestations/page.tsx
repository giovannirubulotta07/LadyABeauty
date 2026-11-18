import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ChevronIcon, PlusIcon } from "@/components/admin/icons";
import { Badge, Loading, PageTitle } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { priceLabel } from "@/domain/catalog/price";
import { formatDuration } from "@/lib/format";
import { listServicesForEdit } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Prestations" };

export default function ServicesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Services />
      </AdminGate>
    </Suspense>
  );
}

async function Services() {
  const services = await listServicesForEdit();
  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Prestations et tarifs"
        back={{ href: "/admin/reglages", label: "Réglages" }}
        actions={
          <Link
            href="/admin/reglages/prestations/nouvelle"
            className={buttonClasses("primary", "md", "gap-2")}
          >
            <PlusIcon className="size-4" />
            Nouvelle
          </Link>
        }
      />
      <ul className="divide-y divide-sand-200 rounded-card border border-sand-200 bg-ivory">
        {services.map((s) => (
          <li key={s.id}>
            <Link
              href={`/admin/reglages/prestations/${s.id}`}
              className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-sand-50"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-espresso-900">
                  {s.name}
                </span>
                <span className="block text-sm text-espresso-500">
                  {formatDuration(s.duration_min)}
                  {" · "}
                  {priceLabel({
                    priceCents: s.price_cents,
                    priceIsFrom: s.price_is_from,
                    depositCents: s.deposit_cents,
                  }) ?? "Prix non affiché"}
                </span>
                <span className="mt-1 flex flex-wrap gap-1.5">
                  {!s.is_active ? <Badge tone="danger">Masquée</Badge> : null}
                  {s.is_active && !s.bookable_online ? (
                    <Badge tone="muted">Au studio uniquement</Badge>
                  ) : null}
                  {s.is_featured ? <Badge tone="accent">Accueil</Badge> : null}
                </span>
              </span>
              <ChevronIcon className="size-4 text-espresso-500" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
