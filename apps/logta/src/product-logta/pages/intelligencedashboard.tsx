import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CreditCard, DollarSign, Fuel, Package, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogtaPageView from '../../components/LogtaPageView';
import { LOGTA_DASHBOARD_PAGE_PAD_TOP_PX } from '../../constants/logtaLayout';
import { supabase } from '../../lib/supabase';

type KpiRow = {
  label: string;
  value: string;
};

type MapPin = {
  id: string;
  x: number;
  y: number;
  label: string;
};

type FuelMarketRow = {
  id?: string;
  type?: string | null;
  price?: number | null;
  variation_percentage?: number | null;
  last_updated?: string | null;
};

const fundsRows: KpiRow[] = [
  { label: 'Balance', value: '-$700.00' },
  { label: 'Line of credit', value: '$72 000.00' },
];

const rebateRows: KpiRow[] = [
  { label: 'Current month', value: '$61 097.08' },
  { label: 'Current period', value: '$320.00' },
];

const fuelPins: MapPin[] = [
  { id: 'f-1', x: 16, y: 31, label: '$3.21' },
  { id: 'f-2', x: 48, y: 19, label: '$3.07' },
  { id: 'f-3', x: 60, y: 48, label: '$3.52' },
  { id: 'f-4', x: 83, y: 23, label: '$3.07' },
  { id: 'f-5', x: 34, y: 59, label: '$3.10' },
];

const trackingPins: MapPin[] = [
  { id: 't-1', x: 20, y: 28, label: 'TR-12' },
  { id: 't-2', x: 71, y: 24, label: 'TR-08' },
  { id: 't-3', x: 32, y: 63, label: 'TR-03' },
  { id: 't-4', x: 56, y: 65, label: 'TR-11' },
  { id: 't-5', x: 74, y: 59, label: 'TR-18' },
];

const IntelligenceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(' ')[0] || 'Operator';
  const [fuelRows, setFuelRows] = useState<FuelMarketRow[]>([]);
  const [fuelLoading, setFuelLoading] = useState(true);

  useEffect(() => {
    const normalizeType = (value?: string | null) => {
      const type = (value || '').toLowerCase();
      if (type.includes('gasolina')) return 'gasolina';
      if (type.includes('etanol') || type.includes('alcool') || type.includes('álcool')) return 'etanol';
      if (type.includes('diesel')) return 'diesel';
      if (type.includes('gnv') || type.includes('gas') || type.includes('gás')) return 'gnv';
      return type;
    };

    const fetchFuel = async () => {
      setFuelLoading(true);
      const { data } = await supabase.from('fuel_prices').select('id, type, price, variation_percentage, last_updated').order('type');
      setFuelRows((data || []).map((item) => ({ ...item, type: normalizeType(item.type) })));
      setFuelLoading(false);
    };

    fetchFuel();
    const interval = window.setInterval(fetchFuel, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const fuelOrderedRows = useMemo(() => {
    const labels: Record<string, string> = {
      gasolina: 'Gasolina',
      diesel: 'Diesel',
      etanol: 'Etanol',
      gnv: 'GNV',
    };
    const types = ['gasolina', 'diesel', 'etanol', 'gnv'];
    const byType = new Map<string, FuelMarketRow>();
    fuelRows.forEach((row) => byType.set((row.type || '').toLowerCase(), row));
    return types.map((type) => ({
      type,
      label: labels[type],
      data: byType.get(type) || null,
    }));
  }, [fuelRows]);

  const fuelAverage = useMemo(() => {
    const available = fuelOrderedRows.filter((item) => item.data?.price != null);
    if (available.length === 0) return 0;
    return available.reduce((acc, item) => acc + Number(item.data?.price || 0), 0) / available.length;
  }, [fuelOrderedRows]);

  const latestFuelUpdate = useMemo(() => {
    return fuelOrderedRows
      .map((item) => item.data?.last_updated)
      .filter(Boolean)
      .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime())[0];
  }, [fuelOrderedRows]);

  return (
    <LogtaPageView style={{ padding: `${LOGTA_DASHBOARD_PAGE_PAD_TOP_PX}px 0 28px` }}>
      <div className="logta-dashboard-shell">
        <section className="logta-welcome-card" style={{ 
          background: 'linear-gradient(135deg, #fff 0%, #f8f7ff 100%)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ padding: '6px 12px', borderRadius: '20px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em' }}>
              INTELLIGENCE HUB
            </div>
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '-0.04em' }}>Welcome back, {firstName}</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '4px' }}>Logita is monitoring your fleet and operations in real-time.</p>
        </section>

        <section className="logta-dashboard-grid">
          <div className="logta-dashboard-stack">
            <KpiCard
              title="Funds"
              icon={<DollarSign size={15} />}
              cta="See details"
              rows={fundsRows}
              highlight="$71 300.00"
              highlightSuffix="available funds"
            />
            <KpiCard
              title="Rebates"
              icon={<Package size={15} />}
              cta="See details"
              rows={rebateRows}
              highlight="$48 321.43"
              highlightSuffix="lifetime rebates"
            />

            <div className="logta-dashboard-card">
              <div className="logta-dashboard-card-head">
                <div className="logta-dashboard-card-title">
                  <span className="logta-dashboard-icon">
                    <Fuel size={15} />
                  </span>
                  <h3>Combustível Brasil</h3>
                </div>
                <button type="button" onClick={() => navigate('/combustivel')}>
                  Ver detalhes
                  <ArrowUpRight size={13} />
                </button>
              </div>
              {fuelLoading ? (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Sincronizando preços do mercado...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>R$ {fuelAverage.toFixed(2)}</strong>
                    <small style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {latestFuelUpdate ? `Atualizado às ${new Date(latestFuelUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sem atualização'}
                    </small>
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {fuelOrderedRows.map((item) => {
                      const variation = Number(item.data?.variation_percentage || 0);
                      const positive = variation > 0;
                      return (
                        <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--line)', borderRadius: '10px', padding: '8px 10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '12px' }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '12px' }}>{item.data?.price != null ? `R$ ${Number(item.data.price).toFixed(2)}` : '—'}</strong>
                            {item.data ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 700, color: positive ? '#EF4444' : '#10B981' }}>
                                {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(variation).toFixed(1)}%
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="logta-dashboard-card">
              <div className="logta-dashboard-card-head">
                <div className="logta-dashboard-card-title">
                  <span className="logta-dashboard-icon">
                    <CreditCard size={15} />
                  </span>
                  <h3>Cards</h3>
                </div>
                <button type="button">
                  See details
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <div className="logta-cards-list">
                {[
                  { n: '**** 7462', p: 'Jane Cooper', l: '329 gallons remaining' },
                  { n: '**** 5615', p: 'Leslie Alexander', l: '145 gallons remaining' },
                  { n: '**** 4149', p: 'Ronald Richards', l: '241 gallons remaining' },
                ].map((card) => (
                  <div key={card.n} className="logta-cards-row">
                    <span>{card.n}</span>
                    <strong>{card.p}</strong>
                    <small>{card.l}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="logta-dashboard-card">
              <div className="logta-dashboard-card-head">
                <div className="logta-dashboard-card-title">
                  <span className="logta-dashboard-icon">
                    <Truck size={15} />
                  </span>
                  <h3>Loads</h3>
                </div>
                <button type="button">
                  See more
                  <ArrowUpRight size={13} />
                </button>
              </div>
              <div className="logta-loads-mini-card">
                <strong>#3568130</strong>
                <div className="logta-loads-mini-route">
                  <span>Carrier: Southwest</span>
                  <span className="logta-chip-status">In-transit</span>
                </div>
                <p>Texas · 15.08.24 ⟶ Illinois · 21.08.24</p>
              </div>
            </div>
          </div>

          <div className="logta-dashboard-stack">
            <MapCard title="Fuel map" cta="View the map" pins={fuelPins} />
            <MapCard title="Tracking" cta="View fleet" pins={trackingPins} />
          </div>
        </section>
      </div>
    </LogtaPageView>
  );
};

const KpiCard = ({
  title,
  icon,
  cta,
  rows,
  highlight,
  highlightSuffix,
}: {
  title: string;
  icon: React.ReactNode;
  cta: string;
  rows: KpiRow[];
  highlight: string;
  highlightSuffix: string;
}) => (
  <article className="logta-dashboard-card">
    <div className="logta-dashboard-card-head">
      <div className="logta-dashboard-card-title">
        <span className="logta-dashboard-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <button type="button">
        {cta}
        <ArrowUpRight size={13} />
      </button>
    </div>
    <div className="logta-kpi-rows">
      {rows.map((row) => (
        <div key={row.label}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
    <p className="logta-kpi-highlight">
      <strong>{highlight}</strong>
      <span>{highlightSuffix}</span>
    </p>
  </article>
);

const MapCard = ({ title, cta, pins }: { title: string; cta: string; pins: MapPin[] }) => (
  <article className="logta-dashboard-card logta-map-card">
    <div className="logta-dashboard-card-head">
      <div className="logta-dashboard-card-title">
        <span className="logta-dashboard-icon">
          <Fuel size={15} />
        </span>
        <h3>{title}</h3>
      </div>
      <button type="button">
        {cta}
        <ArrowUpRight size={13} />
      </button>
    </div>
    <div className="logta-map-card-surface">
      {pins.map((pin) => (
        <span key={pin.id} className="logta-map-pin" style={{ left: `${pin.x}%`, top: `${pin.y}%` }}>
          <Truck size={11} />
          {pin.label}
        </span>
      ))}
      <div className="logta-map-controls">
        <button type="button">+</button>
        <button type="button">−</button>
      </div>
    </div>
  </article>
);

export default IntelligenceDashboard;