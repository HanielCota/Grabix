import { PLANS } from "@/server/plans";

// Single source of truth for the "what's in Pro" copy, derived from the actual
// plan definitions in plans.ts so the marketing never drifts from what the
// server enforces. Consumed by the upgrade dialog and the home-page upsell.

const MB = 1024 * 1024;
const mb = (bytes: number) => Math.round(bytes / MB);

const free = PLANS.free;
const pro = PLANS.pro;

export interface PlanBenefit {
  /** What Pro gives. */
  label: string;
  /** What Free gives, for an inline comparison (omitted for Pro-only features). */
  free?: string;
}

export const PRO_BENEFITS: readonly PlanBenefit[] = [
  { label: `${pro.limits.maxAssets} itens por análise`, free: `${free.limits.maxAssets}` },
  { label: "Downloads diários ilimitados", free: `${free.quota.downloadsPerDay}/dia` },
  { label: "Busca profunda (varre várias páginas)" },
  { label: "Renderização de páginas com JavaScript" },
  { label: `Arquivos de até ${mb(pro.limits.maxFileSizeBytes)} MB`, free: `${mb(free.limits.maxFileSizeBytes)} MB` },
  { label: `ZIP de até ${mb(pro.limits.maxZipSizeBytes)} MB`, free: `${mb(free.limits.maxZipSizeBytes)} MB` },
];

/** Flattened "label (free: X)" strings for compact list rendering. */
export function benefitText(b: PlanBenefit): string {
  return b.free ? `${b.label} (free: ${b.free})` : b.label;
}
