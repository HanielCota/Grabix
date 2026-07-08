import type { Metadata } from "next";

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

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
