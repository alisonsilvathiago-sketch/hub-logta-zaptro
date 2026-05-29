import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Database, TrendingUp, Shield, HardDrive,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  FileText, DollarSign, Activity, Users, Building2,
  Phone, Mail, UserCheck, Key, ChevronRight, CloudDownload, RefreshCw, Smartphone, Trash2, MessageSquare
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { toastSuccess } from '@core/lib/toast';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

const MOCK_CLIENTS: Record<string, any> = {};

const BackupsClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'];
  if (!client) {
    return <div style={{ padding: 40 }}>Nenhum dado real disponível. (Mocks removidos)</div>;
  }

  const [activeTab, setActiveTab] = useState<'infra' | 'cadastro' | 'snapshots' | 'seguranca'>('infra');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: client.name, 
    email: client.email, 
    plan: client.plan, 
    cnpj: client.cnpj,
    phone: client.phone,
    address: client.address,
    responsible: client.responsible,
    status: client.status || 'active'
  });

  const handleSave = () => {
    toastSuccess(`Perfil de "${editForm.name}" atualizado no Backups!`);
    setIsEditing(false);
  };

  return (
    <div style={s.container}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/master/backups')}>
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
              <span style={{ ...s.statusBadge, backgroundColor: '#EFF6FF', color: '#0061FF' }}>✓ Ativo</span>
            </div>
            <p style={s.clientSub}>{editForm.email} · Backups {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={{ ...s.editBtn, backgroundColor: '#0061FF' }} onClick={handleSave}>
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
                if(window.confirm('Excluir cliente permanentemente do sistema de Backups?')) {
                  toastSuccess('Cliente removido da infra de backups.');
                  navigate('/master/backups');
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
            ['infra', Activity, 'Infraestrutura'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['snapshots', CloudDownload, 'Snapshots & Logs'],
            ['seguranca', Shield, 'Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* INFRAESTRUTURA */}
        {activeTab === 'infra' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Total Armazenado" value={client.storageUsed} icon={HardDrive} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Nodes Ativos" value="3" icon={Database} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Último Backup" value="Há 2h" icon={Clock} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="Saúde Global" value="100%" icon={CheckCircle2} accent="#0061FF" softBg="#EFF6FF" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Redundância por Provedor</h3>
              <div style={s.providerGrid}>
                {['AWS (Virginia)', 'GCP (São Paulo)', 'Azure (West US)'].map(p => (
                  <div key={p} style={s.providerCard}>
                    <div style={s.providerIcon}><Database size={18} color="#0061FF" /></div>
                    <div style={{ flex: 1 }}>
                      <p style={s.snapTitle}>{p}</p>
                      <p style={s.snapSub}>Status: Operacional</p>
                    </div>
                    <span style={{ color: '#0061FF', fontWeight: '800', fontSize: '12px' }}>ONLINE</span>
                  </div>
                ))}
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
                <h3 style={s.cardTitle}>Colaboradores / Usuários</h3>
                <button style={{ ...s.addSmallBtn, backgroundColor: '#EFF6FF', color: '#0061FF' }}><Plus size={14} /> Novo Colaborador</button>
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

        {/* SNAPSHOTS */}
        {activeTab === 'snapshots' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Histórico de Snapshots</h3>
              {client.backups.map((b: any) => (
                <div key={b.id} style={s.auditRow}>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>{b.name} · {b.size}</p>
                    <p style={s.snapSub}>{b.date}</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#0061FF', padding: '4px 10px', borderRadius: '6px' }}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Segurança de Dados & Recuperação</h3>
              <div style={s.securityGrid}>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Smartphone size={20} color="#0061FF" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>Autenticação de Dois Fatores (2FA)</p>
                    <p style={s.snapSub}>Necessário para operações de restauração (Restore).</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#EFF6FF', color: '#0061FF' }} onClick={() => toastSuccess('2FA Ativado!')}>Ativar 2FA</button>
                </div>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Lock size={20} color="#EF4444" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>Imutabilidade de Backups</p>
                    <p style={s.snapSub}>Impedir que backups sejam deletados acidentalmente.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FEF2F2', color: '#EF4444' }} onClick={() => toastSuccess('Imutabilidade ativada!')}>Ativar Lock</button>
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
  cardTitle: { margin: '0 0 24px 0', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  fieldInputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' },
  fieldValue: { fontSize: '14px', fontWeight: '700', color: '#1E293B' },
  fieldInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1E293B', width: '100%' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  providerGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
  providerCard: { padding: '20px', borderRadius: '24px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px' },
  providerIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', fontSize: '12px', fontWeight: '800', cursor: 'pointer' },
  securityGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  securityIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default BackupsClientProfile;
