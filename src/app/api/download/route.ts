import type { NextRequest } from "next/server";
import { downloadAsset } from "@/features/media-downloader/application/download-asset";
import { Errors } from "@/features/media-downloader/domain/errors";
import { downloadAssetInputSchema } from "@/features/media-downloader/domain/types";
import { buildContentDisposition } from "@/lib/files/file-name";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { consumeDownloadQuota, getUserPlan } from "@/server/entitlements";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const plan = await getUserPlan(user.id);

    const params = request.nextUrl.searchParams;
    const parsedInput = downloadAssetInputSchema.safeParse({
      url: params.get("url") ?? "",
      fileName: params.get("fileName") ?? "download",
    });
    if (!parsedInput.success) {
      return await handleApiError(parsedInput.error);
    }

    const input = parsedInput.data;
    const result = await downloadAsset(input.url, request.signal, plan.limits.maxFileSizeBytes);
    const finalName = result.fileName ?? input.fileName;

    // Count the download only after the asset is confirmed fetchable, so 404s /
    // oversized files don't burn the user's daily quota.
    const quota = await consumeDownloadQuota(user.id, plan);
    if (!quota.ok) {
      throw Errors.quotaExceeded();
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": buildContentDisposition(finalName),
        ...(result.contentLength != null && {
          "Content-Length": String(result.contentLength),
        }),
      },
    });
  } catch (err) {
    return await handleApiError(err);
  }
}
