import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/server/api-utils";
import { requireAdmin } from "@/server/auth-guard";
import { getDb } from "@/server/db";
import { planConfig } from "@/server/db/schema";
import type { Plan } from "@/server/plans";
import { invalidatePlansCache, loadConfig } from "@/server/plans-config";

function serialize(p: Plan) {
  return {
    maxAssets: p.limits.maxAssets,
    maxFileSizeBytes: p.limits.maxFileSizeBytes,
    maxZipSizeBytes: p.limits.maxZipSizeBytes,
    maxConcurrentDownloads: p.limits.maxConcurrentDownloads,
    deepCrawl: p.features.deepCrawl,
    jsRendering: p.features.jsRendering,
    protectedVideo: p.features.protectedVideo,
    downloadsPerDay: Number.isFinite(p.quota.downloadsPerDay) ? p.quota.downloadsPerDay : -1,
  };
}

export async function GET() {
  try {
    await requireAdmin();
    const { plans, pricing } = await loadConfig(true);
    return NextResponse.json({ free: serialize(plans.free), pro: serialize(plans.pro), pricing });
  } catch (err) {
    return await handleApiError(err);
  }
}

const putSchema = z.object({
  id: z.enum(["free", "pro"]),
  maxAssets: z.number().int().min(1).max(1000),
  maxFileSizeBytes: z.number().int().min(1),
  maxZipSizeBytes: z.number().int().min(1),
  maxConcurrentDownloads: z.number().int().min(1).max(20),
  deepCrawl: z.boolean(),
  jsRendering: z.boolean(),
  protectedVideo: z.boolean(),
  downloadsPerDay: z.number().int().min(-1),
  priceAmountCents: z.number().int().min(0).optional(),
  priceLabel: z.string().trim().min(1).max(40).optional(),
});

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const parsed = putSchema.safeParse(await request.json());
    if (!parsed.success) {
      return await handleApiError(parsed.error);
    }

    const d = parsed.data;
    const values = {
      id: d.id,
      maxAssets: d.maxAssets,
      maxFileSizeBytes: d.maxFileSizeBytes,
      maxZipSizeBytes: d.maxZipSizeBytes,
      maxConcurrentDownloads: d.maxConcurrentDownloads,
      deepCrawl: d.deepCrawl,
      jsRendering: d.jsRendering,
      protectedVideo: d.protectedVideo,
      downloadsPerDay: d.downloadsPerDay,
      priceAmountCents: d.priceAmountCents ?? null,
      priceLabel: d.priceLabel ?? null,
    };

    await getDb()
      .insert(planConfig)
      .values(values)
      .onConflictDoUpdate({ target: planConfig.id, set: { ...values, updatedAt: new Date() } });

    invalidatePlansCache();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return await handleApiError(err);
  }
}
