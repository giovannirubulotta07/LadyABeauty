import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { addressLines } from "@/lib/address";
import { getBusinessInfo } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Lady A Beauty traite vos données personnelles (RGPD).",
  alternates: { canonical: "/confidentialite" },
};

export default async function ConfidentialitePage() {
  const business = await getBusinessInfo();
  const controller = business.legal.legalName ?? business.name;
  const contact = business.email;

  return (
    <LegalPage title="Politique de confidentialité" updated="18 novembre 2026">
      <section>
        <p>
          {business.name} accorde une grande importance à la protection de vos
          données personnelles. Cette politique explique quelles données sont
          traitées lorsque vous utilisez ce site, pourquoi, pendant combien de
          temps et quels sont vos droits, conformément au Règlement (UE)
          2016/679 (« RGPD ») et à la loi Informatique et Libertés.
        </p>
      </section>

      <section>
        <h2>Responsable du traitement</h2>
        <p>
          <strong>{controller}</strong>,{" "}
          {addressLines(business.address).join(", ")}.
          {contact ? (
            <>
              {" "}
              Contact : <a href={`mailto:${contact}`}>{contact}</a>.
            </>
          ) : null}
        </p>
      </section>

      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>
            <strong>Identité et contact</strong> : prénom et nom, adresse
            e-mail, numéro de téléphone.
          </li>
          <li>
            <strong>Rendez-vous</strong> : prestations réservées, dates et
            heures, message facultatif, historique, inscriptions sur liste
            d’attente.
          </li>
          <li>
            <strong>Suivi des prestations</strong> : notes internes utiles à la
            qualité du service (par exemple la courbure et la longueur des cils
            utilisées), visibles uniquement par Alessia.
          </li>
          <li>
            <strong>Données techniques</strong> : journaux de connexion et
            adresse IP, utilisés uniquement pour la sécurité (protection contre
            les abus) et conservés sous forme anonymisée.
          </li>
        </ul>
        <p>Aucune donnée bancaire n’est collectée sur ce site.</p>
      </section>

      <section>
        <h2>Finalités et bases légales</h2>
        <ul>
          <li>
            Gérer vos réservations, votre espace client et la liste d’attente —
            exécution du contrat (art. 6.1.b RGPD).
          </li>
          <li>
            Vous envoyer les e-mails liés à vos rendez-vous (confirmation,
            rappel, annulation, place libérée) — exécution du contrat.
          </li>
          <li>
            Assurer la sécurité du site et prévenir les abus — intérêt légitime
            (art. 6.1.f RGPD).
          </li>
          <li>
            Respecter les obligations comptables et légales — obligation légale
            (art. 6.1.c RGPD).
          </li>
        </ul>
        <p>
          Vos données ne sont jamais vendues ni utilisées à des fins
          publicitaires.
        </p>
      </section>

      <section>
        <h2>Destinataires et sous-traitants</h2>
        <p>
          Vos données sont accessibles uniquement à Alessia. Elles sont
          hébergées par des prestataires techniques :
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> (base de données et authentification),
            hébergement dans l’Union européenne ;
          </li>
          <li>
            <strong>Vercel</strong> (hébergement du site) ;
          </li>
          <li>
            <strong>Resend</strong> (envoi des e-mails).
          </li>
        </ul>
        <p>
          Lorsque ces prestataires traitent des données hors de l’Union
          européenne, les transferts sont encadrés par les clauses
          contractuelles types de la Commission européenne et/ou le cadre de
          protection des données UE–États-Unis.
        </p>
      </section>

      <section>
        <h2>Durées de conservation</h2>
        <ul>
          <li>
            Compte client : jusqu’à sa suppression, ou 2 ans après votre dernier
            rendez-vous ou dernière connexion.
          </li>
          <li>
            Historique des rendez-vous : 3 ans après le dernier rendez-vous,
            puis anonymisation.
          </li>
          <li>Inscriptions sur liste d’attente : jusqu’au jour concerné.</li>
          <li>Journaux d’envoi des e-mails et de sécurité : 12 mois.</li>
        </ul>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous disposez d’un droit d’accès, de rectification, d’effacement, de
          limitation, d’opposition et de portabilité. Depuis{" "}
          <Link href="/mon-espace">votre espace</Link>, vous pouvez directement
          modifier vos informations, <strong>télécharger vos données</strong> et{" "}
          <strong>supprimer votre compte</strong>.
          {contact ? (
            <>
              {" "}
              Pour toute autre demande, écrivez à{" "}
              <a href={`mailto:${contact}`}>{contact}</a>.
            </>
          ) : null}
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL (
          <a href="https://www.cnil.fr" rel="noopener">
            www.cnil.fr
          </a>
          ).
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          Ce site n’utilise que des cookies strictement nécessaires à son
          fonctionnement (connexion à votre espace). Voir la{" "}
          <Link href="/cookies">politique relative aux cookies</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
