import "server-only";
import { createHash, randomBytes } from "node:crypto";
import {
  computeDaySlots,
  computeDayStatus,
  isSlotBookable,
} from "@/domain/availability/engine";
import { type LocalDate, parisDate, parisTime } from "@/domain/time/paris";
import {
  parsePgTimestamp,
  parseTstzRange,
  toTstzRange,
} from "@/domain/time/range";
import { planOffers } from "@/domain/waitlist/planner";
import WaitlistOfferEmail, {
  waitlistOfferSubject,
} from "@/emails/waitlist-offer";
import { renderEmail } from "@/emails/render";
import { addressLines, mapsUrl } from "@/lib/address";
import { formatDayLong } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { dayInput, loadCalendar } from "@/server/availability/service";
import { getBusinessInfo } from "@/server/content/queries";
import { createAdminClient } from "@/server/db/admin-client";
import { env } from "@/server/env";
import { deliver } from "@/server/notifications/deliver";

export const hashOfferToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const toStrings = (value: unknown): string[] =>
  Array.isArray(value) ? (value as string[]) : [];

/**
 * Offers the freed slots of one day to the waiting clients (see the planner
 * for the fairness rule) and e-mails them. Safe to call any time and
 * concurrently: the SQL function refuses duplicate or conflicting offers.
 */
export async function processWaitlistDay(
  day: LocalDate,
  now = new Date(),
): Promise<{ offered: number }> {
  const db = createAdminClient();
  const { data: entries, error } = await db
    .from("waitlist_entries")
    .select(
      "id, duration_min, excluded_starts, service_id, variant_id, clients (full_name, email)",
    )
    .eq("day", day)
    .eq("status", "waiting")
    .order("created_at");
  if (error) throw error;
  if (!entries?.length) return { offered: 0 };

  const [{ data: policy }, ctx, business] = await Promise.all([
    db
      .from("business_settings")
      .select(
        "waitlist_exclusive_minutes, waitlist_broadcast_before_hours, waitlist_quiet_start, waitlist_quiet_end",
      )
      .single(),
    loadCalendar(day, day, now),
    getBusinessInfo(),
  ]);
  if (!policy) return { offered: 0 };

  const base = dayInput(ctx, day, 1, now);
  const plan = planOffers(
    base,
    entries.map((e) => ({
      id: e.id,
      durationMin: e.duration_min,
      excludedStarts: toStrings(e.excluded_starts).map(parsePgTimestamp),
    })),
    {
      exclusiveMinutes: policy.waitlist_exclusive_minutes,
      broadcastBeforeHours: policy.waitlist_broadcast_before_hours,
      quietStart: policy.waitlist_quiet_start.slice(0, 5),
      quietEnd: policy.waitlist_quiet_end.slice(0, 5),
    },
  );

  let offered = 0;
  for (const p of plan) {
    const entry = entries.find((e) => e.id === p.entryId)!;
    const token = randomBytes(32).toString("base64url");
    const { data: offerId, error: offerError } = await db.rpc(
      "create_waitlist_offer",
      {
        p_entry_id: entry.id,
        p_period: toTstzRange(p),
        p_token_hash: hashOfferToken(token),
        p_exclusive_until: (p.exclusiveUntil?.toISOString() ?? null) as string,
      },
    );
    if (offerError || !offerId) {
      // Someone else got there first (another run, a booking): nothing to do.
      if (
        !["ENTRY_NOT_WAITING", "SLOT_UNAVAILABLE"].includes(
          offerError?.message ?? "",
        )
      ) {
        console.error("create_waitlist_offer", offerError?.message);
      }
      continue;
    }
    offered++;

    const email = entry.clients?.email;
    if (!email) continue;
    const props = {
      brand: {
        name: business.name,
        siteUrl: env.NEXT_PUBLIC_SITE_URL,
        instagramUrl: business.instagramUrl,
        addressLine: addressLines(business.address).join(", "),
      },
      appt: {
        firstName: entry.clients?.full_name.split(" ")[0] ?? "",
        serviceName:
          (await serviceName(entry.service_id, entry.variant_id)) ?? "",
        dateLabel: formatDayLong(day, { withYear: true, capitalize: true }),
        timeLabel: `${parisTime(p.start)} – ${parisTime(p.end)}`,
        durationLabel: formatDuration(entry.duration_min),
        address: addressLines(business.address).join(", "),
        mapsUrl: mapsUrl(business.name, business.address),
      },
      exclusiveUntil: p.exclusiveUntil ? parisTime(p.exclusiveUntil) : null,
      bookUrl: `${env.NEXT_PUBLIC_SITE_URL}/liste-attente/${token}`,
    };
    await deliver({
      key: `waitlist-offer:${offerId}`,
      kind: "waitlist_offer",
      to: email,
      offerId: offerId as string,
      build: async () => ({
        to: email,
        subject: waitlistOfferSubject(props),
        ...(await renderEmail(<WaitlistOfferEmail {...props} />)),
      }),
    });
  }
  return { offered };
}

async function serviceName(serviceId: string, variantId: string | null) {
  const db = createAdminClient();
  const { data } = await db
    .from("services")
    .select("name, service_variants (id, name)")
    .eq("id", serviceId)
    .maybeSingle();
  if (!data) return null;
  const variant = variantId
    ? data.service_variants.find((v) => v.id === variantId)
    : null;
  return variant ? `${data.name} — ${variant.name}` : data.name;
}

/** Runs processWaitlistDay for every upcoming day that has waiting clients. */
export async function processAllWaitlistDays(now = new Date()) {
  const db = createAdminClient();
  const { data } = await db
    .from("waitlist_entries")
    .select("day")
    .eq("status", "waiting")
    .gte("day", parisDate(now));
  const days = [...new Set((data ?? []).map((r) => r.day))];
  let offered = 0;
  for (const day of days)
    offered += (await processWaitlistDay(day, now)).offered;
  return { days: days.length, offered };
}

// ---------------------------------------------------------------------------
// Client actions (called from server actions after authentication)
// ---------------------------------------------------------------------------
export type WaitlistJoinResult =
  { ok: true; alreadyRegistered: boolean } | { ok: false; error: string };

export const MAX_ACTIVE_ENTRIES = 5;

export async function registerOnWaitlist(params: {
  clientId: string;
  serviceId: string;
  variantId: string | null;
  durationMin: number;
  day: LocalDate;
  now?: Date;
}): Promise<WaitlistJoinResult> {
  const now = params.now ?? new Date();
  const db = createAdminClient();
  const ctx = await loadCalendar(params.day, params.day, now);
  const input = dayInput(ctx, params.day, params.durationMin, now);
  const status = computeDayStatus(input);
  if (status === "past" || status === "beyond_horizon" || status === "closed") {
    return { ok: false, error: "Ce jour n'est pas ouvert à la réservation." };
  }

  const { count } = await db
    .from("waitlist_entries")
    .select("id", { count: "exact", head: true })
    .eq("client_id", params.clientId)
    .in("status", ["waiting", "notified"]);
  if ((count ?? 0) >= MAX_ACTIVE_ENTRIES) {
    return {
      ok: false,
      error: `Vous êtes déjà sur ${MAX_ACTIVE_ENTRIES} listes d'attente. Retirez-en une depuis votre espace.`,
    };
  }

  // The times free right now did not suit her: never offer them back.
  const excluded = computeDaySlots(input)
    .filter((s) => s.status === "available")
    .map((s) => s.start.toISOString());

  const { error } = await db.from("waitlist_entries").insert({
    client_id: params.clientId,
    service_id: params.serviceId,
    variant_id: params.variantId,
    day: params.day,
    duration_min: params.durationMin,
    excluded_starts: excluded,
  });
  if (error?.code === "23505") return { ok: true, alreadyRegistered: true };
  if (error) throw error;
  return { ok: true, alreadyRegistered: false };
}

/** Removes her entry; an open offer is released so the next client can be served. Returns the day. */
export async function leaveWaitlist(
  entryId: string,
  clientId: string,
): Promise<LocalDate | null> {
  const db = createAdminClient();
  const { data: entry } = await db
    .from("waitlist_entries")
    .select("id, day, status")
    .eq("id", entryId)
    .eq("client_id", clientId)
    .in("status", ["waiting", "notified"])
    .maybeSingle();
  if (!entry) return null;

  const { data: open } = await db
    .from("waitlist_offers")
    .select("id")
    .eq("entry_id", entry.id)
    .eq("status", "offered");
  for (const o of open ?? [])
    await db.rpc("release_waitlist_offer", {
      p_offer_id: o.id,
      p_status: "superseded",
    });
  await db
    .from("waitlist_entries")
    .update({ status: "cancelled" })
    .eq("id", entry.id);
  return entry.day;
}

export type OfferView = {
  offerId: string;
  status: "offered" | "accepted" | "expired" | "superseded";
  start: Date;
  end: Date;
  exclusiveUntil: Date | null;
  day: LocalDate;
  serviceName: string;
  durationMin: number;
  firstName: string;
  appointmentId: string | null;
};

export async function findOfferByToken(
  token: string,
): Promise<OfferView | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("waitlist_offers")
    .select(
      "id, status, period, exclusive_until, waitlist_entries (day, duration_min, service_id, variant_id, client_id, clients (full_name))",
    )
    .eq("token_hash", hashOfferToken(token))
    .maybeSingle();
  if (!data?.waitlist_entries) return null;

  const entry = data.waitlist_entries;
  const { start, end } = parseTstzRange(data.period as string);
  let appointmentId: string | null = null;
  if (data.status === "accepted") {
    const { data: appt } = await db
      .from("appointments")
      .select("id")
      .eq("client_id", entry.client_id)
      .eq("source", "waitlist")
      .filter("period", "cs", `[${start.toISOString()},${start.toISOString()}]`)
      .maybeSingle();
    appointmentId = appt?.id ?? null;
  }
  return {
    offerId: data.id,
    status: data.status,
    start,
    end,
    exclusiveUntil: data.exclusive_until
      ? new Date(data.exclusive_until)
      : null,
    day: entry.day,
    serviceName: (await serviceName(entry.service_id, entry.variant_id)) ?? "",
    durationMin: entry.duration_min,
    firstName: entry.clients?.full_name.split(" ")[0] ?? "",
    appointmentId,
  };
}

export type RedeemResult =
  | { ok: true; appointmentId: string }
  | {
      ok: false;
      code: "EXPIRED" | "TAKEN" | "UNAVAILABLE";
      day: LocalDate | null;
    };

/** Books the offered slot (re-checked with the availability engine, then under the SQL lock). */
export async function redeemOffer(
  offer: OfferView,
  now = new Date(),
): Promise<RedeemResult> {
  const db = createAdminClient();
  if (offer.status !== "offered")
    return { ok: false, code: "UNAVAILABLE", day: null };

  const ctx = await loadCalendar(offer.day, offer.day, now);
  const bookable = isSlotBookable(
    dayInput(ctx, offer.day, offer.durationMin, now, offer.offerId),
    offer.start,
  );
  if (!bookable) {
    const day = await release(offer.offerId);
    return { ok: false, code: "TAKEN", day };
  }

  const { data, error } = await db.rpc("redeem_waitlist_offer", {
    p_offer_id: offer.offerId,
  });
  if (error) {
    if (error.message === "OFFER_EXPIRED")
      return { ok: false, code: "EXPIRED", day: null };
    if (["SLOT_TAKEN", "SLOT_BLOCKED", "SLOT_HELD"].includes(error.message)) {
      return { ok: false, code: "TAKEN", day: await release(offer.offerId) };
    }
    if (error.message === "OFFER_UNAVAILABLE")
      return { ok: false, code: "UNAVAILABLE", day: null };
    throw error;
  }
  return { ok: true, appointmentId: data as string };
}

/** Declined by the client, or the slot went to someone else. Returns the day to re-process. */
export async function release(offerId: string): Promise<LocalDate | null> {
  const { data } = await createAdminClient().rpc("release_waitlist_offer", {
    p_offer_id: offerId,
    p_status: "superseded",
  });
  return (data as string | null) ?? null;
}

/** Job: closes expired offers / past days and returns the days to re-process. */
export async function expireWaitlist(): Promise<LocalDate[]> {
  const { data, error } = await createAdminClient().rpc("expire_waitlist");
  if (error) throw error;
  return [...new Set(((data ?? []) as string[]).map(String))];
}
