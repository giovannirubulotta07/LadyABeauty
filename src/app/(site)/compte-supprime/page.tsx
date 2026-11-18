import { FurStrip } from "@/components/site/page-hero";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Compte supprimé",
  robots: { index: false },
};

export default function CompteSupprimePage() {
  return (
    <>
      <FurStrip />
      <Container className="relative -mt-24 flex max-w-xl flex-col items-center rounded-card bg-ivory px-6 py-12 text-center shadow-card sm:-mt-28 sm:px-10">
        <p className="label text-caramel-700">Mes données</p>
        <h1 className="mt-4 text-title text-espresso-900">
          Votre compte a été supprimé
        </h1>
        <p className="mt-5 text-espresso-500">
          Vos données personnelles ont été effacées et vos rendez-vous à venir
          annulés. Merci pour votre confiance.
        </p>
        <ButtonLink href="/" className="mt-10">
          Retour à l’accueil
        </ButtonLink>
      </Container>
      <div className="h-16 sm:h-24" />
    </>
  );
}
