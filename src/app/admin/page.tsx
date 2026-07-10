"use client";

import { ArrowUpRight, CircleDollarSign, Download, RefreshCw, Sparkles, Users, UsersRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminErrorState, AdminLoadingRows, AdminPageHeader, MetricCard } from "@/components/admin/ui";

interface Overview {
  totalUsers: number;
  proActive: number;
  newUsers7d: number;
  downloadsToday: number;
  estRevenueCents: number;
  priceLabel: string;
}

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch("/api/admin/overview")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("overview"))))
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Visão geral"
        title="Operação do Grabix"
        description="Acompanhe o crescimento da base, a adoção do Pro e a atividade mais recente do produto."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-3.5 text-sm font-semibold text-[var(--g-ink)] hover:bg-[var(--g-surface-2)] disabled:opacity-60"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Atualizar
          </button>
        }
      />
      {error ? <AdminErrorState message="Não foi possível carregar a visão geral." onRetry={load} /> : null}
      {!data ? <AdminLoadingRows rows={3} /> : <Dashboard data={data} />}
    </div>
  );
}

function Dashboard({ data }: { data: Overview }) {
  const proAdoption = data.totalUsers > 0 ? Math.round((data.proActive / data.totalUsers) * 100) : 0;
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Usuários cadastrados"
          value={data.totalUsers.toLocaleString("pt-BR")}
          detail="Base total da plataforma"
        />
        <MetricCard
          icon={UsersRound}
          label="Assinantes Pro"
          value={data.proActive.toLocaleString("pt-BR")}
          detail="Assinaturas com status ativo"
        />
        <MetricCard
          icon={ArrowUpRight}
          label="Novos usuários"
          value={data.newUsers7d.toLocaleString("pt-BR")}
          detail="Entradas nos últimos 7 dias"
        />
        <MetricCard
          icon={Download}
          label="Downloads hoje"
          value={data.downloadsToday.toLocaleString("pt-BR")}
          detail="Uso registrado no dia atual"
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <AdminCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--g-ink)]">Receita recorrente estimada</p>
              <p className="mt-1 text-sm text-[var(--g-sub)]">
                Estimativa baseada em assinaturas Pro ativas e no preço vigente.
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]">
              <CircleDollarSign className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-8 text-4xl font-semibold tracking-[-0.05em] text-[var(--g-ink)]">
            {brl(data.estRevenueCents)}
          </p>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-[var(--g-surface-3)]">
            <div className="h-full rounded-full bg-[var(--g-brand)]" style={{ width: `${proAdoption}%` }} />
          </div>
          <div className="mt-3 flex justify-between text-xs text-[var(--g-muted)]">
            <span>Assinantes ativos: {data.proActive.toLocaleString("pt-BR")}</span>
            <span>Adoção Pro: {proAdoption}%</span>
          </div>
        </AdminCard>
        <AdminCard className="p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </span>
          <h2 className="mt-5 text-base font-semibold text-[var(--g-ink)]">Próxima ação recomendada</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--g-sub)]">
            Revise os novos cadastros e acompanhe quem está usando o plano gratuito com frequência.
          </p>
          <a
            href="/admin/users"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--g-brand-light)] hover:text-[var(--g-ink)]"
          >
            Ver usuários <ArrowUpRight className="h-4 w-4" />
          </a>
        </AdminCard>
      </section>
    </>
  );
}
