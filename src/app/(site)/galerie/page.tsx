import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getGallery } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Les réalisations de Lady A Beauty : extensions de cils, rehaussement et sourcils.",
  alternates: { canonical: "/galerie" },
};

export default async function GaleriePage() {
  const images = await getGallery();
  return (
    <Container className="py-section">
      <SectionHeading as="h1" label="Galerie" title="Les regards" />
      <div className="mt-12">
        <GalleryGrid images={images} />
      </div>
    </Container>
  );
}
