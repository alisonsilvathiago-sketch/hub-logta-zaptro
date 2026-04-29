# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository shape
- Monorepo sem workspace único; cada app tem seu próprio `package.json` e `package-lock.json`.
- Produtos principais:
  - `apps/logta`: frontend React/Vite do Logta SaaS (rotas ERP como `/logistica`, `/financeiro`, `/crm`).
  - `apps/zaptro`: frontend React/Vite do Zaptro (rotas curtas como `/inicio`, `/comercial`, `/clientes`).
  - `apps/zaptro/server`: API Node/Express para e-mails transacionais (SendGrid + fila).
  - `hub`: frontend React/Vite do painel master (`/master/*`).
  - `shared`: CSS/componentes compartilhados via alias `@shared`.

## Setup and common commands
Use os comandos a partir da raiz do repositório.

### Install dependencies
- `npm ci --prefix apps/logta`
- `npm ci --prefix apps/zaptro`
- `npm ci --prefix apps/zaptro/server`
- `npm ci --prefix hub`

### Run in development
- Logta frontend: `npm run dev --prefix apps/logta` (porta 5173)
- Zaptro frontend: `npm run dev --prefix apps/zaptro` (porta 5174)
- Zaptro mail API: `npm run dev --prefix apps/zaptro/server` (porta 8787)
- Hub frontend: `npm run dev --prefix hub` (porta 5175)

Para trabalhar no Zaptro completo (UI + envio de e-mail), rode frontend e `apps/zaptro/server` em paralelo.

### Build
- `npm run build --prefix apps/logta`
- `npm run build --prefix apps/zaptro`
- `npm run build --prefix apps/zaptro/server`
- `npm run build --prefix hub`

### Lint
- Zaptro frontend: `npm run lint --prefix apps/zaptro`
- `apps/logta` e `hub` não expõem script de lint em `package.json` no estado atual.

### Tests
- Não há suíte de testes automatizada configurada no repositório atualmente (sem Vitest/Jest/Playwright/Cypress configurados).
- Não existe comando de “single test” hoje porque não há runner de testes definido.

## Architecture overview
### Frontend bootstrapping pattern
- Os três frontends inicializam com `BrowserRouter` e providers de autenticação/tenant no `main.tsx`.
- Entrypoints principais:
  - `apps/logta/src/main.tsx` + `apps/logta/src/app.tsx`
  - `apps/zaptro/src/main.tsx` + `apps/zaptro/src/App.tsx`
  - `hub/src/main.tsx` + `hub/src/App.tsx`
- `apps/logta` e `apps/zaptro` injetam `__APP_RELEASE__` (via Vite `define`) para identificação de build no client.

### Routing and product boundaries
- `apps/logta` concentra o ERP/SaaS com shell autenticado (sidebar/header fixos) e módulos por domínio.
- `apps/zaptro` usa lazy loading amplo e guarda de permissão por rota (`ZaptroGuard`), além de comportamento por domínio/contexto (home/blog/support/checkout).
- `hub` é o painel master com árvore em `/master/*` para gestão de empresas, billing, segurança e infraestrutura.

### Supabase/auth model
- Cada app tem seu próprio `AuthContext`, mas o fluxo base é: `auth.getSession()` + carga de `profiles` + `onAuthStateChange`.
- `apps/logta/src/lib/supabase.ts` e `apps/zaptro/src/lib/supabase.ts` usam fallback de URL/chave e persistem sessão com `storageKey` compartilhado (`logta-auth-token`).
- `hub/src/core/lib/supabase-zaptro.ts` decide entre cliente Supabase dedicado do Zaptro ou fallback para cliente principal para evitar sessões divergentes quando o projeto Supabase é o mesmo.

### Zaptro mail API (backend)
- API em `apps/zaptro/server/src/index.ts` registra rotas em `routes/mailRoutes.ts`.
- Rotas principais:
  - `POST /v1/transactional`
  - `POST /v1/transactional/bulk`
  - `POST /v1/public/password-reset-notice`
  - `POST /v1/internal/raw`
  - `GET /health`
- Segurança e validação:
  - JWT Supabase para rotas autenticadas.
  - `zod` para validação de payload.
  - segredo interno via header `X-Zaptro-Internal-Secret` na rota raw.
- Fila de envio:
  - `createMailQueue` usa BullMQ + Redis quando `REDIS_URL` está disponível.
  - fallback automático para fila em memória com retry exponencial quando Redis/BullMQ não estiver disponível.
- O frontend consome essa API por `VITE_ZAPTRO_MAIL_API_URL` (`apps/zaptro/src/lib/zaptroMailApi.ts`).

### Vite aliases and shared code
- `@` aponta para `src` de cada app.
- `@shared` aponta para `shared` (ou `../shared` no `hub`).
- `hub` expõe aliases adicionais (`@core`, `@hub`) úteis para navegação e refactors internos.

### Notes that matter when editing
- Produto isolado é regra: `apps/logta`, `apps/zaptro` e `hub` não devem importar código de domínio uns dos outros; integrações entre produtos devem ocorrer por API/evento, não por import direto de arquivos.
- Há muitos arquivos `._*` (metadados do macOS); já estão ignorados no ESLint (`**/._*`), não trate como código real.
- Os READMEs dos apps (`apps/logta/README.md` e `apps/zaptro/README.md`) ainda são majoritariamente template do Vite e não descrevem a arquitetura real do monorepo.
