import { NextResponse } from "next/server";
import { getEffectivePricing } from "@/server/plans-config";

// Public: the current Pro price for client display (admin-editable, no redeploy).
export const dynamic = "force-dynamic";

export async function GET() {
  const { amountCents, label } = await getEffectivePricing();
  return NextResponse.json(
    { proPriceLabel: label, proAmountCents: amountCents },
    { headers: { "Cache-Control": "no-store, must-revalidate" } },
  );
}
