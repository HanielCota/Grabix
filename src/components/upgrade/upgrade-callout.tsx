"use client";

import { Crown, X } from "lucide-react";
import { motion } from "motion/react";
import { usePricing } from "@/hooks/use-pricing";

interface UpgradeCalloutProps {
  title?: string;
  message: string;
  onUpgrade: () => void;
  onDismiss?: () => void;
}

// Friendly "you hit a Pro limit" state — accent-colored, not an error.
export function UpgradeCallout({ title = "Recurso do plano Pro", message, onUpgrade, onDismiss }: UpgradeCalloutProps) {
  const { proPriceLabel } = usePricing();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      role="status"
      className="rounded-2xl border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] text-[var(--g-ink)]">
          <Crown className="h-5 w-5 text-[var(--g-gold)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--g-ink)]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--g-sub)]">{message}</p>
          <button
            type="button"
            onClick={onUpgrade}
            className="btn-primary mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
          >
            <Crown size={15} />
            Assinar Pro · {proPriceLabel}
          </button>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-[var(--g-muted)] transition-colors hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
