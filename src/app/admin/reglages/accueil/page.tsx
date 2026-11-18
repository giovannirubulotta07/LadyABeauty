import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { HomeTextsForm } from "@/components/admin/settings/home-texts-form";
import { Card, Loading, PageTitle } from "@/components/admin/ui";
import { getStudioSettings } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Page d’accueil" };

export default function HomeTextsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <HomeTexts />
      </AdminGate>
    </Suspense>
  );
}

async function HomeTexts() {
  const { home } = await getStudioSettings();
  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Textes de l’accueil"
        back={{ href: "/admin/reglages", label: "Réglages" }}
      />
      <Card>
        <HomeTextsForm home={home} />
      </Card>
    </div>
  );
}
