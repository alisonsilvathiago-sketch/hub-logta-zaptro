import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, TrendingUp, Shield, Zap,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  Users, Phone, Mail, Bell, Globe
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { id: '1', name: 'Transportadora Falcão', email: 'contato@falcao.com.br', plan: 'Start', msgs: 4820, limit: 10000, agents: 3, status: 'active' },
  '2': { id: '2', name: 'Logística Express XPTO', email: 'ti@expressxpto.com', plan: 'Pro', msgs: 28400, limit: 50000, agents: 12, status: 'active' },
  '3': { id: '3', name: 'Cargas Rápidas BR', email: 'admin@cargasrapidas.com.br', plan: 'Start', msgs: 1200, limit: 10000, agents: 2, status: 'active' },
  '4': { id: '4', name: 'Transcontinental S.A.', email: 'ti@transcontinental.com', plan: 'Enterprise', msgs: 142000, limit: 500000, agents: 48, status: 'active' },
};

const ZaptroClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'uso' | 'canais' | 'seguranca' | 'faturamento'>('uso');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: client.name, email: client.email, plan: client.plan, limit: String(client.limit) });

  const pct = (client.msgs / Number(editForm.limit)) * 100;

  const handleSave = () => {
    toastSuccess(`Dados de "${editForm.name}" atualizados no Zaptro!`);
    setIsEditing(false);
  };

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/master/zaptro-admin')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ ...s.avatar, backgroundColor: '#7C3AED' }}>{client.name[0]}</div>
          <div>
            {isEditing ? (
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={s.editInput} />
            ) : (
              <h1 style={s.clientName}>{editForm.name}</h1>
            )}
            <p style={s.clientSub}>{editForm.email} · Zaptro {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={s.cancelBtn} onClick={() => setIsEditing(false)}><X size={16} /> Cancelar</button>
              <button style={{ ...s.saveBtn, backgroundColor: '#7C3AED' }} onClick={handleSave}><Save size={16} /> Salvar</button>
            </>
          ) : (
            <button style={{ ...s.editBtn, borderColor: '#7C3AED', color: '#7C3AED', backgroundColor: '#F5F3FF' }} onClick={() => setIsEditing(true)}><Edit3 size={16} /> Editar Cliente</button>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['uso', TrendingUp, 'Consumo de Mensagens'],
            ['canais', Zap, 'Canais Ativos'],
            ['seguranca', Shield, 'Segurança & API'],
            ['faturamento', Clock, 'Faturamento'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { backgroundColor: '#F5F3FF', color: '#7C3AED' } : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* USO DE MENSAGENS */}
        {activeTab === 'uso' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Mensagens Enviadas" value={client.msgs.toLocaleString()} icon={MessageSquare} accent="#7C3AED" softBg="#F5F3FF" />
              <HubMetricCard label="Limite Mensal" value={Number(editForm.limit).toLocaleString()} icon={Globe} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Agentes Ativos" value={String(client.agents)} icon={Users} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Uso do Plano" value={`${pct.toFixed(1)}%`} icon={TrendingUp} accent={pct > 90 ? '#EF4444' : '#7C3AED'} softBg={pct > 90 ? '#FEF2F2' : '#F5F3FF'} />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Controle de Cota</h3>
              <div style={s.storageVisual}>
                <div style={s.storageBar}>
                  <div style={{ ...s.storageFill, width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? '#EF4444' : '#7C3AED' }} />
                </div>
                <div style={s.storageLegend}>
                  <span style={s.usedText}>{client.msgs.toLocaleString()} msgs enviadas</span>
                  <span style={s.totalText}>Limite: {Number(editForm.limit).toLocaleString()}</span>
                </div>
              </div>

              {isEditing && (
                <div style={s.editSection}>
                  <label style={s.fieldLabel}>Novo Limite de Mensagens</label>
                  <input type="number" value={editForm.limit} onChange={e => setEditForm(p => ({ ...p, limit: e.target.value }))} style={s.fieldInput} />
                  <label style={s.fieldLabel}>Plano Zaptro</label>
                  <select value={editForm.plan} onChange={e => setEditForm(p => ({ ...p, plan: e.target.value }))} style={s.fieldInput}>
                    {['Start', 'Pro', 'Enterprise'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CANAIS */}
        {activeTab === 'canais' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Configuração de Canais</h3>
              {[
                { label: 'WhatsApp API', status: 'Ativo', icon: Phone, color: '#25D366' },
                { label: 'Chat Web', status: 'Ativo', icon: MessageSquare, color: '#7C3AED' },
                { label: 'Instagram Direct', status: 'Inativo', icon: Globe, color: '#CBD5E1' },
                { label: 'E-mail Transacional', status: 'Ativo', icon: Mail, color: '#0061FF' },
              ].map(c => (
                <div key={c.label} style={s.channelRow}>
                  <div style={{ ...s.channelIcon, backgroundColor: c.color + '15' }}><c.icon size={18} color={c.color} /></div>
                  <div style={{ flex: 1 }}><p style={s.snapTitle}>{c.label}</p><p style={s.snapSub}>{c.status === 'Ativo' ? 'Operando normalmente' : 'Não configurado'}</p></div>
                  <span style={{ ...s.snapOk, backgroundColor: c.status === 'Ativo' ? '#F0FDF4' : '#F8FAFC', color: c.status === 'Ativo' ? '#10B981' : '#CBD5E1' }}>{c.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Logs de Acesso & API</h3>
              {[
                { action: 'Nova API Key gerada', time: 'Há 2 horas', color: '#7C3AED', icon: '🔑' },
                { action: 'Webhook atualizado', time: 'Há 5 horas', color: '#0061FF', icon: '→' },
                { action: 'Login detectado', time: 'Há 1 dia', color: '#10B981', icon: '👤' },
              ].map((ev, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ ...s.auditIcon, backgroundColor: ev.color + '15' }}>{ev.icon}</div>
                  <div style={{ flex: 1 }}><p style={s.auditTitle}>{ev.action}</p></div>
                  <span style={s.auditTime}>{ev.time}</span>
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
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: 'white' },
  clientName: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  editInput: { fontSize: '22px', fontWeight: '900', color: '#0F172A', border: '2px solid #7C3AED', borderRadius: '12px', padding: '8px 16px', outline: 'none' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', padding: '8px 0', borderRadius: '24px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  storageVisual: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  storageBar: { height: '12px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: '6px', transition: 'width 1s ease' },
  storageLegend: { display: 'flex', justifyContent: 'space-between' },
  usedText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  totalText: { fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
  editSection: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  fieldInput: { padding: '12px 16px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '15px', fontWeight: '700', outline: 'none' },
  channelRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  channelIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  snapOk: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  auditIcon: { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' },
  auditTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  auditTime: { fontSize: '12px', fontWeight: '700', color: '#CBD5E1' },
};

export default ZaptroClientProfile;
