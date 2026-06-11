"use client";

import { Clock, Crown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpgrade } from "@/components/upgrade/upgrade-context";
import { useMe } from "@/hooks/use-me";
import { proDaysLeft } from "@/lib/plans/pro-period";

// Start nudging a week out - enough runway to renew before losing access.
const THRESHOLD_DAYS = 7;
const STORAGE_KEY = "grabix:pro-expiry-dismissed";

// Dismissal token ties to the pass end + the calendar day: dismissing hides the
// banner for the rest of the day, but it returns tomorrow (a gentle daily nudge
// through the final week) and resets entirely once the user renews (new end).
function dismissToken(periodEnd: string): string {
  return `${periodEnd}:${new Date().toDateString()}`;
}

function tone(days: number) {
  if (days <= 2) {
    return {
      bar: "border-[var(--g-danger-border)] bg-[var(--g-danger-bg)]",
      icon: "text-[var(--g-danger)]",
      strong: "text-[var(--g-danger)]",
    };
  }
  if (days <= 5) {
    return { bar: "border-amber-500/30 bg-amber-500/10", icon: "text-amber-400", strong: "text-amber-400" };
  }
  return {
    bar: "border-[var(--g-accent-border)] bg-[var(--g-accent-soft)]",
    icon: "text-[var(--g-gold)]",
    strong: "text-[var(--g-ink)]",
  };
}

// Slim banner shown to Pro users in the final week of their pass, recovering
// churn with a one-tap renew. Hidden for free users and lifetime grants.
export function ProExpiryBanner() {
  const { me } = useMe();
  const { open: openUpgrade } = useUpgrade();
  // Assume dismissed until the effect can read localStorage, so we never flash.
  const [dismissed, setDismissed] = useState(true);

  const periodEnd = me?.plan === "pro" ? (me.periodEnd ?? null) : null;
  const days = proDaysLeft(periodEnd);
  const shouldShow = days != null && days <= THRESHOLD_DAYS;

  useEffect(() => {
    if (!periodEnd || !shouldShow) return;
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === dismissToken(periodEnd));
    } catch {
      setDismissed(false);
    }
  }, [periodEnd, shouldShow]);

  if (!shouldShow || dismissed || !periodEnd || days == null) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, dismissToken(periodEnd as string));
    } catch {
      // Non-fatal: banner simply reappears on next load.
    }
  }

  const t = tone(days);
  const dayLabel = `${days} ${days === 1 ? "dia" : "dias"}`;

  return (
    <div className={`border-b ${t.bar}`} role="status">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-2.5 sm:px-8">
        <Clock className={`h-4 w-4 shrink-0 ${t.icon}`} />
        <p className="min-w-0 flex-1 text-sm text-[var(--g-sub)]">
          <span className={`font-semibold ${t.strong}`}>Seu Pro vence em {dayLabel}.</span>{" "}
          <span className="hidden sm:inline">Renove para não perder o acesso ilimitado.</span>
        </p>
        <button
          type="button"
          onClick={() => openUpgrade()}
          className="btn-primary inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold"
        >
          <Crown className="h-3.5 w-3.5 text-[var(--g-gold)]" />
          Renovar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dispensar aviso"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--g-muted)] transition-colors hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
