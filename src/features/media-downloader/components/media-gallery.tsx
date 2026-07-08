"use client";

import { CheckSquare, Crown, Download, FileImage, Image as ImageIcon, Package, Square, Video, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUpgrade } from "@/components/upgrade/upgrade-context";
import { useDownloadZip } from "@/hooks/use-download-zip";
import { usePricing } from "@/hooks/use-pricing";
import type { AnalyzePageResult, MediaAsset } from "../domain/types";
import { MediaCard } from "./media-card";
import { type FilterType, MediaFilters } from "./media-filters";

const PAGE_SIZE = 24;

interface MediaGalleryProps {
  result: AnalyzePageResult;
}

export function MediaGallery({ result }: MediaGalleryProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { open: openUpgrade } = useUpgrade();
  const { proPriceLabel } = usePricing();
  const host = useMemo(() => {
    try {
      return new URL(result.url).hostname.replace(/^www\./, "");
    } catch {
      return result.url;
    }
  }, [result.url]);
  const { isZipping, zipMessage, downloadZip, cancelZip } = useDownloadZip({ host, onUpgradeRequired: openUpgrade });

  // ─── Derived data ───

  const counts = useMemo(() => {
    let img = 0;
    let gif = 0;
    let vid = 0;
    for (const a of result.assets) {
      if (a.type === "IMAGE") {
        img++;
        if (a.extension === "gif") gif++;
      } else {
        vid++;
      }
    }
    return { all: result.assets.length, IMAGE: img, GIF: gif, VIDEO: vid };
  }, [result.assets]);

  const filtered = useMemo(() => {
    if (filter === "all") return result.assets;
    if (filter === "GIF") return result.assets.filter((a) => a.extension === "gif");
    return result.assets.filter((a) => a.type === filter);
  }, [result.assets, filter]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Auto-load the next page when the sentinel nears the viewport (infinite scroll).
  // Each loaded batch pushes the sentinel well past the 400px margin, so it only
  // re-fires after the user scrolls further; the button below is the manual fallback.
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => c + PAGE_SIZE);
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // ─── Selection ───

  const toggleSelect = useCallback((url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected((prev) => {
      const filteredUrls = new Set(filtered.map((a) => a.url));
      const allFilteredSelected = filtered.every((a) => prev.has(a.url));
      if (allFilteredSelected) {
        // Deselect only the currently filtered items
        const next = new Set(prev);
        for (const url of filteredUrls) next.delete(url);
        return next;
      }
      // Select all filtered items (keep previous selections from other filters)
      return new Set([...prev, ...filteredUrls]);
    });
  }, [filtered]);

  // Ctrl+A to select all
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectAll]);

  const selectedAssets = useMemo(() => result.assets.filter((a) => selected.has(a.url)), [result.assets, selected]);

  const assetsForZip = useMemo(() => {
    if (selected.size === 0) return filtered;
    return selectedAssets;
  }, [filtered, selected.size, selectedAssets]);

  // ─── Handlers ───

  function handleFilterChange(f: FilterType) {
    setFilter(f);
    setVisibleCount(PAGE_SIZE);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.url));

  const zipLabel =
    selected.size > 0
      ? `ZIP (${assetsForZip.length} selecionado${assetsForZip.length !== 1 ? "s" : ""})`
      : `ZIP (${filtered.length})`;

  // ─── Render ───

  return (
    <section className="space-y-6">
      {/* Summary panel */}
      <div className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--g-sub)]">Análise concluída</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--g-ink)]">
              {result.totalFound} mídia{result.totalFound !== 1 ? "s" : ""}
            </h2>
            <p className="mt-1 text-sm text-[var(--g-sub)]">
              {host}
              {result.pagesScanned && result.pagesScanned > 1 && (
                <span className="ml-2 text-xs text-[var(--g-muted)]">({result.pagesScanned} páginas varridas)</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Select all */}
            <button
              type="button"
              onClick={selectAll}
              className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all ${
                allFilteredSelected
                  ? "border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] text-[var(--g-ink)]"
                  : "border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)] hover:text-[var(--g-ink)]"
              }`}
            >
              {allFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              {allFilteredSelected ? "Desmarcar" : "Selecionar"} tudo
            </button>

            {selected.size > 0 && (
              <span className="rounded-lg bg-[var(--g-accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--g-ink)]">
                {selected.size}
              </span>
            )}

            {/* ZIP */}
            {isZipping ? (
              <button
                type="button"
                onClick={cancelZip}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] px-4 text-xs font-bold text-[var(--g-danger)] transition-all hover:bg-[rgba(248,113,113,0.12)]"
              >
                <X className="h-3.5 w-3.5" />
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => downloadZip(assetsForZip)}
                disabled={assetsForZip.length === 0}
                className="btn-primary inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold"
              >
                <Package className="h-3.5 w-3.5" />
                {zipLabel}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            icon={<ImageIcon className="h-4 w-4" />}
            label="Imagens"
            value={counts.IMAGE}
            color="text-sky-400"
            bg="bg-sky-500/10"
          />
          <Stat
            icon={<FileImage className="h-4 w-4" />}
            label="GIFs"
            value={counts.GIF}
            color="text-emerald-400"
            bg="bg-emerald-500/10"
          />
          <Stat
            icon={<Video className="h-4 w-4" />}
            label="Vídeos"
            value={counts.VIDEO}
            color="text-fuchsia-400"
            bg="bg-fuchsia-500/10"
          />
          <Stat
            icon={<Download className="h-4 w-4" />}
            label="Total"
            value={counts.all}
            color="text-[var(--g-ink)]"
            bg="bg-[var(--g-accent-soft)]"
          />
        </div>
      </div>

      {/* Locked-by-plan upgrade hint */}
      {result.lockedCount && result.lockedCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[var(--g-ink)]">
            <span className="font-bold">+{result.lockedCount}</span> mídia{result.lockedCount !== 1 ? "s" : ""} além do
            limite do plano grátis. Assine o Pro ({proPriceLabel}) para liberar todas.
          </p>
          <button
            type="button"
            onClick={() => openUpgrade("todas as mídias da página")}
            className="btn-primary inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold"
          >
            <Crown className="h-3.5 w-3.5 text-[var(--g-gold)]" />
            Assinar Pro
          </button>
        </div>
      ) : null}

      {/* ZIP feedback */}
      {zipMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            zipMessage.type === "ok"
              ? "border border-[var(--g-success-border)] bg-[var(--g-success-bg)] text-[var(--g-success)]"
              : "border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)]"
          }`}
        >
          {zipMessage.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MediaFilters active={filter} onChange={handleFilterChange} counts={counts} />
        <p className="text-sm text-[var(--g-muted)]">
          {filtered.length} de {result.totalFound} visíveis
        </p>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--g-line)] py-16 text-center">
          <p className="text-sm text-[var(--g-muted)]">Nenhum resultado para este filtro.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {visible.map((asset, i) => (
              <MemoMediaCard
                key={asset.url}
                asset={asset}
                index={i}
                selected={selected.has(asset.url)}
                toggleSelect={toggleSelect}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <div ref={sentinelRef} aria-hidden="true" className="pointer-events-none h-px w-full" />
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-6 text-sm font-semibold text-[var(--g-sub)] transition-all hover:bg-[var(--g-line)] hover:text-[var(--g-ink)] hover:border-[var(--g-line-hover)]"
              >
                Mostrar mais ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

const MemoMediaCard = memo(function MemoMediaCard({
  asset,
  index,
  selected,
  toggleSelect,
}: {
  asset: MediaAsset;
  index: number;
  selected: boolean;
  toggleSelect: (url: string) => void;
}) {
  const onToggle = useCallback(() => toggleSelect(asset.url), [toggleSelect, asset.url]);
  return <MediaCard asset={asset} index={index} selected={selected} onToggle={onToggle} />;
});

function Stat({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-2)] px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>{icon}</div>
      <div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        <p className="text-xs font-medium text-[var(--g-muted)]">{label}</p>
      </div>
    </div>
  );
}
