import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Cookies",
  description:
    "Lady A Beauty n’utilise que des cookies techniques nécessaires au fonctionnement du site : pas de publicité, pas de suivi.",
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <LegalPage title="Cookies" updated="18 novembre 2026">
      <section>
        <p>
          Ce site{" "}
          <strong>
            n’utilise aucun cookie publicitaire ni de mesure d’audience
          </strong>
          , et ne contient aucun traceur de réseaux sociaux. C’est pourquoi
          aucun bandeau de consentement ne vous est présenté.
        </p>
      </section>
      <section>
        <h2>Cookies strictement nécessaires</h2>
        <p>
          Lorsque vous vous connectez à votre espace, des cookies de session
          (préfixe <code>sb-</code>) mémorisent votre connexion de façon
          sécurisée. Ils sont indispensables au service demandé et exemptés de
          consentement (article 82 de la loi Informatique et Libertés). Ils sont
          supprimés à la déconnexion ou à leur expiration.
        </p>
      </section>
      <section>
        <h2>Contenus externes</h2>
        <p>
          Les liens vers Instagram ou Google Maps ne déposent aucun cookie tant
          que vous ne cliquez pas dessus ; une fois sur ces sites, leurs propres
          politiques s’appliquent.
        </p>
      </section>
    </LegalPage>
  );
}
