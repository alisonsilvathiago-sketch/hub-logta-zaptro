import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Database, Shield, ChevronRight, ArrowUpRight, Activity, Server, 
  Radio, RefreshCw, CheckSquare
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { toast } from 'sonner';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';

interface SystemEvent {
  id: number;
  time: string;
  system: 'Logta SaaS' | 'Zaptro CRM' | 'LogDock' | 'Hub Master';
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

const MasterHubDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userName = profile?.full_name?.split(' ')[0] || 'Master';
  const [isSyncing, setIsSyncing] = useState(false);
  const [telemetry, setTelemetry] = useState({
    cpu: 34,
    memory: 68,
    requests: 124,
    latency: 14
  });

  const [events, setEvents] = useState<SystemEvent[]>([
    { id: 1, time: 'Agora mesmo', system: 'Logta SaaS', message: 'Sincronização de notas fiscais finalizada para TransLog Ltda.', type: 'success' },
    { id: 2, time: 'Há 2 min', system: 'Zaptro CRM', message: 'SendGrid disparou 120 e-mails de recuperação de senha ativos.', type: 'info' },
    { id: 3, time: 'Há 5 min', system: 'LogDock', message: 'Otimização automatizada de índices de banco de dados concluída.', type: 'success' },
    { id: 4, time: 'Há 12 min', system: 'Hub Master', message: 'Auditoria de segurança das chaves API executada com sucesso.', type: 'success' },
    { id: 5, time: 'Há 20 min', system: 'Logta SaaS', message: 'Dispositivo GPS #8786 comunicou nova rota de frotas ativas.', type: 'info' }
  ]);

  // Simulate real-time updates to make the dashboard feel ALIVE and PREMIUM
  useEffect(() => {
    const interval = setInterval(() => {
      // Fluctuate telemetry slightly
      setTelemetry(prev => ({
        cpu: Math.max(10, Math.min(95, prev.cpu + Math.floor(Math.random() * 9) - 4)),
        memory: Math.max(40, Math.min(90, prev.memory + Math.floor(Math.random() * 5) - 2)),
        requests: Math.max(80, prev.requests + Math.floor(Math.random() * 15) - 7),
        latency: Math.max(8, Math.min(35, prev.latency + Math.floor(Math.random() * 5) - 2))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    toast.success('Sincronizando telemetria global...');
    
    setTimeout(() => {
      setIsSyncing(false);
      setTelemetry(prev => ({
        cpu: 28,
        memory: 62,
        requests: prev.requests + 12,
        latency: 11
      }));
      
      const newEvent: SystemEvent = {
        id: Date.now(),
        time: 'Agora mesmo',
        system: 'Hub Master',
        message: `Auditoria forçada por ${userName} completada. Toda a infraestrutura saudável.`,
        type: 'success'
      };
      
      setEvents(prev => [newEvent, ...prev.slice(0, 4)]);
      toast.success('Sincronização concluída com sucesso!');
    }, 1200);
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'success': return { bg: '#E0F2FE', text: '#0369A1' };
      case 'warning': return { bg: '#FEF3C7', text: '#D97706' };
      case 'error': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F1F5F9', text: '#475569' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HUB MASTER HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1.2px', lineHeight: 1.2 }}>
              Hub Master Command
            </h1>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
              v1.4.0 <Radio size={10} style={{ animation: 'pulse 1.5s infinite ease-in-out' }} />
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '4px', margin: 0 }}>
            Gerenciamento global do ecossistema Logta, Zaptro e LogDock.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#0F172A',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <RefreshCw size={14} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            {isSyncing ? 'Sincronizando...' : 'Atualizar Dados'}
          </button>
          
          <div style={{ background: '#FFFFFF', padding: '10px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#0F172A', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <Activity size={14} color="#10B981" style={{ animation: 'pulse 1.5s infinite ease-in-out' }} /> 
            <span style={{ color: '#10B981' }}>Sistema Saudável</span>
          </div>
        </div>
      </div>

      {/* HUB MONITORING GRID */}
      <div style={{ ...HUB_METRIC_GRID_STYLE, marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
        <HubMetricCard
          label="Empresas Ativas"
          icon={Users}
          iconVariant="soft"
          accent="#0061FF"
          topRight={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                fontSize: 14,
                fontWeight: 800,
                color: '#10B981',
              }}
            >
              +12% <ArrowUpRight size={12} />
            </span>
          }
          value="124"
        />

        <HubMetricCard
          label="Storage Global"
          icon={Database}
          iconVariant="solid"
          accent="#0061FF"
          topRight={
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)' }}>60% Alocado</span>
          }
          value="1.2 TB"
          footer={
            <div
              style={{
                width: '100%',
                height: 4,
                background: '#E2E8F0',
                borderRadius: 2,
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '60%', height: '100%', background: '#10B981', borderRadius: 2 }} />
            </div>
          }
        />

        <HubMetricCard
          label="Incidentes Seg."
          icon={Shield}
          iconVariant="soft"
          accent="#0061FF"
          topRight={
            <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>Status Seguro</span>
          }
          value="0"
        />

        <HubMetricCard
          label="Requisições / seg"
          icon={Activity}
          iconVariant="solid"
          accent="#0061FF"
          topRight={
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-secondary)' }}>99.99% Global</span>
          }
          value={
            <>
              {telemetry.requests}{' '}
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-secondary)' }}>req/s</span>
            </>
          }
          footer={
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-secondary)',
                marginTop: 6,
                fontWeight: 500,
              }}
            >
              Latência média em {telemetry.latency}ms
            </div>
          }
        />
      </div>

      {/* RESUMO POR ÁREA DO NEGÓCIO */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {[
          {
            label: 'Pipeline CRM',
            value: 'R$ 842k',
            sub: 'Funis ativos em Zaptro CRM',
            pill: '+38 oportunidades esta semana',
          },
          {
            label: 'Financeiro recorrente',
            value: 'R$ 428k',
            sub: 'MRR consolidado (Logta + Zaptro)',
            pill: '+8.2% vs. mês anterior',
          },
          {
            label: 'Operações Logística',
            value: '1.284',
            sub: 'Cargas em rota hoje no Logta',
            pill: '96.2% entregas dentro do SLA',
          },
          {
            label: 'Tickets / HubChat',
            value: '142',
            sub: 'Conversas abertas em todos os canais',
            pill: '12 com risco de SLA',
          },
          {
            label: 'Status do ecossistema',
            value: '4',
            sub: 'Ambientes críticos monitorados',
            pill: '0 incidentes em produção',
          },
        ].map((card, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #E2E8F0',
              padding: '16px 18px',
              boxShadow: '0 4px 10px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: idx === 2 ? '#2A61FF' : '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: idx === 2 ? '0px' : '0.06em',
              }}
            >
              {card.label}
            </span>
            <span
              style={{
                fontSize: '33px',
                fontWeight: 800,
                color:
                  idx === 1
                    ? 'rgba(5, 5, 5, 1)'
                    : idx === 2
                      ? 'rgba(0, 0, 0, 1)'
                      : 'rgba(42, 97, 255, 1)',
                letterSpacing: '-0.03em',
                marginTop: '27px',
                marginBottom: '10px',
              }}
            >
              {card.value}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#64748B',
                fontWeight: 500,
                letterSpacing: '0.2px',
              }}
            >
              {card.sub}
            </span>
            <span
              style={{
                marginTop: 2,
                fontSize: idx === 2 ? '10px' : '11px',
                fontWeight: 700,
                color: idx === 2 ? 'rgba(255, 255, 255, 1)' : '#0061FF',
                background: idx === 2 ? 'rgba(0, 0, 0, 1)' : '#EFF6FF',
                borderRadius: 999,
                padding: idx === 2 ? '4px 19px' : '4px 10px',
                alignSelf: 'flex-start',
              }}
            >
              {card.pill}
            </span>
          </div>
        ))}
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: PRODUCTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* PRODUCT ACCESS MODULE */}
          <div className="premium-card" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', padding: '40px 36px', borderRadius: '28px', border: '1px solid #E2E8F0', boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(15, 23, 42, 0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(15, 23, 42, 0.06)'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#0061FF', letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Ecossistema</span>
                <h3 style={{ fontSize: '24px', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
                  Acesso aos Produtos
                </h3>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', marginBottom: '28px', marginTop: '10px', fontWeight: 600, lineHeight: 1.5, maxWidth: '48rem' }}>
              Acesse e gerencie cada plataforma ativa — um toque leva ao módulo completo.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
               {[
                 { name: 'Logta SaaS', desc: 'Gestão de logística e frotas de transporte', color: '#0061FF', status: 'Online', sessions: '4,120 ativas', latency: '12ms', path: '/master/logistica' },
                 { name: 'Zaptro CRM', desc: 'Gestão de vendas, funis e relacionamento de clientes', color: '#10B981', status: 'Online', sessions: '1,840 ativas', latency: '15ms', path: '/master/crm' },
                 { name: 'LogDock', desc: 'Gestão documental inteligente e OCR automatizado', color: '#F59E0B', status: 'Updating', sessions: '120 ativas', latency: '42ms', path: '/master/logdock' }
               ].map((product, i) => (
                 <div 
                   key={i} 
                   onClick={() => navigate(product.path)}
                   style={{ 
                     padding: '22px 24px', 
                     borderRadius: '18px', 
                     border: '1px solid #E2E8F0', 
                     display: 'flex', 
                     alignItems: 'center', 
                     gap: '22px', 
                     cursor: 'pointer',
                     transition: 'all 0.2s',
                     background: '#FFFFFF',
                     boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                     borderLeft: `4px solid ${product.color}`,
                   }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.borderColor = '#CBD5E1';
                     e.currentTarget.style.borderLeftColor = product.color;
                     e.currentTarget.style.boxShadow = `0 16px 40px ${product.color}22`;
                     e.currentTarget.style.transform = 'translateY(-2px)';
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.borderColor = '#E2E8F0';
                     e.currentTarget.style.borderLeftColor = product.color;
                     e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 23, 42, 0.04)';
                     e.currentTarget.style.transform = 'translateY(0)';
                   }}
                 >
                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: product.color, boxShadow: `0 0 0 4px ${product.color}33, 0 0 18px ${product.color}99`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                       <div style={{ fontWeight: 950, fontSize: '22px', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{product.name}</div>
                       <div style={{ fontSize: '15px', color: '#475569', marginTop: '6px', fontWeight: 600, lineHeight: 1.45 }}>{product.desc}</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                       <div style={{ textAlign: 'right' }}>
                         <span style={{ 
                           fontSize: '12px', 
                           fontWeight: 900, 
                           color: product.status === 'Online' ? '#059669' : '#D97706',
                           backgroundColor: product.status === 'Online' ? '#D1FAE5' : '#FEF3C7',
                           padding: '6px 12px',
                           borderRadius: '10px',
                           display: 'inline-block',
                           letterSpacing: '0.06em',
                         }}>
                           {product.status.toUpperCase()}
                         </span>
                         <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: 700 }}>{product.sessions} · {product.latency}</div>
                       </div>
                       <ChevronRight size={22} color="#94A3B8" strokeWidth={2.5} />
                    </div>
                 </div>
               ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SERVERS TELEMETRY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* TELEMETRIA DE SERVIDORES */}
          <div className="premium-card" style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0px 8px 16px rgba(0, 0, 0, 0.04)'; }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Server size={18} color="#0061FF" />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Recursos do Servidor
              </h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* CPU LOAD */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  <span>Carga da CPU</span>
                  <span>{telemetry.cpu}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${telemetry.cpu}%`, height: '100%', background: telemetry.cpu > 80 ? '#EF4444' : '#0061FF', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* MEMORY USAGE */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  <span>Uso de Memória</span>
                  <span>{telemetry.memory}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${telemetry.memory}%`, height: '100%', background: telemetry.memory > 80 ? '#F59E0B' : '#10B981', borderRadius: '3px', transition: 'width 0.4s ease' }} />
                </div>
              </div>

              {/* SMTP SERVICE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Fila SendGrid (Mail API)</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={12} /> OK
                </span>
              </div>

              {/* REDIS INSTANCE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Fila Redis (BullMQ)</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={12} /> ATIVA
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* ATIVIDADE GLOBAL — lista em largura total */}
      <div
        className="premium-card"
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          background: '#FFFFFF',
          padding: '28px 32px 8px',
          borderRadius: '28px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
            Atividade Global em Tempo Real
          </h3>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite ease-in-out', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.25)' }} />
        </div>
        <p style={{ fontSize: '13px', color: '#475569', marginBottom: '8px', marginTop: '8px', fontWeight: 600, lineHeight: 1.5 }}>
          Auditoria ativa de operações nos ambientes Logta, Zaptro e LogDock.
        </p>

        <div
          role="list"
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginTop: '20px',
            borderTop: '1px solid #E2E8F0',
          }}
        >
          {events.map((event, index) => {
            const badge = getEventBadgeStyle(event.type);
            const getSystemPath = (sys: string) => {
              switch (sys) {
                case 'Logta SaaS': return '/master/logistica';
                case 'Zaptro CRM': return '/master/crm';
                case 'LogDock': return '/master/logdock';
                default: return '/master/resultados';
              }
            };
            const isLast = index === events.length - 1;
            return (
              <div
                role="listitem"
                key={event.id}
                onClick={() => navigate(getSystemPath(event.system))}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(120px, 160px) 1fr minmax(100px, auto)',
                  alignItems: 'center',
                  gap: '20px',
                  width: '100%',
                  padding: '18px 4px',
                  borderBottom: isLast ? 'none' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: badge.bg,
                    color: badge.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    justifySelf: 'start',
                  }}
                >
                  {event.system}
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#334155', fontWeight: 500, lineHeight: 1.55, letterSpacing: '0px' }}>
                  {event.message}
                </p>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {event.time}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVOLUTIONARY GLOBAL PULSE EFFECT CSS */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default MasterHubDashboard;
