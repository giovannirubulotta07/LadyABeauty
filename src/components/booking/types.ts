import type { DayStatus } from "@/domain/availability/engine";
import type { PublicSlot } from "@/server/actions/booking";

export type FlowVariant = {
  id: string;
  name: string;
  durationMin: number;
  priceLabel: string | null;
};

export type FlowService = {
  id: string;
  slug: string;
  name: string;
  durationMin: number;
  priceLabel: string | null;
  variants: FlowVariant[];
};

export type FlowProfile = {
  signedIn: boolean;
  email: string | null;
  fullName: string;
  phone: string;
  needsPrivacy: boolean;
};

export type FlowBusiness = {
  addressLines: string[];
  mapsUrl: string;
  instagramUrl: string | null;
  cancellationCutoffHours: number;
};

export type DayInfo = { day: string; status: DayStatus };
export type { PublicSlot };

export type Step = "prestation" | "date" | "coordonnees" | "recapitulatif";

export const STEPS: Array<{ id: Step; label: string }> = [
  { id: "prestation", label: "Prestation" },
  { id: "date", label: "Date & heure" },
  { id: "coordonnees", label: "Coordonnées" },
  { id: "recapitulatif", label: "Confirmation" },
];
