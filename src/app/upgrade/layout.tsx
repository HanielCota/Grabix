import type { Metadata } from "next";
import { auth } from "@/auth";
import { CustomerShell } from "@/components/workspace/customer-shell";

export const metadata: Metadata = { title: "Upgrade para Pro", robots: { index: false, follow: false } };

export default async function UpgradeLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return session?.user ? <CustomerShell>{children}</CustomerShell> : children;
}
