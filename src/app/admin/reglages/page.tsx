import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";
import { ChevronIcon } from "@/components/admin/icons";
import { Loading, PageTitle } from "@/components/admin/ui";
import { signOut } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Réglages" };

const SECTIONS = [
  {
    href: "/admin/reglages/horaires",
    title: "Horaires et règles de réservation",
    text: "Jours et heures d’ouverture, délai minimum, annulation, liste d’attente.",
  },
  {
    href: "/admin/reglages/prestations",
    title: "Prestations et tarifs",
    text: "Noms, durées, prix, acomptes, variantes, réservation en ligne.",
  },
  {
    href: "/admin/reglages/studio",
    title: "Studio et notifications",
    text: "Adresse, téléphone, Instagram, logo, informations légales, e-mails reçus.",
  },
  {
    href: "/admin/reglages/accueil",
    title: "Textes de la page d’accueil",
    text: "Titre, sous-titre et présentation « À propos ».",
  },
  {
    href: "/admin/reglages/galerie",
    title: "Galerie",
    text: "Ajouter, ordonner, masquer ou supprimer des photos.",
  },
] as const;

export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminGate>
        <PageTitle title="Réglages" />
        <ul className="divide-y divide-sand-200 rounded-card border border-sand-200 bg-ivory">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex min-h-16 items-center gap-4 px-4 py-4 hover:bg-sand-50 sm:px-6"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-espresso-900">
                    {s.title}
                  </span>
                  <span className="block text-sm text-espresso-500">
                    {s.text}
                  </span>
                </span>
                <ChevronIcon className="size-5 shrink-0 text-espresso-500" />
              </Link>
            </li>
          ))}
        </ul>
        <form action={signOut} className="mt-8">
          <button
            type="submit"
            className="min-h-11 text-sm text-espresso-700 underline underline-offset-4"
          >
            Se déconnecter
          </button>
        </form>
      </AdminGate>
    </Suspense>
  );
}
