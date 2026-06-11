import { Readable } from "node:stream";
import type { NextRequest } from "next/server";
import { createZipStream } from "@/features/media-downloader/application/download-zip";
import { Errors } from "@/features/media-downloader/domain/errors";
import { downloadZipInputSchema } from "@/features/media-downloader/domain/types";
import { buildContentDisposition } from "@/lib/files/file-name";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { consumeDownloadQuota, getUserPlan } from "@/server/entitlements";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
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

    const quota = await consumeDownloadQuota(user.id, plan);
    if (!quota.ok) {
      throw Errors.quotaExceeded();
    }

    const zipStream = await createZipStream(assets, request.signal, {
      maxZipBytes: plan.limits.maxZipSizeBytes,
      concurrency: plan.limits.maxConcurrentDownloads,
    });

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
