import { ArrowRight, Check, CircleHelp, ShieldCheck, Sparkles } from "lucide-react";
import { ConversionLink } from "@/components/landing/conversion-link";
import { SectionHeading } from "@/components/landing/section-heading";
import { benefits, faqs, painPoints, productHighlights, productSignals, steps, supportedFormats } from "@/data/landing";

export function LandingSections() {
  return (
    <div className="landing-sections">
      <section id="problema" className="section-shell grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="Sem caça ao arquivo"
          title="A mídia que você precisa não deveria se esconder na página."
          align="left"
        >
          Em vez de abrir abas, inspecionar elementos e salvar arquivos um por um, use uma análise que deixa tudo
          visível de uma vez.
        </SectionHeading>
        <ul className="grid gap-3">
          {painPoints.map((pain, index) => (
            <li key={pain} className="flex gap-4 rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fa7f6a]/10 text-xs font-bold text-[#ff9b8b]">
                0{index + 1}
              </span>
              <p className="pt-0.5 text-sm leading-6 text-[var(--g-sub)]">{pain}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="como-funciona" className="section-shell border-y border-[var(--g-line)] py-20">
        <SectionHeading eyebrow="Feito para ser simples" title="Da URL ao download em três passos.">
          Sem configuração complicada e sem precisar sair do navegador.
        </SectionHeading>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative overflow-hidden rounded-3xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6"
            >
              <span
                aria-hidden="true"
                className="absolute right-6 top-5 text-5xl font-semibold tracking-[-0.08em] text-white/[0.34]"
              >
                0{index + 1}
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--g-brand)]/10 text-[var(--g-brand-light)]">
                <step.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-[var(--g-ink)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--g-sub)]">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="produto" className="section-shell py-20">
        <SectionHeading eyebrow="Tudo no mesmo lugar" title="Uma forma mais clara de revisar o que encontrou.">
          O resultado chega organizado para você identificar, selecionar e baixar somente os arquivos certos.
        </SectionHeading>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
          {productHighlights.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm font-medium text-[var(--g-ink)]">
              <item.icon className="h-4 w-4 text-[var(--g-brand-light)]" />
              {item.text}
            </li>
          ))}
        </ul>
        <dl className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {productSignals.map((signal) => (
            <div
              key={signal.label}
              className="rounded-xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-5 text-center"
            >
              <dt className="text-xs text-[var(--g-muted)]">{signal.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--g-ink)]">{signal.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="beneficios" className="section-shell py-20">
        <SectionHeading eyebrow="Por que Grabix" title="Menos etapas entre encontrar e baixar.">
          Recursos diretos para quem precisa trabalhar com conteúdo público de forma mais organizada.
        </SectionHeading>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className="rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-6 transition-colors hover:border-[var(--g-line-hover)]"
            >
              <benefit.icon className="h-5 w-5 text-[var(--g-brand-light)]" />
              <h3 className="mt-5 font-semibold tracking-[-0.02em] text-[var(--g-ink)]">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--g-sub)]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="confianca" className="section-shell py-12">
        <div className="rounded-3xl border border-[var(--g-brand)]/25 bg-[var(--g-brand)]/[0.055] px-6 py-10 sm:px-10">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[var(--g-brand-light)]">
                Uso transparente
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">
                Você vê exatamente o que a ferramenta encontrou.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--g-sub)]">
                O Grabix trabalha apenas com HTML público. Não acessa conteúdo protegido por login nem tenta contornar
                DRM.
              </p>
            </div>
            <ShieldCheck className="h-12 w-12 text-[var(--g-brand-light)]" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section id="planos" className="section-shell py-20">
        <SectionHeading eyebrow="Comece no seu ritmo" title="Use grátis. Evolua quando a demanda crescer.">
          Comece com o essencial e escolha o Pro quando precisar de mais capacidade, downloads e análise aprofundada.
        </SectionHeading>
        <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-[var(--g-line)] bg-[var(--g-surface-1)] p-7">
            <p className="text-sm font-semibold text-[var(--g-ink)]">Grátis</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">R$ 0</p>
            <p className="mt-2 text-sm text-[var(--g-sub)]">Para testar o fluxo e usar dentro dos limites diários.</p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--g-sub)]">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-[var(--g-brand-light)]" />
                Análise de páginas públicas
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-[var(--g-brand-light)]" />
                Downloads individuais
              </li>
            </ul>
            <ConversionLink
              location="pricing_free"
              href="#comece"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[var(--g-line-hover)] text-sm font-bold text-[var(--g-ink)] hover:bg-[var(--g-surface-3)]"
            >
              Começar grátis
            </ConversionLink>
          </article>
          <article className="relative rounded-3xl border border-[var(--g-brand)]/45 bg-[#111d1c] p-7 shadow-[0_12px_40px_rgba(24,168,143,0.09)]">
            <span className="absolute right-6 top-6 rounded-full bg-[#3dd5b0] px-2.5 py-1 text-[10px] font-bold text-[#06241f]">
              RECOMENDADO
            </span>
            <p className="text-sm font-semibold text-[var(--g-brand-light)]">Grabix Pro</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--g-ink)]">Mais liberdade</p>
            <p className="mt-2 text-sm text-[var(--g-sub)]">
              Para quem precisa processar mais arquivos com menos limite.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[var(--g-sub)]">
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-[var(--g-brand-light)]" />
                Downloads diários ilimitados
              </li>
              <li className="flex gap-2">
                <Check className="h-4 w-4 text-[var(--g-brand-light)]" />
                Busca profunda e mais recursos
              </li>
            </ul>
            <ConversionLink
              location="pricing_pro"
              href="/pricing"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#3dd5b0] text-sm font-bold text-[#06241f] hover:bg-[#7cedd0]"
            >
              Ver detalhes do Pro
            </ConversionLink>
          </article>
        </div>
      </section>

      <section id="faq" className="section-shell py-20">
        <SectionHeading eyebrow="Sem letras miúdas" title="Perguntas frequentes" />
        <div className="mx-auto mt-10 max-w-3xl divide-y divide-[var(--g-line)] rounded-2xl border border-[var(--g-line)] bg-[var(--g-surface-1)] px-5 sm:px-7">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-sm font-semibold text-[var(--g-ink)]">
                {faq.question}
                <CircleHelp className="h-4 w-4 shrink-0 text-[var(--g-muted)] transition-transform group-open:rotate-45" />
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-6 text-[var(--g-sub)]">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="section-shell pb-24 pt-4">
        <div className="overflow-hidden rounded-[2rem] bg-[#3dd5b0] px-6 py-12 text-center sm:px-12 sm:py-16">
          <Sparkles className="mx-auto h-6 w-6 text-[#065649]" aria-hidden="true" />
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-[#06241f] sm:text-4xl">
            Transforme uma URL em uma galeria pronta para baixar.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#065649]">
            Comece grátis e veja em poucos segundos o que uma página pública tem para oferecer.
          </p>
          <ConversionLink
            location="final_cta"
            href="#comece"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-[#06241f] px-6 text-sm font-bold text-white hover:bg-[#0d3730]"
          >
            Experimentar o Grabix <ArrowRight className="h-4 w-4" />
          </ConversionLink>
          <p className="mt-5 text-[11px] font-medium text-[#065649]">Formatos comuns: {supportedFormats.join(" · ")}</p>
        </div>
      </section>
    </div>
  );
}
