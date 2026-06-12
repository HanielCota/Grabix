import { NextResponse } from "next/server";
import { planToJson } from "@/server/plans";
import { getEffectivePlans } from "@/server/plans-config";

// Public: the current Free/Pro plan limits and price (admin-editable, no redeploy).
export const dynamic = "force-dynamic";

export async function GET() {
  const { plans, pricing } = await getEffectivePlans();
  return NextResponse.json(
    { free: planToJson(plans.free), pro: planToJson(plans.pro), pricing },
    { headers: { "Cache-Control": "no-store, must-revalidate" } },
  );
}
