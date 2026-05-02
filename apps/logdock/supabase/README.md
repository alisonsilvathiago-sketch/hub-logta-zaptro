# Supabase Infrastructure - LogDock

Esta pasta contém as migrações e configurações do Supabase para o LogDock.

## Como aplicar as migrações

### Opção 1: Via Supabase CLI (Recomendado)
Se você tem o Supabase CLI instalado, execute:
```bash
supabase link --project-ref rrjnkmgkhbtapumgmhhr
supabase db push
```

### Opção 2: Manual (Dashboard)
1. Copie o conteúdo do arquivo em `migrations/20260501000000_logdock_security_foundation.sql`.
2. Vá para o seu [Supabase Dashboard](https://supabase.com/dashboard).
3. Selecione o projeto `LogDock`.
4. Vá em **SQL Editor** -> **New Query**.
5. Cole o código e clique em **Run**.

## Estrutura de Segurança Implementada
- **Auditoria**: Logs automáticos de todas as ações em arquivos e pastas.
- **Isolação de Tenant**: RLS (Row Level Security) garantindo que empresas não vejam dados umas das outras.
- **Storage Seguro**: Acesso ao bucket restrito por ID de empresa.
- **MFA Ready**: Funções preparadas para exigir autenticação em dois fatores.
