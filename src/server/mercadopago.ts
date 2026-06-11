import crypto from "node:crypto";
import { AppError } from "@/features/media-downloader/domain/errors";

// Mercado Pago - Subscriptions (preapproval) via REST.
// Docs: https://www.mercadopago.com.br/developers/en/reference/subscriptions/_preapproval/post

const MP_API = "https://api.mercadopago.com";

function accessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new AppError("Assinatura indisponível no momento.", "BILLING_UNAVAILABLE", 503);
  }
  return token;
}

export interface MpPreapproval {
  id: string;
  status: string; // pending | authorized | paused | cancelled
  external_reference?: string;
  payer_email?: string;
  next_payment_date?: string;
  reason?: string;
  auto_recurring?: { transaction_amount?: number; currency_id?: string };
}

/** Create a monthly subscription tied to a user (external_reference = userId). */
export async function createPreapproval(params: {
  userId: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
}): Promise<{ id: string; initPoint: string }> {
  const res = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: "Grabix Pro",
      external_reference: params.userId,
      payer_email: params.payerEmail,
      back_url: params.backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: params.amount,
        currency_id: "BRL",
      },
    }),
  });

  if (!res.ok) {
    throw new AppError(`Falha ao criar assinatura (MP ${res.status}).`, "BILLING_ERROR", 502);
  }

  const data = (await res.json()) as { id: string; init_point?: string; sandbox_init_point?: string };
  const initPoint = data.init_point ?? data.sandbox_init_point;
  if (!initPoint) {
    throw new AppError("Mercado Pago não retornou link de checkout.", "BILLING_ERROR", 502);
  }
  return { id: data.id, initPoint };
}

export async function getPreapproval(id: string): Promise<MpPreapproval> {
  const res = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) {
    throw new AppError(`Falha ao consultar assinatura (MP ${res.status}).`, "BILLING_ERROR", 502);
  }
  return (await res.json()) as MpPreapproval;
}

export async function getAuthorizedPayment(id: string): Promise<{ preapproval_id?: string; status?: string }> {
  const res = await fetch(`${MP_API}/authorized_payments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) {
    throw new AppError(`Falha ao consultar pagamento (MP ${res.status}).`, "BILLING_ERROR", 502);
  }
  return (await res.json()) as { preapproval_id?: string; status?: string };
}

// ─── One-time payment (Checkout Pro: Pix + card) ───
// Pix can't be used for recurring preapprovals, so a Pro pass is sold as a single
// payment that grants ~1 month. Checkout Pro enables Pix by default for BRL.

export interface MpPayment {
  id: number | string;
  status: string; // approved | pending | in_process | rejected | refunded | charged_back | cancelled
  external_reference?: string;
  payer?: { email?: string };
  date_approved?: string | null;
  // Amount actually paid — used to verify the payment matches the Pro price so a
  // user can't get Pro by paying an arbitrary (smaller) amount.
  transaction_amount?: number;
  currency_id?: string;
}

/** Create a one-time checkout preference tied to a user (external_reference = userId). */
export async function createCheckoutPreference(params: {
  userId: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
  notificationUrl?: string;
}): Promise<{ id: string; initPoint: string }> {
  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        {
          id: "grabix-pro",
          title: "Grabix Pro (1 mês)",
          quantity: 1,
          unit_price: params.amount,
          currency_id: "BRL",
        },
      ],
      payer: { email: params.payerEmail },
      external_reference: params.userId,
      back_urls: { success: params.backUrl, failure: params.backUrl, pending: params.backUrl },
      auto_return: "approved",
      ...(params.notificationUrl ? { notification_url: params.notificationUrl } : {}),
      // Pix + card are enabled by default for BRL; we don't exclude anything.
    }),
  });

  if (!res.ok) {
    throw new AppError(`Falha ao criar checkout (MP ${res.status}).`, "BILLING_ERROR", 502);
  }

  const data = (await res.json()) as { id: string; init_point?: string; sandbox_init_point?: string };
  const initPoint = data.init_point ?? data.sandbox_init_point;
  if (!initPoint) {
    throw new AppError("Mercado Pago não retornou link de checkout.", "BILLING_ERROR", 502);
  }
  return { id: data.id, initPoint };
}

export async function getPayment(id: string): Promise<MpPayment> {
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });
  if (!res.ok) {
    throw new AppError(`Falha ao consultar pagamento (MP ${res.status}).`, "BILLING_ERROR", 502);
  }
  return (await res.json()) as MpPayment;
}

// Reject signatures whose timestamp is too old/new. Defends against replay of a
// captured webhook (the idempotency table is the primary guard; this is depth).
// Tunable via env in case Mercado Pago reuses the original `ts` across retries.
const WEBHOOK_TOLERANCE_MS = (() => {
  const seconds = Number.parseInt(process.env.MP_WEBHOOK_TOLERANCE_SECONDS ?? "", 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 5 * 60_000;
})();

function isFreshTimestamp(ts: string): boolean {
  const raw = Number(ts);
  if (!Number.isFinite(raw) || raw <= 0) return false;
  // MP may send seconds or milliseconds - normalize to ms.
  const ms = raw < 1e12 ? raw * 1000 : raw;
  return Math.abs(Date.now() - ms) <= WEBHOOK_TOLERANCE_MS;
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length === 0 || ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

/**
 * Validate the `x-signature` HMAC Mercado Pago sends with each webhook.
 * Manifest: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (data.id lowercased
 * when alphanumeric), signed with MP_WEBHOOK_SECRET (HMAC-SHA256, hex).
 */
export function verifyWebhookSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || !opts.signature) return false;

  const parts: Record<string, string> = {};
  for (const segment of opts.signature.split(",")) {
    const [k, v] = segment.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;
  if (!isFreshTimestamp(ts)) return false;

  const manifest = `id:${opts.dataId.toLowerCase()};request-id:${opts.requestId ?? ""};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  return safeEqualHex(expected, v1);
}
