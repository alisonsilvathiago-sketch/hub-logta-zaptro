import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Coins, Cpu, Zap, Activity, Search, Clock, AlertTriangle, 
  CheckCircle2, Lock, UserPlus, TrendingUp, BarChart3, ArrowRight,
  Shield
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

import { supabase } from '@core/lib/supabase';

const CreditsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'politicas' | 'logs'>('dashboard');

  const [clients, setClients] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCreditsClients() {
      const { data } = await supabase.from('companies').select('*');
      if (data) {
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name || 'Empresa sem nome',
          balance: 0,
          ia_usage: 0,
          api_usage: 0,
          status: 'ok',
        }));
        setClients(mapped);
      }
    }
    fetchCreditsClients();
  }, []);

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
            ['politicas', Shield, 'Políticas de Retenção'],
            ['logs', Clock, 'Snapshots & Logs'],
          ].map(([key, Icon, label]) => (
            <button key={key as string} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key as any)}>
              <Icon size={16} /> {label as string}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total em Saldo" value="R$ 142.8k" icon={Coins} accent="#F59E0B" softBg="#FFFBEB" />
              <HubMetricCard label="Requisições IA (Hoje)" value="12.4k" icon={Cpu} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Evolution API (Hoje)" value="348k" icon={Zap} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Clientes em Alerta" value="5" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Gerenciamento de Saldos IA & APIs</h3>
                <div style={s.searchBox}><Search size={16} color="#94A3B8" /><input type="text" placeholder="Buscar cliente..." style={s.searchInput} /></div>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Cliente</th><th style={s.th}>Saldo Atual</th><th style={s.th}>Uso IA</th><th style={s.th}>Uso Evolution</th><th style={s.th}>Status</th><th style={s.th}>Ações</th></tr></thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/credits/${c.id}`)}>
                      <td style={s.td}><span style={s.clientName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.stat}>R$ {c.balance.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.ia_usage.toLocaleString()} reqs</span></td>
                      <td style={s.td}><span style={s.stat}>{c.api_usage.toLocaleString()} calls</span></td>
                      <td style={s.td}><span style={{ ...s.badge, color: c.status === 'warning' ? '#EF4444' : '#10B981', backgroundColor: c.status === 'warning' ? '#FEF2F2' : '#F0FDF4' }}>{c.status === 'warning' ? 'Saldo Baixo' : 'Ok'}</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/credits/${c.id}`)}>Ver Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POLÍTICAS DE RETENÇÃO */}
        {activeTab === 'politicas' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Políticas de Faturamento & Recargas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Recarga Automática', desc: 'Recarregar R$ 100,00 quando o saldo atingir R$ 20,00.', color: '#F59E0B' },
                  { label: 'Limite de Consumo IA', desc: 'Bloquear requisições de IA se o uso diário exceder R$ 50,00.', color: '#8B5CF6' },
                  { label: 'Notificação de Saldo', desc: 'Enviar alerta via Zaptro quando o saldo for menor que R$ 10,00.', color: '#0061FF' },
                ].map((p, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{p.label}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{p.desc}</p>
                    </div>
                    <button style={{ ...s.addBtn, padding: '8px 16px', fontSize: '12px' }}>Ajustar</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SNAPSHOTS & LOGS */}
        {activeTab === 'logs' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Logs de Requisições & Transações</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              {logs.map((log, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={18} color="#F59E0B" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>{log.event} · <span style={{ color: '#64748B' }}>{log.client}</span></p>
                    <p style={s.snapSub}>{log.time} · Custo: {log.cost}</p>
                  </div>
                  <CheckCircle2 size={16} color="#10B981" />
                </div>
              ))}
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
  title: { margin: 0, fontSize: '29px', fontWeight: '900', color: '#000000', letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #F59E0B', backgroundColor: '#FFFBEB', color: '#F59E0B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: hubPillTabStripStyles.container,
  tabBtn: hubPillTabStripStyles.button,
  tabActive: hubPillTabStripStyles.buttonActive,
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
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '180px' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #F59E0B', backgroundColor: '#FFFBEB', color: '#F59E0B', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
};

export default CreditsAdmin;
