import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { GalleryManager } from "@/components/admin/settings/gallery-manager";
import { ImageUpload } from "@/components/admin/settings/image-upload";
import {
  Card,
  CardTitle,
  Empty,
  Loading,
  PageTitle,
} from "@/components/admin/ui";
import { uploadGalleryImage } from "@/server/admin/actions/settings";
import { listGalleryForEdit } from "@/server/admin/settings";

export const metadata: Metadata = { title: "Galerie" };

export default function GalleryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <Gallery />
      </AdminGate>
    </Suspense>
  );
}

async function Gallery() {
  const photos = await listGalleryForEdit();
  return (
    <div className="space-y-6">
      <PageTitle
        title="Galerie"
        back={{ href: "/admin/reglages", label: "Réglages" }}
      />
      <Card aria-labelledby="ajout-titre" className="max-w-2xl">
        <CardTitle id="ajout-titre">Ajouter des photos</CardTitle>
        <ImageUpload
          action={uploadGalleryImage}
          label="Photos"
          hint="Directement depuis votre téléphone. Elles sont redimensionnées et les données de localisation sont supprimées."
          withAlt
          multiple
        />
      </Card>
      {photos.length ? (
        <GalleryManager photos={photos} />
      ) : (
        <Empty>Aucune photo pour l’instant.</Empty>
      )}
    </div>
  );
}
