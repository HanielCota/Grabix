"use client";

import { AlertCircle, ArrowRight, Globe, Loader2, Search, Sparkles, X, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DeepCrawlToggle } from "@/components/deep-crawl-toggle";
import { useUpgrade } from "@/components/upgrade/upgrade-context";
import { useMe } from "@/hooks/use-me";
import type { CrawlConfig } from "@/lib/crawl/types";
import { getPublicUrlError, normalizeHttpUrlInput } from "@/lib/url/public-url";

const EXAMPLE_URL = "https://pt.wikipedia.org/wiki/Gato";
const STEPS = ["Cole a URL", "Veja as mídias", "Baixe"];

type PartialCrawlConfig = Pick<CrawlConfig, "maxDepth" | "maxPages" | "followExternal">;

interface UrlInputProps {
  onSubmit: (url: string, deepCrawl: boolean, crawlConfig?: PartialCrawlConfig) => void;
  isLoading: boolean;
  resetKey?: number;
}

export function UrlInput({ onSubmit, isLoading, resetKey }: UrlInputProps) {
  const { me } = useMe();
  const { open: openUpgrade } = useUpgrade();
  const searchParams = useSearchParams();
  const deepLocked = me?.plan !== "pro";
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [crawlConfig, setCrawlConfig] = useState<PartialCrawlConfig>({
    maxDepth: 2,
    maxPages: 20,
    followExternal: false,
  });

  useEffect(() => {
    if (resetKey !== undefined) {
      setUrl("");
      setTouched(false);
    }
  }, [resetKey]);

  useEffect(() => {
    const presetUrl = searchParams.get("url");
    if (!presetUrl || getPublicUrlError(presetUrl)) return;
    setUrl(presetUrl);
    setTouched(false);
  }, [searchParams]);

  const validationError = useMemo(() => {
    if (!touched || !url.trim()) return null;
    return getPublicUrlError(url);
  }, [url, touched]);

  const errorId = validationError ? "url-input-error" : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const trimmed = url.trim();
    if (!trimmed) return;
    const error = getPublicUrlError(trimmed);
    if (error) return;
    const normalized = normalizeHttpUrlInput(trimmed);
    onSubmit(normalized, deepCrawl, deepCrawl ? crawlConfig : undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Input bar */}
      <div className="rounded-2xl">
        <div
          className={`relative flex items-center gap-2 rounded-2xl border bg-[var(--g-surface-1)] p-1.5 transition-colors ${
            validationError
              ? "border-[var(--g-danger-border)]"
              : "border-[var(--g-line-hover)] focus-within:border-[var(--g-accent-border)]"
          }`}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--g-surface-3)] text-[var(--g-muted)]">
            <Search className="h-5 w-5" />
          </div>

          <label htmlFor="url-input" className="sr-only">
            URL pública para extrair mídia
          </label>
          <input
            id="url-input"
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (!touched && e.target.value.trim()) setTouched(true);
            }}
            placeholder="Cole uma URL aqui..."
            disabled={isLoading}
            autoComplete="url"
            spellCheck={false}
            aria-invalid={validationError ? "true" : "false"}
            aria-describedby={errorId}
            className="min-h-12 min-w-0 flex-1 bg-transparent px-2 text-[15px] text-[var(--g-ink)] placeholder:text-[var(--g-muted)] focus:outline-none disabled:opacity-50"
          />

          {url && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setTouched(false);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--g-muted)] transition-all hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]"
              aria-label="Limpar URL"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary inline-flex h-12 shrink-0 items-center gap-2 rounded-xl px-6 text-sm font-bold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                Extrair
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Validation error */}
        {validationError && (
          <p id={errorId} className="mt-2 flex items-center gap-1.5 px-2 text-xs font-medium text-[var(--g-danger)]">
            <AlertCircle size={13} />
            {validationError}
          </p>
        )}
      </div>

      {/* Feature pills + deep crawl toggle */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Pill icon={<Globe size={16} />} text="Qualquer site" />
          <Pill icon={<Zap size={16} />} text="Em segundos" />
          <Pill icon={<Sparkles size={16} />} text="Plano grátis" />
        </div>

        <DeepCrawlToggle
          enabled={deepCrawl}
          onEnabledChange={setDeepCrawl}
          config={crawlConfig}
          onConfigChange={setCrawlConfig}
          locked={deepLocked}
          onLockedClick={() => openUpgrade("o Deep Crawl")}
        />

        {/* How it works + example */}
        <div className="mt-1 flex flex-col items-center gap-2.5">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-[var(--g-muted)]">
            {STEPS.map((step, i) => (
              <span key={step} className="inline-flex items-center gap-1.5">
                {i > 0 && <ArrowRight size={11} className="opacity-40" />}
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--g-surface-3)] text-[10px] font-bold text-[var(--g-sub)]">
                  {i + 1}
                </span>
                {step}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setUrl(EXAMPLE_URL);
              setTouched(true);
            }}
            className="rounded-full border border-[var(--g-line)] bg-[var(--g-surface-2)] px-3 py-1 text-xs font-medium text-[var(--g-sub)] transition-colors hover:border-[var(--g-line-hover)] hover:text-[var(--g-ink)]"
          >
            Testar com um exemplo
          </button>
        </div>
      </div>
    </form>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--g-line)] bg-[var(--g-surface-2)] px-4 py-2 text-sm font-medium text-[var(--g-muted)]">
      <span className="text-[var(--g-sub)]">{icon}</span>
      {text}
    </span>
  );
}
