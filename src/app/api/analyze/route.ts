import { type NextRequest, NextResponse } from "next/server";
import { analyzePage } from "@/features/media-downloader/application/analyze-page";
import { Errors } from "@/features/media-downloader/domain/errors";
import { analyzePageInputSchema, analyzePageResultSchema } from "@/features/media-downloader/domain/types";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { getUserPlan } from "@/server/entitlements";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const plan = await getUserPlan(user.id);

    const body = await request.json();
    const parsedInput = analyzePageInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return await handleApiError(parsedInput.error);
    }

    const { url, deepCrawl } = parsedInput.data;
    if (deepCrawl && !plan.features.deepCrawl) {
      throw Errors.upgradeRequired("A busca profunda é exclusiva do plano Pro.");
    }

    const raw = await analyzePage(url, deepCrawl, request.signal, { allowJsRendering: plan.features.jsRendering });

    // ─── Per-plan gating: strip protected-video assets, then cap to plan limit ───
    let assets = raw.assets;
    if (!plan.features.protectedVideo) {
      assets = assets.filter((a) => !a.sourceTag.startsWith("vturb"));
    }
    const allowed = plan.limits.maxAssets;
    const lockedCount = Math.max(0, assets.length - allowed);
    if (lockedCount > 0) {
      assets = assets.slice(0, allowed);
    }

    const parsedResult = analyzePageResultSchema.safeParse({
      ...raw,
      assets,
      totalFound: assets.length,
      lockedCount: lockedCount > 0 ? lockedCount : undefined,
    });
    if (!parsedResult.success) {
      return await handleApiError(parsedResult.error);
    }

    return NextResponse.json(parsedResult.data);
  } catch (err) {
    return await handleApiError(err);
  }
}
