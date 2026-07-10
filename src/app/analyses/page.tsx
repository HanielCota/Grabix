"use client";

import { Clock3, FileSearch, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { trackConversion } from "@/lib/analytics";

interface AnalysisItem {
  id: string;
  sourceUrl: string;
  domain: string;
  status: string;
  deepCrawl: boolean;
  totalFound: number;
  imageCount: number;
  videoCount: number;
  selectedCount: number;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

export default function AnalysesPage() {
  const [items, setItems] = useState<AnalysisItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (search = "") => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/analyses?q=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error("analyses");
      const data = await response.json();
      setItems(data.analyses ?? []);
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackConversion("analysis_history_viewed");
    load();
  }, [load]);

  async function remove(id: string) {
    if (!window.confirm("Excluir esta análise salva? Os arquivos não serão alterados na página original.")) return;
    const response = await fetch(`/api/analyses/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="mx-auto max-w-5xl space-y-7">
      <header className="flex flex-col gap-4 border-b border-[var(--g-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--g-brand)]">Biblioteca</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">Minhas análises</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--g-sub)]">
            Retome uma análise sem processar a mesma página novamente.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[#3dd5b0] px-4 text-sm font-bold text-[#06241f] hover:bg-[#7cedd0]"
        >
          Nova análise
        </Link>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(query);
        }}
        className="flex items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-3 py-2"
      >
        <Search className="h-4 w-4 text-[var(--g-muted)]" />
        <label className="sr-only" htmlFor="analysis-search">
          Buscar análises
        </label>
        <input
          id="analysis-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por domínio ou URL"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--g-ink)] placeholder:text-[var(--g-muted)] focus:outline-none"
        />
      </form>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] p-4 text-sm text-[var(--g-danger)]"
        >
          Não foi possível carregar seu histórico.{" "}
          <button type="button" onClick={() => load(query)} className="font-semibold underline">
            Tentar novamente
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="space-y-3" aria-live="polite">
          {["one", "two", "three"].map((id) => (
            <div
              key={id}
              className="h-28 animate-pulse rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)]"
            />
          ))}
          <span className="sr-only">Carregando análises</span>
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-6 py-16 text-center">
          <FileSearch className="mx-auto h-6 w-6 text-[var(--g-brand-light)]" />
          <h2 className="mt-4 text-base font-semibold text-[var(--g-ink)]">Sua biblioteca está vazia</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--g-sub)]">
            Conclua uma análise para voltar aos arquivos e gerar novos ZIPs quando quiser.
          </p>
          <Link href="/" className="mt-5 inline-flex text-sm font-bold text-[var(--g-brand-light)]">
            Fazer a primeira análise
          </Link>
        </div>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--g-brand)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--g-brand-light)]">
                  {item.status}
                </span>
                {item.deepCrawl ? (
                  <span className="rounded-full bg-[var(--g-surface-3)] px-2 py-1 text-[10px] font-bold text-[var(--g-sub)]">
                    Busca profunda
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 truncate text-base font-semibold text-[var(--g-ink)]">{item.domain}</h2>
              <p className="mt-1 truncate text-xs text-[var(--g-muted)]">{item.sourceUrl}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--g-sub)]">
                <span>{item.totalFound} arquivos</span>
                <span>{item.imageCount} imagens</span>
                <span>{item.videoCount} vídeos</span>
                <span>{item.selectedCount} selecionados</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {formatDate(item.updatedAt)}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/analyses/${item.id}`}
                className="inline-flex h-10 items-center rounded-xl bg-[#3dd5b0] px-4 text-sm font-bold text-[#06241f] hover:bg-[#7cedd0]"
              >
                Abrir
              </Link>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Excluir análise de ${item.domain}`}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--g-line-hover)] text-[var(--g-muted)] hover:bg-[var(--g-danger-bg)] hover:text-[var(--g-danger)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
