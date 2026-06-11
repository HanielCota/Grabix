"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    fetch("/api/admin/overview")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("err"))))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-sm text-[var(--g-danger)]">Erro ao carregar a visão geral.</p>;
  if (!data) return <p className="text-sm text-[var(--g-muted)]">Carregando…</p>;

  const cards = [
    { label: "Usuários", value: data.totalUsers.toLocaleString("pt-BR") },
    { label: "Assinantes Pro", value: data.proActive.toLocaleString("pt-BR") },
    { label: "Novos (7 dias)", value: data.newUsers7d.toLocaleString("pt-BR") },
    { label: "Downloads hoje", value: data.downloadsToday.toLocaleString("pt-BR") },
    { label: "Receita estimada/mês", value: brl(data.estRevenueCents) },
    { label: "Preço atual", value: data.priceLabel },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--g-muted)]">{c.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--g-ink)]">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
