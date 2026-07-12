"use client";

import { Check, Crown, Loader2, ShieldCheck } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useMe } from "@/hooks/use-me";
import { usePlans } from "@/hooks/use-plans";
import { trackConversion } from "@/lib/analytics";
import { startCheckout } from "@/lib/billing/checkout";
import { formatBrazilianCurrency, getPlanPresentations } from "@/lib/plans/presentation";

export default function UpgradePage() {
  const { status } = useSession();
  const { me } = useMe();
  const { plans } = usePlans();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPro = me?.plan === "pro";
  const usage = me?.usage;
  const price = plans ? formatBrazilianCurrency(plans.pricing.amountCents) : "R$ 19,90";
  const benefits = plans ? getPlanPresentations(plans).pro.highlights : [];

  async function purchase() {
    if (status !== "authenticated") {
      signIn("google", { callbackUrl: "/upgrade" });
      return;
    }
    trackConversion("plan_selected", { plan: "pro", source_page: "upgrade", price_displayed: price });
    setBusy(true);
    setError(null);
    try {
      await startCheckout({ reason: "account_upgrade", returnTo: "/" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível abrir o checkout.");
    }
  }

  return (
    <main id="conteudo" className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--g-brand-light)]">Plano e capacidade</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--g-ink)]">
          {isPro ? "Seu acesso Pro" : "Planeje seu próximo trabalho"}
        </h1>
        <p className="mt-2 text-sm text-[var(--g-sub)]">
          Veja seu plano atual e escolha o Pro quando precisar de mais capacidade.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--g-muted)]">Plano atual</p>
          <div className="mt-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-[var(--g-gold)]" />
            <h2 className="text-xl font-bold text-[var(--g-ink)]">{isPro ? "Grabix Pro" : "Grabix Grátis"}</h2>
          </div>
          {isPro ? (
            <p className="mt-3 text-sm leading-relaxed text-[var(--g-sub)]">
              Seu acesso Pro está ativo
              {me?.periodEnd ? ` até ${new Date(me.periodEnd).toLocaleDateString("pt-BR")}` : ""}.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-[var(--g-sub)]">
                Use o Grátis para downloads pontuais. Seus limites renovam diariamente.
              </p>
              <dl className="mt-6 space-y-3 rounded-xl bg-[var(--g-surface-2)] p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--g-sub)]">Downloads usados hoje</dt>
                  <dd className="font-bold text-[var(--g-ink)]">
                    {usage ? `${usage.used} de ${usage.limit ?? "∞"}` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--g-sub)]">Restantes hoje</dt>
                  <dd className="font-bold text-[var(--g-ink)]">{usage?.remaining ?? "—"}</dd>
                </div>
              </dl>
            </>
          )}
        </section>
        <section className="rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-surface-1)] p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--g-brand-light)]">
            {isPro ? "Renovação manual" : "Recomendado para uso frequente"}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[var(--g-ink)]">Grabix Pro</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--g-sub)]">
            Mais arquivos por análise, ZIPs maiores e recursos avançados para concluir mais em menos etapas.
          </p>
          <p className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[var(--g-ink)]">{price}</p>
          <p className="mt-1 text-sm text-[var(--g-muted)]">pagamento único · 30 dias · sem renovação automática</p>
          <ul className="mt-5 space-y-2.5">
            {benefits.slice(0, 6).map((item) => (
              <li key={item} className="flex gap-2 text-sm text-[var(--g-sub)]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--g-success)]" strokeWidth={3} />
                {item}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={purchase}
            disabled={busy || isPro}
            className="btn-primary mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold disabled:cursor-default disabled:opacity-70"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPro ? (
              <Check className="h-4 w-4" />
            ) : status === "authenticated" ? (
              <Crown className="h-4 w-4 text-[var(--g-gold)]" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            {isPro ? "Seu plano atual" : status === "authenticated" ? "Começar com o Pro" : "Entrar para assinar"}
          </button>
          {error ? (
            <p role="alert" className="mt-3 text-sm text-[var(--g-danger)]">
              {error}
            </p>
          ) : null}
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[var(--g-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--g-success)]" />
            Pagamento processado com segurança pelo Mercado Pago.
          </p>
        </section>
      </div>
    </main>
  );
}
