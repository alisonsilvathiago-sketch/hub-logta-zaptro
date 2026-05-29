# Auditoria de Segurança e Performance — Ecossistema Logta

**Data:** 2026-05-16  
**Escopo:** Hub Master (`hub/`), Logta SaaS (`apps/logta-saas/`), Zaptro (`apps/zaptro/`), LogDock (`apps/logdock/`)

Este documento consolida o que **já existia**, o que foi **corrigido nesta rodada** e o que **ainda requer ação manual** (deploy Supabase, secrets, infra).

---

## Resumo executivo

| Camada | Status | Observação |
|--------|--------|------------|
| RLS Logta | ✅ Forte | `empresa_id` + `auth.empresa_id()` nas migrations |
| RLS LogDock | ✅ Forte | `company_id` + storage policies |
| RLS Zaptro | ⚠️ Misto | Scripts dev permissivos; migration de produção adicionada |
| RBAC Zaptro | ✅ | `ZaptroGuard` + `permissions` em `profiles` |
| RBAC Logta | ✅ Melhorado | `LogtaAuthGate` + `logtaPermissions.ts` |
| RBAC Hub | ✅ | `MasterLayout` + roles MASTER |
| Auth Logta | ✅ Corrigido | Gate de sessão + `empresa_id` obrigatório |
| API Zaptro | ✅ | JWT + Zod + secret interno + rate limit global |
| Headers HTTP | ✅ Melhorado | `vercel.json` hub + logta; root já tinha CSP |
| Anti-indexação | ✅ Melhorado | `robots.txt` + `X-Robots-Tag` em apps privados |
| Performance Hub | ✅ Melhorado | Lazy loading de rotas master |
| Performance Zaptro | ✅ Já existia | Lazy loading amplo em `App.tsx` |

---

## 1. Multi-tenant

### Já existia
- **Logta:** `empresa_id` em tabelas + triggers `set_empresa_id()` + políticas RLS (`apps/logta-saas/supabase/migrations/`).
- **Zaptro / LogDock / Hub:** `company_id` em `profiles` e queries client-side.
- **LogDock:** `get_user_company()` na migration `20260501000000_logdock_security_foundation.sql`.

### Implementado / corrigido
- `shared/security/tenant.ts` — helpers `assertTenantMatch`, `getTenantId`.
- **Logta:** `LogtaAuthGate` bloqueia acesso sem sessão e sem `empresa_id`.
- **Zaptro:** `validateTenantAccess` agora **fail-closed** (erro = bloqueio).

### Pendente (manual)
- Middleware Express/Edge com validação de tenant em **todas** as APIs (logta `server.js` aberto, rotas públicas de logística Zaptro).
- Unificar nomenclatura `empresa_id` vs `company_id` no schema master (evitar drift).

---

## 2. RBAC

### Já existia
- Zaptro: `ZaptroGuard`, `zaptroPermissions.ts`, mapa por página.
- Hub: roles em `MasterLayout`, `PermissionGate` em `shared/`.
- Logta: colunas `nivel_acesso`, `permissoes_json` (migration 004).

### Implementado
- `apps/logta-saas/src/lib/logtaPermissions.ts` — papéis admin, gerente, operador, financeiro, suporte, cliente, leitura.
- `LogtaAuthGate` — checagem de módulo por rota (`canAccessLogtaPath`).

### Pendente
- Conectar UI `Permissoes.tsx` ao Supabase (`perfis.permissoes_json`) em vez de `localStorage`.
- Usar `PermissionGate` no Hub onde fizer sentido (hoje só MasterLayout).

---

## 3. RLS (PostgreSQL / Supabase)

### Validar em produção
```bash
# Aplicar migrations por app no projeto Supabase correto
apps/logta-saas/supabase/migrations/*.sql
apps/logdock/supabase/migrations/*.sql
apps/zaptro/supabase/migrations/*.sql
master_schema.sql  # hub / cross-product
```

### Nova migration Zaptro
- `apps/zaptro/supabase/migrations/20260516000000_tighten_profiles_rls.sql` — substitui políticas dev em `profiles`.

**⚠️** Não aplicar scripts `schema-zaptro-minimal.sql` em produção (políticas `USING (true)`).

---

## 4. APIs

| API | Auth | Rate limit | Validação |
|-----|------|------------|-----------|
| zaptro/server | JWT + internal secret | ✅ Global 120 req/min + reset público | Zod (mail) |
| logta-saas/server | ❌ stub / calendar aberto | ❌ | ❌ |
| hub edge (hub-core) | API key / webhook | ❌ | parcial |

**Ação recomendada:** proteger `logta-saas/server/server.js` (Google Calendar) com auth; revisar `logisticsPublicRoutes.ts`.

---

## 5. Segurança web

### Implementado
- Headers em `hub/vercel.json`, `apps/logta-saas/vercel.json`.
- `shared/security/vercelHeaders.ts` — referência para novos deploys.
- CSP sem `unsafe-eval`; `connect-src` restrito a Supabase (ajustar se usar APIs extras).

### Já existia
- Root `vercel.json` com CSP (tinha IP hardcoded e `unsafe-eval` — preferir configs por app).

### Pendente
- DOMPurify para HTML renderizado de usuários.
- Revisar `master_bypass` + token na URL (`shared/context/AuthContext.tsx`) — risco se vazar.
- CSRF: baixo risco com Bearer JWT; cookies SSO exigem CSP forte.

---

## 6. Storage

### Já existia
- LogDock: bucket `logdock` com RLS em `storage.objects`.
- Signed URLs em `logDockLibrary.ts`, `UnifiedFileUploader.tsx`.

### Pendente
- Auditar usos de `getPublicUrl` (avatars, comprovantes) — preferir signed URLs em dados sensíveis.
- Documentar buckets privados no dashboard Supabase.

---

## 7. Criptografia e sessão

### Já existia
- HTTPS via Vercel; PKCE + `autoRefreshToken` em `shared/lib/supabase.ts`.
- Cookie compartilhado `.logta.com.br` / `.zaptro.com.br` (SSO).

### Recomendações
- Nunca commitar `.env`; rotacionar `X-Zaptro-Internal-Secret`.
- Encryption at rest: responsabilidade Supabase/cloud provider.

---

## 8. Logs e auditoria

### Já existia
- `master_audit_logs`, `hub_notificacoes`, `security_logs` (edge), `audit_logs` (logdock/zaptro).

### Implementado
- `shared/security/audit.ts` — `recordSecurityAudit()` com fallback entre tabelas.

### Pendente
- Padronizar um schema de auditoria por produto.
- Registrar `login` / `login_failed` nos fluxos de auth.

---

## 9. Performance

### Implementado nesta rodada
- **Hub:** `React.lazy` + `Suspense` em rotas `/master/*` (~2.7MB → chunks menores no primeiro paint).

### Já existia
- **Zaptro:** lazy loading extensivo.

### Recomendado (próximas sprints)
- Lazy loading **Logta** (`App.tsx` importa todas as páginas).
- Dividir `logdock/App.tsx` (~6400 linhas).
- Virtualização em listas grandes; debounce em buscas.
- Índices DB: `empresa_id`, `company_id`, `created_at` nas tabelas de alto volume.

---

## 10. Anti-indexação (Google)

- `robots.txt` em hub, logta-saas, logdock.
- Header `X-Robots-Tag: noindex` em apps autenticados (vercel).
- Rotas públicas intencionais: checkout, rastreamento, combustível (hub) — mantidas em `Allow`.

---

## Arquivos criados / alterados (esta entrega)

```
shared/security/          # roles, tenant, audit, vercelHeaders
apps/logta-saas/src/components/LogtaAuthGate.tsx
apps/logta-saas/src/lib/logtaPermissions.ts
apps/zaptro/server/src/middleware/globalRateLimit.ts
apps/zaptro/supabase/migrations/20260516000000_tighten_profiles_rls.sql
hub/src/App.tsx           # lazy routes
hub/vercel.json, apps/logta-saas/vercel.json
**/public/robots.txt
apps/zaptro/src/lib/accessControl.ts  # fail-closed
```

---

## Checklist de deploy

- [ ] Aplicar migrations Supabase (logta, logdock, zaptro, master)
- [ ] Confirmar RLS ativo: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] Variáveis de ambiente em Vercel (sem vazamento no client além de anon key)
- [ ] Testar login Logta → rotas bloqueadas sem sessão
- [ ] Testar Zaptro tenant bloqueado / assinatura inativa
- [ ] Lighthouse + bundle analyzer no Hub após lazy load

---

*Mantido alinhado ao monorepo `hub-logta-zaptro`. Atualize este arquivo a cada mudança de segurança relevante.*
