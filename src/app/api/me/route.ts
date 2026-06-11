import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";
import { getDb } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { getTodayUsage, getUserPlan } from "@/server/entitlements";

// Lightweight "who am I + my plan + today's usage" endpoint for the client UI.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false });
  }

  const userId = session.user.id;
  const [plan, used, admin, subRows] = await Promise.all([
    getUserPlan(userId),
    getTodayUsage(userId),
    isAdmin(userId, session.user.email),
    getDb()
      .select({ end: subscriptions.currentPeriodEnd, start: subscriptions.updatedAt })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1),
  ]);
  const limit = plan.quota.downloadsPerDay;
  const finite = Number.isFinite(limit);
  const isPro = plan.id === "pro";
  const periodEnd = isPro ? (subRows[0]?.end?.toISOString() ?? null) : null;
  // Start of the current paid period ≈ when the subscription row was last
  // written by a payment webhook; lets the client size the countdown bar to the
  // real cycle length instead of assuming a fixed 31-day pass.
  const periodStart = isPro ? (subRows[0]?.start?.toISOString() ?? null) : null;

  return NextResponse.json({
    authenticated: true,
    plan: plan.id,
    isAdmin: admin,
    periodEnd,
    periodStart,
    usage: {
      used,
      limit: finite ? limit : null,
      remaining: finite ? Math.max(0, limit - used) : null,
    },
  });
}
