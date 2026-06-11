import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { subscriptions, users, webhookEvents } from "@/server/db/schema";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb();

    const [subs, events] = await Promise.all([
      db
        .select({
          id: subscriptions.id,
          userId: subscriptions.userId,
          email: users.email,
          plan: subscriptions.plan,
          status: subscriptions.status,
          provider: subscriptions.provider,
          externalId: subscriptions.externalId,
          currentPeriodEnd: subscriptions.currentPeriodEnd,
          updatedAt: subscriptions.updatedAt,
        })
        .from(subscriptions)
        .leftJoin(users, eq(users.id, subscriptions.userId))
        .orderBy(desc(subscriptions.updatedAt))
        .limit(200),
      db.select().from(webhookEvents).orderBy(desc(webhookEvents.receivedAt)).limit(50),
    ]);

    return NextResponse.json({ subscriptions: subs, events });
  } catch (err) {
    return await handleApiError(err);
  }
}
