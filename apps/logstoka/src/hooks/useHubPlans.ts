import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type HubPlan = {
  id: string;
  name: string;
  price_monthly?: number;
  description?: string;
  features?: string[];
};

const FALLBACK_PLANS: HubPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 297,
    description: 'Operação essencial para lojas em crescimento.',
    features: ['1 depósito', 'Importação CSV/XML', 'Dashboard operacional', 'Suporte por e-mail'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 597,
    description: 'Multicanal com IA e integrações.',
    features: ['Multi depósitos', 'OCR + Llama 3.2', 'Webhooks marketplaces', 'Inventário inteligente'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 0,
    description: 'Volume alto e SLA dedicado.',
    features: ['Multi empresas', 'API ilimitada', 'Success manager', 'Ambiente dedicado'],
  },
];

export function useHubPlans() {
  const [plans, setPlans] = useState<HubPlan[]>(FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase.from('plans').select('id, name, price_monthly, description, features').limit(6);
        if (!error && data?.length) {
          setPlans(
            data.map((p) => ({
              id: String(p.id),
              name: String(p.name ?? 'Plano'),
              price_monthly: Number(p.price_monthly ?? 0),
              description: typeof p.description === 'string' ? p.description : undefined,
              features: Array.isArray(p.features) ? (p.features as string[]) : undefined,
            })),
          );
        }
      } catch {
        /* fallback */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { plans, loading };
}
