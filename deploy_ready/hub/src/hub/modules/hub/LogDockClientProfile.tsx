import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HardDrive, TrendingUp, Shield, Database,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  FileText, DollarSign, Activity, Users, Building2,
  Phone, Mail, UserCheck, Key, ChevronRight, Cloud, Download, MapPin, Smartphone, Trash2, MessageSquare
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

const MOCK_CLIENTS: Record<string, any> = {};

const LogDockClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'];
  if (!client) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Nenhum dado real disponível. (Mocks removidos)</div>;
  }

  const [activeTab, setActiveTab] = useState<'armazenamento' | 'cadastro' | 'snapshots' | 'seguranca'>('armazenamento');
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
    toastSuccess(`Perfil de "${editForm.name}" atualizado no LogDock!`);
    setIsEditing(false);
  };

  const statusColors = {
    active: { bg: '#F0FDF4', text: '#10B981', label: '✓ Ativo' },
    blocked: { bg: '#FEF2F2', text: '#EF4444', label: '✕ Bloqueado' },
    warning: { bg: '#FFFBEB', text: '#F59E0B', label: '⚠ Pendente' },
  };

  const currStatus = (statusColors as any)[editForm.status] || statusColors.active;
  const storagePct = (client.storageUsed / client.storageLimit) * 100;

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/master/logdock')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ ...s.avatar, backgroundColor: '#0061FF' }}>{client.name[0]}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEditing ? (
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={s.editInput} />
              ) : (
                <h1 style={s.clientName}>{editForm.name}</h1>
              )}
              <span style={{ ...s.statusBadge, backgroundColor: currStatus.bg, color: currStatus.text }}>{currStatus.label}</span>
            </div>
            <p style={s.clientSub}>{editForm.email} · LogDock {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={{ ...s.editBtn, backgroundColor: '#10B981' }} onClick={handleSave}>
                <CheckCircle2 size={18} /> Salvar
              </button>
              <button style={{ ...s.deleteBtn, backgroundColor: '#F1F5F9', color: '#64748B' }} onClick={() => setIsEditing(false)}>
                <X size={18} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button 
                style={s.chatBtn} 
                onClick={() => navigate(`/master/hubchat?token=4dbc4jv0n196sv9a0bdk&id=${client.id}`)}
              >
                <MessageSquare size={18} /> Chat
              </button>
              <button style={s.editBtn} onClick={() => setIsEditing(true)}>
                <Edit3 size={18} /> Editar Cadastro
              </button>
              <button style={s.deleteBtn} onClick={() => {
                if(window.confirm('Excluir cliente permanentemente?')) {
                  toastSuccess('Cliente excluído do LogDock.');
                  navigate('/master/logdock');
                }
              }}>
                <Trash2 size={18} /> Excluir Cliente
              </button>
            </>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['armazenamento', Cloud, 'Armazenamento'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['snapshots', Database, 'Snapshots & Logs'],
            ['seguranca', Shield, 'Acesso & Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* ARMAZENAMENTO */}
        {activeTab === 'armazenamento' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Espaço Usado" value={`${client.storageUsed} GB`} icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Limite do Plano" value={`${client.storageLimit} GB`} icon={Activity} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Arquivos Ativos" value="12.4k" icon={FileText} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Snapshots" value={String(client.backups.length)} icon={Database} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Uso de Disco</h3>
              <div style={s.storageVisual}>
                <div style={s.storageBar}>
                  <div style={{ ...s.storageFill, width: `${storagePct}%`, backgroundColor: storagePct > 90 ? '#EF4444' : '#0061FF' }} />
                </div>
                <div style={s.storageLegend}>
                  <span style={s.usedText}>{client.storageUsed} GB usados</span>
                  <span style={s.totalText}>Total: {client.storageLimit} GB</span>
                </div>
              </div>
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
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Usuários do LogDock</h3>
                <button style={{ ...s.addSmallBtn, backgroundColor: '#EFF6FF', color: '#0061FF' }}>Novo Usuário</button>
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

        {/* SNAPSHOTS & LOGS */}
        {activeTab === 'snapshots' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Histórico de Snapshots</h3>
              {client.backups.map((b: any) => (
                <div key={b.id} style={s.channelRow}>
                  <div style={{ ...s.channelIcon, backgroundColor: '#F8FAFC' }}>
                    <Download size={18} color="#64748B" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={s.driverName}>{b.name}</p>
                    <p style={s.driverSub}>{b.date} · {b.size}</p>
                  </div>
                  <button style={s.iconBtn}>Restaurar</button>
                </div>
              ))}
              <button style={s.viewAllBtn}>Criar Snapshot Agora <ChevronRight size={16} /></button>
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Segurança & Integridade de Dados</h3>
              <div style={s.securityGrid}>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Smartphone size={20} color="#0061FF" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.driverName}>Autenticação de Dois Fatores (2FA)</p>
                    <p style={s.driverSub}>Proteja o acesso ao painel de infraestrutura.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#F0FDF4', color: '#10B981' }} onClick={() => toastSuccess('2FA Ativado!')}>Ativar 2FA</button>
                </div>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Shield size={20} color="#10B981" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.driverName}>Monitoramento de Integridade</p>
                    <p style={s.driverSub}>Escaneamento automático de volumes S3/Cloud.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#ECFDF5', color: '#10B981' }} onClick={() => toastSuccess('Escaneamento ativado!')}>Ativar Scan</button>
                </div>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Lock size={20} color="#EF4444" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.driverName}>Criptografia de Repouso (AES-256)</p>
                    <p style={s.driverSub}>Reforce a criptografia dos arquivos armazenados.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FEF2F2', color: '#EF4444' }} onClick={() => toastSuccess('Criptografia reforçada!')}>Ativar Cripto</button>
                </div>
              </div>
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
  headerActions: { display: 'flex', gap: '16px', alignItems: 'center' },
  chatBtn: { backgroundColor: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  editBtn: { backgroundColor: '#2D5BFF', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(45, 91, 255, 0.25)' },
  deleteBtn: { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  editInput: { padding: '8px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '24px', fontWeight: '800', color: '#0F172A', outline: 'none', width: '300px' },
  content: { padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' },
  tabs: hubPillTabStripStyles.container,
  tabBtn: { ...hubPillTabStripStyles.button, fontSize: '13px' },
  tabActive: { ...hubPillTabStripStyles.buttonActive, fontSize: '13px' },
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
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px', verticalAlign: 'middle' },
  colabName: { fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  colabRole: { fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' },
  colabTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '6px' },
  storageVisual: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  storageBar: { height: '12px', backgroundColor: '#F1F5F9', borderRadius: '6px', overflow: 'hidden' },
  storageFill: { height: '100%', borderRadius: '6px', transition: 'width 1s ease' },
  storageLegend: { display: 'flex', justifyContent: 'space-between' },
  usedText: { fontSize: '13px', fontWeight: '700', color: '#475569' },
  totalText: { fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
  channelRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  channelIcon: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  driverName: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  driverSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  viewAllBtn: { width: '100%', padding: '14px', marginTop: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  securityGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  securityIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default LogDockClientProfile;
