"use client";

import { CheckCircle2, Clock3, Download, FileSearch, FolderOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeExperience } from "@/components/landing/home-experience";

interface RecentAnalysis {
  id: string;
  domain: string;
  totalFound: number;
  selectedCount: number;
  updatedAt: string;
}

const steps = [
  { icon: FileSearch, title: "Cole uma URL", description: "Use o link de uma página pública." },
  { icon: FolderOpen, title: "Revise os arquivos", description: "Filtre e selecione o que interessa." },
  { icon: Download, title: "Baixe com segurança", description: "Um arquivo por vez ou em um ZIP." },
] as const;

export function WorkspaceHome() {
  const [recent, setRecent] = useState<RecentAnalysis[] | null>(null);

  useEffect(() => {
    fetch("/api/analyses")
      .then((response) => (response.ok ? response.json() : { analyses: [] }))
      .then((data) => setRecent((data.analyses ?? []).slice(0, 3)))
      .catch(() => setRecent([]));
  }, []);

  const isNew = recent?.length === 0;
  return (
    <section className="mx-auto max-w-5xl">
      <div className="rounded-3xl border border-[var(--g-brand)]/20 bg-[var(--g-brand)]/[0.045] px-5 py-7 sm:px-8 sm:py-9">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--g-brand-light)]">
          Seu espaço de downloads
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-[var(--g-ink)] sm:text-4xl">
          Encontre as mídias de uma página em poucos passos.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--g-sub)]">
          Cole uma URL pública, escolha os arquivos certos e faça o download sem precisar navegar entre abas.
        </p>
        <p className="mt-5 flex items-center gap-2 text-xs text-[var(--g-muted)]">
          <CheckCircle2 className="h-4 w-4 text-[var(--g-brand-light)]" />
          Suas análises concluídas ficam salvas para você voltar depois.
        </p>
      </div>

      {recent === null ? (
        <div className="mt-5 h-24 animate-pulse rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)]" />
      ) : isNew ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-4">
              <step.icon className="h-4 w-4 text-[var(--g-brand-light)]" />
              <h2 className="mt-4 text-sm font-semibold text-[var(--g-ink)]">{step.title}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--g-muted)]">{step.description}</p>
            </article>
          ))}
        </div>
      ) : (
        <section className="mt-5 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--g-ink)]">Continue de onde parou</h2>
              <p className="mt-1 text-xs text-[var(--g-muted)]">Suas análises recentes ficam disponíveis aqui.</p>
            </div>
            <Link href="/analyses" className="text-xs font-bold text-[var(--g-brand-light)]">
              Ver histórico
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {recent.map((item) => (
              <Link
                key={item.id}
                href={`/analyses/${item.id}`}
                className="rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-2)] p-3 transition-colors hover:border-[var(--g-line-hover)]"
              >
                <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{item.domain}</p>
                <p className="mt-1 text-xs text-[var(--g-sub)]">
                  {item.totalFound} arquivos · {item.selectedCount} selecionados
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--g-muted)]">
                  <Clock3 className="h-3 w-3" />
                  Retomar análise
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <HomeExperience />
    </section>
  );
}
