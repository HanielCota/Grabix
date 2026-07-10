import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";

const SKELETON_IDS = ["one", "two", "three", "four", "five", "six"] as const;

export function AdminPageHeader({
  eyebrow = "Administração",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-[var(--g-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--g-brand)]">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--g-ink)] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--g-sub)]">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] ${className}`}>
      {children}
    </section>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <AdminCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.11em] text-[var(--g-muted)]">{label}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--g-muted)]">{detail}</p>
    </AdminCard>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-6 py-14 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--g-surface-2)] text-[var(--g-muted)]">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-sm font-semibold text-[var(--g-ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--g-sub)]">{description}</p>
    </div>
  );
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] p-4 text-sm text-[var(--g-danger)] sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        {message}
      </span>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-4">
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function AdminLoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-live="polite">
      {SKELETON_IDS.slice(0, rows).map((id) => (
        <div key={id} className="h-16 animate-pulse rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-1)]" />
      ))}
      <span className="sr-only">Carregando dados</span>
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "active" || normalized === "resolved"
      ? "border-[var(--g-success-border)] bg-[var(--g-success-bg)] text-[var(--g-success)]"
      : normalized === "canceled" || normalized === "past_due" || normalized === "pending"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : "border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)]";
  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}
