"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminLoadingRows, AdminPageHeader } from "@/components/admin/ui";
import { notifyPlansChanged } from "@/hooks/use-pricing";

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
  const router = useRouter();
  const [free, setFree] = useState<PlanData | null>(null);
  const [pro, setPro] = useState<PlanData | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        setFree(d.free);
        setPro(d.pro);
        setPricing(d.pricing);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    // Tell every open browser tab (including public pages) to refetch plan config,
    // and refresh the current Next.js route cache so server-rendered pieces update.
    notifyPlansChanged();
    router.refresh();
    load();
  };

  if (loading || !free || !pro || !pricing) {
    return (
      <div className="space-y-7">
        <AdminPageHeader
          title="Planos e preço"
          description="Defina limites, recursos e o preço exibido para cada plano do Grabix."
        />
        <AdminLoadingRows rows={2} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Planos e preço"
        description="Defina limites, recursos e o preço exibido para cada plano do Grabix."
      />
      <PlanForm id="free" title="Plano Grátis" data={free} pricing={null} onSaved={handleSaved} />
      <PlanForm id="pro" title="Plano Pro" data={pro} pricing={pricing} onSaved={handleSaved} />
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
  onSaved,
}: {
  id: "free" | "pro";
  title: string;
  data: PlanData;
  pricing: Pricing | null;
  onSaved?: () => void;
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
      if (res.ok) {
        setMsg({ ok: true, text: "Salvo!" });
        onSaved?.();
      } else {
        setMsg({ ok: false, text: "Erro ao salvar." });
      }
    } catch {
      setMsg({ ok: false, text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard className="p-5 sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--g-ink)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--g-sub)]">Ajuste capacidade e recursos incluídos neste plano.</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${id === "pro" ? "bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]" : "bg-[var(--g-surface-3)] text-[var(--g-sub)]"}`}
        >
          {id}
        </span>
      </div>

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
    </AdminCard>
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
