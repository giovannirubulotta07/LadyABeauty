import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { HoursEditor } from "@/components/admin/settings/hours-editor";
import { RulesForm } from "@/components/admin/settings/rules-form";
import { Card, CardTitle, Loading, PageTitle } from "@/components/admin/ui";
import { getStudioSettings, getWeeklyHours } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Horaires" };

export default function HoursPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Hours />
      </AdminGate>
    </Suspense>
  );
}

async function Hours() {
  const [hours, settings] = await Promise.all([
    getWeeklyHours(),
    getStudioSettings(),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle
        title="Horaires et règles"
        back={{ href: "/admin/reglages", label: "Réglages" }}
      />
      <Card aria-labelledby="horaires-titre">
        <CardTitle id="horaires-titre">Horaires d’ouverture</CardTitle>
        <p className="mb-2 text-sm text-espresso-500">
          Pour une fermeture exceptionnelle ou des congés, utilisez plutôt «
          Bloquer un créneau » dans l’agenda.
        </p>
        <HoursEditor initial={hours} />
      </Card>
      <Card aria-labelledby="regles-titre">
        <CardTitle id="regles-titre">Règles de réservation</CardTitle>
        <RulesForm rules={settings.rules} />
      </Card>
    </div>
  );
}
