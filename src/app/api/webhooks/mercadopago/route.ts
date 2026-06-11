import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { users, webhookEvents } from "@/server/db/schema";
import { addPendingEntitlement, type EntitlementData, upsertSubscription } from "@/server/entitlements";
import {
  getAuthorizedPayment,
  getPayment,
  getPreapproval,
  type MpPreapproval,
  verifyWebhookSignature,
} from "@/server/mercadopago";
import { mapPaymentStatus, mapPreapprovalStatus } from "@/server/mp-entitlement";
import { getEffectivePricing } from "@/server/plans-config";

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

/**
 * Verify a paid amount matches (at least) the configured Pro price in BRL, so an
 * approved payment crafted for a smaller amount can't unlock Pro. Overpayment is
 * accepted; a 1-cent tolerance absorbs float rounding. Only the *grant* paths
 * call this — revocations (refund/chargeback/cancel) must always apply.
 */
async function paidAmountMeetsPrice(amount: number | undefined, currency: string | undefined): Promise<boolean> {
  if (currency && currency.toUpperCase() !== "BRL") return false;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return false;
  const { amountCents } = await getEffectivePricing();
  const paidCents = Math.round(amount * 100);
  return paidCents >= amountCents - 1;
}

async function applyEntitlement(
  externalRef: string | undefined,
  email: string | undefined,
  data: EntitlementData,
): Promise<string> {
  const db = getDb();

  // Primary: external_reference carries our userId (robust, set at checkout).
  if (externalRef) {
    const byId = await db.select().from(users).where(eq(users.id, externalRef)).limit(1);
    if (byId[0]) {
      await upsertSubscription(byId[0].id, data);
      return "user:ref";
    }
  }

  // Fallback: match by payer email, or queue a pending grant.
  if (email) {
    const normalized = email.toLowerCase();
    const byEmail = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
    if (byEmail[0]) {
      await upsertSubscription(byEmail[0].id, data);
      return "user:email";
    }
    if (data.status === "active") {
      await addPendingEntitlement(normalized, data);
      return "pending";
    }
  }

  return "unmatched";
}

async function resolvePreapproval(type: string, dataId: string): Promise<MpPreapproval | null> {
  if (type.includes("authorized_payment")) {
    const ap = await getAuthorizedPayment(dataId);
    if (!ap.preapproval_id) return null;
    return getPreapproval(ap.preapproval_id);
  }
  if (type.includes("preapproval")) {
    return getPreapproval(dataId);
  }
  return null; // ignore "payment" and other topics
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl;

  let body: { type?: string; topic?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    // MP sometimes pings with an empty/non-JSON body - fall back to query params.
  }

  const type = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const dataId = body.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!dataId) {
    return json(200, { ok: true, note: "sem data.id" });
  }

  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!verifyWebhookSignature({ signature, requestId, dataId: String(dataId) })) {
    return json(401, { error: { code: "INVALID_SIGNATURE", message: "Assinatura inválida." } });
  }

  // ─── Idempotency ───
  // Mark the event as processed only AFTER it succeeds. If we recorded it first
  // and the MP API call then failed, MP's retry would be deduped and the event
  // lost forever. Reprocessing a duplicate is safe (upsert is idempotent).
  //
  // When MP omits x-request-id we fall back to a synthetic key. It must include
  // the lifecycle status, because a single preapproval id (data.id) fires for
  // every transition (authorized → paused → cancelled); keying only on
  // `type:dataId` would dedup the cancellation as a "duplicate" of the original
  // authorization and the user would keep Pro after cancelling. The status is
  // resolved below once we've fetched the resource.
  const db = getDb();
  const isDuplicate = async (key: string): Promise<boolean> => {
    const seen = await db.select().from(webhookEvents).where(eq(webhookEvents.id, key)).limit(1);
    return seen.length > 0;
  };
  const markProcessed = (key: string) =>
    db.insert(webhookEvents).values({ id: key, provider: "mercadopago" }).onConflictDoNothing();

  const topic = String(type);

  // One-time payment (Checkout Pro / Pix). Recurring preapprovals fall through.
  if (topic === "payment") {
    const payment = await getPayment(String(dataId));
    const eventKey = requestId ?? `payment:${dataId}:${payment.status}`;
    if (await isDuplicate(eventKey)) return json(200, { ok: true, duplicate: true });

    const entitlement = mapPaymentStatus(payment);
    if (!entitlement) {
      await markProcessed(eventKey);
      return json(200, { ok: true, status: payment.status });
    }
    // A grant must match the configured price; otherwise an attacker who can get
    // an "approved" payment for a tiny amount (external_reference = their userId)
    // would unlock Pro. Revocations (refund/chargeback) are never gated on price.
    if (
      entitlement.status === "active" &&
      !(await paidAmountMeetsPrice(payment.transaction_amount, payment.currency_id))
    ) {
      await markProcessed(eventKey);
      return json(200, { ok: true, status: payment.status, note: "amount_mismatch" });
    }
    const applied = await applyEntitlement(payment.external_reference, payment.payer?.email, entitlement);
    await markProcessed(eventKey);
    return json(200, { ok: true, applied, status: payment.status });
  }

  const pre = await resolvePreapproval(topic, String(dataId));
  if (!pre) {
    // Nothing resolved (ignored topic): dedup on the base key so MP retries are absorbed.
    const baseKey = requestId ?? `${topic}:${dataId}`;
    if (await isDuplicate(baseKey)) return json(200, { ok: true, duplicate: true });
    await markProcessed(baseKey);
    return json(200, { ok: true, ignored: type });
  }

  // Status is part of the fallback key so lifecycle transitions (authorized →
  // paused → cancelled) on the same preapproval id aren't deduped against each other.
  const eventKey = requestId ?? `preapproval:${pre.id}:${pre.status}`;
  if (await isDuplicate(eventKey)) return json(200, { ok: true, duplicate: true });

  const entitlement = mapPreapprovalStatus(pre);
  if (!entitlement) {
    await markProcessed(eventKey);
    return json(200, { ok: true, status: pre.status });
  }
  // Defense in depth: the recurring amount is set server-side at creation, but if
  // MP reports one below the configured price, refuse to grant. A missing amount
  // is allowed (we trust the server-set value) so legitimate subs aren't broken.
  const recurAmount = pre.auto_recurring?.transaction_amount;
  if (
    entitlement.status === "active" &&
    typeof recurAmount === "number" &&
    !(await paidAmountMeetsPrice(recurAmount, pre.auto_recurring?.currency_id))
  ) {
    await markProcessed(eventKey);
    return json(200, { ok: true, status: pre.status, note: "amount_mismatch" });
  }
  const applied = await applyEntitlement(pre.external_reference, pre.payer_email, entitlement);
  await markProcessed(eventKey);
  return json(200, { ok: true, applied, status: pre.status });
}
