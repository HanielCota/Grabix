import { Download, Globe, LayoutGrid, Link, Package, ScanSearch, Shield, Video } from "lucide-react";
import { PlanComparisonTable } from "@/components/pricing/plan-comparison-table";

// Content sections for the landing page: explain the flow, build trust on what
// works, lay out Free × Pro, and answer common questions. All static/native
// markup (no client hooks), shown only on the pre-extraction home view.

const STEPS = [
  {
    icon: Link,
    title: "Cole a URL",
    body: "Cole o link de qualquer página pública - um post, uma galeria ou uma loja.",
  },
  {
    icon: ScanSearch,
    title: "O Grabix varre a página",
    body: "Em segundos ele lê o HTML e lista todas as imagens e vídeos encontrados.",
  },
  {
    icon: Download,
    title: "Baixe como quiser",
    body: "Um arquivo por vez ou tudo de uma vez em um ZIP organizado.",
  },
];

const SITES = [
  { icon: LayoutGrid, label: "Galerias e portfólios" },
  { icon: Package, label: "Lojas e páginas de produto" },
  { icon: Globe, label: "Blogs e portais de notícias" },
  { icon: Video, label: "Streams de vídeo (HLS/DASH)" },
];

const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "O Grabix é gratuito?",
    a: "Sim. O plano grátis deixa você extrair e baixar mídias todos os dias, dentro dos limites. O Pro libera mais itens, downloads ilimitados e busca profunda.",
  },
  {
    q: "Que tipos de arquivo ele baixa?",
    a: "Imagens (JPG, PNG, WebP, GIF, SVG) e vídeos (MP4, WebM, MOV e streams HLS/DASH, entre outros formatos).",
  },
  {
    q: "Funciona em qualquer site?",
    a: "Em qualquer página com HTML público. O Grabix não acessa conteúdo atrás de login nem quebra proteções de DRM.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. Tudo roda no navegador - cole a URL e pronto.",
  },
  {
    q: "É seguro e legal usar?",
    a: "O Grabix só lê o HTML público da página, como o seu navegador faz. Respeite os direitos autorais e os termos de cada site ao usar o conteúdo.",
  },
];

export function LandingSections() {
  return (
    <>
      {/* ── Como funciona ── */}
      <section id="como-funciona" aria-labelledby="como-funciona-title" className="mt-16">
        <div className="text-center">
          <h2 id="como-funciona-title" className="text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">
            Como funciona
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--g-sub)]">Da URL ao download em três passos.</p>
        </div>
        <ol className="mt-7 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6"
            >
              <span className="absolute right-5 top-5 text-3xl font-extrabold tabular-nums text-[var(--g-surface-3)]">
                {i + 1}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] text-[var(--g-ink)]">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold tracking-[-0.01em] text-[var(--g-ink)]">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--g-sub)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Sites suportados ── */}
      <section id="sites-suportados" aria-labelledby="sites-title" className="mt-16">
        <div className="text-center">
          <h2 id="sites-title" className="text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">
            Funciona em qualquer página pública
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--g-sub)]">
            Se o conteúdo está aberto no HTML, o Grabix encontra. Alguns exemplos:
          </p>
        </div>
        <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SITES.map((site) => (
            <li
              key={site.label}
              className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 text-center"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-2)] text-[var(--g-sub)]">
                <site.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-[var(--g-ink)]">{site.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-[var(--g-muted)]">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          Não acessa conteúdo atrás de login nem quebra DRM - só lê o que é público.
        </p>
      </section>

      {/* ── Comparativo Free × Pro ── */}
      <section id="comparativo" aria-labelledby="comparativo-title" className="mt-16">
        <div className="text-center">
          <h2 id="comparativo-title" className="text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">
            Grátis ou Pro
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--g-sub)]">
            Comece sem custo. Suba para o Pro quando precisar de mais.
          </p>
        </div>
        <div className="mt-7">
          <PlanComparisonTable />
        </div>
        <div className="mt-5 text-center">
          <a
            href="/pricing"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--g-line-hover)] bg-[var(--g-surface-3)] px-5 text-sm font-semibold text-[var(--g-ink)] transition-colors hover:bg-[var(--g-line)]"
          >
            Ver planos e preços
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" aria-labelledby="faq-title" className="mt-16">
        <div className="text-center">
          <h2 id="faq-title" className="text-2xl font-bold tracking-[-0.02em] text-[var(--g-ink)]">
            Perguntas frequentes
          </h2>
        </div>
        <div className="mx-auto mt-7 max-w-2xl space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--g-ink)] marker:content-['']">
                {item.q}
                <span className="text-[var(--g-muted)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[var(--g-sub)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
