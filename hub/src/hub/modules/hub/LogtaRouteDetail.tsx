import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Truck, User, Clock, Navigation, CheckCircle } from 'lucide-react';
import { DetailHistorySection, detailHistoryRowTitle } from './DetailHistorySection';

interface LogtaRouteDetailProps {
  routeId: string;
  onBack: () => void;
}

type RouteData = {
  client: string;
  from: string;
  to: string;
  cargo: string;
  value: string;
  p: number;
  status: string;
  color: string;
  driver: string;
  vehicle: string;
  startedAt: string;
  eta: string;
};

type RouteHistoryRow = { id: string; label: string; client: string; cargo: string; status: string; color: string };

/** Catálogo mock: cada rota pertence a uma única empresa — usado para escopo e lista “recentes”. */
const ROUTE_CATALOG: Record<string, RouteData> = {
  'RT-9021': { client: 'Transportadora Falcão', from: 'São Paulo, SP', to: 'Rio de Janeiro, RJ', cargo: 'Eletrônicos', value: 'R$ 1.420.000,00', p: 75, status: 'Em Trânsito', color: '#3B82F6', driver: 'Ricardo Silva', vehicle: 'Scania R450 - ABC1234', startedAt: 'Hoje, 06:15', eta: 'Hoje, 13:45' },
  'RT-9028': { client: 'Transportadora Falcão', from: 'Guarulhos, SP', to: 'Campinas, SP', cargo: 'Peças industriais', value: 'R$ 280.000,00', p: 40, status: 'Em Trânsito', color: '#3B82F6', driver: 'Fernando Costa', vehicle: 'Scania R450 - ABC9988', startedAt: 'Hoje, 08:40', eta: 'Hoje, 11:20' },
  'RT-9031': { client: 'Transportadora Falcão', from: 'Rio de Janeiro, RJ', to: 'Vitória, ES', cargo: 'Químicos', value: 'R$ 620.000,00', p: 0, status: 'Agendada', color: '#F59E0B', driver: 'Ricardo Silva', vehicle: 'Scania R450 - ABC1234', startedAt: 'Amanhã, 05:00', eta: 'Amanhã, 14:00' },
  'RT-8912': { client: 'Expresso Federal', from: 'Curitiba, PR', to: 'Porto Alegre, RS', cargo: 'Automotivo', value: 'R$ 890.000,00', p: 100, status: 'Concluída', color: '#0061FF', driver: 'Ana Oliveira', vehicle: 'Volvo FH540 - DEF5678', startedAt: 'Ontem, 08:00', eta: 'Ontem, 16:30' },
  'RT-8917': { client: 'Expresso Federal', from: 'Joinville, SC', to: 'Florianópolis, SC', cargo: 'Papel & celulose', value: 'R$ 410.000,00', p: 55, status: 'Em Trânsito', color: '#3B82F6', driver: 'Bruno Azevedo', vehicle: 'Volvo FH540 - DEF5544', startedAt: 'Hoje, 07:10', eta: 'Hoje, 16:00' },
  'RT-9055': { client: 'Rápido Trans', from: 'Belo Horizonte, MG', to: 'Brasília, DF', cargo: 'Alimentos', value: 'R$ 340.000,00', p: 30, status: 'Em Trânsito', color: '#3B82F6', driver: 'Carlos Souza', vehicle: 'Mercedes Axor - GHI9012', startedAt: 'Hoje, 09:00', eta: 'Hoje, 18:00' },
  'RT-9059': { client: 'Rápido Trans', from: 'Uberlândia, MG', to: 'Goiânia, GO', cargo: 'Bebidas', value: 'R$ 195.000,00', p: 88, status: 'Em Trânsito', color: '#3B82F6', driver: 'Carlos Souza', vehicle: 'Mercedes Axor - GHI7721', startedAt: 'Ontem, 22:00', eta: 'Hoje, 06:30' },
  'RT-9101': { client: 'TransNorte Cargo', from: 'Campinas, SP', to: 'Salvador, BA', cargo: 'Fármacos', value: 'R$ 2.100.000,00', p: 0, status: 'Agendada', color: '#F59E0B', driver: 'Pedro Mendes', vehicle: 'Scania R500 - JKL3456', startedAt: 'Amanhã, 05:00', eta: 'Há 2 dias' },
  'RT-9108': { client: 'TransNorte Cargo', from: 'Recife, PE', to: 'Fortaleza, CE', cargo: 'Têxtil', value: 'R$ 380.000,00', p: 15, status: 'Em Trânsito', color: '#3B82F6', driver: 'Juliana Prado', vehicle: 'Scania R500 - JKL9900', startedAt: 'Hoje, 04:00', eta: 'Hoje, 20:00' },
};

const ROUTE_FALLBACK: RouteData = {
  client: 'Transportadora Parceira',
  from: 'Origem Desconhecida',
  to: 'Destino Final',
  cargo: 'Carga Geral',
  value: 'R$ 150.000,00',
  p: 50,
  status: 'Em Rota',
  color: '#3B82F6',
  driver: 'Condutor Externo',
  vehicle: 'Caminhão Padrão - XX0000',
  startedAt: 'Hoje, 07:00',
  eta: 'Hoje, 15:00',
};

function getRouteData(id: string): RouteData {
  const cleanId = id.replace('#', '');
  return ROUTE_CATALOG[cleanId] ?? ROUTE_FALLBACK;
}

function plateTokenFromVehicleField(vehicleStr: string): string {
  const tail = vehicleStr.includes(' - ') ? vehicleStr.split(' - ').pop() || vehicleStr : vehicleStr;
  return tail.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Alinha placa da rota ao inventário mock da aba Frota (LogtaAdmin). */
function plateTokenToFleetVehicleId(token: string): string {
  const map: Record<string, string> = {
    ABC1234: '1',
    ABC9988: '1',
    DEF5678: 'demo-11',
    DEF5544: 'demo-11',
    GHI9012: 'demo-12',
    GHI7721: 'demo-12',
    JKL3456: 'demo-13',
    JKL9900: 'demo-13',
    XX0000: '1',
  };
  return map[token] || '1';
}

const ALL_COMPANY_HISTORY: RouteHistoryRow[] = Object.entries(ROUTE_CATALOG).map(([id, r]) => ({
  id,
  label: id,
  client: r.client,
  cargo: r.cargo,
  status: r.status,
  color: r.color,
}));

function firstRouteIdForClient(clientName: string): string | undefined {
  return ALL_COMPANY_HISTORY.find(h => h.client === clientName)?.id;
}

export const LogtaRouteDetail: React.FC<LogtaRouteDetailProps> = ({ routeId, onBack }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRouteId, setActiveRouteId] = useState(routeId);
  const [historySearchDraft, setHistorySearchDraft] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');

  useEffect(() => {
    setActiveRouteId(routeId);
  }, [routeId]);

  const companyKey = useMemo(() => {
    const raw = searchParams.get('routeClient');
    if (raw) {
      try {
        return decodeURIComponent(raw);
      } catch {
        return getRouteData(routeId).client;
      }
    }
    return getRouteData(routeId).client;
  }, [searchParams, routeId]);

  useEffect(() => {
    const data = getRouteData(routeId);
    if (data.client === companyKey) return;
    const first = firstRouteIdForClient(companyKey);
    if (!first || first === routeId.replace(/^#/, '')) return;
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('routeId', first);
      if (!prev.get('routeClient')) {
        n.set('routeClient', encodeURIComponent(companyKey));
      }
      return n;
    }, { replace: true });
  }, [routeId, companyKey, setSearchParams]);

  const companyHistory = useMemo(
    () => ALL_COMPANY_HISTORY.filter(h => h.client === companyKey),
    [companyKey],
  );

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return companyHistory;
    return companyHistory.filter(
      h =>
        h.client.toLowerCase().includes(q) ||
        h.cargo.toLowerCase().includes(q) ||
        h.id.toLowerCase().includes(q) ||
        h.label.toLowerCase().includes(q) ||
        h.status.toLowerCase().includes(q),
    );
  }, [companyHistory, historyQuery]);

  const selectHistory = (id: string) => {
    const clean = id.startsWith('#') ? id.slice(1) : id;
    setActiveRouteId(clean);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('routeId', clean);
      const rowClient = getRouteData(clean).client;
      const existing = prev.get('routeClient');
      if (existing) {
        try {
          const scope = decodeURIComponent(existing);
          if (scope === rowClient) {
            n.set('routeClient', existing);
            return n;
          }
        } catch {
          /* use row client */
        }
      }
      n.set('routeClient', encodeURIComponent(rowClient));
      return n;
    }, { replace: true });
  };

  const route = getRouteData(activeRouteId);
  const displayId = activeRouteId.startsWith('#') ? activeRouteId : `#${activeRouteId.replace(/^#/, '')}`;
  const vehiclePlate = route.vehicle.includes(' - ') ? route.vehicle.split(' - ').slice(-1)[0] : route.vehicle;

  const [liveProgressPct, setLiveProgressPct] = useState(route.p);
  useEffect(() => {
    setLiveProgressPct(route.p);
  }, [route.p, activeRouteId]);

  useEffect(() => {
    if (route.p <= 0 || route.p >= 100) return undefined;
    const id = window.setInterval(() => {
      setLiveProgressPct(() => {
        const base = route.p;
        const wobble = Math.sin(Date.now() / 3200) * 1.5;
        return Math.max(0, Math.min(100, base + wobble));
      });
    }, 800);
    return () => clearInterval(id);
  }, [route.p, activeRouteId]);

  const goToFleetForVehicle = () => {
    const token = plateTokenFromVehicleField(route.vehicle);
    const fleetVid = plateTokenToFleetVehicleId(token);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('vehicleId');
      n.delete('trackRoute');
      n.delete('trackClient');
      n.set('tab', 'fleet');
      n.set('fleetRow', fleetVid);
      return n;
    }, { replace: true });
  };

  const goToTrackingMapForRoute = () => {
    const clean = activeRouteId.replace(/^#/, '');
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.delete('routeId');
      n.delete('routeClient');
      n.delete('vehicleId');
      n.delete('fleetRow');
      n.set('tab', 'tracking');
      n.set('trackRoute', clean);
      n.set('trackClient', encodeURIComponent(route.client));
      return n;
    }, { replace: true });
  };

  const pressableCardProps = (onActivate: () => void): React.HTMLAttributes<HTMLDivElement> => ({
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  });

  const eventLog = useMemo(
    () => [
      { title: 'Parada para Descanso', time: 'Há 45 min', desc: `Trecho entre ${route.from.split(',')[0]} e ${route.to.split(',')[0]}`, icon: <Clock size={12} />, color: '#64748B' },
      { title: 'Telemetria estável', time: 'Há 2 horas', desc: `Operação monitorada — ${route.client}`, icon: <Navigation size={12} />, color: '#3B82F6' },
      { title: 'Emissão de MDF-e Concluída', time: route.startedAt === 'Amanhã, 05:00' ? 'Aguardando janela' : 'Hoje, 06:20', desc: 'Autorizado pela SEFAZ', icon: <CheckCircle size={12} />, color: '#0061FF' },
      { title: 'Viagem registrada', time: route.startedAt, desc: `Centro de distribuição — ${route.client}`, icon: <Truck size={12} />, color: '#0061FF' },
    ],
    [route.client, route.from, route.startedAt, route.to],
  );

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button type="button" style={s.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ ...s.badge, background: route.color + '15', color: route.color }}>{displayId}</span>
              <h2 style={s.title}>{route.cargo} • {route.client}</h2>
            </div>
            <p style={s.subtitle}>Empresa desta lista: <b style={{ color: '#334155' }}>{companyKey}</b>. Telemetria e histórico só deste tenant.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: route.color, background: route.color + '10', padding: '8px 16px', borderRadius: '20px' }}>
            {route.status}
          </span>
        </div>
      </header>

      {/* BODY GRID */}
      <div style={s.content}>
        {/* SUMMARY STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div
            {...pressableCardProps(goToTrackingMapForRoute)}
            title="Abrir mapa ao vivo filtrado nesta rota"
            style={{
              ...s.cardCompact,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#93C5FD';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={s.iconWrapper}><MapPin size={18} color="#3B82F6" /></div>
            <div>
              <div style={s.cardLabel}>Origem & Destino</div>
              <div style={s.cardVal}>{route.from.split(',')[0]} ➔ {route.to.split(',')[0]}</div>
            </div>
          </div>
          <div style={s.cardCompact}>
            <div style={s.iconWrapper}><User size={18} color="#0061FF" /></div>
            <div>
              <div style={s.cardLabel}>Motorista Responsável</div>
              <div style={s.cardVal}>{route.driver}</div>
            </div>
          </div>
          <div
            {...pressableCardProps(goToFleetForVehicle)}
            title="Abrir frota com este veículo em destaque"
            style={{
              ...s.cardCompact,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#C4B5FD';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={s.iconWrapper}><Truck size={18} color="#8B5CF6" /></div>
            <div>
              <div style={s.cardLabel}>Veículo / Placa</div>
              <div style={s.cardVal}>{vehiclePlate}</div>
            </div>
          </div>
          <div style={s.cardCompact}>
            <div style={s.iconWrapper}><Package size={18} color="#F59E0B" /></div>
            <div>
              <div style={s.cardLabel}>Valor Declarado</div>
              <div style={s.cardVal}>{route.value}</div>
            </div>
          </div>
        </div>

        {/* MAP & DETAILS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* LEFT: PROGRESS & MAP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* PROGRESS */}
            <div style={s.card}>
              <h3 style={s.sectionTitle}>Progresso da Rota</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#64748B" />
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{route.from}</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: '900', color: route.color }}>
                  {liveProgressPct < 10 ? liveProgressPct.toFixed(1) : Math.round(liveProgressPct * 10) / 10}%
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{route.to}</span>
                  <MapPin size={16} color={route.p === 100 ? '#0061FF' : '#EF4444'} />
                </div>
              </div>
              <div
                style={{
                  height: '10px',
                  background: '#F1F5F9',
                  borderRadius: '5px',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <div style={{ height: '100%', borderRadius: '5px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${liveProgressPct}%`,
                      background: `linear-gradient(90deg, ${route.color}, ${route.color}DD)`,
                      borderRadius: '5px',
                      transition: 'width 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <div
                  title="Posição ao vivo na rota"
                  style={{
                    position: 'absolute',
                    left: `${liveProgressPct}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: `3px solid ${route.color}`,
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }}
                >
                  <MapPin size={11} color={route.color} style={{ display: 'block' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                <div>Partida: <b style={{ color: '#1E293B' }}>{route.startedAt}</b></div>
                <div>Previsão de Chegada: <b style={{ color: '#1E293B' }}>{route.eta}</b></div>
              </div>
            </div>

            {/* MAP PLACEHOLDER */}
            <div style={{ ...s.card, height: '380px', position: 'relative', background: '#F8FAFC', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'radial-gradient(#1E293B 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
              
              <svg style={{ position: 'absolute', width: '80%', height: '60%' }} viewBox="0 0 400 200">
                <path d="M 50 150 C 100 50, 300 180, 350 50" fill="none" stroke="#E2E8F0" strokeWidth="6" strokeDasharray="10,10" />
                <path d="M 50 150 C 100 50, 300 180, 350 50" fill="none" stroke={route.color} strokeWidth="6" strokeDasharray="400" strokeDashoffset={400 - (400 * (liveProgressPct / 100))} style={{ transition: 'stroke-dashoffset 0.6s ease-out' }} />
                
                <circle cx="50" cy="150" r="8" fill="#FFFFFF" stroke="#64748B" strokeWidth="4" />
                {liveProgressPct > 0 && liveProgressPct < 100 && (
                  <g transform={`translate(${50 + (300 * (liveProgressPct / 100))}, ${150 - (100 * (liveProgressPct / 100))})`}>
                    <circle cx="0" cy="0" r="12" fill={route.color} style={{ opacity: 0.2, animation: 'pulse 2s infinite' }} />
                    <circle cx="0" cy="0" r="6" fill={route.color} />
                  </g>
                )}
                <circle cx="350" cy="50" r="8" fill="#FFFFFF" stroke={liveProgressPct >= 99.5 ? '#0061FF' : '#EF4444'} strokeWidth="4" />
              </svg>

              <div style={{ zIndex: 2, padding: '16px 24px', background: '#FFFFFF', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'inline-flex', width: '40px', height: '40px', background: route.color + '15', borderRadius: '12px', alignItems: 'center', justifyContent: 'center', color: route.color, marginBottom: '12px' }}>
                  <Navigation size={20} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>Telemetria Logta Link Ativa</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>Sinal vinculado à frota de {route.client}</div>
              </div>

              <style>{`
                @keyframes pulse {
                  0% { transform: scale(1); opacity: 0.5; }
                  70% { transform: scale(3); opacity: 0; }
                  100% { transform: scale(1); opacity: 0; }
                }
              `}</style>
            </div>
          </div>

          {/* RIGHT: TIMELINE & EVENT LOG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={s.card}>
              <h3 style={s.sectionTitle}>Log de Eventos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: '#F1F5F9' }} />

                {eventLog.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#FFFFFF', border: `2px solid ${ev.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ev.color, marginTop: '2px' }}>
                      {ev.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>{ev.title}</div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{ev.time}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{ev.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DetailHistorySection
          heading={`Rotas recentes — ${companyKey}`}
          hint="Lista filtrada pela empresa do clique (parâmetro routeClient na URL). Ao trocar de rota aqui, continua o mesmo tenant. Pesquisa, PDF e Excel."
          searchDraft={historySearchDraft}
          onSearchDraftChange={setHistorySearchDraft}
          onApplySearch={() => setHistoryQuery(historySearchDraft)}
          exportStem={`rotas-${companyKey.replace(/\s+/g, '_')}-${activeRouteId.replace('#', '')}`}
          listMaxHeight={280}
        >
          {filteredHistory.map(h => {
            const clean = activeRouteId.replace('#', '');
            const active = clean === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => selectHistory(h.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: active ? '2px solid #0061FF' : '1px solid #E2E8F0',
                  background: active ? '#EFF6FF' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#0F172A', flexShrink: 0 }}>{h.label}</span>
                <span style={{ ...detailHistoryRowTitle, flex: 1, minWidth: 0, fontSize: '12px', color: '#64748B' }}>{h.cargo}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: h.color, flexShrink: 0 }}>{h.status}</span>
              </button>
            );
          })}
        </DetailHistorySection>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF' },
  header: { padding: '20px 72px 0', marginTop: 50, marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  title: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '900', fontFamily: 'monospace' },
  content: { padding: '16px 72px 48px', display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' },
  cardCompact: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '16px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' },
  iconWrapper: { width: '40px', height: '40px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  cardVal: { fontSize: '14px', fontWeight: '800', color: '#1E293B', marginTop: '2px' },
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' },
};
