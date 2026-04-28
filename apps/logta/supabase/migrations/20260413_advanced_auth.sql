-- Migration: Advanced Authentication & Security (Logta Shield)
-- Description: Multi-factor authentication foundation and security auditing.

-- 1. Extensões no Perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT,
ADD COLUMN IF NOT EXISTS security_settings JSONB DEFAULT '{"require_mfa": false, "session_timeout_min": 30}';

-- 2. Tabela de Códigos de Verificação (OTP)
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) DEFAULT '2FA_LOGIN', -- '2FA_LOGIN', 'PASSWORD_RESET'
    
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Auditoria de Segurança
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    
    event VARCHAR(50) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAIL', '2FA_REQUIRED', '2FA_SUCCESS', '2FA_FAIL', 'LOGOUT', 'PASSWORD_CHANGE'
    ip_address TEXT,
    user_agent TEXT,
    location JSONB DEFAULT '{}',
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS e Segurança
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Usuários só veem seus próprios códigos (embora sejam validados via Edge Function/RPC)
CREATE POLICY "Users see own codes" ON public.verification_codes
FOR SELECT USING (auth.uid() = user_id);

-- Master vê todos os logs; Empresas veem apenas seus logs
CREATE POLICY "Master admin see all security logs" ON public.security_audit_logs
FOR SELECT USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'MASTER_ADMIN' );

CREATE POLICY "Company admin see own security logs" ON public.security_audit_logs
FOR SELECT USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

-- 5. Função para Bloqueio de Força Bruta (Draft lógico)
CREATE OR REPLACE FUNCTION public.check_brute_force_block(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_fail_count INTEGER;
BEGIN
    SELECT count(*) INTO v_fail_count
    FROM public.security_audit_logs
    WHERE profile_id = p_user_id 
      AND (event = 'LOGIN_FAIL' OR event = '2FA_FAIL')
      AND created_at > NOW() - INTERVAL '15 minutes';
      
    RETURN v_fail_count < 10; -- Bloqueia se houver 10 ou mais falhas em 15 min
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
