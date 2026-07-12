import type { Metadata } from "next";

export const metadata: Metadata = { title: "Status do pagamento", robots: { index: false, follow: false } };

export default function BillingReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
