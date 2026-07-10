import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdmin } from "@/server/admin";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || !(await isAdmin(session.user.id, session.user.email))) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[var(--g-bg)] lg:pl-64">
      <AdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
    </main>
  );
}
