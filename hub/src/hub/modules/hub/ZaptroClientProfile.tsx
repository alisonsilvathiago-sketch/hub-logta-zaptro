import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MessageSquare, TrendingUp, Shield, Zap,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  FileText, DollarSign, Activity, Users, Building2,
  Phone, Mail, UserCheck, Key, ChevronRight, Share2, MessageCircle
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { 
    id: '1', 
    name: 'Transportadora Falcão', 
    email: 'contato@falcao.com.br', 
    plan: 'Pro', 
    status: 'active',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    address: 'Av. das Indústrias, 1200 - São Paulo, SP',
    responsible: 'Ricardo Falcão',
    msgs: 14200, 
    agents: 5,
    collaborators: [
      { id: 1, name: 'João Silva', role: 'Operacional', lastLogin: 'Há 2h' },
      { id: 2, name: 'Maria Souza', role: 'Atendimento', lastLogin: 'Há 1 dia' },
    ],
    channels: [
      { id: 1, name: 'WhatsApp Principal', status: 'Conectado', type: 'WhatsApp' },
      { id: 2, name: 'Chat Web Site', status: 'Conectado', type: 'WebWidget' },
    ]
  },
};

const ZaptroClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'comunicacao' | 'cadastro' | 'canais' | 'seguranca'>('comunicacao');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: client.name, 
    email: client.email, 
    plan: client.plan, 
    cnpj: client.cnpj,
    phone: client.phone,
    address: client.address,
    responsible: client.responsible,
    status: client.status
  });

  const handleSave = () => {
    toastSuccess(`Perfil de "${editForm.name}" atualizado no Zaptro!`);
    setIsEditing(false);
  };

  const statusColors = {
    active: { bg: '#F0FDF4', text: '#10B981', label: '✓ Ativo' },
    blocked: { bg: '#FEF2F2', text: '#EF4444', label: '✕ Bloqueado' },
    warning: { bg: '#FFFBEB', text: '#F59E0B', label: '⚠ Pendente' },
  };

  const currStatus = (statusColors as any)[editForm.status] || statusColors.active;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEditing ? (
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={s.editInput} />
              ) : (
                <h1 style={s.clientName}>{editForm.name}</h1>
              )}
              <span style={{ ...s.statusBadge, backgroundColor: currStatus.bg, color: currStatus.text }}>{currStatus.label}</span>
            </div>
            <p style={s.clientSub}>{editForm.email} · Zaptro {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={s.cancelBtn} onClick={() => setIsEditing(false)}><X size={16} /> Cancelar</button>
              <button style={{ ...s.saveBtn, backgroundColor: '#7C3AED' }} onClick={handleSave}><Save size={16} /> Salvar Alterações</button>
            </>
          ) : (
            <button style={{ ...s.editBtn, borderColor: '#7C3AED', color: '#7C3AED', backgroundColor: '#F5F3FF' }} onClick={() => setIsEditing(true)}><Edit3 size={16} /> Editar Perfil</button>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['comunicacao', MessageSquare, 'Comunicação'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['canais', Share2, 'Canais & API'],
            ['seguranca', Shield, 'Acesso & Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { backgroundColor: '#F5F3FF', color: '#7C3AED' } : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* COMUNICAÇÃO */}
        {activeTab === 'comunicacao' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Mensagens Mensais" value={client.msgs.toLocaleString()} icon={MessageCircle} accent="#7C3AED" softBg="#F5F3FF" />
              <HubMetricCard label="Agentes Ativos" value={String(client.agents)} icon={Users} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Tempo Médio Resposta" value="1.2 min" icon={Clock} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Satisfação (NPS)" value="4.8" icon={CheckCircle2} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Volume Diário de Mensagens</h3>
              <div style={s.placeholderChart}>[Gráfico de Volume de Mensagens]</div>
            </div>
          </div>
        )}

        {/* DADOS CADASTRAIS */}
        {activeTab === 'cadastro' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Informações da Empresa</h3>
              <div style={s.formGrid}>
                {[
                  ['CNPJ / CPF', 'cnpj', FileText],
                  ['Responsável', 'responsible', UserCheck],
                  ['Telefone', 'phone', Phone],
                  ['E-mail', 'email', Mail],
                ].map(([label, key, Icon]: any) => (
                  <div key={key} style={s.fieldGroup}>
                    <label style={s.fieldLabel}>{label}</label>
                    <div style={s.fieldInputWrapper}>
                      <Icon size={16} color="#94A3B8" />
                      {isEditing ? (
                        <input value={(editForm as any)[key]} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={s.fieldInput} />
                      ) : (
                        <span style={s.fieldValue}>{(editForm as any)[key]}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ ...s.fieldGroup, gridColumn: 'span 2' }}>
                  <label style={s.fieldLabel}>Endereço Completo</label>
                  <div style={s.fieldInputWrapper}>
                    <MapPin size={16} color="#94A3B8" />
                    {isEditing ? (
                      <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} style={s.fieldInput} />
                    ) : (
                      <span style={s.fieldValue}>{editForm.address}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Usuários do Zaptro</h3>
                <button style={{ ...s.addSmallBtn, backgroundColor: '#F5F3FF', color: '#7C3AED' }}><Zap size={14} /> Novo Usuário</button>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Nome</th><th style={s.th}>Cargo</th><th style={s.th}>Último Acesso</th><th style={s.th}>Ações</th></tr></thead>
                <tbody>
                  {client.collaborators.map((c: any) => (
                    <tr key={c.id} style={s.tr}>
                      <td style={s.td}><span style={s.colabName}>{c.name}</span></td>
                      <td style={s.td}><span style={s.colabRole}>{c.role}</span></td>
                      <td style={s.td}><span style={s.colabTime}>{c.lastLogin}</span></td>
                      <td style={s.td}>
                        <button style={s.iconBtn} title="Resetar Senha"><Key size={14} /></button>
                        <button style={s.iconBtn} title="Editar"><Edit3 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CANAIS & API */}
        {activeTab === 'canais' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Canais de Atendimento Ativos</h3>
              {client.channels.map((ch: any) => (
                <div key={ch.id} style={s.channelRow}>
                  <div style={{ ...s.channelIcon, backgroundColor: ch.type === 'WhatsApp' ? '#F0FDF4' : '#F5F3FF' }}>
                    {ch.type === 'WhatsApp' ? <MessageCircle size={18} color="#10B981" /> : <Activity size={18} color="#7C3AED" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.driverName}>{ch.name}</p>
                    <p style={s.driverSub}>{ch.type}</p>
                  </div>
                  <span style={{ ...s.driverStatus, color: '#10B981' }}>{ch.status}</span>
                </div>
              ))}
              <button style={s.viewAllBtn}>Configurar Nova API <ChevronRight size={16} /></button>
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
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  editInput: { fontSize: '22px', fontWeight: '900', color: '#0F172A', border: '2px solid #7C3AED', borderRadius: '12px', padding: '4px 12px', outline: 'none', backgroundColor: 'white' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: { display: 'flex', gap: '8px', padding: '8px 0', borderRadius: '24px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', border: 'none', background: 'none', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '32px', padding: '32px', border: '1px solid #E2E8F0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldInputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' },
  fieldValue: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  fieldInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1E293B', width: '100%' },
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px', verticalAlign: 'middle' },
  colabName: { fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  colabRole: { fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' },
  colabTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '6px' },
  channelRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  channelIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  driverName: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  driverSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  driverStatus: { fontSize: '11px', fontWeight: '800' },
  viewAllBtn: { width: '100%', padding: '14px', marginTop: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  placeholderChart: { height: '120px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '2px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '600' },
};

export default ZaptroClientProfile;
