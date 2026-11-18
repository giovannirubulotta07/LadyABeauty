"use client";

import Link from "next/link";
import { saveHomeTexts } from "@/server/admin/actions/settings";
import type { StudioSettings } from "@/server/admin/settings";
import { SInput, STextArea, SettingsForm } from "./settings-form";

export function HomeTextsForm({ home }: { home: StudioSettings["home"] }) {
  return (
    <SettingsForm action={saveHomeTexts}>
      <SInput
        name="heroTitle"
        label="Grand titre"
        hint="Affiché en très grand en haut de la page (2 à 4 mots)."
        required
        maxLength={60}
        defaultValue={home.heroTitle}
      />
      <STextArea
        name="heroSubtitle"
        label="Sous-titre"
        maxLength={200}
        defaultValue={home.heroSubtitle}
        className="[&_textarea]:min-h-20"
      />
      <SInput
        name="aboutTitle"
        label="Titre de la présentation"
        required
        maxLength={80}
        defaultValue={home.aboutTitle}
      />
      <STextArea
        name="aboutParagraphs"
        label="Présentation"
        hint="Laissez une ligne vide entre deux paragraphes."
        maxLength={4000}
        rows={10}
        defaultValue={home.aboutParagraphs}
      />
      <p className="text-sm text-espresso-500">
        Les changements sont visibles immédiatement sur{" "}
        <Link href="/" className="underline underline-offset-4" target="_blank">
          la page d’accueil
        </Link>
        .
      </p>
    </SettingsForm>
  );
}
