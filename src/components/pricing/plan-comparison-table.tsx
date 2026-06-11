import { Check, Minus } from "lucide-react";
import { PLAN_COMPARISON, type PlanComparisonRow } from "@/lib/plans/benefits";

// Shared Free × Pro feature table, driven by PLAN_COMPARISON (itself derived from
// PLANS). Rendered on both /pricing and the landing page so the two never drift.

function Cell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--g-success-bg)] text-[var(--g-success)]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    ) : (
      <Minus className="h-4 w-4 text-[var(--g-muted)]" aria-label="Não incluído" />
    );
  }
  return <span className="font-semibold tabular-nums text-[var(--g-ink)]">{value}</span>;
}

function ComparisonRow({ row }: { row: PlanComparisonRow }) {
  return (
    <tr className="border-t border-[var(--g-line)]">
      <th scope="row" className="py-3 pr-3 text-left text-sm font-medium text-[var(--g-sub)]">
        {row.feature}
      </th>
      <td className="px-3 py-3 text-center text-sm text-[var(--g-sub)]">
        <Cell value={row.free} />
      </td>
      <td className="bg-[var(--g-accent-soft)]/40 px-3 py-3 text-center text-sm">
        <Cell value={row.pro} />
      </td>
    </tr>
  );
}

export function PlanComparisonTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)]">
      <table className="w-full border-collapse">
        <caption className="sr-only">Comparativo de recursos entre os planos Grátis e Pro</caption>
        <thead>
          <tr>
            <th className="py-3 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--g-muted)]">
              Recurso
            </th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-widest text-[var(--g-muted)]">
              Grátis
            </th>
            <th className="bg-[var(--g-accent-soft)]/40 px-3 py-3 text-center text-xs font-bold uppercase tracking-widest text-[var(--g-ink)]">
              Pro
            </th>
          </tr>
        </thead>
        <tbody className="[&_th[scope=row]]:pl-5">
          {PLAN_COMPARISON.map((row) => (
            <ComparisonRow key={row.feature} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
