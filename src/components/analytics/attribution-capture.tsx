"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/analytics";

/** Persists campaign tags as soon as a visitor arrives, before sign-in or checkout. */
export function AttributionCapture() {
  useEffect(() => captureAttribution(), []);
  return null;
}
