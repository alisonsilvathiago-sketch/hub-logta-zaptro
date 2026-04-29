import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import LogtaPageView from '../../components/LogtaPageView';
import { supabase } from '../../lib/supabase';

type FuelMarketRow = {
  id?: string;
  type?: string | null;
  price?: number | null;
  variation_percentage?: number | null;
  last_updated?: string | null;
};

const normalizeType = (value?: string | null) => {
  const type = (value || '').toLowerCase();
  if (type.includes('gasolina')) return 'gasolina';
  if (type.includes('etanol') || type.includes('alcool') || type.includes('álcool')) return 'etanol';
  if (type.includes('diesel')) return 'diesel';
  if (type.includes('gnv') || type.includes('gas') || type.includes('gás')) return 'gnv';
  return type;
};

const fuelMeta: Record<string, { label: string; color: string }> = {
  gasolina: { label: 'Gasolina', color: '#6366F1' },
  diesel: { label: 'Diesel', color: '#EF4444' },
  etanol: { label: 'Etanol', color: '#10B981' },
  gnv: { label: 'GNV', color: '#0EA5E9' },
};

const FuelCenter: React.FC = () => {
  const [fuelRows, setFuelRows] = useState<FuelMarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFuelRows = async () => {
    setLoading(true);
    const { data } = await supabase.from('fuel_prices').select('id, type, price, variation_percentage, last_updated').order('type');
    setFuelRows((data || []).map((item) => ({ ...item, type: normalizeType(item.type) })));
    setLoading(false);
  };

  useEffect(() => {
    fetchFuelRows();
    const interval = window.setInterval(fetchFuelRows, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const displayRows = useMemo(() => {
    const canonicalOrder = ['gasolina', 'diesel', 'etanol', 'gnv'];
    const byType = new Map<string, FuelMarketRow>();
    fuelRows.forEach((item) => byType.set((item.type || '').toLowerCase(), item));
    return canonicalOrder.map((type) => ({
      type,
      meta: fuelMeta[type],
      data: byType.get(type) || null,
    }));
  }, [fuelRows]);

  const availableRows = useMemo(() => displayRows.filter((item) => item.data?.price != null), [displayRows]);
  const averageBrazil = useMemo(() => {
    if (availableRows.length === 0) return 0;
    return availableRows.reduce((acc, item) => acc + Number(item.data?.price || 0), 0) / availableRows.length;
  }, [availableRows]);
  const latestFuelUpdate = useMemo(() => {
    return displayRows
      .map((item) => item.data?.last_updated)
      .filter(Boolean)
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
  }, [displayRows]);

  return (
    <LogtaPageView>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', letterSpacing: '-0.03em' }}>Banco Central de Combustível</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Monitoramento nacional de gasolina, diesel, etanol e gás para operação Logta.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchFuelRows}
            style={{ border: '1px solid var(--line)', background: '#fff', borderRadius: '12px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--line)', background: '#fff', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Sincronizando painel de combustível...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            <div style={{ background: '#0F172A', borderRadius: '24px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ borderRadius: '16px', background: '#111827', border: '1px solid rgba(148,163,184,.3)', padding: '14px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '.08em', fontWeight: 700 }}>Média Brasil</div>
                <div style={{ color: '#F8FAFC', fontSize: '34px', fontWeight: 800, marginTop: '4px' }}>R$ {averageBrazil.toFixed(2)}</div>
                <div style={{ color: '#CBD5E1', fontSize: '12px', marginTop: '4px' }}>
                  {latestFuelUpdate ? `Atualizado às ${new Date(latestFuelUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sem atualização recente'}
                </div>
              </div>
              <div style={{ borderRadius: '16px', background: '#F8FAFC', padding: '10px', display: 'grid', gap: '8px' }}>
                {displayRows.map((item) => (
                  <div key={item.type} style={{ borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: item.meta.color }}>{item.meta.label}</span>
                    <strong style={{ fontSize: '15px', color: '#0F172A' }}>{item.data?.price != null ? `R$ ${Number(item.data.price).toFixed(2)}` : '—'}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderRadius: '24px', border: '1px solid var(--line)', background: '#fff', padding: '16px', display: 'grid', gap: '10px' }}>
              {displayRows.map((item) => {
                const variation = Number(item.data?.variation_percentage || 0);
                const positive = variation > 0;
                return (
                  <div key={`var-${item.type}`} style={{ border: '1px solid var(--line)', borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.meta.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>{item.meta.label}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{item.data?.price != null ? `R$ ${Number(item.data.price).toFixed(2)}` : 'Sem dados'}</div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: positive ? '#EF4444' : '#10B981', fontSize: '12px', fontWeight: 700 }}>
                      {item.data ? (
                        <>
                          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {Math.abs(variation).toFixed(1)}%
                        </>
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: '4px', padding: '12px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <MapPin size={14} />
                Fonte: consolidação nacional em tempo real (base `fuel_prices`).
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid var(--line)', padding: '16px 20px' }}>
          <h3 style={{ margin: '0 0 12px' }}>Comparativo por tipo</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayRows.map((item) => ({ name: item.meta.label, value: Number(item.data?.price || 0), color: item.meta.color }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {displayRows.map((item, index) => (
                    <Cell key={`bar-${index}`} fill={item.meta.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </LogtaPageView>
  );
};

export default FuelCenter;
