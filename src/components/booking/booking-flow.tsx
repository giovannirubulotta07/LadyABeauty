"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Alert, Spinner } from "@/components/ui/form";
import { confirmBooking } from "@/server/actions/booking";
import { DateStep } from "./date-step";
import { type Details, DetailsStep } from "./details-step";
import { ServiceStep } from "./service-step";
import { Stepper } from "./stepper";
import { SummaryStep } from "./summary-step";
import type {
  DayInfo,
  FlowBusiness,
  FlowProfile,
  FlowService,
  PublicSlot,
  Step,
} from "./types";
import { useJson } from "./use-json";

type Props = {
  services: FlowService[];
  profile: FlowProfile;
  business: FlowBusiness;
  /** Today in Paris, computed on the server. */
  today: string;
  horizonDays: number;
};

type Patch = Partial<
  Record<
    "prestation" | "variante" | "jour" | "creneau" | "etape",
    string | null
  >
>;

/**
 * The whole booking flow. The URL is the source of truth for the selection
 * (shareable links, working back button) and is updated with the History API,
 * which Next.js keeps in sync with useSearchParams without a server round trip.
 */
export function BookingFlow({
  services,
  profile: serverProfile,
  business,
  today,
  horizonDays,
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const top = useRef<HTMLDivElement>(null);
  const renderedAt = useRef(0);
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  const service =
    services.find((s) => s.slug === params.get("prestation")) ?? null;
  const variant =
    service?.variants.find((v) => v.id === params.get("variante")) ?? null;
  const needsVariant = Boolean(
    service && service.variants.length > 0 && !variant,
  );
  const durationMin = variant?.durationMin ?? service?.durationMin ?? 0;
  const day = params.get("jour");
  const start = params.get("creneau");
  const etape = params.get("etape");

  const [reloadKey, setReloadKey] = useState(0);
  const serviceQuery =
    service && !needsVariant
      ? `prestation=${service.id}${variant ? `&variante=${variant.id}` : ""}`
      : null;
  const days = useJson<{ days: DayInfo[] }>(
    serviceQuery
      ? `/api/disponibilites?${serviceQuery}&du=${today}&jours=${horizonDays + 1}`
      : null,
    reloadKey,
  );
  const slots = useJson<{ slots: PublicSlot[] }>(
    serviceQuery && day ? `/api/creneaux?${serviceQuery}&jour=${day}` : null,
    reloadKey,
  );
  const selectedSlot =
    slots.data?.slots.find(
      (s) => s.start === start && s.status === "available",
    ) ?? null;

  // Signing in during the flow must not remount it (a refresh would stream the
  // Suspense fallback again and lose what she typed): the session cookies are
  // already set by the server action, so the flow just knows she is signed in.
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const profile: FlowProfile = signedInAs
    ? { ...serverProfile, signedIn: true, email: signedInAs }
    : serverProfile;

  const [details, setDetails] = useState<Details>({
    fullName: profile.fullName,
    email: profile.email ?? "",
    phone: profile.phone,
    acceptPrivacy: false,
    honeypot: "",
  });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch: Patch, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value == null) next.delete(key);
        else next.set(key, value);
      }
      const url = `${window.location.pathname}?${next.toString()}`;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [],
  );

  const goToStep = (patch: Patch) => {
    navigate(patch);
    top.current?.scrollIntoView({ block: "start" });
  };

  // Pre-select the first bookable day once the strip is loaded.
  useEffect(() => {
    if (!days.data || day) return;
    // She may have tapped a day in the same instant: never override her choice.
    if (new URLSearchParams(window.location.search).get("jour")) return;
    const first =
      days.data.days.find((d) => d.status === "available") ??
      days.data.days.find(
        (d) => d.status === "on_request_only" || d.status === "full",
      );
    if (first) navigate({ jour: first.day }, "replace");
  }, [days.data, day, navigate]);

  // Resolve the current step from the URL.
  const slotPending = Boolean(start) && slots.loading;
  let step: Step = "date";
  if (!service || needsVariant) step = "prestation";
  else if (
    (etape === "coordonnees" || etape === "recapitulatif") &&
    selectedSlot
  ) {
    step =
      etape === "recapitulatif" && profile.signedIn
        ? "recapitulatif"
        : "coordonnees";
  }

  function confirm() {
    if (!service || !selectedSlot) return;
    setConfirmError(null);
    startTransition(async () => {
      const result = await confirmBooking({
        serviceId: service.id,
        variantId: variant?.id ?? null,
        start: selectedSlot.start,
        fullName: details.fullName,
        phone: details.phone,
        acceptPrivacy: details.acceptPrivacy,
        note: note.trim() || undefined,
        honeypot: details.honeypot,
        renderedAt: renderedAt.current,
      });
      if (result.ok) {
        router.push(`/reserver/confirmation?rdv=${result.appointmentId}`);
        return;
      }
      switch (result.code) {
        case "SLOT_UNAVAILABLE":
          setConflict(result.error);
          setReloadKey((k) => k + 1);
          goToStep({ creneau: null, etape: null });
          break;
        case "AUTH_REQUIRED":
          setServerErrors({});
          setSignedInAs(null);
          goToStep({ etape: "coordonnees" });
          break;
        case "INVALID":
          if (
            result.fieldErrors &&
            Object.keys(result.fieldErrors).some((k) =>
              ["fullName", "phone", "acceptPrivacy"].includes(k),
            )
          ) {
            setServerErrors(result.fieldErrors);
            goToStep({ etape: "coordonnees" });
          } else setConfirmError(result.error);
          break;
        default:
          setConfirmError(result.error);
      }
    });
  }

  return (
    <div ref={top} className="scroll-mt-24">
      <div className="leopard rounded-card p-1.5 shadow-card sm:p-2">
        <div className="min-h-[34rem] rounded-[calc(var(--radius-card)-2px)] bg-ivory px-5 py-7 sm:px-8 sm:py-9">
          <Stepper current={step} />
          <div className="mt-8">
            {step === "prestation" ? (
              <ServiceStep
                services={services}
                selected={service}
                selectedVariantId={variant?.id ?? null}
                onSelectService={(s) => {
                  setConflict(null);
                  navigate({
                    prestation: s.slug,
                    variante: null,
                    jour: null,
                    creneau: null,
                    etape: null,
                  });
                  if (s.variants.length > 0) {
                    requestAnimationFrame(() =>
                      document
                        .getElementById("variantes")
                        ?.scrollIntoView({ block: "start" }),
                    );
                  } else top.current?.scrollIntoView({ block: "start" });
                }}
                onSelectVariant={(variantId) =>
                  goToStep({ variante: variantId, jour: null, creneau: null })
                }
              />
            ) : (etape === "coordonnees" || etape === "recapitulatif") &&
              slotPending ? (
              <div
                role="status"
                className="flex items-center gap-3 py-10 text-espresso-500"
              >
                <Spinner /> Vérification du créneau…
              </div>
            ) : step === "date" ? (
              <DateStep
                serviceLabel={
                  variant ? `${service!.name} — ${variant.name}` : service!.name
                }
                durationMin={durationMin}
                days={{
                  data: days.data?.days,
                  loading: days.loading,
                  error: days.error,
                }}
                slots={{
                  data: slots.data?.slots,
                  loading: slots.loading,
                  error: slots.error,
                }}
                selectedDay={day}
                selectedStart={start}
                conflictMessage={conflict}
                instagramUrl={business.instagramUrl}
                onSelectDay={(d) => {
                  setConflict(null);
                  navigate({ jour: d, creneau: null }, "replace");
                }}
                onSelectSlot={(slot) => {
                  setConflict(null);
                  goToStep({
                    // The day the displayed list belongs to (the URL may already
                    // point to a day she tapped a split second earlier).
                    jour: day,
                    creneau: slot.start,
                    etape:
                      profile.signedIn &&
                      details.fullName &&
                      details.phone &&
                      !profile.needsPrivacy
                        ? "recapitulatif"
                        : "coordonnees",
                  });
                }}
                onChangeService={() =>
                  goToStep({
                    prestation: null,
                    variante: null,
                    jour: null,
                    creneau: null,
                    etape: null,
                  })
                }
                onRetry={() => setReloadKey((k) => k + 1)}
              />
            ) : step === "coordonnees" ? (
              <DetailsStep
                profile={profile}
                details={details}
                getRenderedAt={() => renderedAt.current}
                serverErrors={serverErrors}
                onChange={(d) => {
                  setDetails(d);
                  setServerErrors({});
                }}
                onSignedIn={() => {
                  setSignedInAs(details.email.trim().toLowerCase());
                  goToStep({ etape: "recapitulatif" });
                }}
                onContinue={() => goToStep({ etape: "recapitulatif" })}
                onBack={() => goToStep({ creneau: null, etape: null })}
              />
            ) : selectedSlot && service && day ? (
              <SummaryStep
                serviceName={service.name}
                variantName={variant?.name ?? null}
                priceLabel={variant?.priceLabel ?? service.priceLabel}
                durationMin={durationMin}
                day={day}
                slot={selectedSlot}
                contact={{
                  fullName: details.fullName,
                  email: profile.email,
                  phone: details.phone,
                }}
                business={business}
                note={note}
                pending={pending}
                error={confirmError}
                onNoteChange={setNote}
                onEditDetails={() => goToStep({ etape: "coordonnees" })}
                onConfirm={confirm}
              />
            ) : (
              <Alert tone="error">
                Ce créneau n’est plus disponible. Choisissez une autre heure.
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
