import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { createZipStream } from "@/features/media-downloader/application/download-zip";
import { Errors } from "@/features/media-downloader/domain/errors";
import { downloadZipInputSchema } from "@/features/media-downloader/domain/types";
import { buildContentDisposition } from "@/lib/files/file-name";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { consumeDownloadQuota, getUserPlan, refundDownloadQuota } from "@/server/entitlements";
import { checkRateLimit } from "@/server/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const rl = await checkRateLimit(`zip:${user.id}`, { max: 20, windowMs: 60_000 });
    if (rl.limited) {
      throw Errors.rateLimited();
    }

    const plan = await getUserPlan(user.id);

    const body = await request.json();
    const parsedInput = downloadZipInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return await handleApiError(parsedInput.error);
    }

    const { assets } = parsedInput.data;
    if (assets.length > plan.limits.maxAssets) {
      throw Errors.tooManyAssets();
    }

    // A ZIP counts as one download per file. Reserve the quota up front (so we
    // don't build a ZIP we'd reject), and refund if it can't be produced.
    const quota = await consumeDownloadQuota(user.id, plan, assets.length);
    if (!quota.ok) {
      await refundDownloadQuota(user.id, plan, assets.length);
      throw Errors.quotaExceeded();
    }

    let zipStream: Readable;
    try {
      zipStream = await createZipStream(assets, request.signal, {
        maxZipBytes: plan.limits.maxZipSizeBytes,
        concurrency: plan.limits.maxConcurrentDownloads,
      });
    } catch (err) {
      await refundDownloadQuota(user.id, plan, assets.length);
      throw err;
    }

    const webStream = Readable.toWeb(zipStream) as ReadableStream;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": buildContentDisposition("grabix-media.zip"),
      },
    });
  } catch (err) {
    return await handleApiError(err);
  }
}
