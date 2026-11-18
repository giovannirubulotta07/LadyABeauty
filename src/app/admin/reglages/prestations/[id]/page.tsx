import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionButton } from "@/components/admin/action-button";
import { AdminGate } from "@/components/admin/admin-gate";
import {
  ServiceForm,
  VariantForm,
} from "@/components/admin/settings/service-form";
import { Card, CardTitle, Loading, PageTitle } from "@/components/admin/ui";
import { deleteVariant } from "@/server/admin/actions/settings";
import { getServiceForEdit, listCategories } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Prestation" };

export default function ServicePage({
  params,
}: PageProps<"/admin/reglages/prestations/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Service params={params} />
      </AdminGate>
    </Suspense>
  );
}

async function Service({
  params,
}: Pick<PageProps<"/admin/reglages/prestations/[id]">, "params">) {
  const { id } = await params;
  const back = { href: "/admin/reglages/prestations", label: "Prestations" };

  if (id === "nouvelle") {
    const categories = await listCategories();
    return (
      <div className="max-w-3xl">
        <PageTitle title="Nouvelle prestation" back={back} />
        <Card>
          <ServiceForm service={null} categories={categories} />
        </Card>
      </div>
    );
  }

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { service, categories } = await getServiceForEdit(id);
  if (!service) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle title={service.name} back={back} />
      <Card>
        <ServiceForm service={service} categories={categories} />
      </Card>
      <Card aria-labelledby="variantes-titre">
        <CardTitle id="variantes-titre">Variantes</CardTitle>
        <p className="mb-4 text-sm text-espresso-500">
          Pour proposer plusieurs styles (ex. : cil à cil, volume russe) avec
          leur propre durée ou prix. La cliente choisit au moment de réserver.
        </p>
        <ul className="space-y-6">
          {service.service_variants.map((v) => (
            <li
              key={v.id}
              className="rounded-card border border-sand-200 bg-sand-50/60 p-4"
            >
              <VariantForm serviceId={service.id} variant={v} />
              <ActionButton
                action={deleteVariant}
                input={{ id: v.id }}
                tone="quiet"
                className="mt-3"
                confirm={`Supprimer la variante « ${v.name} » ? Les rendez-vous passés gardent leur historique.`}
              >
                Supprimer cette variante
              </ActionButton>
            </li>
          ))}
          <li className="rounded-card border border-dashed border-sand-200 p-4">
            <h3 className="mb-3 font-medium text-espresso-900">
              Nouvelle variante
            </h3>
            <VariantForm serviceId={service.id} variant={null} />
          </li>
        </ul>
      </Card>
    </div>
  );
}
