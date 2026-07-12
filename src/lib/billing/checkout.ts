import { captureAttribution, trackConversion } from "@/lib/analytics";

const CHECKOUT_CONTEXT_KEY = "grabix:checkout-context:v1";

export interface CheckoutContext {
  reason?: string;
  returnTo?: string;
}

// Client helper: kick off the Pro purchase. Context is deliberately limited to
// non-sensitive UI state; price and plan remain server-controlled.
export async function startCheckout(context: CheckoutContext = {}): Promise<void> {
  captureAttribution();
  const safeContext = {
    reason: typeof context.reason === "string" ? context.reason.slice(0, 80) : undefined,
    returnTo: context.returnTo?.startsWith("/") ? context.returnTo : "/",
  };
  try {
    window.sessionStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(safeContext));
  } catch {
    // Returning to a generic success page is still safe if storage is unavailable.
  }
  trackConversion("checkout_started", {
    plan: "pro",
    upgrade_reason: safeContext.reason,
    source_page: window.location.pathname,
  });
  const res = await fetch("/api/billing/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(safeContext),
  });
  const data = await res.json().catch(() => ({}));

  if (res.ok && data.init_point) {
    window.location.href = data.init_point;
    return;
  }

  throw new Error(data.error?.message ?? "Não foi possível iniciar a assinatura. Tente novamente.");
}

export function takeCheckoutContext(): CheckoutContext {
  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_CONTEXT_KEY);
    window.sessionStorage.removeItem(CHECKOUT_CONTEXT_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
