"use client";

import { useEffect, useState } from "react";
import { PRICING } from "@/server/plans";

// Shared across all consumers so the price is fetched once per TTL window.
// Falls back to the build-time default until /api/pricing (admin-editable)
// responds. The cache is intentionally short-lived so an admin price change
// reflects on the public site without a hard reload (the value is tiny, so
// re-fetching on navigation/focus is cheap).
const TTL_MS = 5_000;
let cached: string | null = null;
let cachedAt = 0;
let inflight: Promise<string> | null = null;

function isFresh(): boolean {
  return cached != null && Date.now() - cachedAt < TTL_MS;
}

function fetchLabel(): Promise<string> {
  if (isFresh()) return Promise.resolve(cached as string);
  if (!inflight) {
    inflight = fetch("/api/pricing")
      .then((r) => r.json())
      .then((d) => {
        cached = (d?.proPriceLabel as string) || PRICING.proPriceLabel;
        cachedAt = Date.now();
        inflight = null;
        return cached;
      })
      .catch(() => {
        // Don't poison the cache with the fallback: clear `inflight` so a later
        // call retries the fetch once the network recovers. Until then callers
        // get the last good value (or the build-time default).
        inflight = null;
        return cached ?? PRICING.proPriceLabel;
      });
  }
  return inflight;
}

export function usePricing() {
  const [proPriceLabel, setLabel] = useState(cached ?? PRICING.proPriceLabel);
  useEffect(() => {
    let active = true;
    const sync = () => {
      fetchLabel().then((l) => active && setLabel(l));
    };
    sync();
    // Revalidate when the user returns to the tab so a price edited elsewhere
    // shows up without a manual reload, even on a long-lived session.
    const onFocus = () => {
      if (!isFresh()) sync();
    };
    // Revalidate immediately when an admin saves a plan/price change in another
    // tab (or in this one).
    const onPlansChanged = () => {
      invalidatePricingCache();
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
  return { proPriceLabel };
}

/** Clear the client-side price cache so the next call fetches fresh data. */
export function invalidatePricingCache() {
  cached = null;
  cachedAt = 0;
  inflight = null;
}

/** Notify every listener that the admin-editable plan config changed. */
export function notifyPlansChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("grabix:plans-changed"));
  }
}
