import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  BadgeCheck,
  FileArchive,
  FolderSearch,
  Link2,
  LockKeyhole,
  MousePointer2,
  ScanSearch,
  Sparkles,
  Zap,
} from "lucide-react";

export const landingContent = {
  eyebrow: "Extração de mídia, sem instalar nada",
  headline: "Encontre todas as mídias de uma página em uma única análise.",
  description:
    "Cole uma URL pública e o Grabix organiza imagens, vídeos e arquivos disponíveis para você baixar no formato que precisar.",
  primaryCta: "Experimentar o Grabix",
  secondaryCta: "Ver como funciona",
};

export const painPoints = [
  "Salvar arquivos um a um e perder tempo alternando entre abas.",
  "Não saber onde estão as imagens e os vídeos de uma página.",
  "Receber downloads sem organização e precisar revisar tudo depois.",
] as const;

export const steps: ReadonlyArray<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: Link2,
    title: "Cole uma URL",
    description: "Use o link de qualquer página que esteja publicamente disponível.",
  },
  {
    icon: ScanSearch,
    title: "Veja tudo encontrado",
    description: "O Grabix lê o HTML aberto e separa cada mídia para você revisar.",
  },
  {
    icon: ArrowDownToLine,
    title: "Baixe do seu jeito",
    description: "Escolha arquivos individuais ou reúna a seleção em um ZIP.",
  },
];

export const benefits: ReadonlyArray<{ icon: LucideIcon; title: string; description: string }> = [
  {
    icon: FolderSearch,
    title: "Visão organizada",
    description: "Revise imagens e vídeos em uma galeria clara antes de baixar.",
  },
  {
    icon: FileArchive,
    title: "ZIP pronto",
    description: "Agrupe o que importa em um download único e bem mais prático.",
  },
  {
    icon: Zap,
    title: "Menos trabalho manual",
    description: "Troque a busca repetitiva por uma análise rápida de uma URL.",
  },
  {
    icon: LockKeyhole,
    title: "Limites transparentes",
    description: "O Grabix trabalha apenas com o conteúdo público que o navegador já pode ler.",
  },
  {
    icon: MousePointer2,
    title: "No navegador",
    description: "Nada para instalar: comece no computador ou no celular.",
  },
  {
    icon: BadgeCheck,
    title: "Feito para revisar",
    description: "Escolha o que faz sentido antes de colocar os arquivos no seu dispositivo.",
  },
];

export const faqs = [
  {
    question: "O Grabix é gratuito?",
    answer:
      "Sim. Você pode começar no plano grátis, dentro dos limites de uso. O Pro libera mais capacidade e recursos avançados.",
  },
  {
    question: "Preciso instalar alguma coisa?",
    answer: "Não. O Grabix funciona diretamente no navegador: basta colar uma URL pública.",
  },
  {
    question: "Funciona no celular?",
    answer: "Sim. A experiência foi desenhada para você analisar links e iniciar downloads também em telas menores.",
  },
  {
    question: "O Grabix acessa páginas privadas?",
    answer: "Não. Ele lê somente o HTML público da página e não contorna logins, paywalls ou proteções DRM.",
  },
  {
    question: "Posso cancelar o Pro quando quiser?",
    answer:
      "O Pro é um acesso avulso de 30 dias, sem renovação automática. Ao fim do período, sua conta volta ao plano Grátis.",
  },
] as const;

export const supportedFormats = ["JPG", "PNG", "WEBP", "GIF", "MP4", "WEBM", "HLS"] as const;

export const productSignals = [
  { label: "Página analisada", value: "exemplo.com/colecao" },
  { label: "Encontrados", value: "Imagens e vídeos prontos para revisar" },
] as const;

export const productHighlights = [
  { icon: Sparkles, text: "Escolha o que vale baixar" },
  { icon: FileArchive, text: "Gere um ZIP quando precisar" },
] as const;
