import { and, count, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { subscriptions, usageDaily, users } from "@/server/db/schema";
import { getEffectivePricing } from "@/server/plans-config";

function brToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, proActive, newUsers, downloads, pricing] = await Promise.all([
      db.select({ c: count() }).from(users),
      db
        .select({ c: count() })
        .from(subscriptions)
        .where(and(eq(subscriptions.status, "active"), gte(subscriptions.currentPeriodEnd, new Date()))),
      db.select({ c: count() }).from(users).where(gte(users.createdAt, sevenDaysAgo)),
      db
        .select({ total: sql<number>`coalesce(sum(${usageDaily.downloads}), 0)` })
        .from(usageDaily)
        .where(eq(usageDaily.day, brToday())),
      getEffectivePricing(),
    ]);

    const proCount = proActive[0]?.c ?? 0;
    return NextResponse.json({
      totalUsers: totalUsers[0]?.c ?? 0,
      proActive: proCount,
      newUsers7d: newUsers[0]?.c ?? 0,
      downloadsToday: Number(downloads[0]?.total ?? 0),
      estRevenueCents: proCount * pricing.amountCents,
      priceLabel: pricing.label,
    });
  } catch (err) {
    return await handleApiError(err);
  }
}
