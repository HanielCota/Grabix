import { ArrowDown, ArrowRight, CheckCircle2, Grab } from "lucide-react";
import type { Metadata } from "next";
import { ConversionLink } from "@/components/landing/conversion-link";
import { HomeExperience } from "@/components/landing/home-experience";
import { LandingSections } from "@/components/landing/landing-sections";
import { landingContent } from "@/data/landing";

export const metadata: Metadata = {
  title: "Grabix — encontre mídias públicas em uma URL",
  description: "Cole uma URL pública, encontre imagens e vídeos e baixe os arquivos certos em poucos passos.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Grabix — encontre mídias públicas em uma URL",
    description: "Uma forma mais clara de encontrar imagens e vídeos em páginas públicas.",
    url: "/",
    siteName: "Grabix",
    locale: "pt_BR",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Grabix",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  url: "https://grabix.app",
  description:
    "Ferramenta online para encontrar imagens e vídeos em páginas públicas e baixar os arquivos selecionados.",
};

export default function Home() {
  return (
    <main id="conteudo">
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>
      <section className="hero-shell relative overflow-hidden">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="section-shell relative z-10 max-w-4xl pb-24 pt-20 text-center lg:pb-32 lg:pt-28">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--g-brand)]/25 bg-[var(--g-brand)]/[0.08] px-3 py-1.5 text-xs font-semibold text-[var(--g-brand-light)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--g-brand-light)]" />
              {landingContent.eyebrow}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-[var(--g-ink)] sm:text-5xl lg:text-[3.7rem] lg:leading-[1.03]">
              {landingContent.headline}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[var(--g-sub)] sm:text-lg">
              {landingContent.description}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <ConversionLink
                location="hero_primary"
                href="#comece"
                ariaLabel="Experimentar o Grabix — hero"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--g-brand)] px-5 text-sm font-bold text-[#06241f] shadow-[0_10px_30px_rgba(48,199,170,0.2)] transition hover:bg-[var(--g-brand-light)]"
              >
                {landingContent.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </ConversionLink>
              <ConversionLink
                location="hero_secondary"
                href="#como-funciona"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-white/[0.025] px-5 text-sm font-bold text-[var(--g-ink)] hover:bg-[var(--g-surface-2)]"
              >
                {landingContent.secondaryCta}
                <ArrowDown className="h-4 w-4" />
              </ConversionLink>
            </div>
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--g-muted)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--g-brand-light)]" />
              Funciona com páginas que exibem conteúdo no HTML público.
            </p>
          </div>
        </div>
      </section>

      <section id="comece" className="section-shell scroll-mt-20 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--g-brand)]">Experimente agora</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">
            Cole uma URL e veja como funciona.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--g-sub)]">
            Crie sua conta gratuita para iniciar uma análise e organizar os arquivos encontrados.
          </p>
        </div>
        <HomeExperience />
      </section>

      <LandingSections />
      <footer className="border-t border-[var(--g-line)]">
        <div className="section-shell flex flex-col gap-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold text-[var(--g-ink)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--g-brand)] text-[#06241f]">
              <Grab className="h-4 w-4" />
            </span>
            Grabix
          </div>
          <p className="max-w-md text-xs leading-5 text-[var(--g-muted)]">
            Encontre e organize mídias disponíveis em páginas públicas. Use sempre respeitando direitos autorais e os
            termos de cada site.
          </p>
          <div className="flex gap-4 text-xs font-medium text-[var(--g-sub)]">
            <a href="/pricing" className="hover:text-[var(--g-ink)]">
              Planos
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
