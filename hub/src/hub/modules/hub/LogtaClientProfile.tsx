import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, PackageSearch, TrendingUp, Shield, Truck,
  Clock, AlertTriangle, CheckCircle2, Lock, Edit3, Save, X,
  MapPin, FileText, DollarSign, Activity, Zap, Users, Building2,
  Phone, Mail, UserCheck, Key, Map as MapIcon, ChevronRight, Smartphone, Plus, MessageSquare, Trash2
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import MapGlobal, { Marker, Popup, truckIcon, carIcon, problemIcon } from '@shared/components/MapGlobal';
import { toastSuccess } from '@core/lib/toast';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

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
          <button style={s.backBtn} onClick={() => navigate('/master/logta')}>
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
                  toastSuccess('Cliente excluído do Logta.');
                  navigate('/master/logta');
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
            ['operacoes', Activity, 'Operações'],
            ['cadastro', Building2, 'Dados Cadastrais'],
            ['financeiro', DollarSign, 'Financeiro/Fiscal'],
            ['frota', Truck, 'Frota & Motoristas'],
            ['seguranca', Shield, 'Acesso & Segurança'],
          ] as const).map(([key, Icon, label]) => (
            <button key={key} style={{ ...s.tabBtn, ...(activeTab === key ? s.tabActive : {}) }} onClick={() => setActiveTab(key)}>
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
                <div style={{ height: '300px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                  <MapGlobal 
                    center={[-23.55052, -46.633308]} 
                    zoom={13} 
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    {truckIcon && (
                      <Marker position={[-23.55052, -46.633308]} icon={truckIcon}>
                        <Popup>
                          <div style={{ padding: '4px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '13px' }}>Scania R450</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Motorista: Pedro Motorista</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {truckIcon && (
                      <Marker position={[-23.54200, -46.625000]} icon={truckIcon}>
                        <Popup>
                          <div style={{ padding: '4px' }}>
                            <p style={{ margin: 0, fontWeight: 900, fontSize: '13px' }}>Volvo FH 540</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>Motorista: Marcos Santos</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {carIcon && (
                      <Marker position={[-23.53800, -46.615000]} icon={carIcon}>
                        <Popup>
                          <p style={{ margin: 0, fontWeight: 800 }}>Origem: CD São Paulo</p>
                        </Popup>
                      </Marker>
                    )}
                    {problemIcon && (
                      <Marker position={[-23.55500, -46.638000]} icon={problemIcon}>
                        <Popup>
                          <p style={{ margin: 0, fontWeight: 800, color: '#EF4444' }}>Alerta de Tráfego</p>
                        </Popup>
                      </Marker>
                    )}
                  </MapGlobal>
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
        {activeTab === 'seguranca' && (
          <div style={s.tabContent}>
            <div style={s.card}>
              <h3 style={s.cardTitle}>Segurança da Conta</h3>
              <div style={s.securityGrid}>
                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Smartphone size={20} color="#0061FF" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>Autenticação de Dois Fatores (2FA)</p>
                    <p style={s.snapSub}>Adicione uma camada extra de segurança à conta master.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#F0FDF4', color: '#10B981' }} onClick={() => toastSuccess('2FA Ativado com sucesso!')}>Ativar 2FA</button>
                </div>

                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Lock size={20} color="#EF4444" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>Bloqueio de Sessões Simultâneas</p>
                    <p style={s.snapSub}>Impedir que múltiplos usuários usem a mesma conta.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FEF2F2', color: '#EF4444' }} onClick={() => toastSuccess('Bloqueio ativado!')}>Ativar Bloqueio</button>
                </div>

                <div style={s.securityItem}>
                  <div style={s.securityIcon}><Key size={20} color="#F59E0B" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>Rotação de Chaves de API</p>
                    <p style={s.snapSub}>Última rotação há 45 dias. Recomendado realizar agora.</p>
                  </div>
                  <button style={{ ...s.addSmallBtn, backgroundColor: '#FFFBEB', color: '#F59E0B' }} onClick={() => toastSuccess('Chaves rotacionadas!')}>Rotacionar Agora</button>
                </div>
              </div>
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Logs de Auditoria Recentes</h3>
              {[
                { action: 'Login bem sucedido', user: 'alison@zaptro.com.br', date: 'Hoje, 14:20', ip: '189.12.3.45' },
                { action: 'Alteração de Permissão', user: 'ricardo@falcao.com.br', date: 'Ontem, 09:15', ip: '201.44.12.1' },
                { action: 'Tentativa de Login Falha', user: 'desconhecido', date: 'Há 2 dias', ip: '45.1.22.9' },
              ].map((log, i) => (
                <div key={i} style={s.auditRow}>
                  <div style={{ flex: 1 }}>
                    <p style={s.snapTitle}>{log.action} · <span style={{ fontWeight: '600', color: '#64748B' }}>{log.user}</span></p>
                    <p style={s.snapSub}>{log.date} · IP: {log.ip}</p>
                  </div>
                  <CheckCircle2 size={16} color={log.action.includes('Falha') ? '#EF4444' : '#10B981'} />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financeiro' && (
          <div style={s.tabContent}>
            <div style={HUB_METRIC_GRID_STYLE}>
              <HubMetricCard label="Faturamento (Mês)" value="R$ 142.500" icon={DollarSign} accent="#10B981" softBg="#F0FDF4" />
              <HubMetricCard label="Impostos a Pagar" value="R$ 12.430" icon={FileText} accent="#EF4444" softBg="#FEF2F2" />
              <HubMetricCard label="Crédito Disponível" value="R$ 50.000" icon={Zap} accent="#0061FF" softBg="#EFF6FF" />
              <HubMetricCard label="Inadimplência" value="2.4%" icon={AlertTriangle} accent="#F59E0B" softBg="#FFF7ED" />
            </div>

            <div style={s.card}>
              <h3 style={s.cardTitle}>Documentos Fiscais Pendentes</h3>
              <div style={s.securityGrid}>
                {[
                  { doc: 'CT-e #1420', val: 'R$ 1.200,00', date: 'Hoje', status: 'Pendente' },
                  { doc: 'NFS-e #882', val: 'R$ 450,00', date: 'Ontem', status: 'Processando' },
                ].map((d, i) => (
                  <div key={i} style={s.securityItem}>
                    <div style={s.securityIcon}><FileText size={20} color="#64748B" /></div>
                    <div style={{ flex: 1 }}>
                      <p style={s.snapTitle}>{d.doc} · {d.val}</p>
                      <p style={s.snapSub}>{d.date}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#FFFBEB', color: '#F59E0B', padding: '4px 10px', borderRadius: '6px' }}>{d.status}</span>
                  </div>
                ))}
              </div>
              <button style={s.viewAllBtn}>Ver Todos os Documentos <ChevronRight size={16} /></button>
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
  cancelBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '999px', border: '2px solid', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
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
  fieldSelect: { padding: '14px 18px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '14px', fontWeight: '700', outline: 'none' },
  addSmallBtn: { padding: '8px 16px', borderRadius: '999px', border: 'none', backgroundColor: '#F0FDF4', color: '#10B981', fontSize: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', borderBottom: '2px solid #F1F5F9' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px', verticalAlign: 'middle' },
  colabName: { fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  colabRole: { fontSize: '12px', fontWeight: '700', color: '#64748B', backgroundColor: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' },
  colabTime: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: '6px' },
  grid2: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' },
  mapPlaceholder: { height: '300px', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  mapOverlay: { position: 'absolute', inset: 0 },
  mapDot: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', position: 'absolute', boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)' },
  driverRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  driverAvatar: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', color: '#475569', flexShrink: 0 },
  driverName: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  driverSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  driverStatus: { fontSize: '11px', fontWeight: '800' },
  viewAllBtn: { width: '100%', padding: '14px', marginTop: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: '800', color: '#1E293B' },
  snapSub: { margin: 0, fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  auditTime: { fontSize: '12px', fontWeight: '700', color: '#CBD5E1' },
  securityGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
  securityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0', borderBottom: '1px solid #F1F5F9' },
  securityIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default LogtaClientProfile;
