"use client";

import { Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { ErrorBoundary } from "@/app/error-boundary";
import { GoogleIcon } from "@/components/icons/google-icon";
import { ProUpsell } from "@/components/upgrade/pro-upsell";
import { MediaDownloader } from "@/features/media-downloader/components/media-downloader";

export function HomeExperience() {
  const { status } = useSession();

  return (
    <>
      <section aria-label="Extrator de mídias" className="mt-10">
        {status === "loading" ? (
          <div
            className="flex items-center justify-center rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] py-16"
            aria-live="polite"
          >
            <span className="sr-only">Carregando sessão</span>
            <Loader2 className="h-5 w-5 animate-spin text-[var(--g-sub)]" aria-hidden="true" />
          </div>
        ) : status === "authenticated" ? (
          <ErrorBoundary
            fallbackTitle="O extrator travou"
            fallbackMessage="Algo quebrou durante a análise. Tenta de novo."
          >
            <MediaDownloader />
          </ErrorBoundary>
        ) : (
          <div className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-8 text-center">
            <p className="text-base font-semibold text-[var(--g-ink)]">Entre para começar</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--g-sub)]">
              Crie sua conta grátis para extrair e baixar mídias. Sem custo para começar.
            </p>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="btn-primary mx-auto mt-5 inline-flex h-11 items-center justify-center gap-2.5 rounded-xl px-6 text-sm font-semibold"
            >
              <GoogleIcon className="h-5 w-5" />
              Continuar com Google
            </button>

            <p className="mx-auto mt-5 max-w-sm border-t border-[var(--g-line)] pt-4 text-sm text-[var(--g-muted)]">
              No plano grátis: <span className="font-semibold text-[var(--g-sub)]">10 itens por análise</span> e{" "}
              <span className="font-semibold text-[var(--g-sub)]">20 downloads por dia</span>.
            </p>
          </div>
        )}
      </section>

      <ProUpsell />
    </>
  );
}
