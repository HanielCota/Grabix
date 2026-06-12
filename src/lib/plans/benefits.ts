import type { Plan, PlanId } from "@/server/plans";

// Single source of truth for the "what's in Pro" copy, derived from the actual
// plan definitions so the marketing never drifts from what the server enforces.
// The returned values reflect admin-edited config when called with plans from
// the live `/api/plans` endpoint.

const MB = 1024 * 1024;
const mb = (bytes: number) => Math.round(bytes / MB);

export interface PlanBenefit {
  /** What Pro gives. */
  label: string;
  /** What Free gives, for an inline comparison (omitted for Pro-only features). */
  free?: string;
}

export function getProBenefits(plans: Record<PlanId, Plan>): readonly PlanBenefit[] {
  const free = plans.free;
  const pro = plans.pro;
  return [
    { label: `${pro.limits.maxAssets} itens por análise`, free: `${free.limits.maxAssets}` },
    { label: "Downloads diários ilimitados", free: `${free.quota.downloadsPerDay}/dia` },
    { label: "Busca profunda (varre várias páginas)" },
    { label: "Renderização de páginas com JavaScript" },
    { label: `Arquivos de até ${mb(pro.limits.maxFileSizeBytes)} MB`, free: `${mb(free.limits.maxFileSizeBytes)} MB` },
    { label: `ZIP de até ${mb(pro.limits.maxZipSizeBytes)} MB`, free: `${mb(free.limits.maxZipSizeBytes)} MB` },
  ];
}

/** Flattened "label (free: X)" strings for compact list rendering. */
export function benefitText(b: PlanBenefit): string {
  return b.free ? `${b.label} (free: ${b.free})` : b.label;
}

// ─── Side-by-side comparison ───
// Feature-by-feature Free × Pro, derived from the same plan definitions. A boolean
// renders as a check/dash; a string renders verbatim. Consumed by /pricing.

export interface PlanComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
}

export function getPlanComparison(plans: Record<PlanId, Plan>): readonly PlanComparisonRow[] {
  const free = plans.free;
  const pro = plans.pro;
  return [
    { feature: "Itens por análise", free: `${free.limits.maxAssets}`, pro: `${pro.limits.maxAssets}` },
    { feature: "Downloads por dia", free: `${free.quota.downloadsPerDay}`, pro: "Ilimitado" },
    {
      feature: "Tamanho máximo por arquivo",
      free: `${mb(free.limits.maxFileSizeBytes)} MB`,
      pro: `${mb(pro.limits.maxFileSizeBytes)} MB`,
    },
    {
      feature: "Tamanho máximo do ZIP",
      free: `${mb(free.limits.maxZipSizeBytes)} MB`,
      pro: `${mb(pro.limits.maxZipSizeBytes)} MB`,
    },
    {
      feature: "Downloads simultâneos",
      free: `${free.limits.maxConcurrentDownloads}`,
      pro: `${pro.limits.maxConcurrentDownloads}`,
    },
    { feature: "Busca profunda (varre várias páginas)", free: free.features.deepCrawl, pro: pro.features.deepCrawl },
    {
      feature: "Renderização de páginas com JavaScript",
      free: free.features.jsRendering,
      pro: pro.features.jsRendering,
    },
    { feature: "Vídeos protegidos", free: free.features.protectedVideo, pro: pro.features.protectedVideo },
  ];
}
