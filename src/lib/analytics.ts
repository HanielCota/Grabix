"use client";

export type ConversionEvent =
  | "cta_click"
  | "extractor_view"
  | "extractor_start"
  | "sign_in_start"
  | "pricing_view"
  | "workspace_view"
  | "media_analysis_start";

type EventProperties = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: "event", event: string, properties?: EventProperties) => void;
    fbq?: (command: "trackCustom", event: string, properties?: EventProperties) => void;
  }
}

// One small boundary for analytics providers. Integrations can be enabled in the
// layout later without scattering vendor calls through presentation components.
export function trackConversion(event: ConversionEvent, properties: EventProperties = {}) {
  if (typeof window === "undefined") return;

  const utm = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries([...utm].filter(([key]) => key.startsWith("utm_")));
  const payload = { ...properties, ...campaign };

  window.dataLayer?.push({ event, ...payload });
  window.gtag?.("event", event, payload);
  window.fbq?.("trackCustom", event, payload);
}

export function withCurrentUtm(href: string) {
  if (typeof window === "undefined" || !href.startsWith("/")) return href;
  const url = new URL(href, window.location.origin);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (key.startsWith("utm_") && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
