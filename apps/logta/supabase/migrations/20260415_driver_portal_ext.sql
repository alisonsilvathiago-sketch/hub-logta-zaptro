-- Migration: Driver Portal Support
-- Description: Extends shipments and routes for mobile execution.

-- 1. Ampliando Shipments para Prova de Entrega (POD)
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS pod_signature_url TEXT,
ADD COLUMN IF NOT EXISTS pod_images TEXT[] DEFAULT '{}', -- Array de URLs para múltiplas fotos
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_lat NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_lng NUMERIC;

-- 2. Garantir que o Bucket de Storage exista (configuração lógica)
-- Nota: Buckets são criados via Console ou SQL se houver extensões, mas aqui documentamos a necessidade.

-- 3. RLS para Motorista Atualizar sua Própria Entrega
CREATE POLICY "Drivers can update shipments assigned to them" ON public.shipments
FOR UPDATE USING (
    id IN (
        SELECT s.id FROM public.shipments s
        JOIN public.routes r ON s.route_id = r.id
        WHERE r.driver_id = auth.uid()
    )
);

-- 4. Ínside Routes: Facilitar busca
CREATE INDEX IF NOT EXISTS idx_shipments_route_id ON public.shipments(route_id);
