# Grabix Design System

Base reutilizável da interface do Grabix. Ele preserva a identidade escura, técnica e discreta do produto: contraste alto, superfícies em camadas e a cor menta reservada para marca e estados de destaque.

## Conteúdo

- `src/design-system/tokens.css`: cores, raios, sombra e preferência de movimento.
- `src/design-system/components.tsx`: `Button`, `Card`, `Badge`, `TextInput`, `SectionHeading`, `Alert` e `EmptyState`.
- `src/design-system/index.ts`: ponto único de importação para componentes.

## Como levar para outro projeto

1. Copie a pasta `src/design-system` e importe `tokens.css` no CSS global do projeto.
2. Caso use Tailwind, os componentes podem ser usados diretamente. Sem Tailwind, mantenha os tokens e reimplemente as classes utilitárias no estilo da aplicação de destino.
3. Importe somente o que for necessário:

```tsx
import { Badge, Button, Card, SectionHeading, TextInput } from "@/design-system";

export function Example() {
  return (
    <Card className="p-6">
      <Badge tone="brand">Novo</Badge>
      <SectionHeading align="left" title="Comece agora" description="Uma interface coerente desde o primeiro ecrã." />
      <TextInput className="mt-6" placeholder="Seu e-mail" type="email" />
      <Button className="mt-3">Criar conta</Button>
    </Card>
  );
}
```

## Princípios de uso

| Elemento | Diretriz |
| --- | --- |
| Fundo | `--g-bg` é o plano principal; evite branco puro em áreas grandes. |
| Superfícies | Use `surface-1` para cartões, `surface-2` para agrupamentos e `surface-3` para controles ativos. |
| Texto | `ink` para conteúdo principal, `sub` para apoio e `muted` para informação secundária. |
| Marca | `brand` é menta e deve sinalizar contexto, não substituir a ação principal. |
| Ação principal | Use `Button` primário: neutro claro, para manter hierarquia e legibilidade. |
| Estados | `success`, `warning` e `danger` são semânticos; nunca use-os apenas como decoração. |

## Escala visual

- Raios: 8 px (`sm`), 12 px (`md`) e 16 px (`lg`).
- Controles: 32 px (`sm`), 40 px (`md`) e 48 px (`lg`).
- Títulos de seção: 30 px no mobile e 36 px a partir de `sm`.
- Espaçamento recomendado: múltiplos de 4 px; cartões geralmente usam 20 px ou 24 px.

## Acessibilidade

Mantenha foco visível, texto com contraste alto e botões com rótulo claro. Para avisos, use `Alert`, que já expõe `role="alert"`; para botões apenas com ícone, forneça `aria-label`.
