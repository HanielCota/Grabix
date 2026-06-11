import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { users, webhookEvents } from "@/server/db/schema";
import { addPendingEntitlement, type EntitlementData, upsertSubscription } from "@/server/entitlements";
import { getAuthorizedPayment, getPreapproval, type MpPreapproval, verifyWebhookSignature } from "@/server/mercadopago";

const DAY_MS = 24 * 60 * 60 * 1000;

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

function mapStatus(pre: MpPreapproval): EntitlementData | null {
  const periodEnd = pre.next_payment_date ? new Date(pre.next_payment_date) : null;
  const externalId = pre.id;

  switch (pre.status) {
    case "authorized":
      return {
        plan: "pro",
        status: "active",
        provider: "mercadopago",
        externalId,
        currentPeriodEnd: periodEnd ?? new Date(Date.now() + 31 * DAY_MS),
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
    // MP sometimes pings with an empty/non-JSON body — fall back to query params.
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
  const eventKey = requestId ?? `${type}:${dataId}`;
  const db = getDb();
  const seen = await db.select().from(webhookEvents).where(eq(webhookEvents.id, eventKey)).limit(1);
  if (seen.length > 0) {
    return json(200, { ok: true, duplicate: true });
  }
  const markProcessed = () =>
    db.insert(webhookEvents).values({ id: eventKey, provider: "mercadopago" }).onConflictDoNothing();

  const pre = await resolvePreapproval(String(type), String(dataId));
  if (!pre) {
    await markProcessed();
    return json(200, { ok: true, ignored: type });
  }

  const entitlement = mapStatus(pre);
  if (!entitlement) {
    await markProcessed();
    return json(200, { ok: true, status: pre.status });
  }

  const applied = await applyEntitlement(pre.external_reference, pre.payer_email, entitlement);
  await markProcessed();
  return json(200, { ok: true, applied, status: pre.status });
}
