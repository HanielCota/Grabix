"use client";

import { useEffect, useState } from "react";

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
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--g-sub)]">Assinaturas</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-[var(--g-muted)]">Nenhuma assinatura ainda.</p>
        ) : (
          <div className="space-y-2">
            {subs.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-1 rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{s.email ?? s.id}</p>
                  <p className="text-xs text-[var(--g-muted)]">
                    {s.plan} · {s.provider ?? "-"} · período até {fmt(s.currentPeriodEnd)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  <span className="text-xs text-[var(--g-muted)]">{fmt(s.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--g-sub)]">
          Eventos de webhook (últimos {events.length})
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-[var(--g-muted)]">Nenhum evento recebido.</p>
        ) : (
          <div className="space-y-1.5">
            {events.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-[var(--g-line)] bg-[var(--g-surface-2)] px-3 py-2 text-xs"
              >
                <span className="truncate font-mono text-[var(--g-sub)]">
                  {e.provider} · {e.id}
                </span>
                <span className="shrink-0 text-[var(--g-muted)]">{fmt(e.receivedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "active";
  const warn = status === "canceled" || status === "past_due";
  const cls = ok
    ? "border-[var(--g-success-border)] bg-[var(--g-success-bg)] text-[var(--g-success)]"
    : warn
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : "border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)]";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${cls}`}>{status}</span>
  );
}
