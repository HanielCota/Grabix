"use client";

import { Crown, Search, Shield } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback((query = "") => {
    setLoading(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]))
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
    <div className="space-y-4">
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

      {loading ? (
        <p className="text-sm text-[var(--g-muted)]">Carregando…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-[var(--g-muted)]">Nenhum usuário.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-4 sm:flex-row sm:items-center sm:justify-between"
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
                <p className="mt-0.5 text-xs text-[var(--g-muted)]">
                  {u.usageToday} download(s) hoje · status {u.subStatus ?? "-"}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
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
