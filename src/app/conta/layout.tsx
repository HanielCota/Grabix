import type { Metadata } from "next";
import { auth } from "@/auth";
import { CustomerShell } from "@/components/workspace/customer-shell";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Gerencie sua conta, plano e uso do Grabix.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return session?.user ? <CustomerShell>{children}</CustomerShell> : children;
}
