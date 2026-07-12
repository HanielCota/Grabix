"use client";

export type ConversionEvent =
  | "cta_click"
  | "extractor_view"
  | "extractor_start"
  | "sign_in_start"
  | "pricing_view"
  | "workspace_view"
  | "media_analysis_start"
  | "analysis_completed"
  | "analysis_failed"
  | "analysis_history_viewed"
  | "saved_analysis_opened"
  | "pricing_viewed"
  | "billing_cycle_selected"
  | "plan_selected"
  | "plan_comparison_viewed"
  | "faq_opened"
  | "upgrade_prompt_viewed"
  | "upgrade_prompt_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_failed"
  | "subscription_activated";

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

  const campaign = getAttribution();
  const payload = { ...properties, ...campaign };

  window.dataLayer?.push({ event, ...payload });
  window.gtag?.("event", event, payload);
  window.fbq?.("trackCustom", event, payload);
}

const ATTRIBUTION_KEY = "grabix:attribution:v1";

/** Keep campaign attribution across sign-in and the external checkout return. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const current = Object.fromEntries(
    [...new URLSearchParams(window.location.search)].filter(([key]) => key.startsWith("utm_")),
  );
  if (Object.keys(current).length === 0) return;
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(current));
  } catch {
    // Analytics must never interfere with the purchase flow.
  }
}

function getAttribution(): Record<string, string> {
  const fromUrl = Object.fromEntries(
    [...new URLSearchParams(window.location.search)].filter(([key]) => key.startsWith("utm_")),
  );
  if (Object.keys(fromUrl).length > 0) return fromUrl;
  try {
    const saved = window.localStorage.getItem(ATTRIBUTION_KEY);
    const parsed = saved ? JSON.parse(saved) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function withCurrentUtm(href: string) {
  if (typeof window === "undefined" || !href.startsWith("/")) return href;
  const url = new URL(href, window.location.origin);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (key.startsWith("utm_") && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
