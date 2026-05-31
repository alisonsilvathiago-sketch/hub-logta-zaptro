# Segurança LogStoka (WMS)

## Princípios

1. **Autenticado por padrão** — rotas `/app/*` exigem login + entitlement LogStoka.
2. **RBAC por colaborador** — `src/lib/permissions.ts` define o que cada perfil vê e faz.
3. **Dados sensíveis nunca públicos** — custo, faturamento e APIs autenticadas não aparecem em `/shared/:token`.
4. **Compartilhamento explícito** — link público só com snapshot sanitizado, prazo e revogação.

## Perfis

| Perfil | Financeiro | Configurações | Compartilhar link |
|--------|------------|---------------|-------------------|
| Administrador | Sim | Sim | Sim |
| Gestor logístico | Sim | Leitura | Sim |
| Operador | **Não** | **Não** | **Não** |

Operadores: movimentações, picking, inventário operacional — sem vendas, relatórios financeiros ou integrações.

## Link público (`/shared/:token`)

- Token criptográfico (`stk-` + UUID).
- **Obrigatório** snapshot congelado (`buildPublicShareSnapshot`).
- Remove: `cost`, `sale_price`, `company_id`, tokens, documentos.
- Quantidades só em permissões `view_comment` / `view_approve`.
- Expiração máxima 7 dias · limite de visitas · revogação manual.
- Sem sincronização ao vivo com Supabase.

## Implementação no código

- Guard de rota: `LogstokaGuard.tsx`
- Gate de UI: `PermissionGate.tsx`
- Valores monetários: `LogstokaMoneyValue` + `LogstokaSecurityProvider`
- Compartilhamento: `secureSharing.ts`, `lib/security/shareSnapshot.ts`

## Produção (obrigatório no backend)

- **Supabase RLS** por `company_id` em todas as tabelas.
- API `logstokaApi` apenas com JWT válido.
- HTTPS em `app.logstoka.com.br` e `api.logstoka.com.br`.
- Não commitar `.env` com chaves reais.
