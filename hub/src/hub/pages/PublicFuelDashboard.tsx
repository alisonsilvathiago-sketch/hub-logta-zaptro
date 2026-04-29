import React, { useState, useEffect } from 'react';
import { Zap, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '../../core/lib/supabase';

interface FuelPrice {
  id: string;
  type: string;
  price: number;
  last_updated: string;
  breakdown: any;
  fuel_history: any[];
}

const PublicFuelDashboard: React.FC = () => {
  const [selectedType, setSelectedType] = useState('Gasolina');
  const [allFuels, setAllFuels] = useState<FuelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState<'logta' | 'zaptro'>('logta');

  useEffect(() => {
    // Detect brand from URL params
    const params = new URLSearchParams(window.location.search);
    const brandParam = params.get('brand');
    if (brandParam === 'zaptro') setBrand('zaptro');

    const fetchData = async () => {
      try {
        const { data, error } = await supabase
          .from('fuel_prices')
          .select('*, fuel_history(*)');
        
        if (data) {
          // Sort history by date desc for each fuel
          const formatted = data.map(f => ({
            ...f,
            fuel_history: f.fuel_history?.sort((a: any, b: any) => 
              new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
            ) || []
          }));
          setAllFuels(formatted);
          if (formatted.length > 0 && !selectedType) {
            const firstFuel = formatted.find(f => f.type.toLowerCase().includes('gasolina')) || formatted[0];
            setSelectedType(firstFuel.type);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // SEO Update
    document.title = `Preço do Combustível Hoje | Inteligência Logística ${brand.toUpperCase()}`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', `Acompanhe em tempo real o preço da gasolina, etanol e diesel. Sistema de inteligência de combustível integrado à plataforma ${brand === 'logta' ? 'Logta' : 'Zaptro'}. Otimize sua logística agora.`);
    }
  }, [brand]);

  const currentFuel = allFuels.find(f => f.type.toLowerCase().includes(selectedType.toLowerCase())) || allFuels[0];

  const getTheme = () => {
    const type = selectedType.toLowerCase();
    if (type.includes('etanol')) return { color: '#2563EB', label: 'ETANOL' };
    if (type.includes('diesel')) return { color: '#DC2626', label: 'DIESEL' };
    return { color: '#16A34A', label: 'GASOLINA' };
  };

  const theme = getTheme();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={{ color: '#FFF', fontWeight: '800', marginTop: '20px' }}>SINCRONIZANDO COM CENTRAL DE DADOS BRASIL...</p>
      </div>
    );
  }

  if (!currentFuel) {
    return <div style={{ color: '#000' }}>Nenhum dado disponível no momento.</div>;
  }

  const breakdown = currentFuel.breakdown || {
    refinery: 35.5,
    taxes_state: 24.2,
    taxes_federal: 11.3,
    distribution: 16.0,
    bio_share: 13.0
  };

  const labels = {
    distribution: 'Distribuição e Revenda',
    bio_share: selectedType.toLowerCase().includes('gasolina') ? 'Custo Etanol Anidro' : 'Custo Biocombustível',
    taxes_state: 'Imposto Estadual',
    taxes_federal: 'Impostos Federais',
    refinery: 'Parcela Real/Produtor'
  };

  const segmentColors = {
    distribution: '#1F2937', // Neutral dark
    bio_share: '#4B5563',    // Medium gray
    taxes_state: '#9CA3AF',  // Gray
    taxes_federal: '#D1D5DB', // Light gray
    refinery: theme.color      // The fuel's theme color
  };

  return (
    <div style={styles.page}>
      {/* Background Station Illustration */}
      <div style={styles.stationBackground}>
        <svg width="100%" height="100%" viewBox="0 0 1000 800" fill="none" preserveAspectRatio="xMidYMax slice">
          <path d="M0 100 L1000 100 L1000 140 L0 140 Z" fill="#F1F5F9" />
          <path d="M100 140 L120 800" stroke="#F1F5F9" strokeWidth="40" strokeLinecap="round" />
          <path d="M900 140 L880 800" stroke="#F1F5F9" strokeWidth="40" strokeLinecap="round" />
          <rect y="750" width="1000" height="50" fill="#F8FAFC" />
        </svg>
      </div>

      {/* Top Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <div style={styles.logoBox}>
            <div style={{ ...styles.logoCircle, borderColor: theme.color }}>
              <Zap size={18} color={theme.color} fill={theme.color} />
            </div>
            <span style={styles.logoText}>{brand === 'zaptro' ? 'ZAPTRO FUEL' : 'LOGTA FUEL'}</span>
          </div>
          <div className="nav-divider" style={styles.divider} />
          <div className="nav-breadcrumb" style={styles.navBreadcrumb}>
            Como são formados os Preços  &gt;  <span style={{ fontWeight: '900', color: theme.color }}>{selectedType.toUpperCase()}</span>
          </div>
        </div>

        <div style={styles.navRight}>
          {/* Brand switching removed per user request */}
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.heroSection}>
          <h2 style={styles.preTitle}>TRANSPARÊNCIA E INTELIGÊNCIA LOGÍSTICA</h2>
          <h1 style={{ ...styles.mainTitle, color: theme.color }}>{selectedType.toUpperCase()}</h1>
          <p style={styles.description}>
            Preço médio nacional atualizado em tempo real pela rede {brand.toUpperCase()}.<br />
            Decisões baseadas em dados reais para sua frota.
          </p>

          <div style={styles.fuelSelectorMain}>
            {allFuels.map(f => (
              <button 
                key={f.id} 
                style={{
                  ...styles.mainFuelBtn,
                  ...(selectedType.toLowerCase() === f.type.toLowerCase() ? { 
                    background: theme.color, 
                    color: '#FFF',
                    borderColor: theme.color,
                    transform: 'scale(1.05)'
                  } : {})
                }}
                onClick={() => setSelectedType(f.type)}
              >
                {f.type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* --- FUEL PUMP --- */}
        <div style={styles.pumpContainer}>
          {/* Labels Column (Left) */}
          <div className="hide-on-mobile" style={styles.labelsColumn}>
            {Object.keys(labels).map((key) => (
              <div key={key} style={styles.labelItem}>
                <span style={styles.labelText}>R$ {(Number(currentFuel.price) * ((breakdown as any)[key] / 100)).toFixed(2).replace('.', ',')}</span>
                <div style={styles.labelLine} />
              </div>
            ))}
          </div>

          {/* Pump Illustration */}
          <div style={styles.pumpGraphic}>
            {/* Display Head */}
            <div className="pump-head" style={{ ...styles.pumpHead, backgroundColor: theme.color }}>
              <div style={styles.displayScreen}>
                <div style={styles.screenLabel}>Preço médio &gt; BR</div>
                <div className="screen-value" style={styles.screenValue}>{Number(currentFuel.price).toFixed(2).replace('.', ',')}</div>
              </div>
            </div>

            {/* Pump Body */}
            <div className="pump-body" style={{ ...styles.pumpBody, backgroundColor: theme.color, borderColor: theme.color }}>
              <div style={{ ...styles.bodySegment, height: `${breakdown.distribution}%`, backgroundColor: segmentColors.distribution }}>
                <span className="segment-name" style={styles.segmentName}>{labels.distribution} ({breakdown.distribution}%)</span>
              </div>
              <div style={{ ...styles.bodySegment, height: `${breakdown.bio_share}%`, backgroundColor: segmentColors.bio_share }}>
                <span className="segment-name" style={styles.segmentName}>{labels.bio_share} ({breakdown.bio_share}%)</span>
              </div>
              <div style={{ ...styles.bodySegment, height: `${breakdown.taxes_state}%`, backgroundColor: segmentColors.taxes_state }}>
                <span className="segment-name" style={styles.segmentName}>{labels.taxes_state} ({breakdown.taxes_state}%)</span>
              </div>
              <div style={{ ...styles.bodySegment, height: `${breakdown.taxes_federal}%`, backgroundColor: segmentColors.taxes_federal }}>
                <span className="segment-name" style={styles.segmentName}>{labels.taxes_federal} ({breakdown.taxes_federal}%)</span>
              </div>
              <div style={{ ...styles.bodySegment, height: `${breakdown.refinery}%`, backgroundColor: segmentColors.refinery }}>
                <span className="segment-name" style={styles.segmentName}>{labels.refinery} ({breakdown.refinery}%)</span>
              </div>
            </div>

            {/* Base */}
            <div className="pump-base" style={styles.pumpBase} />
          </div>

          {/* Nozzle and Hose (Right) */}
          <div className="hide-on-mobile" style={styles.nozzleSystem}>
            <div style={styles.nozzle}>
              <div style={styles.nozzleTip} />
              <div style={{ ...styles.nozzleBody, backgroundColor: theme.color }} />
              <div style={styles.nozzleTrigger} />
            </div>
            <div style={styles.hoseContainer}>
               <svg width="60" height="250" viewBox="0 0 60 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0V180C10 210 50 210 50 180V80" stroke="#1F2937" strokeWidth="12" strokeLinecap="round"/>
               </svg>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div style={styles.footerInfo}>
          <div style={{ ...styles.avgBadge, background: theme.color }}>
            Preço Médio Brasil: R$ {Number(currentFuel.price).toFixed(2).replace('.', ',')}
          </div>
          <p style={styles.sourceText}>
            Relatório de inteligência {brand === 'logta' ? 'Logta' : 'Zaptro'}. Dados auditados ANP/CEPEA. 
            Sua logística movida a dados.
          </p>
          <div style={styles.periodBox}>
            Última Sincronização: {new Date(currentFuel.last_updated).toLocaleString('pt-BR')}
          </div>
        </div>

        {/* Historical Section */}
        <div style={styles.historySection}>
          <div style={styles.historyHeader}>
            <Clock size={20} color={theme.color} />
            <h3 style={styles.historyTitle}>VARIAÇÃO 7 DIAS ({selectedType.toUpperCase()})</h3>
          </div>
          <div style={styles.historyList}>
            {currentFuel.fuel_history && currentFuel.fuel_history.length > 0 ? (
              currentFuel.fuel_history.slice(0, 5).map((h, i) => (
                <div key={i} style={styles.historyRow}>
                  <div style={styles.historyDate}>{new Date(h.recorded_at).toLocaleDateString('pt-BR')}</div>
                  <div style={styles.historyLine} />
                  <div style={{ ...styles.historyPrice, color: theme.color }}>R$ {Number(h.price).toFixed(2).replace('.', ',')}</div>
                </div>
              ))
            ) : (
              <div style={styles.noHistory}>Analisando mercado...</div>
            )}
          </div>
        </div>
      </main>

      <footer style={styles.pageFooter}>
        <ShieldCheck size={14} /> {brand.toUpperCase()} Intelligence Core • © 2026
      </footer>

      <style>{`
        @font-face {
          font-family: 'Digital';
          src: url('https://fonts.cdnfonts.com/s/14873/DS-DIGI.woff') format('woff');
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
          .nav-divider, .nav-breadcrumb { display: none !important; }
          
          nav { padding: 0 15px !important; }
          main { padding: 20px 15px !important; }
          
          .heroSection h1 { font-size: 42px !important; }
          .heroSection p { font-size: 14px !important; }
          
          .pump-head { width: 280px !important; height: 160px !important; padding: 15px !important; }
          .screen-value { font-size: 64px !important; }
          .pump-body { width: 240px !important; height: 320px !important; }
          .pump-base { width: 300px !important; }
          .segment-name { font-size: 10px !important; }
          
          .mainFuelBtn { padding: 10px 15px !important; font-size: 10px !important; }
          .fuelSelectorMain { gap: 8px !important; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: '"Inter", sans-serif',
    display: 'flex',
    flexDirection: 'column' as const,
    color: '#111',
    overflowX: 'hidden',
    position: 'relative' as const
  },
  stationBackground: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    opacity: 0.5,
    pointerEvents: 'none' as const
  },
  loadingContainer: {
    backgroundColor: '#1E293B',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loader: {
    width: '48px',
    height: '48px',
    border: '5px solid #FFF',
    borderBottomColor: 'transparent',
    borderRadius: '50%',
    display: 'inline-block',
    boxSizing: 'border-box' as const,
    animation: 'rotation 1s linear infinite',
  },
  nav: {
    height: '70px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 60px',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  logoBox: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoCircle: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: '900', fontSize: '18px', letterSpacing: '-1px' },
  divider: { width: '1px', height: '30px', backgroundColor: '#EEE' },
  navBreadcrumb: { fontSize: '12px', color: '#666', fontWeight: '500' },
  navRight: { display: 'flex', alignItems: 'center', gap: '20px' },
  stateBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    padding: '8px 16px', 
    borderRadius: '20px', 
    border: '1px solid #E2E8F0', 
    background: '#FFF', 
    fontSize: '12px', 
    fontWeight: '800',
    cursor: 'pointer'
  },
  main: {
    flex: 1,
    padding: '40px 60px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    zIndex: 1,
    position: 'relative' as const
  },
  heroSection: { textAlign: 'center' as const, maxWidth: '800px', marginBottom: '30px' },
  preTitle: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '1.5px' },
  mainTitle: { fontSize: '72px', fontWeight: '900', margin: '5px 0', letterSpacing: '-3px' },
  description: { fontSize: '16px', fontWeight: '500', color: '#475569', lineHeight: '1.6' },
  fuelSelectorMain: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    marginTop: '25px',
    flexWrap: 'wrap' as const
  },
  mainFuelBtn: {
    padding: '12px 24px',
    borderRadius: '12px',
    border: '2px solid #E2E8F0',
    fontSize: '12px',
    fontWeight: '900',
    cursor: 'pointer',
    background: '#F8FAFC',
    color: '#64748B',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
  },
  pumpContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    position: 'relative' as const,
    marginTop: '20px',
    marginBottom: '40px'
  },
  labelsColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    paddingTop: '200px',
    height: '560px',
    marginRight: '20px'
  },
  labelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'flex-end',
    width: '140px'
  },
  labelText: { fontSize: '18px', fontWeight: '900', color: '#1E293B' },
  labelLine: { width: '40px', height: '2px', backgroundColor: '#E2E8F0' },
  pumpGraphic: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  },
  pumpHead: {
    width: '340px',
    height: '220px',
    borderRadius: '30px 30px 20px 20px',
    padding: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0 -10px 0 rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.05)',
    transition: 'background-color 0.4s'
  },
  displayScreen: {
    backgroundColor: '#FFF',
    width: '100%',
    height: '100%',
    borderRadius: '15px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px'
  },
  screenLabel: { fontSize: '14px', fontWeight: '900', color: '#64748B', marginBottom: '5px' },
  screenValue: { 
    fontSize: '92px', 
    fontWeight: '400', 
    fontFamily: '"Digital", Courier, monospace', 
    letterSpacing: '2px',
    color: '#000'
  },
  pumpBody: {
    width: '300px',
    height: '350px',
    marginTop: '5px',
    borderRadius: '5px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    border: '8px solid transparent',
    boxSizing: 'content-box' as const,
    transition: 'background-color 0.4s, border-color 0.4s'
  },
  bodySegment: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  segmentName: { fontSize: '11px', fontWeight: '800', color: '#FFF', whiteSpace: 'nowrap' as const, opacity: 0.9 },
  pumpBase: {
    width: '380px',
    height: '40px',
    backgroundColor: '#0F172A',
    borderRadius: '10px',
    marginTop: '-10px',
    zIndex: 2
  },
  nozzleSystem: {
    position: 'relative' as const,
    marginLeft: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  },
  nozzle: {
    width: '60px',
    height: '140px',
    marginTop: '40px',
    position: 'relative' as const
  },
  nozzleTip: {
    width: '30px',
    height: '40px',
    backgroundColor: '#94A3B8',
    borderRadius: '5px',
    transform: 'rotate(-45deg)',
    position: 'absolute' as const,
    left: '-10px',
    top: '0'
  },
  nozzleBody: {
    width: '45px',
    height: '100px',
    borderRadius: '10px',
    border: '4px solid rgba(0,0,0,0.1)',
    position: 'absolute' as const,
    top: '30px',
    transition: 'background-color 0.4s'
  },
  nozzleTrigger: {
    width: '15px',
    height: '60px',
    backgroundColor: '#334155',
    borderRadius: '10px',
    position: 'absolute' as const,
    right: '-5px',
    top: '50px'
  },
  hoseContainer: {
    marginTop: '-20px'
  },
  footerInfo: {
    textAlign: 'center' as const,
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '15px',
    marginTop: '20px'
  },
  avgBadge: {
    color: '#FFF',
    padding: '10px 30px',
    borderRadius: '12px',
    fontWeight: '900',
    fontSize: '18px',
    transition: 'background-color 0.4s'
  },
  sourceText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748B',
    maxWidth: '700px'
  },
  periodBox: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '15px',
    fontSize: '11px',
    fontWeight: '800',
    color: '#94A3B8'
  },
  historySection: {
    marginTop: '50px',
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#F8FAFC',
    borderRadius: '20px',
    padding: '30px',
    border: '1px solid #F1F5F9'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  historyTitle: { fontSize: '13px', fontWeight: '900', color: '#1E293B', letterSpacing: '0.5px' },
  historyList: { display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  historyRow: { display: 'flex', alignItems: 'center', gap: '15px' },
  historyDate: { fontSize: '13px', fontWeight: '700', minWidth: '100px', color: '#64748B' },
  historyLine: { flex: 1, height: '1px', backgroundColor: '#E2E8F0', borderStyle: 'dashed' as any },
  historyPrice: { fontSize: '16px', fontWeight: '900' },
  noHistory: { fontSize: '12px', color: '#94A3B8', textAlign: 'center' as const, padding: '15px' },
  pageFooter: {
    padding: '30px',
    textAlign: 'center' as const,
    fontSize: '11px',
    fontWeight: '800',
    color: '#94A3B8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  }
};

export default PublicFuelDashboard;
