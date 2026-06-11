"use client";

import { Grab, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { signIn, useSession } from "next-auth/react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { MediaDownloader } from "@/features/media-downloader/components/media-downloader";
import { ErrorBoundary } from "./error-boundary";

export default function Home() {
  const { status } = useSession();

  return (
    <main className="mx-auto max-w-3xl px-5 pt-12 pb-10 sm:px-8 sm:pt-20">
      {/* ── Hero ── */}
      <header className="mb-10 text-center sm:mb-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)]"
        >
          <Grab className="h-10 w-10 text-[var(--g-ink)]" strokeWidth={1.5} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-3xl font-bold tracking-[-0.03em] text-[var(--g-ink)] sm:text-4xl"
        >
          GRABIX
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--g-sub)] sm:text-lg"
        >
          Cola uma URL, o Grabix extrai todas as imagens e vídeos. Baixa um por um ou tudo em ZIP.
        </motion.p>
      </header>

      {/* ── Input + Results ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {status === "loading" ? (
          <div className="flex items-center justify-center rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] py-16">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--g-sub)]" />
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

            <p className="mx-auto mt-5 max-w-xs border-t border-[var(--g-line)] pt-4 text-xs text-[var(--g-muted)]">
              No plano grátis: <span className="font-semibold text-[var(--g-sub)]">10 itens por análise</span> e{" "}
              <span className="font-semibold text-[var(--g-sub)]">20 downloads por dia</span>.
            </p>
          </div>
        )}
      </motion.section>

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-[var(--g-line)] pt-5 text-center text-sm leading-relaxed text-[var(--g-muted)]">
        <p>Só lê o HTML público. Não pula login, não quebra DRM, não faz mágica.</p>
        <p className="mt-1 text-xs opacity-40">v1.0.0</p>
      </footer>
    </main>
  );
}
