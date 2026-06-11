"use client";

import { Check, Crown, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { usePricing } from "@/hooks/use-pricing";
import { startCheckout } from "@/lib/billing/checkout";
import { benefitText, PRO_BENEFITS } from "@/lib/plans/benefits";

function splitPrice(label: string): { amount: string; period: string } {
  const idx = label.indexOf("/");
  if (idx === -1) return { amount: label.trim(), period: "" };
  return { amount: label.slice(0, idx).trim(), period: label.slice(idx + 1).trim() };
}

export function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { proPriceLabel } = usePricing();
  const { amount, period } = splitPrice(proPriceLabel);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Assinar o Grabix Pro"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] p-7 shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[var(--g-muted)] transition-colors hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)]">
              <Crown className="h-6 w-6 text-[var(--g-ink)]" />
            </div>
            <h2 className="text-xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">Grabix Pro</h2>

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-[var(--g-ink)]">{amount}</span>
              {period && <span className="text-sm font-medium text-[var(--g-sub)]">/{period}</span>}
            </div>

            {/* Benefits */}
            <ul className="mt-5 space-y-2.5">
              {PRO_BENEFITS.map((b) => (
                <li key={b.label} className="flex items-start gap-2.5 text-sm text-[var(--g-sub)]">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--g-accent-soft)] text-[var(--g-ink)]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {benefitText(b)}
                </li>
              ))}
            </ul>

            {error && <p className="mt-4 text-xs font-medium text-[var(--g-danger)]">{error}</p>}

            {/* CTA */}
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={busy}
              className="btn-primary mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Abrindo checkout...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  Assinar por {amount}
                  {period && `/${period}`}
                </>
              )}
            </button>

            <p className="mt-3 text-center text-xs text-[var(--g-muted)]">
              Pagamento via Mercado Pago. Cancele quando quiser.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
