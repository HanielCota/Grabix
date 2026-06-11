"use client";

import { useEffect, useState } from "react";

interface PlanData {
  maxAssets: number;
  maxFileSizeBytes: number;
  maxZipSizeBytes: number;
  maxConcurrentDownloads: number;
  deepCrawl: boolean;
  jsRendering: boolean;
  protectedVideo: boolean;
  downloadsPerDay: number;
}
interface Pricing {
  amountCents: number;
  label: string;
}

const MB = 1024 * 1024;

export default function AdminPlansPage() {
  const [free, setFree] = useState<PlanData | null>(null);
  const [pro, setPro] = useState<PlanData | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        setFree(d.free);
        setPro(d.pro);
        setPricing(d.pricing);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !free || !pro || !pricing) {
    return <p className="text-sm text-[var(--g-muted)]">Carregando…</p>;
  }

  return (
    <div className="space-y-6">
      <PlanForm id="free" title="Plano Grátis" data={free} pricing={null} />
      <PlanForm id="pro" title="Plano Pro" data={pro} pricing={pricing} />
      <p className="text-xs text-[var(--g-muted)]">
        Mudanças valem na hora para você; para os demais, em até ~1 min (cache). O valor afeta novas assinaturas no
        Mercado Pago - assinaturas existentes mantêm o preço contratado.
      </p>
    </div>
  );
}

function PlanForm({
  id,
  title,
  data,
  pricing,
}: {
  id: "free" | "pro";
  title: string;
  data: PlanData;
  pricing: Pricing | null;
}) {
  const [f, setF] = useState(data);
  const [unlimited, setUnlimited] = useState(data.downloadsPerDay < 0);
  const [priceReais, setPriceReais] = useState(pricing ? (pricing.amountCents / 100).toFixed(2) : "");
  const [priceLabel, setPriceLabel] = useState(pricing?.label ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const body: Record<string, unknown> = {
      id,
      maxAssets: f.maxAssets,
      maxFileSizeBytes: f.maxFileSizeBytes,
      maxZipSizeBytes: f.maxZipSizeBytes,
      maxConcurrentDownloads: f.maxConcurrentDownloads,
      deepCrawl: f.deepCrawl,
      jsRendering: f.jsRendering,
      protectedVideo: f.protectedVideo,
      downloadsPerDay: unlimited ? -1 : f.downloadsPerDay,
    };
    if (id === "pro") {
      body.priceAmountCents = Math.round(Number(priceReais) * 100);
      body.priceLabel = priceLabel;
    }
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setMsg(res.ok ? { ok: true, text: "Salvo!" } : { ok: false, text: "Erro ao salvar." });
    } catch {
      setMsg({ ok: false, text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
      <h2 className="mb-4 text-lg font-bold text-[var(--g-ink)]">{title}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField label="Itens por análise" value={f.maxAssets} onChange={(v) => setF({ ...f, maxAssets: v })} />
        <NumberField
          label="Tamanho máx. por arquivo (MB)"
          value={Math.round(f.maxFileSizeBytes / MB)}
          onChange={(v) => setF({ ...f, maxFileSizeBytes: v * MB })}
        />
        <NumberField
          label="Tamanho máx. do ZIP (MB)"
          value={Math.round(f.maxZipSizeBytes / MB)}
          onChange={(v) => setF({ ...f, maxZipSizeBytes: v * MB })}
        />
        <NumberField
          label="Downloads simultâneos"
          value={f.maxConcurrentDownloads}
          onChange={(v) => setF({ ...f, maxConcurrentDownloads: v })}
        />
        <div>
          <NumberField
            label="Downloads por dia"
            value={f.downloadsPerDay < 0 ? 0 : f.downloadsPerDay}
            disabled={unlimited}
            onChange={(v) => setF({ ...f, downloadsPerDay: v })}
          />
          <label className="mt-1.5 flex items-center gap-2 text-xs text-[var(--g-sub)]">
            <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
            Ilimitado
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <ToggleField label="Busca profunda" value={f.deepCrawl} onChange={(v) => setF({ ...f, deepCrawl: v })} />
        <ToggleField label="JS rendering" value={f.jsRendering} onChange={(v) => setF({ ...f, jsRendering: v })} />
        <ToggleField
          label="Vídeo protegido (Vturb)"
          value={f.protectedVideo}
          onChange={(v) => setF({ ...f, protectedVideo: v })}
        />
      </div>

      {id === "pro" && (
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--g-line)] pt-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-[var(--g-sub)]">Valor mensal (R$)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceReais}
              onChange={(e) => setPriceReais(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] px-3 py-2 text-sm text-[var(--g-ink)] focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[var(--g-sub)]">Rótulo exibido</span>
            <input
              type="text"
              value={priceLabel}
              onChange={(e) => setPriceLabel(e.target.value)}
              placeholder="R$ 19,90/mês"
              className="mt-1 w-full rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] px-3 py-2 text-sm text-[var(--g-ink)] focus:outline-none"
            />
          </label>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary inline-flex h-9 items-center rounded-xl px-4 text-sm font-bold disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {msg && (
          <span className={`text-sm font-medium ${msg.ok ? "text-[var(--g-success)]" : "text-[var(--g-danger)]"}`}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[var(--g-sub)]">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="mt-1 w-full rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] px-3 py-2 text-sm text-[var(--g-ink)] focus:outline-none disabled:opacity-50"
      />
    </label>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--g-sub)]">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
