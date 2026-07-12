"use client";

import { CheckCircle2, Clock3, Crown, Loader2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { trackConversion } from "@/lib/analytics";
import { takeCheckoutContext } from "@/lib/billing/checkout";

type View = "checking" | "success" | "pending" | "failed";

function safePath(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export default function BillingReturnPage() {
  return (
    <Suspense fallback={<ReturnLoading />}>
      <BillingReturnContent />
    </Suspense>
  );
}

function BillingReturnContent() {
  const search = useSearchParams();
  const [view, setView] = useState<View>("checking");
  const context = useMemo(() => takeCheckoutContext(), []);
  const returnTo = safePath(search.get("returnTo") ?? context.returnTo);
  const providerStatus = search.get("status") ?? search.get("collection_status");

  useEffect(() => {
    if (providerStatus === "rejected" || providerStatus === "failure" || providerStatus === "cancelled") {
      setView("failed");
      trackConversion("checkout_failed", { plan: "pro", provider_status: providerStatus });
      return;
    }
    if (providerStatus === "pending" || providerStatus === "in_process") {
      setView("pending");
      return;
    }

    let attempts = 0;
    const check = async () => {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const me = await response.json();
        if (me.plan === "pro") {
          setView("success");
          trackConversion("checkout_completed", { plan: "pro", upgrade_reason: context.reason });
          trackConversion("subscription_activated", { plan: "pro" });
          return true;
        }
      } catch {
        // The retry below covers a transient connection or webhook delay.
      }
      return false;
    };
    void check().then((active) => {
      if (active) return;
      const timer = window.setInterval(async () => {
        attempts += 1;
        if ((await check()) || attempts >= 8) {
          window.clearInterval(timer);
          if (attempts >= 8) setView("pending");
        }
      }, 2_000);
      return () => window.clearInterval(timer);
    });
  }, [context.reason, providerStatus]);

  const content = {
    checking: {
      icon: <Loader2 className="h-8 w-8 animate-spin text-[var(--g-brand-light)]" />,
      title: "Confirmando seu pagamento",
      text: "Estamos atualizando seu acesso Pro. Isso costuma levar apenas alguns instantes.",
    },
    success: {
      icon: <CheckCircle2 className="h-8 w-8 text-[var(--g-success)]" />,
      title: "Seu Grabix Pro está ativo",
      text: "Os limites ampliados já foram liberados. Você pode continuar de onde parou.",
    },
    pending: {
      icon: <Clock3 className="h-8 w-8 text-amber-400" />,
      title: "Pagamento em processamento",
      text: "Assim que o Mercado Pago confirmar o pagamento, seu acesso Pro será liberado. Atualize esta página em alguns minutos.",
    },
    failed: {
      icon: <TriangleAlert className="h-8 w-8 text-[var(--g-danger)]" />,
      title: "Não foi possível concluir o pagamento",
      text: "Nenhuma cobrança foi confirmada. Você pode tentar novamente ou escolher outra forma de pagamento no Mercado Pago.",
    },
  }[view];

  return (
    <main id="conteudo" className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-12">
      <section className="w-full rounded-3xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-7 text-center sm:p-10">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--g-surface-3)]">
          {content.icon}
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--g-ink)]">{content.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--g-sub)]">{content.text}</p>
        {view === "success" ? (
          <p className="mt-5 rounded-xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-4 py-3 text-sm font-medium text-[var(--g-ink)]">
            Pro por 30 dias · pagamento único · sem renovação automática
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={returnTo}
            className="btn-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
          >
            <Crown className="h-4 w-4 text-[var(--g-gold)]" />
            {view === "success" ? "Continuar meu trabalho" : "Voltar ao Grabix"}
          </Link>
          {view !== "checking" ? (
            <Link
              href="/upgrade"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-5 text-sm font-semibold text-[var(--g-ink)]"
            >
              Ver plano e pagamento
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ReturnLoading() {
  return (
    <main id="conteudo" className="mx-auto flex min-h-[70vh] max-w-xl items-center px-5 py-12">
      <div className="w-full rounded-3xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-10 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--g-brand-light)]" />
        <p className="mt-4 text-sm text-[var(--g-sub)]">Preparando o status do pagamento…</p>
      </div>
    </main>
  );
}
