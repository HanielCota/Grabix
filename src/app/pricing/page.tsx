import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Preços e planos - Grabix",
  description:
    "Compare o plano grátis e o Grabix Pro: mais itens por análise, downloads ilimitados, busca profunda e arquivos maiores. Pague uma vez por 30 dias de acesso via Pix ou cartão.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Preços e planos - Grabix",
    description:
      "Compare o plano grátis e o Grabix Pro: mais itens, downloads ilimitados e busca profunda. Pague uma vez por 30 dias.",
    url: "/pricing",
    siteName: "Grabix",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preços e planos - Grabix",
    description: "Compare o plano grátis e o Grabix Pro. Pague uma vez por 30 dias de acesso.",
  },
};

export default function Page() {
  return <PricingPage />;
}
