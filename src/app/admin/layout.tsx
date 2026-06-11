import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email))) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <h1 className="mb-1 text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">Painel admin</h1>
      <p className="mb-5 text-sm text-[var(--g-muted)]">Gerencie usuários, planos, valores e assinaturas.</p>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </main>
  );
}
