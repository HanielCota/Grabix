"use client";

import { CreditCard, LayoutDashboard, SlidersHorizontal, Users } from "lucide-react";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/plans", label: "Planos & preço", icon: SlidersHorizontal },
  { href: "/admin/subscriptions", label: "Assinaturas", icon: CreditCard },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        const Icon = l.icon;
        return (
          <a
            key={l.href}
            href={l.href}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] text-[var(--g-ink)]"
                : "border-[var(--g-line)] bg-[var(--g-surface-2)] text-[var(--g-sub)] hover:text-[var(--g-ink)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
