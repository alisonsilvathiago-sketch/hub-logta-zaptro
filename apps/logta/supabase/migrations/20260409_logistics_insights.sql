-- Tabela de Insights Logísticos (Base para IA Preditiva)
CREATE TABLE IF NOT EXISTS public.logistics_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  route_id TEXT, -- Vinculado à rota analisada
  driver_id TEXT, -- Vinculado ao motorista
  avg_delivery_time NUMERIC, -- Tempo médio em minutos
  fuel_efficiency NUMERIC, -- Eficiência em km/l
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  recommendation_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.logistics_insights ENABLE ROW LEVEL SECURITY;

-- Política de isolamento
CREATE POLICY "Company insights isolation" ON public.logistics_insights
FOR SELECT USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Inserir alguns mocks de IA para demonstração
/*
INSERT INTO public.logistics_insights (company_id, route_id, driver_id, avg_delivery_time, fuel_efficiency, risk_score, recommendation_text)
VALUES 
('sua-company-id', 'R-1024', 'D-55', 45, 3.2, 15, 'Eficiência acima da média. Rota otimizada.'),
('sua-company-id', 'R-1025', 'D-12', 140, 2.1, 75, 'Motorista com histórico de atraso nesta rota. Sugerimos revisão do cronograma.');
*/
