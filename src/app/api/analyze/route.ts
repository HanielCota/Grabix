import { type NextRequest, NextResponse } from "next/server";
import { analyzePage } from "@/features/media-downloader/application/analyze-page";
import { AppError, Errors } from "@/features/media-downloader/domain/errors";
import { analyzePageInputSchema, analyzePageResultSchema } from "@/features/media-downloader/domain/types";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { getUserPlan } from "@/server/entitlements";
import { checkRateLimit } from "@/server/rate-limit";
import { recordUrlFailure } from "@/server/url-failures";

export async function POST(request: NextRequest) {
  // Captured so the catch block can log failures against the right URL/user.
  let url: string | null = null;
  let userId: string | null = null;

  try {
    const user = await requireUser();
    userId = user.id;

    // Per-user budget on top of the global per-IP limit: each analyze triggers an
    // outbound fetch, so cap how fast a single account can drive that.
    const rl = await checkRateLimit(`analyze:${user.id}`, { max: 20, windowMs: 60_000 });
    if (rl.limited) {
      throw Errors.rateLimited();
    }

    const plan = await getUserPlan(user.id);

    const body = await request.json();
    const parsedInput = analyzePageInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return await handleApiError(parsedInput.error);
    }

    const { url: inputUrl, deepCrawl } = parsedInput.data;
    url = inputUrl;
    if (deepCrawl && !plan.features.deepCrawl) {
      throw Errors.upgradeRequired("A busca profunda é exclusiva do plano Pro.");
    }

    const raw = await analyzePage(url, deepCrawl, request.signal, { allowJsRendering: plan.features.jsRendering });

    // The page loaded fine but nothing was extractable — the most useful signal
    // for improving extraction. Logged against the raw count (before plan gating)
    // so a free user's hidden assets don't read as "no media".
    if (raw.assets.length === 0) {
      await recordUrlFailure({ url, reason: "NO_MEDIA", deepCrawl, userId });
    }

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
    // Record site/extraction failures (not client aborts). isActionableFailure
    // inside recordUrlFailure filters out user-side codes (auth, quota, etc.).
    if (url && !request.signal.aborted) {
      const reason = err instanceof AppError ? err.code : "INTERNAL_ERROR";
      const message = err instanceof Error ? err.message : null;
      await recordUrlFailure({ url, reason, message, deepCrawl: false, userId });
    }
    return await handleApiError(err);
  }
}
