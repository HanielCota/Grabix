# Grabix — Setup de Planos (Free / Pro)

O Grabix agora exige **login** e tem dois planos: **Free** e **Pro** (assinatura
mensal via Mercado Pago). Este guia cobre o que provisionar para rodar.

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

## 3. Mercado Pago (cobrança)

A assinatura é criada **por usuário via API** (não há link estático). O botão
"Assinar Pro" chama `/api/billing/subscribe`, que cria um *preapproval* mensal
com `external_reference = userId` e redireciona o usuário para o checkout do MP.

1. No painel do Mercado Pago → **Suas integrações** → crie uma aplicação e copie
   o **Access Token** (use o de **teste** em dev).
2. Em **Webhooks**, registre a URL `https://SEU_DOMINIO/api/webhooks/mercadopago`,
   assine os tópicos **`subscription_preapproval`** e
   **`subscription_authorized_payment`**, e copie a **Secret key** (assinatura).
3. Configure:

```bash
MP_ACCESS_TOKEN="APP_USR-... (ou TEST-...)"
MP_WEBHOOK_SECRET="sua-secret-key"
MP_PRO_AMOUNT="19.90"
NEXT_PUBLIC_PRO_PRICE_LABEL="R$ 19,90/mês"
```

### Como funciona

- O webhook valida o header **`x-signature`** (HMAC-SHA256 com a `MP_WEBHOOK_SECRET`)
  e é **idempotente** (dedupe pelo `x-request-id`).
- Ao receber um evento, **consulta a API do MP** pelo id e lê o `status` e o
  `external_reference` (= o `userId`). `authorized` libera o Pro; `cancelled`
  mantém acesso até o fim do período pago; `paused` suspende.
- ✅ **Casamento robusto por `userId`** (não por e-mail), porque a assinatura é
  criada já vinculada ao usuário logado. Há fallback por e-mail + *entitlement
  pendente* caso o `external_reference` não venha.
- Em teste, pague com uma **conta de comprador de teste** (diferente da conta
  vendedora) — o MP retorna `sandbox_init_point` com credenciais de teste.

## 4. Rodar

```bash
npm install
npm run db:migrate
npm run dev
```

Sem `DATABASE_URL`/`AUTH_*` o app sobe, mas login e operações falham — todas as
4 rotas de API exigem usuário autenticado.
