import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section text-center">
      <p className="label text-caramel-700">Page introuvable</p>
      <h1 className="mt-4 text-title text-espresso-900">
        Cette page n’existe pas
      </h1>
      <p className="mt-5 max-w-md text-espresso-500">
        Le lien est peut-être incomplet, ou la page a été déplacée.
      </p>
      <ButtonLink href="/" className="mt-10">
        Retour à l’accueil
      </ButtonLink>
    </Container>
  );
}
