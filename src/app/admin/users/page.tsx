"use client";

import { Crown, Search, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingRows,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/components/admin/ui";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  createdAt: string;
  plan: "free" | "pro";
  subStatus: string | null;
  usageToday: number;
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((query = "") => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {
        setUsers([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function act(id: string, action: "grantPro" | "revokePro" | "setAdmin", value?: boolean) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      load(q);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuários"
        description="Busque usuários e gerencie acessos administrativos ou o plano Pro."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
        className="flex items-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] px-3 py-2"
      >
        <Search className="h-4 w-4 text-[var(--g-muted)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          className="min-w-0 flex-1 bg-transparent text-sm text-[var(--g-ink)] placeholder:text-[var(--g-muted)] focus:outline-none"
        />
      </form>

      {error ? <AdminErrorState message="Não foi possível carregar os usuários." onRetry={() => load(q)} /> : null}
      {loading ? (
        <AdminLoadingRows />
      ) : users.length === 0 ? (
        <AdminEmptyState
          title="Nenhum usuário encontrado"
          description="Tente outro nome ou endereço de e-mail para refinar a busca."
        />
      ) : (
        <AdminCard className="overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_0.7fr_0.75fr_auto] gap-4 border-b border-[var(--g-line)] bg-[var(--g-surface-2)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--g-muted)] md:grid">
            <span>Usuário</span>
            <span>Plano</span>
            <span>Atividade</span>
            <span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-[var(--g-line)]">
            {users.map((u) => (
              <div
                key={u.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.6fr)_0.7fr_0.75fr_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{u.name ?? "-"}</p>
                    {u.plan === "pro" && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--g-ink)]">
                        <Crown size={10} className="text-[var(--g-gold)]" /> Pro
                      </span>
                    )}
                    {u.isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--g-sub)]">
                        <Shield size={10} /> Admin
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-[var(--g-muted)]">{u.email}</p>
                </div>

                <div className="md:hidden">
                  <AdminStatusBadge status={u.plan} />
                </div>
                <div className="hidden md:block">
                  <AdminStatusBadge status={u.plan} />
                </div>
                <div className="text-xs text-[var(--g-muted)]">
                  {u.usageToday} download(s) hoje
                  <br />
                  <span className="text-[10px]">{u.subStatus ?? "Sem assinatura"}</span>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                  {u.plan === "pro" ? (
                    <ActionButton disabled={busyId === u.id} onClick={() => act(u.id, "revokePro")}>
                      Remover Pro
                    </ActionButton>
                  ) : (
                    <ActionButton disabled={busyId === u.id} onClick={() => act(u.id, "grantPro")}>
                      Dar Pro
                    </ActionButton>
                  )}
                  <ActionButton disabled={busyId === u.id} onClick={() => act(u.id, "setAdmin", !u.isAdmin)}>
                    {u.isAdmin ? "Remover admin" : "Tornar admin"}
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 items-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-3 text-xs font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
