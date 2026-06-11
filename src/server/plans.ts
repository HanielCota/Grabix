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

// ─── Pricing (display only; billing runs through Mercado Pago) ───
// The actual checkout is created per-user server-side via /api/billing/subscribe.

export const PRICING = {
  proPriceLabel: process.env.NEXT_PUBLIC_PRO_PRICE_LABEL ?? "R$ 19,90/mês",
};
