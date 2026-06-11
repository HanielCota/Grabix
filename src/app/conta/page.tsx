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
                ? proUntil
                  ? `Acesso Pro ativo até ${proUntil}.`
                  : "Acesso Pro ativo."
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
