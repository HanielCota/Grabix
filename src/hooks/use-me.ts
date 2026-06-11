"use client";

import { useCallback, useEffect, useState } from "react";

export interface MeData {
  authenticated: boolean;
  plan?: "free" | "pro";
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

  return { me, loading, refresh: load };
}
