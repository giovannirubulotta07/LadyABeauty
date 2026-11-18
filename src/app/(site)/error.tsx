"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function SiteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-section text-center">
      <p className="label text-caramel-700">Petit contretemps</p>
      <h1 className="mt-4 text-title text-espresso-900">
        Une erreur est survenue
      </h1>
      <p className="mt-5 max-w-md text-espresso-500">
        Nous n’avons pas pu afficher cette page. Réessayez dans un instant ; si
        le problème persiste, contactez-nous sur Instagram.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => retry()}>Réessayer</Button>
        <ButtonLink href="/" variant="outline">
          Retour à l’accueil
        </ButtonLink>
      </div>
    </Container>
  );
}
