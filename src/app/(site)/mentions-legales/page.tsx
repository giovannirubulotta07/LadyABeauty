import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { addressLines } from "@/lib/address";
import { getBusinessInfo } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default async function MentionsLegalesPage() {
  const business = await getBusinessInfo();
  const { legalName, siret } = business.legal;

  return (
    <LegalPage title="Mentions légales" updated="18 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          <strong>{business.name}</strong>
          {legalName ? ` — ${legalName}` : ""}
          <br />
          {addressLines(business.address).join(", ")}
          {siret ? (
            <>
              <br />
              SIRET : {siret}
            </>
          ) : null}
          {business.email ? (
            <>
              <br />
              E-mail : <a href={`mailto:${business.email}`}>{business.email}</a>
            </>
          ) : null}
          {business.phone ? (
            <>
              <br />
              Téléphone : {business.phone}
            </>
          ) : null}
        </p>
        <p>
          Directrice de la publication : Alessia, fondatrice de {business.name}.
        </p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <p>
          Site hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Avenue
          #4133, Covina, CA 91723, États-Unis — vercel.com.
          <br />
          Données hébergées par <strong>Supabase Inc.</strong> (infrastructure
          dans l’Union européenne) — supabase.com.
        </p>
      </section>
      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, photographies et le logo de {business.name} sont la
          propriété d’Alessia. Toute reproduction sans autorisation est
          interdite.
        </p>
      </section>
      <section>
        <h2>Données personnelles</h2>
        <p>
          Voir la <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </section>
    </LegalPage>
  );
}
