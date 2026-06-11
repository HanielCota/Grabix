"use client";

import { useEffect, useState } from "react";
import { PRICING } from "@/server/plans";

// Shared across all consumers so the price is fetched once. Falls back to the
// build-time default until /api/pricing (admin-editable) responds.
let cached: string | null = null;
let inflight: Promise<string> | null = null;

function fetchLabel(): Promise<string> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch("/api/pricing")
      .then((r) => r.json())
      .then((d) => {
        cached = (d?.proPriceLabel as string) || PRICING.proPriceLabel;
        return cached;
      })
      .catch(() => PRICING.proPriceLabel);
  }
  return inflight;
}

export function usePricing() {
  const [proPriceLabel, setLabel] = useState(cached ?? PRICING.proPriceLabel);
  useEffect(() => {
    let active = true;
    fetchLabel().then((l) => active && setLabel(l));
    return () => {
      active = false;
    };
  }, []);
  return { proPriceLabel };
}
