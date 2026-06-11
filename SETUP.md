# Grabix — Setup de Planos (Free / Pro)

O Grabix agora exige **login** e tem dois planos: **Free** e **Pro** (assinatura
mensal via Hotmart). Este guia cobre o que provisionar para rodar.

## Visão geral

| Plano | Limites |
|-------|---------|
| **Free** | 10 arquivos/análise · 50 MB/arquivo · ZIP até 100 MB · 2 simultâneos · 20 downloads/dia · sem busca profunda / JS rendering / vídeo protegido |
| **Pro**  | 200 arquivos · 100 MB/arquivo · ZIP até 500 MB · 8 simultâneos · downloads ilimitados · todos os recursos |

Ajuste os números em `src/server/plans.ts`.

## 1. Banco de dados (Postgres)

Qualquer Postgres serve (Neon, Supabase, Railway, local).

```bash
# .env.local
DATABASE_URL="postgres://user:password@host:5432/grabix"

# aplicar o schema (8 tabelas)
npx drizzle-kit migrate     # usa as migrações em ./drizzle
# ou, em dev:
npx drizzle-kit push
```

## 2. Auth.js / Google OAuth

```bash
# segredo de sessão
npx auth secret              # grava AUTH_SECRET no .env

# Google: https://console.cloud.google.com/apis/credentials
#   Tipo: OAuth client ID → Web application
#   Redirect URI: https://SEU_DOMINIO/api/auth/callback/google
#   (dev: http://localhost:3000/api/auth/callback/google)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
# Em produção (fora da Vercel): AUTH_URL="https://grabix.app"
```

## 3. Hotmart (cobrança)

1. Crie o produto/assinatura **mensal** no Hotmart e pegue a URL pública de checkout.
2. Em **Ferramentas → Webhook (Postback)**, aponte para:
   `https://SEU_DOMINIO/api/webhooks/hotmart` e copie o **Hottok**.
3. Configure:

```bash
HOTMART_HOTTOK="seu-hottok"
NEXT_PUBLIC_HOTMART_CHECKOUT_URL="https://pay.hotmart.com/XXXXXXX"
NEXT_PUBLIC_PRO_PRICE_LABEL="R$ 19,90/mês"
```

### Como o webhook funciona

- Valida o header `X-HOTMART-HOTTOK` (rejeita o resto).
- É **idempotente** (ignora eventos repetidos pelo `id`).
- Casa o pagamento ao usuário **pelo e-mail**. Eventos `PURCHASE_APPROVED` /
  `PURCHASE_COMPLETE` liberam o Pro; `REFUNDED` / `CHARGEBACK` / `EXPIRED`
  revogam; `SUBSCRIPTION_CANCELLATION` mantém acesso até o fim do período pago.
- ⚠️ **E-mail é o elo.** Se o usuário pagar com e-mail diferente do login, o
  webhook grava um *entitlement pendente* e o Pro é concedido no próximo login
  com aquele e-mail. O botão "Assinar Pro" já pré-preenche o e-mail da sessão no
  checkout para evitar isso.

## 4. Rodar

```bash
npm install
npm run db:migrate
npm run dev
```

Sem `DATABASE_URL`/`AUTH_*` o app sobe, mas login e operações falham — todas as
4 rotas de API exigem usuário autenticado.
