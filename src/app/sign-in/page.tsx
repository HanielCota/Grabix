import type { Metadata } from "next";
import { SignInPageClient } from "@/components/auth/sign-in-page-client";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Grabix com sua conta Google para extrair e baixar midias de paginas publicas.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SignInPage() {
  return <SignInPageClient />;
}
