import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PackageSearch, TrendingUp, Shield, Truck,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  MapPin, FileText, DollarSign, Activity, Zap, Users, Building2,
  Phone, Mail, UserCheck, Key, Map as MapIcon, ChevronRight
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

const MOCK_CLIENTS: Record<string, any> = {
  '1': { 
    id: '1', 
    name: 'Transportadora Falcão', 
    email: 'contato@falcao.com.br', 
    plan: 'Start', 
    status: 'active',
    cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    address: 'Av. das Indústrias, 1200 - São Paulo, SP',
    responsible: 'Ricardo Falcão',
    routes: 84, 
    vehicleLimit: 20, 
    vehicles: 12,
    collaborators: [
      { id: 1, name: 'João Silva', role: 'Operacional', lastLogin: 'Há 2h' },
      { id: 2, name: 'Maria Souza', role: 'Financeiro', lastLogin: 'Há 1 dia' },
    ],
    drivers: [
      { id: 1, name: 'Pedro Motorista', license: 'Cat. E', status: 'Em Rota' },
      { id: 2, name: 'Marcos Santos', license: 'Cat. D', status: 'Disponível' },
    ]
  },
};

const LogtaClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const client = MOCK_CLIENTS[id || '1'] || MOCK_CLIENTS['1'];

  const [activeTab, setActiveTab] = useState<'operacoes' | 'financeiro' | 'frota' | 'cadastro' | 'seguranca'>('operacoes');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: client.name, 
    email: client.email, 
    plan: client.plan, 
    limit: String(client.vehicleLimit),
    cnpj: client.cnpj,
    phone: client.phone,
    address: client.address,
    responsible: client.responsible,
    status: client.status
  });

  const pct = (client.vehicles / Number(editForm.limit)) * 100;

  const handleSave = () => {
    toastSuccess(`Dados de "${editForm.name}" atualizados com sucesso!`);
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
          <button style={s.backBtn} onClick={() => navigate('/master/logta-admin')}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ ...s.avatar, backgroundColor: '#10B981' }}>{client.name[0]}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEditing ? (
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={s.editInput} />
              ) : (
                <h1 style={s.clientName}>{editForm.name}</h1>
              )}
              <span style={{ ...s.statusBadge, backgroundColor: currStatus.bg, color: currStatus.text }}>{currStatus.label}</span>
            </div>
            <p style={s.clientSub}>{editForm.email} · Logta {editForm.plan}</p>
          </div>
        </div>
        <div style={s.headerActions}>
          {isEditing ? (
            <>
              <button style={s.cancelBtn} onClick={() => setIsEditing(false)}><X size={16} /> Cancelar</button>
              <button style={{ ...s.saveBtn, backgroundColor: '#10B981' }} onClick={handleSave}><Save size={16} /> Salvar Alterações</button>
            </>
          ) : (
            <button style={{ ...s.editBtn, borderColor: '#10B981', color: '#10B981', backgroundColor: '#F0FDF4' }} onClick={() => setIsEditing(true)}><Edit3 size={16} /> Editar Perfil</button>
          )}
        </div>
      </header>

      {/* TABS */}
      <div style={s.content}>
        <div style={s.tabs}>
          {([
            ['operacoes', Activity, 'Operações'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['financeiro', DollarSign, 'Financeiro/Fiscal'],
            ['frota', Truck, 'Frota & Motoristas'],
            ['seguranca', Shield, 'Acesso & Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? { backgroundColor: '#F0FDF4', color: '#10B981' } : {}) }} onClick={() => setActiveTab(key)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* OPERAÇÕES */}
        {activeTab === 'operacoes' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Rotas Ativas" value={client.routes.toLocaleString()} icon={MapPin} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Veículos em Trânsito" value={String(client.vehicles)} icon={Truck} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Entregas Concluídas" value="94%" icon={CheckCircle2} accent="#8B5CF6" softBg="#F5F3FF" />
              <HubMetricCard label="CT-es Emitidos" value="1.2k" icon={FileText} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Performance Operacional</h3>
              {[
                { label: 'Emissão de Documentos', val: '99.8%', desc: 'Estável' },
                { label: 'Rastreamento GPS', val: '100%', desc: 'Estável' },
                { label: 'Ocupação de Frota', val: '72%', desc: 'Moderado' },
              ].map(i => (
                <div key={i.label} style={s.auditRow}>
                  <div style={{ flex: 1 }}><p style={s.snapTitle}>{i.label}</p><p style={s.snapSub}>{i.desc}</p></div>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#10B981' }}>{i.val}</span>
                </div>
              ))}
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
                {isEditing && (
                  <div style={{ ...s.fieldGroup, gridColumn: 'span 2' }}>
                    <label style={s.fieldLabel}>Status da Conta</label>
                    <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} style={s.fieldSelect}>
                      <option value="active">Ativo</option>
                      <option value="blocked">Bloqueado</option>
                      <option value="warning">Pendente</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div style={s.card}>
              <div style={s.cardHeader}>
                <h3 style={s.cardTitle}>Colaboradores / Usuários</h3>
                <button style={s.addSmallBtn}><Plus size={14} /> Novo Colaborador</button>
              </div>
              <table style={s.table}>
                <thead><tr><th style={s.th}>Nome</th><th style={s.th}>Cargo/Nível</th><th style={s.th}>Último Acesso</th><th style={s.th}>Ações</th></tr></thead>
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

        {/* FROTA & MOTORISTAS */}
        {activeTab === 'frota' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Frota Atual" value={`${client.vehicles}/${editForm.limit}`} icon={Truck} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Motoristas" value={String(client.drivers.length)} icon={Users} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Em Manutenção" value="2" icon={AlertTriangle} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Capacidade" value={`${pct.toFixed(1)}%`} icon={TrendingUp} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.grid2}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>Monitoramento em Tempo Real</h3>
                <div style={s.mapPlaceholder}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgb(16, 185, 129)', position: 'absolute', boxShadow: 'rgba(16, 185, 129, 0.2) 0px 0px 0px 4px', top: '20%', left: '30%' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgb(0, 97, 255)', position: 'absolute', boxShadow: 'rgba(0, 97, 255, 0.2) 0px 0px 0px 4px', top: '50%', left: '70%' }} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'rgb(16, 185, 129)', position: 'absolute', boxShadow: 'rgba(16, 185, 129, 0.2) 0px 0px 0px 4px', top: '80%', left: '40%' }} />
                  </div>
                  <MapIcon size={48} color="#CBD5E1" />
                  <p style={{ color: '#94A3B8', fontWeight: '700', marginTop: '12px', position: 'relative' }}>Mapa de Rotas Ativas</p>
                </div>
              </div>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Motoristas Escalados</h3>
                {client.drivers.map((d: any) => (
                  <div key={d.id} style={s.driverRow}>
                    <div style={s.driverAvatar}>{d.name[0]}</div>
                    <div style={{ flex: 1 }}>
                      <p style={s.driverName}>{d.name}</p>
                      <p style={s.driverSub}>{d.license}</p>
                    </div>
                    <span style={{ ...s.driverStatus, color: d.status === 'Em Rota' ? '#10B981' : '#64748B' }}>{d.status}</span>
                  </div>
                ))}
                <button style={s.viewAllBtn}>Ver Todos os Motoristas <ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Outras abas permanecem com o conteúdo básico ou expandido conforme necessário */}
        {(activeTab === 'financeiro' || activeTab === 'seguranca') && (
           <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
             <Zap size={48} color="#E2E8F0" style={{ marginBottom: '16px' }} />
             <h3 style={s.cardTitle}>Módulo {activeTab.toUpperCase()}</h3>
             <p style={{ color: '#64748B' }}>Dados financeiros e de segurança detalhados para o cliente ID {id}.</p>
           </div>
        )}
      </div>
    </div>
  );
};

const Plus = ({ size, color }: any) => <Zap size={size} color={color} />;

const s: Record<string, React.CSSProperties> = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', minHeight: '100vh', overflowY: 'auto' },
  header: { padding: '40px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justify_content: 'center', cursor: 'pointer', color: '#475569' },
  avatar: { width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: 'white' },
  clientName: { margin: 0, fontSize: '22px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  statusBadge: { padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '800' },
  clientSub: { margin: 0, fontSize: '13px', color: '#64748B', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  editInput: { fontSize: '22px', fontWeight: '900', color: '#0F172A', border: '2px solid #10B981', borderRadius: '12px', padding: '4px 12px', outline: 'none', backgroundColor: 'white' },
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
  fieldSelect: { padding: '14px 18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '14px', fontWeight: '700', outline: 'none' },
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px', verticalAlign: 'middle' },
  colabName: { fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  colabRole: { fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' },
  colabTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', display: 'inline-flex', alignItems: 'center', justify_content: 'center', cursor: 'pointer', marginRight: '6px' },
  grid2: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  mapPlaceholder: { height: '300px', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justify_content: 'center', position: 'relative', overflow: 'hidden' },
  mapOverlay: { position: 'absolute', inset: 0 },
  mapDot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', position: 'absolute', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)' },
  driverRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  driverAvatar: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justify_content: 'center', fontSize: '14px', fontWeight: '800', color: '#475569' },
  driverName: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  driverSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  driverStatus: { fontSize: '11px', fontWeight: '800' },
  viewAllBtn: { width: '100%', padding: '14px', marginTop: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justify_content: 'center', gap: '8px' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  auditTime: { fontSize: '12px', fontWeight: '700', color: '#CBD5E1' },
};

export default LogtaClientProfile;
