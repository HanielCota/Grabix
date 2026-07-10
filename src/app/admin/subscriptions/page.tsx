"use client";

import { useEffect, useState } from "react";
import { AdminCard, AdminEmptyState, AdminPageHeader, AdminStatusBadge } from "@/components/admin/ui";

interface Sub {
  id: string;
  email: string | null;
  plan: string;
  status: string;
  provider: string | null;
  externalId: string | null;
  currentPeriodEnd: string | null;
  updatedAt: string;
}
interface Evt {
  id: string;
  provider: string;
  receivedAt: string;
}

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString("pt-BR") : "-");

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [events, setEvents] = useState<Evt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        setSubs(d.subscriptions ?? []);
        setEvents(d.events ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[var(--g-muted)]">Carregando…</p>;

  return (
    <div className="space-y-7">
      <AdminPageHeader
        title="Assinaturas"
        description="Acompanhe o status das assinaturas e os últimos eventos recebidos pelo provedor de pagamento."
      />
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--g-ink)]">Assinaturas ativas e histórico</h2>
        {subs.length === 0 ? (
          <AdminEmptyState
            title="Nenhuma assinatura encontrada"
            description="Quando uma assinatura for criada, ela aparecerá aqui com seu status e período atual."
          />
        ) : (
          <AdminCard className="overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_0.8fr_0.65fr] gap-4 border-b border-[var(--g-line)] bg-[var(--g-surface-2)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--g-muted)] sm:grid">
              <span>Cliente e plano</span>
              <span>Status</span>
              <span>Atualizado</span>
            </div>
            <div className="divide-y divide-[var(--g-line)]">
              {subs.map((s) => (
                <div
                  key={s.id}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.5fr)_0.8fr_0.65fr] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{s.email ?? s.id}</p>
                    <p className="text-xs text-[var(--g-muted)]">
                      {s.plan} · {s.provider ?? "-"} · período até {fmt(s.currentPeriodEnd)}
                    </p>
                  </div>
                  <AdminStatusBadge status={s.status} />
                  <span className="text-xs text-[var(--g-muted)]">{fmt(s.updatedAt)}</span>
                </div>
              ))}
            </div>
          </AdminCard>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--g-ink)]">Eventos de webhook (últimos {events.length})</h2>
        {events.length === 0 ? (
          <AdminEmptyState
            title="Nenhum webhook recebido"
            description="Os eventos de cobrança aparecerão aqui assim que forem enviados pelo provedor."
          />
        ) : (
          <AdminCard className="divide-y divide-[var(--g-line)] overflow-hidden">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-4 px-5 py-3 text-xs">
                <span className="truncate font-mono text-[var(--g-sub)]">
                  {e.provider} · {e.id}
                </span>
                <span className="shrink-0 text-[var(--g-muted)]">{fmt(e.receivedAt)}</span>
              </div>
            ))}
          </AdminCard>
        )}
      </section>
    </div>
  );
}
