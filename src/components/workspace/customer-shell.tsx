"use client";

import { CircleHelp, Download, FileSearch, Menu, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { trackConversion } from "@/lib/analytics";

const navigation = [
  { href: "/", label: "Extrair mídias", icon: FileSearch },
  { href: "/conta", label: "Minha conta", icon: Settings },
] as const;

const pageMeta: Record<string, { title: string; description: string }> = {
  "/": { title: "Extrair mídias", description: "Analise uma página pública e baixe os arquivos que precisar." },
  "/conta": { title: "Minha conta", description: "Gerencie seu perfil, plano e limite de downloads." },
};

function navClass(active: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
    active
      ? "bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]"
      : "text-[var(--g-sub)] hover:bg-[var(--g-surface-2)] hover:text-[var(--g-ink)]"
  }`;
}

function WorkspaceLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1" aria-label="Área do cliente">
      {navigation.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} onClick={onNavigate} className={navClass(pathname === href)}>
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--g-brand)] text-[#06241f]">
        <Download className="h-4 w-4" />
      </span>
      <span>
        <strong className="block text-sm text-[var(--g-ink)]">Grabix</strong>
        <small className="text-xs text-[var(--g-muted)]">Seu espaço</small>
      </span>
    </Link>
  );
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const page = pageMeta[pathname] ?? pageMeta["/"];

  useEffect(() => {
    trackConversion("workspace_view", { page: pathname });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[var(--g-bg)] lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-[var(--g-line)] bg-[var(--g-bg)] px-3 py-5 lg:flex lg:flex-col">
        <div className="px-3">
          <Brand />
        </div>
        <div className="mt-10">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--g-muted)]">Workspace</p>
          <WorkspaceLinks />
        </div>
        <div className="mt-auto rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-3">
          <Sparkles className="h-4 w-4 text-[var(--g-brand-light)]" />
          <p className="mt-3 text-xs font-semibold text-[var(--g-ink)]">Precisa de mais capacidade?</p>
          <p className="mt-1 text-xs leading-5 text-[var(--g-muted)]">
            O Pro libera mais arquivos e downloads sem limite diário.
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex text-xs font-bold text-[var(--g-brand-light)] hover:text-[var(--g-ink)]"
          >
            Conhecer o Pro
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-[var(--g-line)] bg-[var(--g-bg)]/90 px-4 backdrop-blur sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] text-[var(--g-ink)] lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--g-ink)]">{page.title}</p>
            <p className="hidden truncate text-xs text-[var(--g-muted)] sm:block">{page.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/#faq"
            title="Ajuda"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--g-sub)] hover:bg-[var(--g-surface-2)] hover:text-[var(--g-ink)]"
          >
            <CircleHelp className="h-4 w-4" />
          </Link>
          <AccountMenu />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <aside className="relative flex h-full w-72 flex-col bg-[var(--g-bg)] px-4 py-6 shadow-2xl">
            <div className="mb-9 flex items-center justify-between">
              <Brand onNavigate={() => setMenuOpen(false)} />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
                className="text-[var(--g-sub)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WorkspaceLinks onNavigate={() => setMenuOpen(false)} />
            <Link
              href="/#faq"
              onClick={() => setMenuOpen(false)}
              className="mt-6 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[var(--g-sub)] hover:bg-[var(--g-surface-2)] hover:text-[var(--g-ink)]"
            >
              <CircleHelp className="h-4 w-4" />
              Ajuda e perguntas frequentes
            </Link>
            <div className="mt-auto rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-4">
              <p className="text-sm font-semibold text-[var(--g-ink)]">Aproveite melhor o Grabix</p>
              <p className="mt-1 text-xs leading-5 text-[var(--g-muted)]">
                Suba para Pro quando precisar de mais capacidade.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
