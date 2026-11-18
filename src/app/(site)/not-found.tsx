import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { PageHero } from "@/components/site/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <PageHero
        size="compact"
        fur="rose"
        label="Page introuvable"
        title="Cette page n’existe pas"
      />
      <Container className="flex flex-col items-start py-16 sm:py-20">
        <p className="max-w-md text-lg text-espresso-700">
          Le lien est peut-être incomplet, ou la page a été déplacée.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Retour à l’accueil</ButtonLink>
          <ButtonLink href="/reserver" variant="outline">
            Prendre rendez-vous
          </ButtonLink>
        </div>
      </Container>
    </>
  );
}
