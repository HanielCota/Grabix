"use client";

import { LayoutDashboard, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { useMe } from "@/hooks/use-me";

function initials(name?: string | null, email?: string | null): string {
  const src = (name ?? email ?? "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--g-sub)] transition-colors hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]";

// Avatar button + dropdown with the user's identity and account actions.
export function AccountMenu() {
  const { data: session } = useSession();
  const { me } = useMe();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const user = session?.user;
  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Sua conta"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-xs font-bold text-[var(--g-sub)] transition-colors hover:border-[var(--g-accent-border)] hover:text-[var(--g-ink)]"
      >
        {user.image ? (
          <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          initials(user.name, user.email)
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] shadow-2xl"
        >
          <div className="border-b border-[var(--g-line)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{user.name ?? "Sua conta"}</p>
            {user.email && <p className="truncate text-xs text-[var(--g-muted)]">{user.email}</p>}
          </div>
          <div className="p-1.5">
            <a href="/conta" role="menuitem" className={MENU_ITEM} onClick={() => setOpen(false)}>
              <Settings className="h-4 w-4" />
              Minha conta
            </a>
            {me?.isAdmin && (
              <a href="/admin" role="menuitem" className={MENU_ITEM} onClick={() => setOpen(false)}>
                <LayoutDashboard className="h-4 w-4" />
                Painel admin
              </a>
            )}
            <button type="button" role="menuitem" onClick={() => signOut()} className={MENU_ITEM}>
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
