import type { Metadata } from "next";
import { BOOKING_LINK } from "@/components/site/navigation";
import { ServiceCard } from "@/components/site/service-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getServices } from "@/server/content/queries";

export const metadata: Metadata = {
  title: "Prestations",
  description:
    "Extension de cils, remplissage, rehaussement, browlift, sourcils : durées et tarifs.",
  alternates: { canonical: "/prestations" },
};

export default async function PrestationsPage() {
  const services = await getServices();

  return (
    <Container className="py-section">
      <SectionHeading
        as="h1"
        label="Prestations"
        title="Prestations & tarifs"
        intro="Chaque prestation est réalisée sur mesure, selon votre regard et vos envies."
      />
      {services.length === 0 ? (
        <p className="mt-12 rounded-card border border-dashed border-sand-200 p-10 text-center text-espresso-500">
          Les prestations seront bientôt disponibles.
        </p>
      ) : (
        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li key={service.id}>
              <ServiceCard
                service={service}
                withDescription
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-16 flex justify-center">
        <ButtonLink href={BOOKING_LINK.href} size="lg">
          {BOOKING_LINK.label}
        </ButtonLink>
      </div>
    </Container>
  );
}
