// ─── Plan definitions ───
//
// A plan is just a named bundle of the same limits/features that used to live
// globally in `appConfig`. Resolve the caller's plan, then enforce its limits.

const MB = 1024 * 1024;

export type PlanId = "free" | "pro";

export interface PlanLimits {
  maxAssets: number;
  maxFileSizeBytes: number;
  maxZipSizeBytes: number;
  maxConcurrentDownloads: number;
}

export interface PlanFeatures {
  deepCrawl: boolean;
  jsRendering: boolean;
  protectedVideo: boolean;
}

export interface Plan {
  id: PlanId;
  limits: PlanLimits;
  features: PlanFeatures;
  /** Max downloads per UTC day. Number.POSITIVE_INFINITY = unlimited. */
  quota: { downloadsPerDay: number };
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    limits: {
      maxAssets: 10,
      maxFileSizeBytes: 50 * MB,
      maxZipSizeBytes: 100 * MB,
      maxConcurrentDownloads: 2,
    },
    features: { deepCrawl: false, jsRendering: false, protectedVideo: false },
    quota: { downloadsPerDay: 20 },
  },
  pro: {
    id: "pro",
    limits: {
      maxAssets: 200,
      maxFileSizeBytes: 100 * MB,
      maxZipSizeBytes: 500 * MB,
      maxConcurrentDownloads: 8,
    },
    features: { deepCrawl: true, jsRendering: true, protectedVideo: true },
    quota: { downloadsPerDay: Number.POSITIVE_INFINITY },
  },
};

export const FREE_PLAN = PLANS.free;

export function getPlan(id: string | null | undefined): Plan {
  return (id && PLANS[id as PlanId]) || PLANS.free;
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "free" || value === "pro";
}

// ─── Serialization ───
// JSON-friendly representation used by public APIs and client hooks. Keeping it
// here (instead of in plans-config) avoids pulling the DB driver into the
// browser bundle.

export interface PlanSnapshot {
  maxAssets: number;
  maxFileSizeBytes: number;
  maxZipSizeBytes: number;
  maxConcurrentDownloads: number;
  deepCrawl: boolean;
  jsRendering: boolean;
  protectedVideo: boolean;
  /** `-1` means unlimited (Infinity). */
  downloadsPerDay: number;
}

export function planToJson(plan: Plan): PlanSnapshot {
  return {
    maxAssets: plan.limits.maxAssets,
    maxFileSizeBytes: plan.limits.maxFileSizeBytes,
    maxZipSizeBytes: plan.limits.maxZipSizeBytes,
    maxConcurrentDownloads: plan.limits.maxConcurrentDownloads,
    deepCrawl: plan.features.deepCrawl,
    jsRendering: plan.features.jsRendering,
    protectedVideo: plan.features.protectedVideo,
    downloadsPerDay: Number.isFinite(plan.quota.downloadsPerDay) ? plan.quota.downloadsPerDay : -1,
  };
}

export function planFromJson(id: PlanId, snapshot: PlanSnapshot): Plan {
  return {
    id,
    limits: {
      maxAssets: snapshot.maxAssets,
      maxFileSizeBytes: snapshot.maxFileSizeBytes,
      maxZipSizeBytes: snapshot.maxZipSizeBytes,
      maxConcurrentDownloads: snapshot.maxConcurrentDownloads,
    },
    features: {
      deepCrawl: snapshot.deepCrawl,
      jsRendering: snapshot.jsRendering,
      protectedVideo: snapshot.protectedVideo,
    },
    quota: { downloadsPerDay: snapshot.downloadsPerDay < 0 ? Number.POSITIVE_INFINITY : snapshot.downloadsPerDay },
  };
}

// ─── Pricing (display only; billing runs through Mercado Pago) ───
// The actual checkout is created per-user server-side via /api/billing/subscribe.

export const PRICING = {
  proPriceLabel: process.env.NEXT_PUBLIC_PRO_PRICE_LABEL ?? "R$ 19,90/mês",
};
