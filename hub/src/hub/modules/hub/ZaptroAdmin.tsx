import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, TrendingUp, Shield, Activity,
  Search, Clock, AlertTriangle, CheckCircle2, Lock,
  UserPlus, Zap, Bell, Phone, Mail
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', email: 'contato@falcao.com.br', plan: 'Start', msgs: 4820, agents: 3, status: 'active', zaptro: true, logta: true, logdock: true, ia: false, backup: true },
  { id: 2, name: 'Logística Express XPTO', email: 'ti@expressxpto.com', plan: 'Pro', msgs: 28400, agents: 12, status: 'active', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
  { id: 3, name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', plan: 'Start', msgs: 1200, agents: 2, status: 'active', zaptro: true, logta: false, logdock: true, ia: false, backup: false },
  { id: 4, name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', plan: 'Enterprise', msgs: 142000, agents: 48, status: 'active', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
];

const MOCK_ACTIVITY = [
  { id: 1, client: 'Transportadora Falcão', event: 'Novo atendimento iniciado', channel: 'WhatsApp', time: 'Há 2 min', type: 'msg' },
  { id: 2, client: 'Transcontinental S.A.', event: '142 mensagens enviadas em massa', channel: 'Campanha', time: 'Há 8 min', type: 'bulk' },
  { id: 3, client: 'Logística Express XPTO', event: 'Agente respondeu via IA', channel: 'Chat', time: 'Há 15 min', type: 'ia' },
  { id: 4, client: 'Cargas Rápidas BR', event: 'Bot de triagem ativado', channel: 'WhatsApp', time: 'Há 22 min', type: 'bot' },
];

const ZaptroAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'atividade' | 'seguranca'>('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'Start' });

  const handleAddClient = () => {
    if (!newClient.email || !newClient.name) return;
    toastSuccess(`Cliente "${newClient.name}" criado! Acesso ao Zaptro liberado.`);
    setIsAddClientOpen(false);
    setNewClient({ name: '', email: '', plan: 'Start' });
  };

  const tabDef: Array<[typeof activeTab, React.ElementType, string]> = [
    ['dashboard', Activity, 'Dashboard'],
    ['clientes', Users, 'Gestão de Clientes'],
    ['atividade', TrendingUp, 'Monitor de Uso'],
    ['seguranca', Shield, 'Segurança & Logs'],
  ];

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <MessageSquare size={32} color="#7C3AED" />
          <div>
            <h1 style={s.title}>Zaptro</h1>
            <p style={s.subtitle}>Painel de Controle</p>
          </div>
        </div>
        <button style={{ ...s.addBtn, borderColor: '#7C3AED', backgroundColor: '#F5F3FF', color: '#7C3AED' }} onClick={() => setIsAddClientOpen(true)}>
          <UserPlus size={16} /> Adicionar Cliente
        </button>
      </header>

      <div style={s.content}>
        <div style={s.tabs}>
          {tabDef.map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { ...s.tabActive, backgroundColor: '#F5F3FF', color: '#7C3AED' } : {}) }} onClick={() => setActiveTab(key)}>
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
              <h3 style={s.cardTitle}>Uso por Produto — Clientes Ativos</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {['Todos', 'Zaptro', 'Logta', 'LogDock', 'IA Créditos', 'Backups'].map(prod => (
                  <button key={prod} style={{ padding: '8px 18px', borderRadius: '999px', border: '2px solid', borderColor: prod === 'Todos' ? '#7C3AED' : '#E2E8F0', backgroundColor: prod === 'Todos' ? '#F5F3FF' : 'white', color: prod === 'Todos' ? '#7C3AED' : '#64748B', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                    {prod}
                  </button>
                ))}
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th>
                  <th style={s.th}>Zaptro</th><th style={s.th}>Logta</th><th style={s.th}>LogDock</th><th style={s.th}>IA Créditos</th><th style={s.th}>Backups</th>
                </tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map((c, i) => (
                    <tr key={i} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/zaptro-admin/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#7C3AED', textDecoration: 'underline dotted' }}>{c.name}</span></td>
                      {[c.zaptro, c.logta, c.logdock, c.ia, c.backup].map((active, j) => (
                        <td key={j} style={s.td}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: active ? '#F0FDF4' : '#F8FAFC', color: active ? '#10B981' : '#CBD5E1' }}>{active ? '✓ Ativo' : '—'}</span></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={s.grid2}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Volume de Mensagens por Canal</h3>
                {[['WhatsApp', '62%', '#25D366'], ['Chat Web', '21%', '#7C3AED'], ['E-mail', '11%', '#0061FF'], ['SMS', '6%', '#F59E0B']].map(([label, pct, color]) => (
                  <div key={label as string} style={s.barRow}>
                    <span style={s.barLabel}>{label as string}</span>
                    <div style={s.barTrack}><div style={{ ...s.barFill, width: pct as string, backgroundColor: color as string }} /></div>
                    <span style={s.barVal}>{pct as string}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Status da Infraestrutura</h3>
                {[['API WhatsApp', 'Operando · 18ms'], ['Fila de Mensagens (BullMQ)', 'Operando'], ['Servidor de E-mail', 'Operando'], ['Bot de Triagem IA', 'Operando']].map(([t, d]) => (
                  <div key={t as string} style={s.statusRow}>
                    <CheckCircle2 size={18} color="#10B981" />
                    <div><p style={s.statusTitle}>{t as string}</p><p style={s.statusDesc}>{d as string}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GESTÃO DE CLIENTES */}
        {activeTab === 'clientes' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Clientes Zaptro</h3>
                <div style={s.searchBox}><Search size={16} color="#94A3B8" /><input type="text" placeholder="Buscar..." style={s.searchInput} /></div>
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th><th style={s.th}>Plano</th><th style={s.th}>Mensagens/mês</th><th style={s.th}>Agentes</th><th style={s.th}>Status</th><th style={s.th}>Ações</th>
                </tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/zaptro-admin/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#7C3AED', textDecoration: 'underline dotted' }}>{c.name}</span></td>
                      <td style={s.td}><span style={s.badge}>{c.plan}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.msgs.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.agents}</span></td>
                      <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' }}>● Ativo</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/zaptro-admin/${c.id}`)}>Ver Perfil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MONITOR DE USO */}
        {activeTab === 'atividade' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Mensagens Hoje" value="48,2k" icon={MessageSquare} accent="#7C3AED" softBg="#F5F3FF" />
              <HubMetricCard label="Atendimentos Abertos" value="312" icon={Phone} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="E-mails Enviados" value="1,240" icon={Mail} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Notificações Disparadas" value="8,900" icon={Bell} accent="#F59E0B" softBg="#FFF7ED" />
            </div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Atividade em Tempo Real</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              {MOCK_ACTIVITY.map(a => (
                <div key={a.id} style={s.actRow}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={18} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.actTitle}>{a.event}</p>
                    <p style={s.actSub}>{a.client} · {a.channel}</p>
                  </div>
                  <span style={s.actTime}><Clock size={13} /> {a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="JWT Validados Hoje" value="18,4k" icon={Lock} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Tentativas Negadas" value="7" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Logs de Auditoria" value="9.2k" icon={Shield} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="API Keys Ativas" value="24" icon={Zap} accent="#10B981" softBg="#F0FDF4" />
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Trilha de Auditoria</h3>
              {[
                { action: 'Campanha enviada com sucesso', detail: 'Transcontinental S.A. · 142 destinatários', time: '14:32', color: '#10B981', icon: '✓' },
                { action: 'Token JWT inválido detectado', detail: 'IP 203.45.12.99 · rota /v1/transactional', time: '14:18', color: '#EF4444', icon: '✕' },
                { action: 'Nova API Key gerada', detail: 'Logística Express XPTO', time: '12:00', color: '#7C3AED', icon: '🔑' },
                { action: 'Rate limit atingido', detail: 'Cargas Rápidas BR · 1000 req/min', time: '10:45', color: '#F59E0B', icon: '⚠' },
                { action: 'Webhook configurado', detail: 'Transportadora Falcão · endpoint ativo', time: '09:20', color: '#0061FF', icon: '→' },
              ].map((ev, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: ev.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{ev.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' }}>{ev.action}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>{ev.detail}</p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#CBD5E1' }}>{ev.time}</span>
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
  title: { margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  subtitle: { margin: 0, fontSize: '14px', color: '#64748B', fontWeight: '600' },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '24px', width: 'fit-content', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { borderRadius: '16px' },
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
