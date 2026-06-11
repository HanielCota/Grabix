"use client";

import { Crown, Grab, LogOut } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useMe } from "@/hooks/use-me";
import { startCheckout } from "@/lib/billing/checkout";

function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-2 py-1 text-xs font-bold text-[var(--g-ink)]">
        <Crown className="h-3 w-3" /> Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-2 py-1 text-xs font-semibold text-[var(--g-sub)]">
      Free
    </span>
  );
}

export function SiteHeader() {
  const { status } = useSession();
  const { me } = useMe();
  const plan = me?.plan ?? "free";
  const [busy, setBusy] = useState(false);

  async function handleUpgrade() {
    setBusy(true);
    try {
      await startCheckout();
    } catch {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--g-line)] bg-[var(--g-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-[var(--g-ink)]">
          <Grab className="h-5 w-5" strokeWidth={1.75} />
          Grabix
        </a>

        <div className="flex items-center gap-2">
          {status === "authenticated" && (
            <>
              <PlanBadge plan={plan} />
              {plan === "free" && (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={busy}
                  className="btn-primary inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold disabled:opacity-60"
                >
                  <Crown className="h-3.5 w-3.5" />
                  {busy ? "Abrindo..." : "Assinar Pro"}
                </button>
              )}
              <button
                type="button"
                onClick={() => signOut()}
                aria-label="Sair"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)] transition-all hover:bg-[var(--g-line)] hover:text-[var(--g-ink)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          )}

          {status === "unauthenticated" && (
            <button
              type="button"
              onClick={() => signIn("google")}
              className="btn-primary inline-flex h-8 items-center rounded-lg px-4 text-xs font-bold"
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
