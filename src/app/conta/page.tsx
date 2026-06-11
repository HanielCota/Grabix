"use client";

import { Crown, Loader2, LogOut, TriangleAlert } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useUpgrade } from "@/components/upgrade/upgrade-context";
import { useMe } from "@/hooks/use-me";
import { usePricing } from "@/hooks/use-pricing";

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return null;
  }
}

const DAY_MS = 86_400_000;
// One-time Pro pass length (mirrors PRO_PASS_DURATION_MS on the server) — used as
// the bar's full span since we don't store the purchase date.
const PASS_MS = 31 * DAY_MS;

function proCountdown(periodEnd?: string | null): { days: number; pct: number } | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd).getTime();
  if (Number.isNaN(end)) return null;
  const remaining = end - Date.now();
  if (remaining <= 0) return null;
  return {
    days: Math.ceil(remaining / DAY_MS),
    // Keep a sliver visible while active; fraction of the pass still remaining.
    pct: Math.max(2, Math.min(100, (remaining / PASS_MS) * 100)),
  };
}

export default function ContaPage() {
  const { data: session, status } = useSession();
  const { me } = useMe();
  const { open: openUpgrade } = useUpgrade();
  const { proPriceLabel } = usePricing();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <main className="mx-auto flex max-w-2xl items-center justify-center px-5 py-20">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--g-sub)]" />
      </main>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <p className="text-base font-semibold text-[var(--g-ink)]">Entre para ver sua conta</p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/conta" })}
          className="btn-primary mx-auto mt-5 inline-flex h-11 items-center justify-center gap-2.5 rounded-xl px-6 text-sm font-semibold"
        >
          <GoogleIcon className="h-5 w-5" />
          Continuar com Google
        </button>
      </main>
    );
  }

  const user = session.user;
  const plan = me?.plan ?? "free";
  const isPro = plan === "pro";
  const proUntil = formatDate(me?.periodEnd);
  const countdown = proCountdown(me?.periodEnd);
  const barColor = !countdown
    ? "var(--g-gold)"
    : countdown.days <= 2
      ? "var(--g-danger)"
      : countdown.days <= 5
        ? "#f59e0b"
        : "var(--g-gold)";

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error?.message ?? "Não foi possível excluir a conta.");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Falha de conexão ao excluir a conta.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">Minha conta</h1>

      {/* ── Profile ── */}
      <section className="flex items-center gap-4 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-sm font-bold text-[var(--g-sub)]">
          {user.image ? (
            <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
          ) : (
            (user.name ?? user.email ?? "?").slice(0, 2).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[var(--g-ink)]">{user.name ?? "—"}</p>
          <p className="truncate text-sm text-[var(--g-muted)]">{user.email}</p>
          <p className="mt-0.5 text-xs text-[var(--g-muted)]">Perfil gerenciado pela sua conta Google.</p>
        </div>
      </section>

      {/* ── Plan & usage ── */}
      <section className="mt-4 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--g-sub)]">Plano</span>
              {isPro ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--g-ink)]">
                  <Crown size={10} className="text-[var(--g-gold)]" /> Pro
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--g-sub)]">
                  Free
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--g-sub)]">
              {isPro
                ? "Seu acesso Pro está ativo."
                : me?.usage?.limit != null
                  ? `${me.usage.used} de ${me.usage.limit} downloads usados hoje.`
                  : "Plano grátis."}
            </p>
          </div>
          <button
            type="button"
            onClick={openUpgrade}
            className="btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
          >
            <Crown className="h-4 w-4" />
            {isPro ? "Renovar Pro" : `Assinar Pro · ${proPriceLabel}`}
          </button>
        </div>

        {/* Tempo restante do passe Pro */}
        {isPro && countdown && (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--g-ink)]">
                {countdown.days === 1 ? "Falta 1 dia" : `Faltam ${countdown.days} dias`}
              </span>
              {proUntil && <span className="text-[var(--g-muted)]">até {proUntil}</span>}
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-[var(--g-surface-3)]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(countdown.pct)}
              aria-label="Tempo restante do plano Pro"
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${countdown.pct}%`, background: barColor }}
              />
            </div>
          </div>
        )}
      </section>

      {/* ── Session ── */}
      <section className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
        <div>
          <p className="text-sm font-semibold text-[var(--g-ink)]">Sessão</p>
          <p className="text-xs text-[var(--g-muted)]">Sair desta conta neste dispositivo.</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-4 text-sm font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)]"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </section>

      {/* ── Danger zone ── */}
      <section className="mt-4 rounded-2xl border border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] p-5">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--g-danger)]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--g-ink)]">Excluir conta</p>
            <p className="mt-1 text-sm text-[var(--g-sub)]">
              Remove permanentemente sua conta, assinatura e histórico. Esta ação não pode ser desfeita.
            </p>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--g-danger-border)] bg-transparent px-4 text-sm font-semibold text-[var(--g-danger)] transition-colors hover:bg-[rgba(248,113,113,0.12)]"
              >
                Excluir minha conta
              </button>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-[var(--g-ink)]">Tem certeza?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--g-danger)] px-4 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sim, excluir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="inline-flex h-9 items-center rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-4 text-sm font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)] disabled:opacity-60"
                >
                  Cancelar
                </button>
              </div>
            )}

            {error && <p className="mt-2 text-xs font-medium text-[var(--g-danger)]">{error}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
