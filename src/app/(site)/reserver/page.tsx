import { PageHero } from "@/components/site/page-hero";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { connection } from "next/server";
import { Suspense } from "react";
import { BookingFlow } from "@/components/booking/booking-flow";
import type { FlowService } from "@/components/booking/types";
import { Container } from "@/components/ui/container";
import { priceLabel } from "@/domain/catalog/price";
import { parisDate } from "@/domain/time/paris";
import { addressLines, mapsUrl } from "@/lib/address";
import { getSessionUser } from "@/server/auth/session";
import { findClientForUser } from "@/server/clients/service";
import { getBusinessInfo, getServices } from "@/server/content/queries";

export const metadata: Metadata = pageMetadata({
  title: "Prendre rendez-vous",
  description:
    "Réservez en ligne votre extension de cils, rehaussement ou browlift à Annemasse : choisissez la prestation, le jour et l’heure, confirmation immédiate.",
  path: "/reserver",
});

export default function ReserverPage() {
  return (
    <>
      <PageHero
        size="compact"
        fur="rose"
        label="Réservation"
        title="Prendre rendez-vous"
      />
      <Container className="relative -mt-14 max-w-3xl pb-16 sm:-mt-20 sm:pb-24">
        <Suspense fallback={<FlowSkeleton />}>
          <BookingLoader />
        </Suspense>
      </Container>
    </>
  );
}

/** Reads the session (request-time), so it streams behind the Suspense boundary. */
async function BookingLoader() {
  await connection(); // "today" must be computed per request
  const [business, services, user] = await Promise.all([
    getBusinessInfo(),
    getServices(),
    getSessionUser(),
  ]);
  const client = user ? await findClientForUser(user) : null;

  const flowServices: FlowService[] = services
    .filter((s) => s.bookableOnline)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      durationMin: s.durationMin,
      priceLabel: priceLabel(s),
      variants: s.variants.map((v) => ({
        id: v.id,
        name: v.name,
        durationMin: v.durationMin,
        priceLabel: priceLabel({
          priceCents: v.priceCents,
          priceIsFrom: false,
          depositCents: s.depositCents,
        }),
      })),
    }));

  return (
    <BookingFlow
      services={flowServices}
      today={parisDate(new Date())}
      horizonDays={business.policy.maxAdvanceDays}
      profile={{
        signedIn: Boolean(user),
        email: user?.email ?? null,
        fullName: client?.fullName ?? "",
        phone: client?.phone ?? "",
        needsPrivacy: !client?.privacyAcceptedAt,
      }}
      business={{
        addressLines: addressLines(business.address),
        mapsUrl: mapsUrl(business.name, business.address),
        instagramUrl: business.instagramUrl,
        cancellationCutoffHours: business.policy.cancellationCutoffHours,
      }}
    />
  );
}

function FlowSkeleton() {
  return (
    <div
      className="rounded-card border border-sand-200 shadow-card"
      role="status"
      aria-busy="true"
    >
      <div className="min-h-[34rem] space-y-4 rounded-card bg-ivory px-5 py-7 sm:px-8 sm:py-9">
        <span className="sr-only">Chargement de la réservation…</span>
        <div className="h-1 rounded-full bg-sand-200" />
        <div className="h-8 w-2/3 rounded bg-sand-50" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-16 rounded-card bg-sand-50" />
        ))}
      </div>
    </div>
  );
}
