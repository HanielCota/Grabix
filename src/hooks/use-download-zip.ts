"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaAsset } from "@/features/media-downloader/domain/types";
import { notifyUsageChanged } from "@/hooks/use-me";

const MAX_ZIP_FILES = 200;

interface DownloadZipState {
  isZipping: boolean;
  message: { type: "ok" | "err"; text: string } | null;
}

interface UseDownloadZipOptions {
  host: string;
  onUpgradeRequired?: (reason: string) => void;
}

export function useDownloadZip({ host, onUpgradeRequired }: UseDownloadZipOptions) {
  const [state, setState] = useState<DownloadZipState>({ isZipping: false, message: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Auto-dismiss success messages.
  useEffect(() => {
    if (state.message?.type !== "ok") return;
    const timer = setTimeout(() => setState((prev) => ({ ...prev, message: null })), 4000);
    return () => clearTimeout(timer);
  }, [state.message]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isZipping: false }));
  }, []);

  const downloadZip = useCallback(
    async (assets: MediaAsset[]) => {
      if (!assets.length) return;
      const capped = assets.slice(0, MAX_ZIP_FILES);
      const count = capped.length;

      const controller = new AbortController();
      abortRef.current = controller;
      setState({
        isZipping: true,
        message:
          assets.length > MAX_ZIP_FILES
            ? {
                type: "err",
                text: `Limite de ${MAX_ZIP_FILES} arquivos por ZIP. Os primeiros ${MAX_ZIP_FILES} serão incluídos.`,
              }
            : null,
      });

      try {
        const res = await fetch("/api/download-zip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assets: capped }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (!res.ok) {
          if (res.status === 402) {
            setState((prev) => ({ ...prev, message: null }));
            onUpgradeRequired?.("o download em ZIP");
            return;
          }
          const data = await res.json();
          setState({
            isZipping: false,
            message: { type: "err", text: data.error?.message ?? "Erro ao gerar ZIP." },
          });
          return;
        }

        const blob = await res.blob();
        if (controller.signal.aborted) return;

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `grabix-${host}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

        setState({
          isZipping: false,
          message: { type: "ok", text: `${count} arquivo${count !== 1 ? "s" : ""} no ZIP.` },
        });
        notifyUsageChanged();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ isZipping: false, message: { type: "err", text: "Erro de conexão ao gerar ZIP." } });
      }
    },
    [host, onUpgradeRequired],
  );

  return {
    isZipping: state.isZipping,
    zipMessage: state.message,
    downloadZip,
    cancelZip: cancel,
  };
}
