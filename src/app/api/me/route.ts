import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";
import { getTodayUsage, getUserPlan } from "@/server/entitlements";

// Lightweight "who am I + my plan + today's usage" endpoint for the client UI.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false });
  }

  const [plan, used, admin] = await Promise.all([
    getUserPlan(session.user.id),
    getTodayUsage(session.user.id),
    isAdmin(session.user.id, session.user.email),
  ]);
  const limit = plan.quota.downloadsPerDay;
  const finite = Number.isFinite(limit);

  return NextResponse.json({
    authenticated: true,
    plan: plan.id,
    isAdmin: admin,
    usage: {
      used,
      limit: finite ? limit : null,
      remaining: finite ? Math.max(0, limit - used) : null,
    },
  });
}
