-- Migration: Backup & Restore Management System
-- Description: Tracking snapshots and audit logs for data security.

-- 1. Tabela de Backups
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE, -- NULL = Backup Global (Master)
    
    type VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- 'AUTO', 'MANUAL'
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SUCCESS', 'FAILED', 'RESTORING'
    
    storage_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    
    modules JSONB DEFAULT '[]', -- Grupos de dados incluídos (Finance, CRM, etc.)
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- 2. Tabela de Auditoria de Restauração
CREATE TABLE IF NOT EXISTS public.backup_restore_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_id UUID REFERENCES public.backups(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id),
    
    action VARCHAR(20) NOT NULL, -- 'RESTORE_TOTAL', 'RESTORE_PARTIAL'
    status VARCHAR(20) NOT NULL, -- 'SUCCESS', 'FAILED'
    details JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_restore_logs ENABLE ROW LEVEL SECURITY;

-- Políticas Backups
CREATE POLICY "Master admin see all backups" ON public.backups
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Company see own backups" ON public.backups
FOR SELECT USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

-- Políticas Logs
CREATE POLICY "Master admin see all restore logs" ON public.backup_restore_logs
FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Company see own restore logs" ON public.backup_restore_logs
FOR SELECT USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

-- 4. Bucket de Storage (Comando p/ Referência - deve ser criado via painel ou SQL Extension se habilitado)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);

-- 5. RPC para Restauração Segura (Atomic)
CREATE OR REPLACE FUNCTION public.rpc_restore_snapshot(
    p_company_id UUID,
    p_snapshot JSONB
) RETURNS JSONB AS $$
DECLARE
    v_table TEXT;
    v_rows JSONB;
    v_message TEXT;
BEGIN
    -- NOTA: O PostgreSQL não permite desabilitar FKs em sessões não-superuser facilmente
    -- Então vamos deletar e inserir na ordem correta de dependência.
    
    -- Exemplo para FINANCEIRO
    IF (p_snapshot ? 'transactions') THEN
        DELETE FROM public.transactions WHERE company_id = p_company_id;
        INSERT INTO public.transactions SELECT * FROM jsonb_populate_recordset(null::public.transactions, p_snapshot->'transactions');
    END IF;

    -- Adicionar mais tabelas conforme necessário seguindo a lógica de FKs
    -- Esta função pode ser expandida conforme a evolução do banco.

    RETURN jsonb_build_object('success', true, 'message', 'Restauração realizada com sucesso');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
