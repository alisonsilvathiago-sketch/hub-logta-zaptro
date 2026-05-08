import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageSearch, Users, TrendingUp, Shield, Activity,
  Truck, MapPin, Clock, AlertTriangle, CheckCircle2,
  Lock, UserPlus, DollarSign, FileText, Zap
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS = [
  { id: 1, name: 'Transportadora Falcão', email: 'contato@falcao.com.br', plan: 'Start', routes: 84, vehicles: 12, status: 'active', zaptro: true, logta: true, logdock: true, ia: false, backup: true },
  { id: 2, name: 'Logística Express XPTO', email: 'ti@expressxpto.com', plan: 'Pro', routes: 412, vehicles: 78, status: 'active', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
  { id: 3, name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', plan: 'Start', routes: 23, vehicles: 5, status: 'active', zaptro: true, logta: false, logdock: true, ia: false, backup: false },
  { id: 4, name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', plan: 'Enterprise', routes: 2840, vehicles: 420, status: 'active', zaptro: true, logta: true, logdock: true, ia: true, backup: true },
];

const MOCK_ACTIVITY = [
  { id: 1, client: 'Transcontinental S.A.', event: 'Rota finalizada com sucesso', detail: 'SP → RJ · 432 km', time: 'Há 3 min' },
  { id: 2, client: 'Logística Express XPTO', event: 'Novo CTE emitido', detail: 'CT-e Nº 94812', time: 'Há 10 min' },
  { id: 3, client: 'Transportadora Falcão', event: 'Veículo em atraso detectado', detail: 'Placa ABC-1234 · 45 min atrasado', time: 'Há 18 min' },
  { id: 4, client: 'Cargas Rápidas BR', event: 'Entrega confirmada (POD)', detail: 'Assinatura digital coletada', time: 'Há 25 min' },
];

const LogtaAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clientes' | 'operacoes' | 'seguranca'>('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [filterProduct, setFilterProduct] = useState('Todos');
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'Start' });

  const handleAddClient = () => {
    if (!newClient.email || !newClient.name) return;
    toastSuccess(`Cliente "${newClient.name}" criado! Acesso ao Logta liberado.`);
    setIsAddClientOpen(false);
    setNewClient({ name: '', email: '', plan: 'Start' });
  };

  const tabDef: Array<[typeof activeTab, React.ElementType, string]> = [
    ['dashboard', Activity, 'Dashboard'],
    ['clientes', Users, 'Gestão de Clientes'],
    ['operacoes', TrendingUp, 'Monitor de Operações'],
    ['seguranca', Shield, 'Segurança & Logs'],
  ];

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <PackageSearch size={32} color="#10B981" />
          <div>
            <h1 style={s.title}>Logta</h1>
            <p style={s.subtitle}>Painel Master de Administração — Logística & ERP</p>
          </div>
        </div>
        <button style={s.addBtn} onClick={() => setIsAddClientOpen(true)}>
          <UserPlus size={16} /> Adicionar Cliente
        </button>
      </header>

      <div style={s.content}>
        <div style={s.tabs}>
          {tabDef.map(([key, Icon, label]) => (
            <button key={key}
              style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }}
              onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Rotas Ativas" value="3,359" icon={MapPin} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Veículos Cadastrados" value="515" icon={Truck} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="CT-es Emitidos Hoje" value="842" icon={FileText} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Alertas de Atraso" value="4" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
            </div>

            {/* Filtro de produtos */}
            <div style={s.card}>
              <h3 style={s.cardTitle}>Uso por Produto — Clientes Ativos</h3>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
                {['Todos', 'Zaptro', 'Logta', 'LogDock', 'IA Créditos', 'Backups'].map(prod => {
                  const isActive = filterProduct === prod;
                  return (
                    <button 
                      key={prod} 
                      onClick={() => setFilterProduct(prod)}
                      style={{ 
                        padding: '8px 18px', 
                        borderRadius: '999px', 
                        border: '2px solid', 
                        borderColor: isActive ? '#10B981' : '#E2E8F0', 
                        backgroundColor: isActive ? '#F0FDF4' : 'white', 
                        color: isActive ? '#10B981' : '#64748B', 
                        fontSize: '13px', 
                        fontWeight: '800', 
                        cursor: 'pointer',
                        transition: '0.2s'
                      }}
                    >
                      {prod}
                    </button>
                  );
                })}
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th>
                  <th style={s.th}>Zaptro</th><th style={s.th}>Logta</th><th style={s.th}>LogDock</th><th style={s.th}>IA Créditos</th><th style={s.th}>Backups</th>
                </tr></thead>
                <tbody>
                  {MOCK_CLIENTS
                    .filter(c => {
                      if (filterProduct === 'Todos') return true;
                      if (filterProduct === 'Zaptro') return c.zaptro;
                      if (filterProduct === 'Logta') return c.logta;
                      if (filterProduct === 'LogDock') return c.logdock;
                      if (filterProduct === 'IA Créditos') return c.ia;
                      if (filterProduct === 'Backups') return c.backup;
                      return true;
                    })
                    .map((c, i) => (
                    <tr key={i} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logta-admin/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#10B981', textDecoration: 'underline dotted' }}>{c.name}</span></td>
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
                <h3 style={s.cardTitle}>Performance de Entregas</h3>
                {[['No Prazo', '87%', '#10B981'], ['Em Atraso', '8%', '#EF4444'], ['Em Trânsito', '5%', '#F59E0B']].map(([label, pct, color]) => (
                  <div key={label as string} style={s.barRow}>
                    <span style={s.barLabel}>{label as string}</span>
                    <div style={s.barTrack}><div style={{ ...s.barFill, width: pct as string, backgroundColor: color as string }} /></div>
                    <span style={s.barVal}>{pct as string}</span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Status da Plataforma</h3>
                {[['Motor de Rotas', 'Operando · 22ms'], ['Emissão CT-e', 'Operando'], ['Rastreamento GPS', 'Operando'], ['POD Digital', 'Operando']].map(([t, d]) => (
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
                <h3 style={s.cardTitle}>Clientes Logta</h3>
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th><th style={s.th}>Plano</th><th style={s.th}>Rotas</th><th style={s.th}>Veículos</th><th style={s.th}>Status</th><th style={s.th}>Ações</th>
                </tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logta-admin/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#10B981', textDecoration: 'underline dotted' }}>{c.name}</span></td>
                      <td style={s.td}><span style={s.badge}>{c.plan}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.routes.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.vehicles}</span></td>
                      <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' }}>● Ativo</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/logta-admin/${c.id}`)}>Ver Perfil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MONITOR DE OPERAÇÕES */}
        {activeTab === 'operacoes' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Rotas Hoje" value="284" icon={MapPin} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Entregas Concluídas" value="198" icon={CheckCircle2} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Km Rodados Hoje" value="48.2k" icon={Truck} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="CT-es Emitidos" value="842" icon={FileText} accent="#F59E0B" softBg="#FFF7ED" />
            </div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Atividade Operacional em Tempo Real</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>● AO VIVO</span>
              </div>
              {MOCK_ACTIVITY.map(a => (
                <div key={a.id} style={s.actRow}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={18} color="#10B981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.actTitle}>{a.event}</p>
                    <p style={s.actSub}>{a.client} · {a.detail}</p>
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
              <HubMetricCard label="Sessões Ativas" value="67" icon={Zap} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Acessos Negados" value="3" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Logs de Auditoria" value="6.1k" icon={Shield} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Criptografia" value="AES-256" icon={Lock} accent="#0061FF" softBg="#EFF6FF" />
            </div>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Trilha de Auditoria</h3>
              {[
                { action: 'CT-e emitido com sucesso', detail: 'Logística Express XPTO · CT-e Nº 94812', time: '14:32', color: '#10B981', icon: '✓' },
                { action: 'Login realizado', detail: 'Transcontinental S.A. · IP 189.40.12.3', time: '14:15', color: '#0061FF', icon: '→' },
                { action: 'Rota alterada manualmente', detail: 'Transportadora Falcão · Rota SP→RJ', time: '12:00', color: '#F59E0B', icon: '✎' },
                { action: 'Acesso negado', detail: 'IP não autorizado: 203.45.12.99', time: '10:20', color: '#EF4444', icon: '✕' },
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

      <LogtaModal isOpen={isAddClientOpen} onClose={() => setIsAddClientOpen(false)} title="Adicionar Cliente Logta" subtitle="Crie a conta e libere o acesso ao Logta" icon={<UserPlus color="#10B981" />}
        primaryAction={{ label: 'Criar & Liberar Acesso', onClick: handleAddClient }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setIsAddClientOpen(false) }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
          {[['Nome da Empresa', 'name', 'text', 'Ex: Transportadora XYZ'], ['E-mail de Acesso', 'email', 'email', 'contato@empresa.com']].map(([label, field, type, ph]) => (
            <div key={field as string}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>{label as string}</label>
              <input type={type as string} placeholder={ph as string} value={(newClient as any)[field as string]}
                onChange={e => setNewClient(p => ({ ...p, [field as string]: e.target.value }))}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px' }}>Plano Logta</label>
            <select value={newClient.plan} onChange={e => setNewClient(p => ({ ...p, plan: e.target.value }))}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '600', outline: 'none' }}>
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
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #10B981', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', backgroundColor: '#FFFFFF', padding: '8px', borderRadius: '24px', width: 'fit-content', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { backgroundColor: '#F0FDF4', color: '#10B981' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  grid2: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  barLabel: { width: '120px', fontSize: '13px', fontWeight: '700', color: '#475569' },
  barTrack: { flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px' },
  barVal: { width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: '800', color: '#0F172A' },
  statusRow: { display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' },
  statusTitle: { margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  statusDesc: { margin: 0, fontSize: '12px', color: '#64748B' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800' },
  badge: { padding: '5px 10px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '12px', fontWeight: '800' },
  stat: { fontSize: '14px', fontWeight: '700', color: '#475569' },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #10B981', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  actRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  actTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  actSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  actTime: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#CBD5E1', whiteSpace: 'nowrap' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
};

export default LogtaAdmin;
