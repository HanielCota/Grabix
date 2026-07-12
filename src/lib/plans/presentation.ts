import type { Plan, PlanId } from "@/server/plans";

const MB = 1024 * 1024;

export interface PlanPresentation {
  id: PlanId;
  name: string;
  audience: string;
  description: string;
  highlights: readonly string[];
}

export interface ComparisonCategory {
  name: string;
  rows: readonly { feature: string; free: string | boolean; pro: string | boolean }[];
}

function megabytes(bytes: number) {
  return `${Math.round(bytes / MB)} MB`;
}

/**
 * Customer-facing plan copy. Values that can be edited by an admin stay derived
 * from the live plan object, avoiding a marketing promise that the API cannot enforce.
 */
export function getPlanPresentations(plans: Record<PlanId, Plan>): Record<PlanId, PlanPresentation> {
  const free = plans.free;
  const pro = plans.pro;
  return {
    free: {
      id: "free",
      name: "Grátis",
      audience: "Para uso ocasional",
      description: "Teste uma página, encontre mídias públicas e faça downloads pontuais sem compromisso.",
      highlights: [
        `Até ${free.limits.maxAssets} itens por análise`,
        `Até ${free.quota.downloadsPerDay} downloads por dia`,
        `ZIPs de até ${megabytes(free.limits.maxZipSizeBytes)}`,
        `Arquivos de até ${megabytes(free.limits.maxFileSizeBytes)}`,
        `${free.limits.maxConcurrentDownloads} downloads simultâneos`,
      ],
    },
    pro: {
      id: "pro",
      name: "Pro",
      audience: "Para uso frequente",
      description: "Para analisar páginas maiores, reunir mais arquivos e concluir trabalhos com menos etapas.",
      highlights: [
        `Até ${pro.limits.maxAssets} itens por análise`,
        "Downloads diários ilimitados",
        `ZIPs de até ${megabytes(pro.limits.maxZipSizeBytes)}`,
        `Arquivos de até ${megabytes(pro.limits.maxFileSizeBytes)}`,
        "Busca profunda em várias páginas",
        "Renderização de páginas com JavaScript",
        `${pro.limits.maxConcurrentDownloads} downloads simultâneos`,
      ],
    },
  };
}

export function getComparisonCategories(plans: Record<PlanId, Plan>): readonly ComparisonCategory[] {
  const free = plans.free;
  const pro = plans.pro;
  return [
    {
      name: "Análises",
      rows: [
        {
          feature: "Arquivos encontrados por análise",
          free: `${free.limits.maxAssets}`,
          pro: `${pro.limits.maxAssets}`,
        },
        { feature: "Busca profunda em várias páginas", free: free.features.deepCrawl, pro: pro.features.deepCrawl },
        { feature: "Páginas com JavaScript", free: free.features.jsRendering, pro: pro.features.jsRendering },
        { feature: "Vídeos protegidos", free: free.features.protectedVideo, pro: pro.features.protectedVideo },
      ],
    },
    {
      name: "Downloads",
      rows: [
        { feature: "Downloads por dia", free: `${free.quota.downloadsPerDay}`, pro: "Ilimitados" },
        {
          feature: "Tamanho máximo por arquivo",
          free: megabytes(free.limits.maxFileSizeBytes),
          pro: megabytes(pro.limits.maxFileSizeBytes),
        },
        {
          feature: "Tamanho máximo do ZIP",
          free: megabytes(free.limits.maxZipSizeBytes),
          pro: megabytes(pro.limits.maxZipSizeBytes),
        },
        {
          feature: "Downloads simultâneos",
          free: `${free.limits.maxConcurrentDownloads}`,
          pro: `${pro.limits.maxConcurrentDownloads}`,
        },
      ],
    },
  ];
}

export function formatBrazilianCurrency(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}
