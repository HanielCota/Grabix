import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { users, webhookEvents } from "@/server/db/schema";
import { addPendingEntitlement, type EntitlementData, upsertSubscription } from "@/server/entitlements";

// Hotmart Webhook 2.0 — https://developers.hotmart.com/docs/en/webhooks/
// Auth is a shared "hottok" token (sent in the X-HOTMART-HOTTOK header).
// There is no per-payload HMAC, so the token IS the trust boundary — reject
// anything that doesn't match HOTMART_HOTTOK.

const DAY_MS = 24 * 60 * 60 * 1000;

const GRANT_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);

const REVOKE_EVENTS: Record<string, string> = {
  PURCHASE_REFUNDED: "refunded",
  PURCHASE_CHARGEBACK: "chargeback",
  PURCHASE_PROTEST: "chargeback",
  PURCHASE_EXPIRED: "expired",
  SUBSCRIPTION_CANCELLATION: "canceled",
};

function json(status: number, payload: unknown) {
  return NextResponse.json(payload, { status });
}

interface HotmartPayload {
  id?: string;
  event?: string;
  hottok?: string;
  data?: {
    buyer?: { email?: string };
    purchase?: { transaction?: string };
    subscription?: {
      subscriber?: { code?: string };
      date_next_charge?: number;
    };
  };
}

function mapEvent(event: string, body: HotmartPayload): EntitlementData | null {
  const sub = body.data?.subscription;
  const nextCharge = sub?.date_next_charge;
  const externalId = sub?.subscriber?.code ?? body.data?.purchase?.transaction ?? null;
  const periodFromCharge = typeof nextCharge === "number" ? new Date(nextCharge) : null;

  if (GRANT_EVENTS.has(event)) {
    return {
      plan: "pro",
      status: "active",
      provider: "hotmart",
      externalId,
      currentPeriodEnd: periodFromCharge ?? new Date(Date.now() + 31 * DAY_MS),
    };
  }

  const revokeStatus = REVOKE_EVENTS[event];
  if (revokeStatus) {
    return { plan: "pro", status: revokeStatus, provider: "hotmart", externalId, currentPeriodEnd: periodFromCharge };
  }

  if (event === "PURCHASE_DELAYED") {
    return { plan: "pro", status: "past_due", provider: "hotmart", externalId, currentPeriodEnd: null };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const expected = process.env.HOTMART_HOTTOK;

  let body: HotmartPayload;
  try {
    body = (await request.json()) as HotmartPayload;
  } catch {
    return json(400, { error: { code: "INVALID_JSON", message: "Corpo inválido." } });
  }

  const hottok = request.headers.get("x-hotmart-hottok") ?? body.hottok;
  if (!expected || hottok !== expected) {
    return json(401, { error: { code: "INVALID_HOTTOK", message: "Hottok inválido." } });
  }

  const event = String(body.event ?? "").toUpperCase();
  const email = body.data?.buyer?.email?.toLowerCase();
  const eventId = body.id ?? body.data?.purchase?.transaction;

  const db = getDb();

  // ─── Idempotency: skip events we've already processed ───
  if (eventId) {
    const inserted = await db
      .insert(webhookEvents)
      .values({ id: eventId, provider: "hotmart" })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) {
      return json(200, { ok: true, duplicate: true });
    }
  }

  const entitlement = mapEvent(event, body);
  if (!entitlement) {
    return json(200, { ok: true, ignored: event });
  }

  if (!email) {
    return json(200, { ok: true, note: "sem email no payload" });
  }

  // ─── Match by email; queue a pending grant if no account exists yet ───
  const matched = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = matched[0];

  if (user) {
    await upsertSubscription(user.id, entitlement);
    return json(200, { ok: true, applied: "user", event });
  }

  // Only worth queueing positive grants; a revoke for an unknown email is a no-op.
  if (entitlement.status === "active") {
    await addPendingEntitlement(email, entitlement);
    return json(200, { ok: true, applied: "pending", event });
  }

  return json(200, { ok: true, note: "sem usuário para revogar", event });
}
