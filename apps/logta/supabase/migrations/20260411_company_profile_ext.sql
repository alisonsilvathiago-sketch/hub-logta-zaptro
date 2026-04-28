-- Adicionando campos financeiros e corporativos à tabela de empresas
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_agency TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS segment TEXT;

-- Garantir que o perfil tenha metadados para telefone e endereço secundário se necessário
-- (Profiles já usam metadata JSONB por padrão em algumas partes do sistema)
