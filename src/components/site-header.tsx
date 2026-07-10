"use client";

import { Crown, FileQuestion, Grab, LayoutDashboard, Menu, ScanSearch, Tag, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { AccountMenu } from "@/components/account-menu";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useUpgrade } from "@/components/upgrade/upgrade-context";
import { useMe } from "@/hooks/use-me";
import { usePricing } from "@/hooks/use-pricing";
import { trackConversion } from "@/lib/analytics";

// Shared between the desktop bar and the mobile sheet so navigation never drifts.
// Hash links jump to home-page sections from any route.
const NAV_LINKS = [
  { href: "/#como-funciona", label: "Como funciona", icon: ScanSearch },
  { href: "/#beneficios", label: "Recursos", icon: FileQuestion },
  { href: "/pricing", label: "Preços", icon: Tag },
] as const;

function isActive(pathname: string, href: string): boolean {
  return !href.includes("#") && pathname === href;
}

function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  if (plan === "pro") {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--g-accent-border)] bg-[var(--g-accent-soft)] px-2 py-1 text-xs font-bold text-[var(--g-ink)]">
        <Crown className="h-3 w-3 text-[var(--g-gold)]" /> Pro
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-2 py-1 text-xs font-semibold text-[var(--g-sub)]">
      Free
    </span>
  );
}

function UsagePill({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const cls =
    remaining === 0
      ? "border-[var(--g-danger-border)] bg-[var(--g-danger-bg)] text-[var(--g-danger)]"
      : remaining <= 5
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : "border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)]";
  return (
    <span
      title={`${used} de ${limit} downloads usados hoje`}
      className={`inline-flex items-center rounded-lg border px-2 py-1 text-xs font-semibold tabular-nums ${cls}`}
    >
      {used}/{limit}
      <span className="hidden sm:inline">&nbsp;hoje</span>
    </span>
  );
}

// Skeleton placeholders while the session resolves, so the bar doesn't flash
// empty then pop the auth controls in (layout shift).
function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="hidden h-7 w-14 animate-pulse rounded-lg bg-[var(--g-surface-3)] sm:block" />
      <span className="h-9 w-9 animate-pulse rounded-full bg-[var(--g-surface-3)]" />
    </div>
  );
}

// Mobile-only sheet (hamburger) holding the site nav links and, for free users,
// the daily-quota line. Account actions stay in the avatar menu.
function MobileNav({ pathname, freeUsage }: { pathname: string; freeUsage: { used: number; limit: number } | null }) {
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

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)] transition-colors hover:bg-[var(--g-line)] hover:text-[var(--g-ink)]"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-1)] shadow-2xl"
        >
          {freeUsage && (
            <div className="border-b border-[var(--g-line)] px-4 py-3">
              <p className="text-xs text-[var(--g-muted)]">Downloads hoje</p>
              <p className="text-sm font-semibold tabular-nums text-[var(--g-ink)]">
                {freeUsage.used} de {freeUsage.limit}
              </p>
            </div>
          )}
          <div className="p-1.5">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--g-surface-3)] text-[var(--g-ink)]"
                      : "text-[var(--g-sub)] hover:bg-[var(--g-surface-3)] hover:text-[var(--g-ink)]"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { status } = useSession();
  const { me } = useMe();
  const plan = me?.plan ?? "free";
  const { open: openUpgrade } = useUpgrade();
  const { proPriceLabel } = usePricing();
  const pathname = usePathname();

  const isFree = plan === "free";
  const freeUsage = isFree && me?.usage?.limit != null ? { used: me.usage.used, limit: me.usage.limit } : null;

  if (pathname.startsWith("/admin") || (status === "authenticated" && (pathname === "/" || pathname === "/conta")))
    return null;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--g-line)] bg-[var(--g-bg)]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        {/* ── Brand ── */}
        <Link href="/" className="group inline-flex shrink-0 items-center gap-2.5" aria-label="Grabix - início">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] text-[var(--g-ink)] transition-colors group-hover:border-[var(--g-accent-border)]">
            <Grab className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <span className="text-base font-bold tracking-[-0.01em] text-[var(--g-ink)]">Grabix</span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[var(--g-surface-3)] text-[var(--g-ink)]"
                    : "text-[var(--g-sub)] hover:bg-[var(--g-surface-2)] hover:text-[var(--g-ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Auth / actions ── */}
        <div className="flex items-center gap-2">
          {status === "loading" && <AuthSkeleton />}

          {status === "authenticated" && (
            <>
              {me?.isAdmin && (
                <Link
                  href="/admin"
                  title="Painel admin"
                  className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] text-[var(--g-sub)] transition-all hover:bg-[var(--g-line)] hover:text-[var(--g-ink)] sm:inline-flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              )}
              {freeUsage && (
                <span className="hidden sm:inline-flex">
                  <UsagePill used={freeUsage.used} limit={freeUsage.limit} />
                </span>
              )}
              <PlanBadge plan={plan} />
              {isFree && (
                <button
                  type="button"
                  onClick={() => openUpgrade()}
                  className="btn-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold"
                >
                  <Crown className="h-3.5 w-3.5 text-[var(--g-gold)]" />
                  Assinar Pro
                  <span className="hidden font-semibold text-[var(--g-accent-text)]/65 sm:inline">
                    · {proPriceLabel}
                  </span>
                </button>
              )}
              <AccountMenu />
              <MobileNav pathname={pathname} freeUsage={freeUsage} />
            </>
          )}

          {status === "unauthenticated" && (
            <>
              {pathname !== "/sign-in" && (
                <button
                  type="button"
                  onClick={() => {
                    trackConversion("sign_in_start", { location: "header" });
                    signIn("google");
                  }}
                  className="btn-primary inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-bold"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Começar grátis
                </button>
              )}
              <MobileNav pathname={pathname} freeUsage={null} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
