import type { Metadata } from "next";
import { PricingPage } from "@/components/pricing/pricing-page";

const siteUrl = "https://grabix.app";

export const metadata: Metadata = {
  title: "Precos e planos para baixar imagens e videos",
  description:
    "Compare o plano gratis e o Grabix Pro para baixar imagens e videos de paginas publicas. Veja limites, busca profunda, downloads ilimitados e acesso por 30 dias.",
  alternates: { canonical: "/pricing" },
  keywords: [
    "preco Grabix",
    "Grabix Pro",
    "plano para baixar imagens",
    "plano para baixar videos",
    "downloads ilimitados",
    "busca profunda",
  ],
  openGraph: {
    title: "Precos e planos do Grabix",
    description:
      "Compare o plano gratis e o Grabix Pro: mais itens, downloads ilimitados, busca profunda e acesso por 30 dias.",
    url: "/pricing",
    siteName: "Grabix",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Precos e planos do Grabix",
    description: "Compare o plano gratis e o Grabix Pro para baixar imagens e videos de paginas publicas.",
  },
};

const pricingJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Grabix Pro",
    description:
      "Plano do Grabix para extrair mais imagens e videos de paginas publicas, com downloads ilimitados, busca profunda e arquivos maiores.",
    brand: { "@type": "Brand", name: "Grabix" },
    category: "MultimediaApplication",
    url: `${siteUrl}/pricing`,
    offers: {
      "@type": "Offer",
      name: "Acesso Grabix Pro por 30 dias",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Como funciona o pagamento do Grabix Pro?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Voce paga uma vez e libera o Grabix Pro por 30 dias. Nao ha cobranca recorrente automatica.",
        },
      },
      {
        "@type": "Question",
        name: "Quais formas de pagamento o Grabix aceita?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O pagamento do Grabix Pro pode ser feito por Pix ou cartao de credito via Mercado Pago.",
        },
      },
      {
        "@type": "Question",
        name: "Posso usar o Grabix de graca?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim. O plano gratis permite extrair e baixar midias todos os dias dentro dos limites do plano.",
        },
      },
    ],
  },
];

export default function Page() {
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(pricingJsonLd)}
      </script>
      <PricingPage />
    </>
  );
}
