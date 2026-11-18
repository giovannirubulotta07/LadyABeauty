import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ImageUpload } from "@/components/admin/settings/image-upload";
import { StudioForm } from "@/components/admin/settings/studio-form";
import { Card, CardTitle, Loading, PageTitle } from "@/components/admin/ui";
import { uploadLogo } from "@/server/admin/actions/settings";
import { getStudioSettings } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Studio" };

export default function StudioPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Studio />
      </AdminGate>
    </Suspense>
  );
}

async function Studio() {
  const { studio } = await getStudioSettings();
  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle
        title="Studio et notifications"
        back={{ href: "/admin/reglages", label: "Réglages" }}
      />
      <Card aria-labelledby="studio-titre">
        <CardTitle id="studio-titre">Coordonnées</CardTitle>
        <StudioForm studio={studio} />
      </Card>
      <Card aria-labelledby="logo-titre">
        <CardTitle id="logo-titre">Logo</CardTitle>
        {studio.logoUrl ? (
          <Image
            src={studio.logoUrl}
            alt="Logo actuel"
            width={96}
            height={96}
            className="mb-4 rounded-card border border-sand-200"
          />
        ) : null}
        <ImageUpload
          action={uploadLogo}
          label="Nouveau logo"
          hint="Image carrée de préférence (PNG ou JPEG)."
        />
      </Card>
    </div>
  );
}
