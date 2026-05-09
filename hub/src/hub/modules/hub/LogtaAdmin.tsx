import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageSearch, Shield, Activity,
  Truck, MapPin, Clock, AlertTriangle,
  UserPlus, FileText, Search as SearchIcon
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'politicas' | 'logs'>('dashboard');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [filterProduct, setFilterProduct] = useState('Todos');
  const [newClient, setNewClient] = useState({ name: '', email: '', plan: 'Start' });

  const handleAddClient = () => {
    if (!newClient.email || !newClient.name) return;
    toastSuccess(`Cliente "${newClient.name}" criado! Acesso ao Logta liberado.`);
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
            <button
              key={key}
              style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }}
              onClick={() => setActiveTab(key as any)}
            >
              <Icon size={16} strokeWidth={2} /> {label}
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

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Clientes Logta / ERP</h3>
                <div style={s.searchBox}>
                  <SearchIcon size={16} color="#94A3B8" />
                  <input type="text" placeholder="Buscar..." style={s.searchInput} />
                </div>
              </div>
              <table style={s.table}>
                <thead><tr>
                  <th style={s.th}>Cliente</th><th style={s.th}>Plano</th><th style={s.th}>Rotas/mês</th><th style={s.th}>Frota</th><th style={s.th}>Status</th><th style={s.th}>Ações</th>
                </tr></thead>
                <tbody>
                  {MOCK_CLIENTS.map(c => (
                    <tr key={c.id} style={{ ...s.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logta/${c.id}`)}>
                      <td style={s.td}><span style={{ ...s.clientName, color: '#10B981' }}>{c.name}</span></td>
                      <td style={s.td}><span style={s.badge}>{c.plan}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.routes.toLocaleString()}</span></td>
                      <td style={s.td}><span style={s.stat}>{c.vehicles} un</span></td>
                      <td style={s.td}><span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: '#F0FDF4', color: '#10B981' }}>Ativo</span></td>
                      <td style={s.td} onClick={e => e.stopPropagation()}>
                        <button style={s.actionBtn} onClick={() => navigate(`/master/logta/${c.id}`)}>Ver Detalhes</button>
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
              <h3 style={s.cardTitle}>Políticas de Dados Fiscais & Logísticos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Retenção Fiscal (Legal)', desc: 'XMLs de CT-e e NF-e armazenados por 5 anos (exigência legal).', color: '#10B981' },
                  { label: 'Histórico de Rotas', desc: 'Telemetria e tracking salvos por 2 anos para auditoria.', color: '#0061FF' },
                  { label: 'Logs de Eventos ERP', desc: 'Alterações de status e financeiro por 1 ano.', color: '#F59E0B' },
                ].map((p, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1E293B' }}>{p.label}</p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>{p.desc}</p>
                    </div>
                    <button style={{ ...s.addBtn, padding: '8px 16px', fontSize: '12px' }}>Gerenciar</button>
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
                <h3 style={s.cardTitle}>Auditoria Global Logta</h3>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', backgroundColor: '#F0FDF4', padding: '6px 14px', borderRadius: '20px' }}>AO VIVO</span>
              </div>
              {MOCK_ACTIVITY.map(a => (
                <div key={a.id} style={s.actRow}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={18} color="#10B981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.actTitle}>{a.event}</p>
                    <p style={s.actSub}>{a.client} · {a.detail}</p>
                  </div>
                  <span style={s.actTime}><Clock size={13} /> {a.time}</span>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Acessos & Segurança</h3>
              </div>
              {[
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
  title: { margin: 0, fontSize: '17px', fontWeight: '900', color: '#000000', letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #10B981', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: hubPillTabStripStyles.container,
  tabBtn: { ...hubPillTabStripStyles.button, height: 39, fontSize: '13px', color: 'var(--text-title, #0F172A)' },
  tabActive: { ...hubPillTabStripStyles.buttonActive, fontSize: '13px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: 'none' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '600', width: '200px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '18px 20px', verticalAlign: 'middle' },
  clientName: { fontSize: '15px', fontWeight: '800' },
  badge: { padding: '5px 10px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '6px', fontSize: '12px', fontWeight: '800' },
  stat: { fontSize: '13px', fontWeight: 600, color: '#475569', opacity: 0.88 },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '999px', border: '2px solid #10B981', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  actRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  actTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  actSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  actTime: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#CBD5E1', whiteSpace: 'nowrap' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
};

export default LogtaAdmin;
