-- ==============================================================================
-- LOGTA SAAS - AJUSTES NA TABELA DE FRETES (SINCRONIA COM FRONTEND)
-- ==============================================================================

DO $$ 
BEGIN
    -- 1. Adicionar numero_frete (ex: FR-1234)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='numero_frete') THEN
        ALTER TABLE public.fretes ADD COLUMN numero_frete TEXT;
    END IF;

    -- 2. Adicionar cliente_nome
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='cliente_nome') THEN
        ALTER TABLE public.fretes ADD COLUMN cliente_nome TEXT;
    END IF;

    -- 3. Adicionar valor_frete (migrando dados de 'valor' se existir)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='valor_frete') THEN
        ALTER TABLE public.fretes ADD COLUMN valor_frete DECIMAL(10,2) DEFAULT 0.00;
        -- Backup do valor antigo se existir
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='valor') THEN
            UPDATE public.fretes SET valor_frete = valor;
        END IF;
    END IF;

    -- 4. Adicionar tipo_carga
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='tipo_carga') THEN
        ALTER TABLE public.fretes ADD COLUMN tipo_carga TEXT DEFAULT 'Geral';
    END IF;

    -- 5. Adicionar colunas fiscais (cte e mdfe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='cte') THEN
        ALTER TABLE public.fretes ADD COLUMN cte TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='mdfe') THEN
        ALTER TABLE public.fretes ADD COLUMN mdfe TEXT;
    END IF;

    -- 6. Colunas Operacionais Adicionais
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='distancia_km') THEN
        ALTER TABLE public.fretes ADD COLUMN distancia_km DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='peso_kg') THEN
        ALTER TABLE public.fretes ADD COLUMN peso_kg DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='valor_pedagio') THEN
        ALTER TABLE public.fretes ADD COLUMN valor_pedagio DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fretes' AND column_name='valor_combustivel') THEN
        ALTER TABLE public.fretes ADD COLUMN valor_combustivel DECIMAL(10,2) DEFAULT 0.00;
    END IF;

END $$;
