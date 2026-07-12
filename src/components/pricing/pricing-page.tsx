"use client";

import { Check, ChevronRight, Crown, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { PlanComparisonTable } from "@/components/pricing/plan-comparison-table";
import { useMe } from "@/hooks/use-me";
import { usePlans } from "@/hooks/use-plans";
import { captureAttribution, trackConversion } from "@/lib/analytics";
import { startCheckout } from "@/lib/billing/checkout";
import { formatBrazilianCurrency, getPlanPresentations } from "@/lib/plans/presentation";

const FAQ = [
  [
    "Posso usar o Grabix gratuitamente?",
    "Sim. O plano Grátis permite analisar páginas públicas e fazer downloads dentro dos limites mostrados acima.",
  ],
  [
    "Como funciona o Pro?",
    "O Pro é um acesso avulso de 30 dias. Hoje não há renovação automática: você só compra novamente se decidir renovar.",
  ],
  ["Quais formas de pagamento estão disponíveis?", "Pix e cartão de crédito, processados pelo Mercado Pago."],
  [
    "O que acontece ao fim dos 30 dias?",
    "Sua conta volta ao plano Grátis. Os limites do plano gratuito passam a valer novamente.",
  ],
  [
    "O Pro encontra mais arquivos?",
    "Ele libera mais itens por análise e a busca profunda; o resultado continua dependendo do conteúdo público disponível na página.",
  ],
] as const;

export function PricingPage() {
  const { status } = useSession();
  const { me } = useMe();
  const { plans } = usePlans();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPro = me?.plan === "pro";
  const authed = status === "authenticated";
  const present = plans ? getPlanPresentations(plans) : null;
  const price = plans ? formatBrazilianCurrency(plans.pricing.amountCents) : "R$ 19,90";

  useEffect(() => {
    captureAttribution();
    trackConversion("pricing_viewed", { plan: me?.plan ?? "visitor", source_page: "pricing" });
  }, [me?.plan]);

  async function selectPro(location: string) {
    trackConversion("plan_selected", { plan: "pro", price_displayed: price, location });
    if (!authed) {
      signIn("google", { callbackUrl: "/pricing" });
      return;
    }
    if (isPro) {
      window.location.assign("/upgrade");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await startCheckout({ reason: "pricing_page", returnTo: "/" });
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Não foi possível abrir o checkout.");
    }
  }

  return (
    <main id="conteudo" className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)]">
          <Crown className="h-6 w-6 text-[var(--g-gold)]" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--g-brand-light)]">
          Planos simples, uso no seu ritmo
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[var(--g-ink)] sm:text-5xl">
          Analise mais páginas e monte ZIPs maiores sem recomeçar.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--g-sub)] sm:text-lg">
          Comece gratuitamente. Escolha o Pro quando precisar de mais arquivos por análise, busca profunda e downloads
          sem limite diário.
        </p>
        <p className="mt-4 text-sm font-medium text-[var(--g-muted)]">
          O plano Grátis não exige pagamento. O Pro é um acesso de 30 dias, sem cobrança automática.
        </p>
      </header>

      <section aria-label="Planos" className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-2">
        <PlanCard
          name={present?.free.name ?? "Grátis"}
          audience={present?.free.audience ?? "Para uso ocasional"}
          description={present?.free.description ?? "Para downloads pontuais."}
          price="R$ 0"
          billing="sem prazo ou cobrança"
          benefits={present?.free.highlights ?? []}
          action={authed && !isPro ? "Seu plano atual" : "Começar gratuitamente"}
          disabled={authed && !isPro}
          onAction={() => {
            trackConversion("plan_selected", { plan: "free", location: "pricing" });
            window.location.assign("/");
          }}
        />
        <PlanCard
          recommended
          name={present?.pro.name ?? "Pro"}
          audience={present?.pro.audience ?? "Para uso frequente"}
          description={present?.pro.description ?? "Para trabalhos maiores."}
          price={price}
          billing="pagamento único · 30 dias de acesso"
          benefits={present?.pro.highlights ?? []}
          action={isPro ? "Gerenciar meu Pro" : authed ? "Começar com o Pro" : "Entrar para assinar"}
          busy={busy}
          onAction={() => selectPro("pricing_card")}
        />
      </section>
      {error ? (
        <p role="alert" className="mx-auto mt-3 max-w-4xl text-center text-sm font-medium text-[var(--g-danger)]">
          {error}
        </p>
      ) : null}

      <section className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3" aria-label="Confiança no pagamento">
        <Trust icon={<LockKeyhole className="h-4 w-4" />} text="Pix ou cartão via Mercado Pago" />
        <Trust icon={<ShieldCheck className="h-4 w-4" />} text="Acesso liberado após confirmação" />
        <Trust icon={<Check className="h-4 w-4" />} text="Sem renovação automática" />
      </section>

      <section className="mt-16" aria-labelledby="comparison-heading">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--g-brand-light)]">
            Compare o que muda
          </p>
          <h2 id="comparison-heading" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--g-ink)]">
            Capacidade para o trabalho que você precisa fazer agora.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--g-sub)]">
            Os limites abaixo são aplicados pelo produto e atualizados junto com a configuração do plano.
          </p>
        </div>
        <PlanComparisonTable />
      </section>

      <section className="mt-16 grid gap-5 lg:grid-cols-3" aria-labelledby="use-cases-heading">
        <div className="lg:col-span-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--g-brand-light)]">
            Escolha por frequência
          </p>
          <h2 id="use-cases-heading" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--g-ink)]">
            Um plano para cada ritmo de uso.
          </h2>
        </div>
        <UseCase title="Uso ocasional" text="Você analisa poucas páginas e faz downloads pontuais." plan="Grátis" />
        <UseCase
          title="Uso frequente"
          text="Você organiza mídias de lojas, galerias ou catálogos com regularidade."
          plan="Pro por 30 dias"
          recommended
        />
        <UseCase
          title="Trabalho concentrado"
          text="Você tem um projeto maior e precisa encontrar e baixar muito conteúdo em menos etapas."
          plan="Pro por 30 dias"
        />
      </section>

      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="faq-heading">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--g-brand-light)]">Sem letras miúdas</p>
        <h2 id="faq-heading" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--g-ink)]">
          Perguntas antes de escolher.
        </h2>
        <div className="mt-5 space-y-3">
          {FAQ.map(([question, answer]) => (
            <details
              key={question}
              className="group rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5"
              onToggle={(event) => {
                if ((event.currentTarget as HTMLDetailsElement).open) trackConversion("faq_opened", { question });
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--g-ink)]">
                {question}
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--g-muted)] transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--g-sub)]">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-[var(--g-accent-border)] bg-[var(--g-surface-1)] px-6 py-10 text-center sm:px-10">
        <Sparkles className="mx-auto h-5 w-5 text-[var(--g-gold)]" />
        <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-[var(--g-ink)]">
          {isPro ? "Seu Pro já está ativo." : "Comece grátis. Faça upgrade quando fizer sentido."}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--g-sub)]">
          {isPro
            ? "Consulte seu acesso e renove apenas se quiser continuar com a capacidade ampliada."
            : `O Pro custa ${price} por 30 dias. Você vê o total antes de pagar.`}
        </p>
        <button
          type="button"
          onClick={() => selectPro("pricing_footer")}
          disabled={busy}
          className="btn-primary mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4 text-[var(--g-gold)]" />}
          {isPro ? (
            "Gerenciar meu Pro"
          ) : authed ? (
            "Começar com o Pro"
          ) : (
            <>
              <GoogleIcon className="h-4 w-4" /> Entrar para assinar
            </>
          )}
        </button>
      </section>
    </main>
  );
}

function PlanCard(props: {
  name: string;
  audience: string;
  description: string;
  price: string;
  billing: string;
  benefits: readonly string[];
  action: string;
  recommended?: boolean;
  disabled?: boolean;
  busy?: boolean;
  onAction: () => void;
}) {
  return (
    <article
      className={`relative flex min-h-[480px] flex-col rounded-3xl border bg-[var(--g-surface-1)] p-6 sm:p-7 ${props.recommended ? "border-[var(--g-accent-border)] shadow-[0_12px_40px_rgba(0,0,0,0.12)]" : "border-[var(--g-line)]"}`}
    >
      {props.recommended ? (
        <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--g-ink)]">
          <Sparkles className="h-3 w-3 text-[var(--g-gold)]" /> Mais escolhido
        </span>
      ) : null}
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--g-brand-light)]">{props.audience}</p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--g-ink)]">{props.name}</h2>
      <p className="mt-2 min-h-12 text-sm leading-relaxed text-[var(--g-sub)]">{props.description}</p>
      <div className="mt-6">
        <span className="text-4xl font-extrabold tracking-[-0.04em] text-[var(--g-ink)]">{props.price}</span>
        <p className="mt-1 text-sm font-medium text-[var(--g-muted)]">{props.billing}</p>
      </div>
      <ul className="mt-6 space-y-3">
        {props.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2.5 text-sm text-[var(--g-sub)]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--g-success)]" strokeWidth={3} />
            {benefit}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={props.onAction}
        disabled={props.disabled || props.busy}
        className={`${props.recommended ? "btn-primary" : "border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-ink)] hover:bg-[var(--g-line)]"} mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-5 pt-0 text-sm font-bold transition-colors disabled:cursor-default disabled:opacity-70`}
      >
        {props.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {props.action}
      </button>
    </article>
  );
}

function Trust({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-1)] px-4 py-3 text-center text-xs font-medium text-[var(--g-sub)]">
      <span className="text-[var(--g-success)]">{icon}</span>
      {text}
    </div>
  );
}
function UseCase({
  title,
  text,
  plan,
  recommended,
}: {
  title: string;
  text: string;
  plan: string;
  recommended?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${recommended ? "border-[var(--g-accent-border)] bg-[var(--g-accent-soft)]" : "border-[var(--g-line)] bg-[var(--g-surface-1)]"}`}
    >
      <h3 className="font-bold text-[var(--g-ink)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--g-sub)]">{text}</p>
      <p className="mt-4 text-sm font-bold text-[var(--g-ink)]">Recomendado: {plan}</p>
    </article>
  );
}
