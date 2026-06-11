import type { NextRequest } from "next/server";
import { Errors } from "@/features/media-downloader/domain/errors";
import { runDeepCrawl } from "@/lib/crawl/orchestrator";
import { deepCrawlRequestSchema } from "@/lib/crawl/schemas";
import type { SSEEventMap, SSEEventName } from "@/lib/crawl/types";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { getUserPlan } from "@/server/entitlements";
import { checkRateLimit } from "@/server/rate-limit";
import { validateDnsResolution, validateUrlFormat } from "@/server/security";
import { recordUrlFailure } from "@/server/url-failures";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    return await handleApiError(err);
  }

  const parsed = deepCrawlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return await handleApiError(parsed.error);
  }

  try {
    const user = await requireUser();

    // Deep crawl fans out to many pages - tighter per-user budget than analyze.
    const rl = await checkRateLimit(`deep:${user.id}`, { max: 5, windowMs: 60_000 });
    if (rl.limited) {
      throw Errors.rateLimited();
    }

    const plan = await getUserPlan(user.id);
    if (!plan.features.deepCrawl) {
      throw Errors.upgradeRequired("A busca profunda é exclusiva do plano Pro.");
    }

    const normalizedUrl = await validateUrlFormat(parsed.data.url);
    await validateDnsResolution(normalizedUrl.hostname);

    const url = normalizedUrl.toString();
    const config = parsed.data.config ?? {};
    const encoder = new TextEncoder();
    const abortController = new AbortController();

    request.signal.addEventListener("abort", () => abortController.abort(), { once: true });

    const stream = new ReadableStream({
      async start(controller) {
        function send<E extends SSEEventName>(event: E, data: SSEEventMap[E]) {
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            // Stream closed - ignore
          }
        }

        try {
          const result = await runDeepCrawl(url, config, send, abortController.signal);
          // Crawl finished but found nothing - log it so the site can be improved.
          if (result.totalMedia === 0 && !abortController.signal.aborted) {
            await recordUrlFailure({ url, reason: "NO_MEDIA", deepCrawl: true, userId: user.id });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro desconhecido";
          if (!abortController.signal.aborted) {
            await recordUrlFailure({ url, reason: "CRAWL_ERROR", message, deepCrawl: true, userId: user.id });
          }
          send("crawl_error", { error: message });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return await handleApiError(err);
  }
}
