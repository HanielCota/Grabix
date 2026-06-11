"use client";

import { useCallback, useEffect, useState } from "react";

export interface MeData {
  authenticated: boolean;
  plan?: "free" | "pro";
  isAdmin?: boolean;
  /** ISO date the Pro pass is active through (null for free or no expiry). */
  periodEnd?: string | null;
  /** ISO date the current Pro period began (≈ last payment); sizes the bar. */
  periodStart?: string | null;
  usage?: { used: number; limit: number | null; remaining: number | null };
}

export function useMe() {
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    fetch("/api/me")
      .then((r) => r.json())
      .then((d: MeData) => active && setMe(d))
      .catch(() => active && setMe(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => load(), [load]);

  // Refresh the plan/quota when a download changes usage, or on tab focus.
  useEffect(() => {
    function onChange() {
      load();
    }
    window.addEventListener("grabix:usage-changed", onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener("grabix:usage-changed", onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [load]);

  return { me, loading, refresh: load };
}

/** Notify the UI that download usage changed (header quota pill refetches). */
export function notifyUsageChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("grabix:usage-changed"));
  }
}
