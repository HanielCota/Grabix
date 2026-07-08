"use client";

import { Grab } from "lucide-react";
import { signIn } from "next-auth/react";
import { GoogleIcon } from "@/components/icons/google-icon";

export function SignInPageClient() {
  return (
    <main
      id="conteudo"
      className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center px-5 text-center"
    >
      <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)]">
        <Grab className="h-8 w-8 text-[var(--g-ink)]" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h1 className="text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">Entre no Grabix</h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--g-sub)]">
        Faça login para extrair e baixar mídias. É grátis para começar.
      </p>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="btn-primary mt-7 inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold"
      >
        <GoogleIcon className="h-5 w-5" />
        Continuar com Google
      </button>

      <p className="mt-6 text-xs text-[var(--g-muted)]">
        Ao continuar, você concorda em usar o Grabix apenas com conteúdo público.
      </p>
    </main>
  );
}
