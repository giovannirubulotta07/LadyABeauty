import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";

/** Readable long-form layout for legal pages. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <Container className="max-w-prose py-section">
      <p className="label text-caramel-700">Informations légales</p>
      <h1 className="mt-4 text-title text-espresso-900">{title}</h1>
      <p className="mt-3 text-sm text-espresso-500">
        Dernière mise à jour : {updated}
      </p>
      <div className="mt-10 space-y-8 leading-relaxed text-espresso-700 [&_a]:text-caramel-700 [&_a]:underline [&_a]:underline-offset-4 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-espresso-900 [&_li]:mt-1.5 [&_p+p]:mt-3 [&_section>*+*]:mt-3 [&_strong]:font-medium [&_strong]:text-espresso-900 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </Container>
  );
}
