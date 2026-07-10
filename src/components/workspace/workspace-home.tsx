"use client";

import { Clock3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MediaDownloader } from "@/features/media-downloader/components/media-downloader";

interface RecentAnalysis {
  id: string;
  domain: string;
  totalFound: number;
  selectedCount: number;
}

export function WorkspaceHome() {
  const [recent, setRecent] = useState<RecentAnalysis[] | null>(null);

  useEffect(() => {
    fetch("/api/analyses")
      .then((response) => (response.ok ? response.json() : { analyses: [] }))
      .then((data) => setRecent((data.analyses ?? []).slice(0, 3)))
      .catch(() => setRecent([]));
  }, []);

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">Nova análise</h1>
        <p className="mt-1 text-sm text-[var(--g-sub)]">
          Cole uma URL pública para encontrar e baixar as mídias disponíveis.
        </p>
      </div>
      <MediaDownloader />
      {recent && recent.length > 0 ? (
        <section className="mt-10 border-t border-[var(--g-line)] pt-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--g-ink)]">Análises recentes</h2>
              <p className="mt-1 text-xs text-[var(--g-muted)]">
                Retome uma seleção ou gere outro ZIP sem reprocessar a página.
              </p>
            </div>
            <Link
              href="/analyses"
              className="shrink-0 text-sm font-semibold text-[var(--g-brand-light)] hover:text-[var(--g-ink)]"
            >
              Ver todas
            </Link>
          </div>
          <div className="mt-4 divide-y divide-[var(--g-line)] rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)]">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/analyses/${item.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--g-surface-2)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{item.domain}</p>
                  <p className="mt-1 text-xs text-[var(--g-muted)]">
                    {item.totalFound} arquivos · {item.selectedCount} selecionados
                  </p>
                </div>
                <Clock3 className="h-4 w-4 shrink-0 text-[var(--g-muted)]" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
