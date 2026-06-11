import { and, desc, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { subscriptions, usageDaily, users } from "@/server/db/schema";

function brToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function isProActive(status: string | null, end: Date | null): boolean {
  if (!status) return false;
  if (status === "active") return !end || end.getTime() > Date.now();
  if (status === "canceled") return !!end && end.getTime() > Date.now();
  return false;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const db = getDb();
    const q = (request.nextUrl.searchParams.get("q") ?? "").trim();

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
        subPlan: subscriptions.plan,
        subStatus: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        usageToday: usageDaily.downloads,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .leftJoin(usageDaily, and(eq(usageDaily.userId, users.id), eq(usageDaily.day, brToday())))
      .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(200);

    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      image: r.image,
      isAdmin: r.isAdmin,
      createdAt: r.createdAt,
      plan: isProActive(r.subStatus, r.currentPeriodEnd) ? "pro" : "free",
      subStatus: r.subStatus,
      currentPeriodEnd: r.currentPeriodEnd,
      usageToday: r.usageToday ?? 0,
    }));

    return NextResponse.json({ users: items });
  } catch (err) {
    return await handleApiError(err);
  }
}
