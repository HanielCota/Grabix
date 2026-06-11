import { getDb } from "@/server/db";
import { planConfig } from "@/server/db/schema";
import { PLANS, type Plan, type PlanId } from "@/server/plans";

// Admin-editable plan config lives in the `plan_config` table and overrides the
// code defaults in plans.ts. Cached in-memory with a short TTL; the cache is
// cleared immediately when an admin saves a change.

export interface Pricing {
  amountCents: number;
  label: string;
}

interface LoadedConfig {
  plans: Record<PlanId, Plan>;
  pricing: Pricing;
}

const TTL_MS = 60_000;
let cache: { data: LoadedConfig; at: number } | null = null;

function codePricing(): Pricing {
  const reais = Number(process.env.MP_PRO_AMOUNT ?? "19.90");
  const cents = Math.round((Number.isFinite(reais) ? reais : 19.9) * 100);
  return { amountCents: cents, label: process.env.NEXT_PUBLIC_PRO_PRICE_LABEL ?? "R$ 19,90/mês" };
}

export async function loadConfig(force = false): Promise<LoadedConfig> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const plans: Record<PlanId, Plan> = { free: PLANS.free, pro: PLANS.pro };
  let pricing = codePricing();

  try {
    const rows = await getDb().select().from(planConfig);
    for (const r of rows) {
      const id = r.id as PlanId;
      if (id !== "free" && id !== "pro") continue;
      plans[id] = {
        id,
        limits: {
          maxAssets: r.maxAssets,
          maxFileSizeBytes: r.maxFileSizeBytes,
          maxZipSizeBytes: r.maxZipSizeBytes,
          maxConcurrentDownloads: r.maxConcurrentDownloads,
        },
        features: {
          deepCrawl: r.deepCrawl,
          jsRendering: r.jsRendering,
          protectedVideo: r.protectedVideo,
        },
        quota: { downloadsPerDay: r.downloadsPerDay < 0 ? Number.POSITIVE_INFINITY : r.downloadsPerDay },
      };
      if (id === "pro" && r.priceAmountCents != null) {
        pricing = { amountCents: r.priceAmountCents, label: r.priceLabel ?? pricing.label };
      }
    }
  } catch (err) {
    // biome-ignore lint/suspicious/noConsole: operator-facing fallback warning
    console.warn("[Grabix] plan-config: usando defaults do código (DB indisponível):", err);
  }

  const data = { plans, pricing };
  cache = { data, at: Date.now() };
  return data;
}

export async function getEffectivePlan(id: PlanId): Promise<Plan> {
  const { plans } = await loadConfig();
  return plans[id] ?? PLANS.free;
}

export async function getEffectivePricing(): Promise<Pricing> {
  return (await loadConfig()).pricing;
}

export function invalidatePlansCache() {
  cache = null;
}
