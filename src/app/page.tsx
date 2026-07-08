import { Grab } from "lucide-react";
import type { Metadata } from "next";
import { HomeExperience } from "@/components/landing/home-experience";
import { LandingSections } from "@/components/landing/landing-sections";

const siteUrl = "https://grabix.app";

export const metadata: Metadata = {
  title: "Grabix - Baixar imagens e videos de paginas publicas",
  description:
    "Use o Grabix para extrair imagens e videos de paginas publicas pela URL. Encontre midias, baixe arquivos individuais ou gere um ZIP em poucos segundos.",
  alternates: { canonical: "/" },
  keywords: [
    "baixar imagens de site",
    "baixar videos de site",
    "extrair imagens de URL",
    "extrair videos de URL",
    "download de midias",
    "Grabix",
  ],
  openGraph: {
    title: "Grabix - Baixar imagens e videos de paginas publicas",
    description: "Cole uma URL publica, encontre imagens e videos e baixe um por um ou tudo em ZIP.",
    url: "/",
    siteName: "Grabix",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grabix - Baixar imagens e videos de paginas publicas",
    description: "Cole uma URL publica, encontre imagens e videos e baixe um por um ou tudo em ZIP.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Grabix",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Ferramenta online para extrair imagens e videos de paginas publicas pela URL e baixar os arquivos individualmente ou em ZIP.",
    offers: [
      { "@type": "Offer", name: "Grabix Gratis", price: "0", priceCurrency: "BRL" },
      { "@type": "Offer", name: "Grabix Pro", priceCurrency: "BRL" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "O Grabix e gratuito?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sim. O plano gratis permite extrair e baixar midias todos os dias dentro dos limites. O Pro libera mais itens, downloads ilimitados e busca profunda.",
        },
      },
      {
        "@type": "Question",
        name: "Que tipos de arquivo o Grabix baixa?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "O Grabix baixa imagens JPG, PNG, WebP, GIF e SVG, alem de videos MP4, WebM, MOV e streams HLS/DASH quando estao disponiveis em HTML publico.",
        },
      },
      {
        "@type": "Question",
        name: "O Grabix funciona em qualquer site?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Funciona em paginas com HTML publico. O Grabix nao acessa conteudo atras de login nem quebra protecoes de DRM.",
        },
      },
    ],
  },
];

export default function Home() {
  return (
    <main id="conteudo" className="mx-auto max-w-3xl px-5 pt-12 pb-10 sm:px-8 sm:pt-20">
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>

      <header className="mb-10 overflow-hidden text-center sm:mb-14">
        <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)]">
          <Grab className="h-10 w-10 text-[var(--g-ink)]" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold text-[var(--g-ink)] sm:text-4xl">GRABIX</h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--g-sub)] sm:text-lg">
          Baixe imagens e videos de paginas publicas pela URL. O Grabix encontra fotos, galerias, arquivos de video e
          streams no HTML aberto para baixar um arquivo por vez ou tudo em ZIP.
        </p>
      </header>

      <HomeExperience />
      <LandingSections />

      <footer className="mt-16 border-t border-[var(--g-line)] pt-5 text-center text-sm leading-relaxed text-[var(--g-muted)]">
        <p>Só lê o HTML público. Não pula login, não quebra DRM, não faz mágica.</p>
        <p className="mt-1 text-xs">v1.0.0</p>
      </footer>
    </main>
  );
}
