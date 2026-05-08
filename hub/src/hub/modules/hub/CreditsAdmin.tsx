import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins, Cpu, Zap, Activity, Search, Clock, AlertTriangle, 
  CheckCircle2, Lock, UserPlus, TrendingUp, BarChart3, ArrowRight
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', email: 'contato@falcao.com.br', balance: 2500, ia_usage: 450, api_usage: 12000, status: 'active', ia: true },
  { id: 2, name: 'Logística Express XPTO', email: 'ti@expressxpto.com', balance: 8400, ia_usage: 2100, api_usage: 45000, status: 'active', ia: true },
  { id: 3, name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', balance: 120, ia_usage: 10, api_usage: 500, status: 'warning', ia: true },
  { id: 4, name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', balance: 45000, ia_usage: 12400, api_usage: 280000, status: 'active', ia: true },
];

const CreditsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'logs'>('dashboard');

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Coins size={32} color="#F59E0B" />
          <div>
            <h1 style={s.title}>Serviços de Créditos</h1>
            <p style={s.subtitle}>Gestão de IA (OpenAI/Anthropic) e Evolution API</p>
          </div>
        </div>
        <button style={s.addBtn}>
          <Zap size={16} /> Recarregar Créditos
        </button>
      </header>

      <div style={s.content}>
        <div style={s.tabs}>
          {[
            ['dashboard', Activity, 'Dashboard'],
            ['clientes', BarChart3, 'Consumo por Cliente'],
            ['logs', Clock, 'Logs de Requisições'],
          ].map(([key, Icon, label]) => (
            <button key={key as string} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key as any)}>
              <Icon size={16} /> {label as string}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total em Saldo" value="R$ 142.8k" icon={Coins} accent="#F59E0B" softBg="#FFFBEB" />
              <HubMetricCard label="Requisições IA (Hoje)" value="12.4k" icon={Cpu} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Evolution API (Hoje)" value="348k" icon={Zap} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Clientes em Alerta" value="5" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Ranking de Consumo (Últimos 30 dias)</h3>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Cliente</th><th style={s.th}>Saldo Atual</th><th style={s.th}>Uso IA</th><th style={s.th}>Uso Evolution</th><th style={s.th}>Status</th></tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}><span style={s.clientName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.stat}>R$ {c.balance.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.ia_usage.toLocaleString()} reqs</span></td>
                      <td style={s.td}><span style={s.stat}>{c.api_usage.toLocaleString()} calls</span></td>
                      <td style={s.td}><span style={{ ...s.badge, color: c.status === 'warning' ? '#EF4444' : '#10B981', backgroundColor: c.status === 'warning' ? '#FEF2F2' : '#F0FDF4' }}>{c.status === 'warning' ? 'Saldo Baixo' : 'Ok'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', color: '#64748B', fontWeight: '600' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #F59E0B', backgroundColor: '#FFFBEB', color: '#F59E0B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', padding: '8px 0', borderRadius: '24px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  tabActive: { backgroundColor: '#FFFBEB', color: '#F59E0B' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800', color: '#1E293B' },
  stat: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
};

export default CreditsAdmin;
