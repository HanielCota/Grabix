import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { pendingEntitlements, subscriptions, usageDaily } from "@/server/db/schema";
import { isPlanId, type Plan, type PlanId } from "@/server/plans";
import { getEffectivePlan } from "@/server/plans-config";

// ─── Subscription shape shared by webhook + pending-claim ───

export interface EntitlementData {
  plan: string;
  status: string;
  provider?: string | null;
  externalId?: string | null;
  currentPeriodEnd?: Date | null;
}

const REVOKED_NOW = new Set(["refunded", "chargeback", "expired", "inactive", "past_due"]);

function isActive(status: string, currentPeriodEnd: Date | null | undefined): boolean {
  if (REVOKED_NOW.has(status)) return false;
  // "canceled" keeps access until the period the user already paid for ends.
  if (status === "canceled") return !!currentPeriodEnd && currentPeriodEnd.getTime() > Date.now();
  if (status === "active") return !currentPeriodEnd || currentPeriodEnd.getTime() > Date.now();
  return false;
}

/** Resolve the effective (admin-configured) plan for a user. */
export async function getUserPlan(userId: string): Promise<Plan> {
  const db = getDb();
  const rows = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  const sub = rows[0];
  const planId: PlanId = sub && isActive(sub.status, sub.currentPeriodEnd) && isPlanId(sub.plan) ? sub.plan : "free";
  return getEffectivePlan(planId);
}

/** Insert or update the single subscription row for a user. */
export async function upsertSubscription(userId: string, data: EntitlementData): Promise<void> {
  const db = getDb();
  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: data.plan,
      status: data.status,
      provider: data.provider ?? null,
      externalId: data.externalId ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        plan: data.plan,
        status: data.status,
        provider: data.provider ?? null,
        externalId: data.externalId ?? null,
        // Keep the existing paid-through date when an event carries none
        // (e.g. a cancellation) so the user isn't downgraded mid-period.
        currentPeriodEnd: data.currentPeriodEnd ?? sql`${subscriptions.currentPeriodEnd}`,
        updatedAt: new Date(),
      },
    });
}

// ─── Daily download quota ───

// The quota window is a calendar day in Brazil (resets at 00:00 BRT, not UTC).
function currentDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

/**
 * Atomically add `amount` to today's download count and report whether the
 * caller is still within their plan's daily quota. Race-safe via an upsert.
 */
export async function consumeDownloadQuota(
  userId: string,
  plan: Plan,
  amount = 1,
): Promise<{ ok: boolean; used: number; limit: number }> {
  const limit = plan.quota.downloadsPerDay;
  if (!Number.isFinite(limit)) return { ok: true, used: 0, limit };

  const db = getDb();
  const day = currentDay();
  const [row] = await db
    .insert(usageDaily)
    .values({ userId, day, downloads: amount })
    .onConflictDoUpdate({
      target: [usageDaily.userId, usageDaily.day],
      set: { downloads: sql`${usageDaily.downloads} + ${amount}` },
    })
    .returning();

  const used = row?.downloads ?? amount;
  return { ok: used <= limit, used, limit };
}

/** Give back quota when the action it was charged for didn't happen. */
export async function refundDownloadQuota(userId: string, plan: Plan, amount = 1): Promise<void> {
  if (!Number.isFinite(plan.quota.downloadsPerDay)) return;
  const db = getDb();
  await db
    .update(usageDaily)
    .set({ downloads: sql`GREATEST(0, ${usageDaily.downloads} - ${amount})` })
    .where(and(eq(usageDaily.userId, userId), eq(usageDaily.day, currentDay())));
}

/** Read today's usage without incrementing (for UI hints). */
export async function getTodayUsage(userId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select()
    .from(usageDaily)
    .where(and(eq(usageDaily.userId, userId), eq(usageDaily.day, currentDay())))
    .limit(1);
  return rows[0]?.downloads ?? 0;
}

// ─── Pending entitlements (webhook arrived before the user signed up) ───

export async function addPendingEntitlement(email: string, data: EntitlementData): Promise<void> {
  const db = getDb();
  await db.insert(pendingEntitlements).values({
    email: email.toLowerCase(),
    plan: data.plan,
    status: data.status,
    provider: data.provider ?? null,
    externalId: data.externalId ?? null,
    currentPeriodEnd: data.currentPeriodEnd ?? null,
  });
}

/** On sign-in, apply (and clear) any entitlement that was waiting for this email. */
export async function claimPendingEntitlements(email: string | null | undefined, userId: string): Promise<void> {
  if (!email) return;
  const normalized = email.toLowerCase();
  const db = getDb();

  const pending = await db.select().from(pendingEntitlements).where(eq(pendingEntitlements.email, normalized));
  if (pending.length === 0) return;

  // Apply the most recently created entitlement.
  const latest = pending.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
  await upsertSubscription(userId, {
    plan: latest.plan,
    status: latest.status,
    provider: latest.provider,
    externalId: latest.externalId,
    currentPeriodEnd: latest.currentPeriodEnd,
  });

  await db.delete(pendingEntitlements).where(eq(pendingEntitlements.email, normalized));
}
