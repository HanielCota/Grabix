import type { EntitlementData } from "@/server/entitlements";
import type { MpPayment, MpPreapproval } from "@/server/mercadopago";

// Pure mapping of Mercado Pago objects → the entitlement we persist. Kept free of
// any runtime imports (types only) so it can be unit-tested without a DB/network.

const DAY_MS = 24 * 60 * 60 * 1000;

// A one-time payment (or a recurring charge) grants ~1 month of Pro.
export const PRO_PASS_DURATION_MS = 31 * DAY_MS;

/** Recurring subscription (preapproval) status → entitlement. */
export function mapPreapprovalStatus(pre: MpPreapproval, now = Date.now()): EntitlementData | null {
  const periodEnd = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
  const externalId = pre.id;

  switch (pre.status) {
    case "authorized":
      return {
        plan: "pro",
        status: "active",
        provider: "mercadopago",
        externalId,
        currentPeriodEnd: periodEnd ?? new Date(now + PRO_PASS_DURATION_MS),
      };
    case "cancelled":
      return { plan: "pro", status: "canceled", provider: "mercadopago", externalId, currentPeriodEnd: periodEnd };
    case "paused":
      return { plan: "pro", status: "past_due", provider: "mercadopago", externalId, currentPeriodEnd: null };
    default:
      // "pending" and anything else: nothing to grant yet.
      return null;
  }
}

/** One-time payment (Pix / card via Checkout Pro) status → entitlement. */
export function mapPaymentStatus(p: MpPayment, now = Date.now()): EntitlementData | null {
  const externalId = String(p.id);

  switch (p.status) {
    case "approved":
      return {
        plan: "pro",
        status: "active",
        provider: "mercadopago",
        externalId,
        currentPeriodEnd: new Date(now + PRO_PASS_DURATION_MS),
      };
    case "refunded":
      return { plan: "pro", status: "refunded", provider: "mercadopago", externalId, currentPeriodEnd: null };
    case "charged_back":
      return { plan: "pro", status: "chargeback", provider: "mercadopago", externalId, currentPeriodEnd: null };
    default:
      // pending | in_process | rejected | cancelled — nothing to grant yet.
      return null;
  }
}
