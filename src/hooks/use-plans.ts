"use client";

import { useEffect, useState } from "react";
import { PLANS, type Plan, type PlanSnapshot, PRICING, planFromJson } from "@/server/plans";

export interface PlansData {
  free: Plan;
  pro: Plan;
  pricing: { amountCents: number; label: string };
}

interface PlansPayload {
  free: PlanSnapshot;
  pro: PlanSnapshot;
  pricing: { amountCents: number; label: string };
}

// Short-lived cache: plan config is tiny and admin edits should show quickly.
const TTL_MS = 5_000;
let cached: PlansData | null = null;
let cachedAt = 0;
let inflight: Promise<PlansData> | null = null;

function buildFallback(): PlansData {
  return {
    free: PLANS.free,
    pro: PLANS.pro,
    pricing: { amountCents: Math.round(19.9 * 100), label: PRICING.proPriceLabel },
  };
}

function parsePayload(payload: PlansPayload): PlansData {
  return {
    free: planFromJson("free", payload.free),
    pro: planFromJson("pro", payload.pro),
    pricing: payload.pricing,
  };
}

function isFresh(): boolean {
  return cached != null && Date.now() - cachedAt < TTL_MS;
}

function fetchPlans(): Promise<PlansData> {
  if (isFresh()) return Promise.resolve(cached as PlansData);
  if (!inflight) {
    inflight = fetch("/api/plans")
      .then((r) => r.json())
      .then((d: PlansPayload) => {
        cached = parsePayload(d);
        cachedAt = Date.now();
        inflight = null;
        return cached;
      })
      .catch(() => {
        inflight = null;
        return cached ?? buildFallback();
      });
  }
  return inflight;
}

export function usePlans() {
  const [data, setData] = useState<PlansData | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    const sync = () => {
      setLoading(true);
      fetchPlans()
        .then((d) => active && setData(d))
        .catch(() => active && setData(null))
        .finally(() => active && setLoading(false));
    };
    sync();
    const onFocus = () => {
      if (!isFresh()) sync();
    };
    const onPlansChanged = () => {
      invalidatePlansCache();
      sync();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("grabix:plans-changed", onPlansChanged);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("grabix:plans-changed", onPlansChanged);
    };
  }, []);

  return { plans: data, loading, refresh: fetchPlans };
}

/** Clear the client-side plan cache so the next call fetches fresh data. */
export function invalidatePlansCache() {
  cached = null;
  cachedAt = 0;
  inflight = null;
}
