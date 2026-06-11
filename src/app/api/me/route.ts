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
      .select({ end: subscriptions.currentPeriodEnd })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1),
  ]);
  const limit = plan.quota.downloadsPerDay;
  const finite = Number.isFinite(limit);
  const periodEnd = plan.id === "pro" ? (subRows[0]?.end?.toISOString() ?? null) : null;

  return NextResponse.json({
    authenticated: true,
    plan: plan.id,
    isAdmin: admin,
    periodEnd,
    usage: {
      used,
      limit: finite ? limit : null,
      remaining: finite ? Math.max(0, limit - used) : null,
    },
  });
}
