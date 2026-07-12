"use client";

import { Check, Minus } from "lucide-react";
import { useEffect } from "react";
import { usePlans } from "@/hooks/use-plans";
import { trackConversion } from "@/lib/analytics";
import { getComparisonCategories } from "@/lib/plans/presentation";

function Value({ value }: { value: string | boolean }) {
  if (typeof value === "string") return <span className="font-semibold tabular-nums text-[var(--g-ink)]">{value}</span>;
  return value ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--g-success-bg)] text-[var(--g-success)]">
      <Check className="h-3.5 w-3.5" strokeWidth={3} aria-label="Incluído" />
    </span>
  ) : (
    <Minus className="mx-auto h-4 w-4 text-[var(--g-muted)]" aria-label="Não incluído" />
  );
}

export function PlanComparisonTable() {
  const { plans, loading } = usePlans();
  const categories = plans ? getComparisonCategories(plans) : [];

  useEffect(() => {
    trackConversion("plan_comparison_viewed", { location: "pricing" });
  }, []);

  if (loading && !plans) {
    return (
      <div className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6 text-sm text-[var(--g-muted)]">
        Carregando comparação…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] sm:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">Comparativo de recursos entre os planos Grátis e Pro</caption>
          <thead>
            <tr>
              <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--g-muted)]">
                Recurso
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-widest text-[var(--g-muted)]">
                Grátis
              </th>
              <th className="bg-[var(--g-accent-soft)]/40 px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--g-ink)]">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <CategoryRows key={category.name} category={category} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {categories.map((category, index) => (
          <details
            key={category.name}
            open={index === 0}
            className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-4"
          >
            <summary className="cursor-pointer list-none text-sm font-bold text-[var(--g-ink)]">
              {category.name}
            </summary>
            <dl className="mt-4 space-y-3">
              {category.rows.map((row) => (
                <div key={row.feature} className="border-t border-[var(--g-line)] pt-3">
                  <dt className="text-sm font-medium text-[var(--g-sub)]">{row.feature}</dt>
                  <dd className="mt-2 grid grid-cols-2 gap-3 text-center text-sm">
                    <span className="rounded-lg bg-[var(--g-surface-3)] px-2 py-2">
                      <span className="block text-xs font-bold uppercase text-[var(--g-muted)]">Grátis</span>
                      <Value value={row.free} />
                    </span>
                    <span className="rounded-lg bg-[var(--g-accent-soft)] px-2 py-2">
                      <span className="block text-xs font-bold uppercase text-[var(--g-sub)]">Pro</span>
                      <Value value={row.pro} />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
    </div>
  );
}

function CategoryRows({ category }: { category: ReturnType<typeof getComparisonCategories>[number] }) {
  return (
    <>
      <tr className="border-y border-[var(--g-line)] bg-[var(--g-surface-2)]">
        <th
          colSpan={3}
          className="px-5 py-2.5 text-left text-xs font-bold uppercase tracking-widest text-[var(--g-muted)]"
        >
          {category.name}
        </th>
      </tr>
      {category.rows.map((row) => (
        <tr key={row.feature} className="border-b border-[var(--g-line)] last:border-0">
          <th scope="row" className="px-5 py-3 text-left text-sm font-medium text-[var(--g-sub)]">
            {row.feature}
          </th>
          <td className="px-4 py-3 text-center text-sm">
            <Value value={row.free} />
          </td>
          <td className="bg-[var(--g-accent-soft)]/40 px-4 py-3 text-center text-sm">
            <Value value={row.pro} />
          </td>
        </tr>
      ))}
    </>
  );
}
