"use client";

import { Copy, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaGallery } from "@/features/media-downloader/components/media-gallery";
import type { AnalyzePageResult } from "@/features/media-downloader/domain/types";
import { trackConversion } from "@/lib/analytics";

interface SavedAnalysis {
  id: string;
  domain: string;
  sourceUrl: string;
  deepCrawl: boolean;
  createdAt: string;
  result: AnalyzePageResult;
  selectedUrls: string[];
}

export default function SavedAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const { id } = await params;
    const response = await fetch(`/api/analyses/${id}`);
    if (!response.ok) {
      setError(true);
      return;
    }
    const saved = await response.json();
    setAnalysis(saved);
    trackConversion("saved_analysis_opened", { asset_count: saved.result?.totalFound ?? 0 });
  }, [params]);

  useEffect(() => {
    load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const saveSelection = useCallback(
    (selectedUrls: string[]) => {
      if (!analysis) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fetch(`/api/analyses/${analysis.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedUrls }),
        });
      }, 400);
    },
    [analysis],
  );

  if (error)
    return (
      <section className="mx-auto max-w-5xl">
        <Link href="/analyses" className="text-sm font-semibold text-[var(--g-brand-light)]">
          Voltar ao histórico
        </Link>
        <div
          role="alert"
          className="mt-5 rounded-xl border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] p-5 text-sm text-[var(--g-danger)]"
        >
          Esta análise não existe mais ou não está disponível para sua conta.
        </div>
      </section>
    );
  if (!analysis)
    return (
      <div className="flex min-h-52 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--g-sub)]" />
      </div>
    );

  return (
    <section className="mx-auto max-w-6xl space-y-7">
      <header className="border-b border-[var(--g-line)] pb-6">
        <Link href="/analyses" className="text-sm font-semibold text-[var(--g-brand-light)]">
          ← Minhas análises
        </Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--g-brand)]">Análise salva</p>
            <h1 className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">
              {analysis.domain}
            </h1>
            <a
              href={analysis.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-sm text-[var(--g-sub)] hover:text-[var(--g-ink)]"
            >
              {analysis.sourceUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(analysis.sourceUrl)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--g-line-hover)] px-3 text-sm font-semibold text-[var(--g-ink)]"
            >
              <Copy className="h-4 w-4" />
              Copiar URL
            </button>
            <Link
              href={`/?url=${encodeURIComponent(analysis.sourceUrl)}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#3dd5b0] px-4 text-sm font-bold text-[#06241f]"
            >
              <RotateCcw className="h-4 w-4" />
              Analisar novamente
            </Link>
          </div>
        </div>
      </header>
      <MediaGallery
        result={analysis.result}
        initialSelected={analysis.selectedUrls}
        onSelectionChange={saveSelection}
      />
    </section>
  );
}
