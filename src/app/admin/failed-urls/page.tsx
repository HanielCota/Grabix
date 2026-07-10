"use client";

import { Check, ExternalLink, RotateCcw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminEmptyState, AdminErrorState, AdminLoadingRows, AdminPageHeader } from "@/components/admin/ui";

interface FailureRow {
  id: string;
  url: string;
  host: string;
  reason: string;
  message: string | null;
  deepCrawl: boolean;
  count: number;
  resolved: boolean;
  lastSeenAt: string;
}

const REASON_LABELS: Record<string, string> = {
  NO_MEDIA: "Sem mídia",
  FETCH_FAILED: "Falha ao buscar",
  NOT_HTML: "Não é HTML",
  HTML_TOO_LARGE: "HTML grande",
  CRAWL_ERROR: "Erro no crawl",
  INTERNAL_ERROR: "Erro interno",
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason;
}

function reasonClass(reason: string): string {
  // "no media" is informational; the rest are hard errors.
  return reason === "NO_MEDIA"
    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
    : "border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)]";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function AdminFailedUrlsPage() {
  const [q, setQ] = useState("");
  const [includeResolved, setIncludeResolved] = useState(false);
  const [items, setItems] = useState<FailureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((query: string, withResolved: boolean) => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (withResolved) params.set("includeResolved", "1");
    fetch(`/api/admin/failed-urls?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {
        setItems([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: q is applied on submit/toggle, not on each keystroke
  useEffect(() => load(q, includeResolved), [load, includeResolved]);

  async function act(id: string, action: "resolve" | "reopen" | "delete") {
    if (action === "delete" && !window.confirm("Excluir este registro de falha? Esta ação não pode ser desfeita."))
      return;
    setBusyId(id);
    try {
      await fetch("/api/admin/failed-urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      load(q, includeResolved);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Monitoramento de URLs"
        description="Revise erros de análise, acompanhe recorrências e mantenha a fila de falhas organizada."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(q, includeResolved);
          }}
          className="flex flex-1 items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-3 py-2"
        >
          <Search className="h-4 w-4 text-[var(--g-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por domínio ou URL…"
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--g-ink)] placeholder:text-[var(--g-muted)] focus:outline-none"
          />
        </form>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--g-sub)]">
          <input
            type="checkbox"
            checked={includeResolved}
            onChange={(e) => setIncludeResolved(e.target.checked)}
            className="accent-[var(--g-accent)]"
          />
          Mostrar resolvidas
        </label>
      </div>

      {error ? (
        <AdminErrorState
          message="Não foi possível carregar as URLs com falha."
          onRetry={() => load(q, includeResolved)}
        />
      ) : null}
      {loading ? (
        <AdminLoadingRows />
      ) : items.length === 0 ? (
        <AdminEmptyState
          title="Nenhuma falha para revisar"
          description="Quando uma análise falhar, ela será registrada aqui com detalhes para investigação."
        />
      ) : (
        <AdminCard className="divide-y divide-[var(--g-line)] overflow-hidden">
          {items.map((it) => (
            <div
              key={it.id}
              className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${it.resolved ? "opacity-60" : ""}`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${reasonClass(it.reason)}`}
                  >
                    {reasonLabel(it.reason)}
                  </span>
                  {it.deepCrawl && (
                    <span className="inline-flex items-center rounded-md border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--g-sub)]">
                      Deep
                    </span>
                  )}
                  {it.count > 1 && (
                    <span className="inline-flex items-center rounded-md bg-[var(--g-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--g-ink)] tabular-nums">
                      {it.count}×
                    </span>
                  )}
                  <span className="text-xs font-semibold text-[var(--g-sub)]">{it.host}</span>
                </div>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs text-[var(--g-muted)] transition-colors hover:text-[var(--g-ink)]"
                >
                  {it.url}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                <p className="mt-0.5 text-xs text-[var(--g-muted)]">
                  Visto por último em {formatDate(it.lastSeenAt)}
                  {it.message ? ` · ${it.message}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {it.resolved ? (
                  <ActionButton disabled={busyId === it.id} onClick={() => act(it.id, "reopen")}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reabrir
                  </ActionButton>
                ) : (
                  <ActionButton disabled={busyId === it.id} onClick={() => act(it.id, "resolve")}>
                    <Check className="h-3.5 w-3.5" /> Resolver
                  </ActionButton>
                )}
                <ActionButton disabled={busyId === it.id} onClick={() => act(it.id, "delete")}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </ActionButton>
              </div>
            </div>
          ))}
        </AdminCard>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-3 text-xs font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
