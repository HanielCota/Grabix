"use client";

import { Check, Crown } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useMe } from "@/hooks/use-me";
import { usePlans } from "@/hooks/use-plans";
import { usePricing } from "@/hooks/use-pricing";
import { benefitText, getProBenefits } from "@/lib/plans/benefits";
import { useUpgrade } from "./upgrade-context";

// Always-visible "what's in Pro" block on the home page, so non-subscribers see
// the value up front instead of having to open the upgrade modal first. Hidden
// for Pro users (nothing to sell).
export function ProUpsell() {
  const { status } = useSession();
  const { me } = useMe();
  const { proPriceLabel } = usePricing();
  const { plans } = usePlans();
  const { open: openUpgrade } = useUpgrade();

  if (me?.plan === "pro") return null;

  const authed = status === "authenticated";
  const handleCta = () => (authed ? openUpgrade() : signIn("google", { callbackUrl: "/" }));
  const benefits = plans ? getProBenefits(plans) : [];

  return (
    <section
      aria-labelledby="pro-upsell-title"
      className="mt-10 rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-surface-1)] p-6 sm:p-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] text-[var(--g-ink)]">
            <Crown className="h-5 w-5 text-[var(--g-gold)]" />
          </span>
          <div>
            <h2 id="pro-upsell-title" className="text-lg font-bold tracking-[-0.02em] text-[var(--g-ink)]">
              O que vem no Grabix Pro
            </h2>
            <p className="text-sm text-[var(--g-sub)]">
              Tudo do plano grátis, sem limites -{" "}
              <span className="font-semibold text-[var(--g-ink)]">{proPriceLabel}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCta}
          className="btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
        >
          <Crown className="h-4 w-4 text-[var(--g-gold)]" />
          {authed ? "Assinar Pro" : "Entrar para assinar"}
        </button>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {benefits.map((b) => (
          <li key={b.label} className="flex items-start gap-2.5 text-sm text-[var(--g-sub)]">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--g-accent-soft)] text-[var(--g-ink)]">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {benefitText(b)}
          </li>
        ))}
      </ul>
    </section>
  );
}
