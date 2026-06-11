"use client";

import { Check, Crown, Loader2, Sparkles } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { PlanComparisonTable } from "@/components/pricing/plan-comparison-table";
import { useMe } from "@/hooks/use-me";
import { usePricing } from "@/hooks/use-pricing";
import { startCheckout } from "@/lib/billing/checkout";

function splitPrice(label: string): { amount: string; period: string } {
  const idx = label.indexOf("/");
  if (idx === -1) return { amount: label.trim(), period: "" };
  return { amount: label.slice(0, idx).trim(), period: label.slice(idx + 1).trim() };
}

// Billing FAQ - grounded in how the Pro pass actually works (one-time 30-day pass
// via Mercado Pago, no recurring charge, auto-downgrade to Free on expiry).
const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Como funciona o pagamento?",
    a: "Você paga uma vez e libera o Grabix Pro por 30 dias. Não é uma assinatura recorrente: nada é cobrado automaticamente depois.",
  },
  {
    q: "Quais formas de pagamento?",
    a: "Pix ou cartão de crédito, processados com segurança pelo Mercado Pago.",
  },
  {
    q: "Preciso cancelar?",
    a: "Não. O acesso Pro expira sozinho ao fim dos 30 dias. Você só paga de novo se quiser renovar.",
  },
  {
    q: "O que acontece quando o Pro expira?",
    a: "Sua conta volta automaticamente ao plano grátis. Seu histórico e seus downloads continuam disponíveis.",
  },
  {
    q: "Posso começar de graça?",
    a: "Sim. O plano grátis não custa nada e já permite extrair e baixar mídias todos os dias, dentro dos limites da tabela acima.",
  },
];

export function PricingPage() {
  const { status } = useSession();
  const { me } = useMe();
  const { proPriceLabel } = usePricing();
  const { amount, period } = splitPrice(proPriceLabel);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = me?.plan === "pro";
  const authed = status === "authenticated";

  async function handleSubscribe() {
    setBusy(true);
    setError(null);
    try {
      await startCheckout();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível iniciar a assinatura.");
    }
  }

  function PrimaryCta({ className = "" }: { className?: string }) {
    if (isPro) {
      return (
        <a
          href="/conta"
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-6 text-sm font-bold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-surface-3)] ${className}`}
        >
          <Crown className="h-4 w-4 text-[var(--g-gold)]" />
          Você já é Pro · ver conta
        </a>
      );
    }
    if (!authed) {
      return (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/pricing" })}
          className={`btn-primary inline-flex h-11 items-center justify-center gap-2.5 rounded-xl px-6 text-sm font-bold ${className}`}
        >
          <GoogleIcon className="h-5 w-5" />
          Entrar para assinar
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={busy}
        className={`btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-60 ${className}`}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Abrindo checkout...
          </>
        ) : (
          <>
            <Crown className="h-4 w-4 text-[var(--g-gold)]" />
            Assinar Pro · {amount}
          </>
        )}
      </button>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      {/* ── Hero ── */}
      <header className="text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)]">
          <Crown className="h-7 w-7 text-[var(--g-gold)]" />
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[var(--g-ink)] sm:text-4xl">Planos do Grabix</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--g-sub)] sm:text-lg">
          Comece de graça. Quando precisar de mais itens, arquivos maiores e busca profunda, o Pro libera tudo.
        </p>
      </header>

      {/* ── Plan cards ── */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* Free */}
        <div className="flex flex-col rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--g-sub)]">Grátis</h2>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--g-ink)]">R$ 0</span>
            <span className="text-sm font-medium text-[var(--g-muted)]">/sempre</span>
          </div>
          <p className="mt-2 text-sm text-[var(--g-sub)]">Para baixar mídias do dia a dia, sem custo.</p>
          <div className="mt-5">
            {authed && !isPro ? (
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-6 text-sm font-semibold text-[var(--g-sub)]">
                <Check className="h-4 w-4" /> Seu plano atual
              </span>
            ) : (
              <a
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-6 text-sm font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)]"
              >
                Começar grátis
              </a>
            )}
          </div>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-surface-1)] p-6">
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-lg border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--g-ink)]">
            <Sparkles className="h-3 w-3 text-[var(--g-gold)]" /> Recomendado
          </span>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--g-ink)]">Pro</h2>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-[var(--g-ink)]">{amount}</span>
            {period && <span className="text-sm font-medium text-[var(--g-sub)]">/{period}</span>}
          </div>
          <p className="mt-2 text-sm text-[var(--g-sub)]">Pague uma vez · 30 dias de acesso · Pix ou cartão.</p>
          <div className="mt-5">
            <PrimaryCta className="w-full" />
          </div>
          {error && <p className="mt-3 text-xs font-medium text-[var(--g-danger)]">{error}</p>}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[var(--g-ink)]">Comparativo completo</h2>
        <div className="mt-4">
          <PlanComparisonTable />
        </div>
      </section>

      {/* ── Billing FAQ ── */}
      <section className="mt-12">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-[var(--g-ink)]">Perguntas sobre cobrança</h2>
        <div className="mt-4 space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--g-ink)] marker:content-['']">
                {item.q}
                <span className="text-[var(--g-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--g-sub)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="mt-12 rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-surface-1)] p-7 text-center">
        <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">
          {isPro ? "Você já tem tudo do Pro" : "Pronto para liberar tudo?"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--g-sub)]">
          {isPro
            ? "Aproveite os limites ampliados e a busca profunda."
            : "Sem assinatura recorrente. Você paga uma vez e usa por 30 dias."}
        </p>
        <div className="mt-5 flex justify-center">
          <PrimaryCta />
        </div>
      </section>
    </main>
  );
}
