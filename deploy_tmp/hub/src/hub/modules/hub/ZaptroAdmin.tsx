import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, TrendingUp, Shield, Activity,
  Search, Clock, AlertTriangle, CheckCircle2, Lock,
  UserPlus, Zap, Bell, Phone, Mail
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

import { supabase } from '@core/lib/supabase';

const ZaptroAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'politicas' | 'logs'>('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [filterProduct, setFilterProduct] = useState('Todos');
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'Start' });
  
  const [clients, setClients] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchZaptroClients() {
      const { data } = await supabase.from('companies').select('*');
      if (data) {
        const filtered = data
          .filter((c: any) => c.origin === 'zaptro' || c.plan?.toUpperCase().includes('ZAPTRO'))
          .map((c: any) => ({
            id: c.id,
            name: c.name || 'Empresa sem nome',
            plan: c.plan || 'Zaptro Pro',
            msgs: c.msgs_count || 0,
            agents: c.agents_count || 0,
          }));
        setClients(filtered);
      }
    }
    fetchZaptroClients();
  }, []);

  const handleAddClient = () => {
    if (!newClient.email || !newClient.name) return;
    toastSuccess(`Cliente "${newClient.name}" criado! Acesso ao Zaptro liberado.`);
    setIsAddClientOpen(false);
    setNewClient({ name: '', email: '', plan: 'Start' });
  };

  const tabDef: Array<[string, React.ElementType, string]> = [
    ['dashboard', Activity, 'Dashboard'],
    ['politicas', Shield, 'Políticas de Retenção'],
    ['logs', Clock, 'Snapshots & Logs'],
  ];

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <MessageSquare size={32} color="#7C3AED" />
          <div>
            <h1 style={s.title}>Zaptro</h1>
            <p style={s.subtitle}>Painel Master de Administração de Canais</p>
          </div>
        </div>
        <button style={{ ...s.addBtn, borderColor: '#7C3AED', backgroundColor: '#F5F3FF', color: '#7C3AED' }} onClick={() => setIsAddClientOpen(true)}>
          <UserPlus size={16} /> Adicionar Cliente
        </button>
      </header>

      <div style={s.content}>
        <div style={s.tabs}>
          {tabDef.map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key as any)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Mensagens Hoje" value="48,2k" icon={MessageSquare} accent="#7C3AED" softBg="#F5F3FF" />
              <HubMetricCard label="Atendimentos Ativos" value="312" icon={Zap} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Agentes Online" value="67" icon={Users} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Clientes com Alerta" value="2" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Clientes Zaptro Ativos</h3>
                <div style={s.searchBox}><Search size={16} color="#94A3B8" /><input type="text" placeholder="Buscar..." style={s.searchInput} /></div>
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th><th style={s.th}>Plano</th><th style={s.th}>Mensagens/mês</th><th style={s.th}>Agentes</th><th style={s.th}>Status</th><th style={s.th}>Ações</th>
                </tr></thead>
                <tbody>
                  {clients.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/zaptro/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#7C3AED', textDecoration: 'underline dotted' }}>{c.name}</span></td>
                      <td style={s.td}><span style={s.badge}>{c.plan}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.msgs.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.agents}</span></td>
                      <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' }}>● Ativo</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/zaptro/${c.id}`)}>Ver Detalhes</button>
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
              <h3 style={s.cardTitle}>Políticas de Armazenamento de Mensagens</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Retenção Padrão (Zaptro Start)', desc: 'Mensagens e mídias armazenadas por 90 dias.', color: '#7C3AED' },
                  { label: 'Retenção Extendida (Zaptro Pro)', desc: 'Mensagens e mídias armazenadas por 1 ano.', color: '#10B981' },
                  { label: 'Retenção Enterprise', desc: 'Histórico ilimitado com backup em cold storage.', color: '#0061FF' },
                ].map((p, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{p.label}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{p.desc}</p>
                    </div>
                    <button style={{ ...s.addBtn, padding: '8px 16px', fontSize: '12px' }}>Configurar</button>
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
                <h3 style={s.cardTitle}>Snapshots de Instâncias & Auditoria</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              {activities.map(a => (
                <div key={a.id} style={s.actRow}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={18} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.actTitle}>{a.event}</p>
                    <p style={s.actSub}>{a.client} · Canal: {a.channel}</p>
                  </div>
                  <span style={s.actTime}><Clock size={13} /> {a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LogtaModal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} title="Adicionar Cliente Zaptro" subtitle="Crie a conta e libere o acesso ao Zaptro" icon={<UserPlus color="#7C3AED" />}
        primaryAction={{ label: 'Criar & Liberar Acesso', onClick: handleAddClient }} secondaryAction={{ label: 'Cancelar', onClick: () => setIsAddClientOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {[['Nome da Empresa', 'name', 'text', 'Ex: Transportadora XYZ'], ['E-mail de Acesso', 'email', 'email', 'contato@empresa.com']].map(([label, field, type, ph]) => (
            <div key={field as string}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>{label as string}</label>
              <input type={type as string} placeholder={ph as string} value={(newClient as any)[field as string]} onChange={e => setNewClient(p => ({ ...p, [field as string]: e.target.value }))}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>Plano Zaptro</label>
            <select value={newClient.plan} onChange={e => setNewClient(p => ({ ...p, plan: e.target.value }))} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none' }}>
              {['Start', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  title: { margin: 0, fontSize: '29px', fontWeight: '900', color: '#000000', letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: hubPillTabStripStyles.container,
  tabBtn: hubPillTabStripStyles.button,
  tabActive: hubPillTabStripStyles.buttonActive,
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  barLabel: { width: '160px', fontSize: '13px', fontWeight: '700', color: '#475569' },
  barTrack: { flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px' },
  barVal: { width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  statusRow: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' },
  statusTitle: { margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  statusDesc: { margin: 0, fontSize: '12px', color: '#64748B' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', backgroundColor: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '180px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800' },
  badge: { padding: '5px 10px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '12px', fontWeight: '800' },
  stat: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #7C3AED', backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  actRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  actTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  actSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  actTime: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#CBD5E1', whiteSpace: 'nowrap' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
};

export default ZaptroAdmin;
