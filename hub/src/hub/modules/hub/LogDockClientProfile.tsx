import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Activity, Database, HardDrive, Shield, Terminal,
  ExternalLink, Zap, Cloud, Network, Binary,
  MessageSquare, Edit3, Trash2, Key, Building2, Mail, Phone,
  ChevronRight, RefreshCcw, FileText, Lock, ShieldCheck, Globe,
  Search, Plus, Save, X, UserCheck, MapPin, Users, CreditCard, Receipt,
  Truck, Pencil, CheckCircle2 as CircleCheck
} from 'lucide-react';
import HubMetricCard from '@shared/components/HubMetricCard';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import { toastSuccess } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';

interface LogDockClientProfileProps {
  clientId: string;
  companySnapshot?: { name: string; plan: string; logoUrl?: string };
  isEmbedded?: boolean;
  onBack?: () => void;
}

const ACCENT = '#0061FF';

const LogDockClientProfile: React.FC<LogDockClientProfileProps> = ({ clientId, companySnapshot, isEmbedded, onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('operacoes');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isInlineChatOpen, setIsInlineChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'hub' | 'client', text: string, time: string }>>([
    { sender: 'client', text: 'Olá! Precisamos aumentar o limite de conexões do nosso cluster PostgreSQL.', time: '14:20' },
    { sender: 'hub', text: 'Olá! Identificamos sua solicitação. O tenant está apto para o upgrade. Gostaria de aplicar agora?', time: '14:22' },
  ]);

  const client = useMemo(() => ({
    id: clientId,
    name: companySnapshot?.name || `Empresa ${clientId}`,
    email: `tech@${(companySnapshot?.name || 'empresa').toLowerCase().replace(/\s+/g, '-')}.io`,
    plan: companySnapshot?.plan || 'Enterprise Infra',
    status: 'active',
    requests: '1.2M',
    latency: '42ms',
    uptime: '99.98%'
  }), [clientId, companySnapshot]);

  const statusColors: any = {
    active: { bg: '#EFF6FF', text: ACCENT, label: '✓ Ativo' },
    blocked: { bg: '#FEF2F2', text: '#EF4444', label: '✕ Bloqueado' },
    warning: { bg: '#FFFBEB', text: '#F59E0B', label: '⚠ Pendente' },
  };

  const currStatus = statusColors[client.status] || statusColors.active;

  return (
    <div className={`logta-client-profile${isEmbedded ? ' logta-client-profile--embedded' : ''}`} style={{ backgroundColor: '#FFF' }}>
      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => onBack ? onBack() : navigate('/master/logdock')}>
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ position: 'relative', marginLeft: '8px' }}>
            <HubEntityAvatar
              kind="company"
              name={client.name}
              size={64}
              accent={ACCENT}
              style={{
                borderRadius: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}
            />
            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: currStatus.text, border: '4px solid #FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          </div>

          <div style={{ marginLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <h1 style={s.clientName}>{client.name}</h1>
              <span style={{ ...s.statusBadge, backgroundColor: currStatus.bg, color: currStatus.text }}>{currStatus.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                <Mail size={14} /> {client.email}
              </div>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#CBD5E1' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ACCENT, fontSize: '13px', fontWeight: 600 }}>
                <Zap size={14} /> LogDock {client.plan}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
               <div style={{ fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, background: '#F1F5F9', color: '#0061FF', border: '1px solid #D0E0FF' }}>LOGTA CONECTADO</div>
               <div style={{ fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 6, background: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' }}>ZAPTRO CONECTADO</div>
            </div>
          </div>
        </div>
        <div style={s.headerActions}>
          <button style={s.chatBtn} title="Abrir Chat de Suporte" onClick={() => setIsInlineChatOpen(true)}>
            <MessageSquare size={18} />
          </button>
          <button 
            style={{ ...s.editBtn, background: '#0061FF', color: 'white', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            title="Editar Cadastro" 
            onClick={() => setIsEditModalOpen(true)}
          >
            <Pencil size={18} />
          </button>
          <button style={s.shieldBtn} title="Controle de Políticas" onClick={() => setIsPolicyModalOpen(true)}>
            <Shield size={18} />
          </button>
          <button style={s.deleteBtn} title="Excluir Cliente" onClick={() => window.confirm('Deseja excluir este tenant?') && toastSuccess('Excluído.')}>
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* CONTENT GRID */}
      <div style={s.content}>
        <aside className="logta-client-profile-aside" aria-label="Seções do perfil">
          {[
            {
              title: 'Gestão & Operação',
              items: [
                { id: 'operacoes', label: 'Monitoramento (Live)', Icon: Activity },
                { id: 'automacoes', label: 'Automações & Fluxos', Icon: RefreshCcw },
                { id: 'clientes', label: 'Clientes do Projeto', Icon: Users },
                { id: 'colaboradores', label: 'Colaboradores', Icon: UserCheck },
                { id: 'nodes', label: 'Nodes & Clusters', Icon: Network },
              ]
            },
            {
              title: 'Storage & Drive',
              items: [
                { id: 'arquivos', label: 'Arquivos & Buckets', Icon: HardDrive },
                { id: 'databases', label: 'Instâncias DB', Icon: Database },
              ]
            },
            {
              title: 'Administrativo',
              items: [
                { id: 'cadastro', label: 'Dados Cadastrais', Icon: Building2 },
                { id: 'financeiro', label: 'Financeiro & Billing', Icon: CreditCard },
              ]
            },
            {
              title: 'Segurança',
              items: [
                { id: 'seguranca', label: 'Acesso & Segurança', Icon: Lock },
              ]
            }
          ].map(grp => (
            <div key={grp.title} className="logta-client-sidebar-group" style={{ marginBottom: 24 }}>
              <div style={{ ...s.sidebarGroupTitle, paddingLeft: 8, color: '#94A3B8', fontSize: 10, letterSpacing: '0.05em', marginBottom: 12 }}>{grp.title}</div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                {grp.items.map(({ id, label, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      style={{
                        ...hubPillTabStripStyles.button,
                        ...(active ? hubPillTabStripStyles.buttonActive : {}),
                        width: '100%',
                        justifyContent: 'flex-start',
                        fontWeight: 500,
                        fontSize: '13px',
                      }}
                    >
                      <Icon size={16} color={active ? ACCENT : '#64748B'} style={{ transition: 'color 0.2s', flexShrink: 0 }} />
                      <span style={{ fontWeight: 500, textAlign: 'left' }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <div style={s.tabContent}>
          {activeTab === 'operacoes' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <HubSupabaseChart label="REQS / SEGUNDO" value="42" data={[40, 50, 60, 50, 40, 50, 60, 50, 40, 50]} />
                <HubSupabaseChart label="VEÍCULOS EM TRÂNSITO" value="450" data={[30, 40, 50, 60, 70, 80, 70, 60, 50, 40]} />
                <HubSupabaseChart label="ENTREGAS CONCLUÍDAS" value="94%" data={[20, 30, 40, 50, 60, 70, 80, 90, 80, 70]} />
                <HubSupabaseChart label="CT-ES EMITIDOS" value="1.2k" data={[10, 20, 30, 40, 50, 40, 30, 20, 10, 5]} />
              </div>

              <div style={s.card}>
                <h3 style={s.cardTitle}>Performance Operacional</h3>
                {[
                  { label: 'Emissão de Documentos', val: '99.8%', desc: 'Estável' },
                  { label: 'Rastreamento GPS', val: '100%', desc: 'Estável' },
                  { label: 'Ocupação de Frota', val: '72%', desc: 'Moderado' },
                ].map(i => (
                  <div key={i.label} style={s.auditRow}>
                    <div style={{ flex: 1 }}>
                      <p className="logta-profile-snap-title" style={s.snapTitle}>{i.label}</p>
                      <p style={s.snapSub}>{i.desc}</p>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: ACCENT }}>{i.val}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'clientes' && (
            <div style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ ...s.cardTitle, margin: 0 }}>Clientes Ativos do Projeto</h3>
                <button style={{ ...s.saveBtn, padding: '8px 16px', fontSize: 12 }}>+ Adicionar Cliente</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>CLIENTE</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>CONTATO</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>CONSUMO</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Ricardo Santos', email: 'ricardo@email.com', val: 'R$ 1.240,00', status: 'Ativo' },
                    { name: 'Juliana Oliveira', email: 'juliana.o@tech.io', val: 'R$ 890,50', status: 'Ativo' },
                    { name: 'Marcos Ferreira', email: 'marcos@dev.com', val: 'R$ 4.560,00', status: 'Atrasado' },
                  ].map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => navigate(`/master/logta?tab=clients&clientId=1&context=logdock`)}>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: 12, color: '#64748B' }}>{c.email}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 700 }}>{c.val}</td>
                      <td style={{ padding: '16px 8px' }}>
                         <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'Ativo' ? '#10B981' : '#EF4444', background: c.status === 'Ativo' ? '#ECFDF5' : '#FEF2F2', padding: '4px 8px', borderRadius: 4 }}>
                            {c.status.toUpperCase()}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'financeiro' && (
            <div style={s.tabContent}>
              <header style={{ padding: '0 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                    <Receipt size={22} color="#64748B" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Fatura #FAT-1049</h2>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#0061FF', background: 'rgba(0, 97, 255, 0.08)', padding: '2px 8px', borderRadius: 4 }}>PAGO</span>
                  </div>
                </div>
                <button style={{ ...s.saveBtn, padding: '8px 16px', fontSize: 12 }}>Baixar PDF</button>
              </header>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={{ ...s.card, borderLeft: '4px solid #0061FF' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                         <div>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>VALOR TOTAL</p>
                            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 900, color: '#0F172A' }}>R$ 4.500,00</p>
                         </div>
                         <div>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>VENCIMENTO</p>
                            <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#1E293B' }}>15 de Maio, 2026</p>
                         </div>
                      </div>
                   </div>

                   <div style={s.card}>
                      <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>Itens da Fatura</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                         {[
                           { label: 'Assinatura LogDock Enterprise', val: 'R$ 4.500,00' },
                           { label: 'Uso de Banda (Excedente)', val: 'R$ 0,00' },
                           { label: 'Storage S3 (1.2TB)', val: 'R$ 0,00' },
                         ].map(i => (
                           <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
                              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{i.label}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{i.val}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                   <div style={s.card}>
                      <h3 style={{ ...s.cardTitle, fontSize: 14, marginBottom: 12 }}>Dados de Cobrança</h3>
                      <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
                         <p style={{ margin: 0 }}><strong>Método:</strong> Cartão de Crédito</p>
                         <p style={{ margin: '4px 0 0' }}><strong>Cartão:</strong> **** 4242</p>
                         <p style={{ margin: '4px 0 0' }}><strong>Bandeira:</strong> Visa</p>
                      </div>
                   </div>

                   <div style={{ background: '#F8FAFC', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0' }}>
                      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>Histórico</h3>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                         <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>● Pago em 15/05/2026</div>
                         <div style={{ fontSize: 11, color: '#64748B' }}>● Gerada em 01/05/2026</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'colaboradores' && (
            <div style={s.tabContent}>
              <header style={{ marginBottom: 32 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A' }}>Colaboradores do Time</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>Gestão de acesso interno da empresa ao projeto LogDock.</p>
              </header>

              <div style={s.card}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                       <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                       <input placeholder="Buscar colaborador..." style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, outline: 'none' }} />
                    </div>
                    <button style={{ ...HUB_MASTER_PRODUCT_SHELL.actionBtn, background: '#0061FF', color: 'white', padding: '10px 24px', borderRadius: 100, border: 'none' }} onClick={() => toastSuccess('Membro convidado.')}><Plus size={16} /> ADICIONAR MEMBRO</button>
                 </div>

                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Nome / E-mail</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Cargo</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Permissão</th>
                          <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Ações</th>
                       </tr>
                    </thead>
                    <tbody>
                       {[
                         { name: 'Ricardo Silva', email: 'ricardo@empresa.com', role: 'CTO', perm: 'Admin' },
                         { name: 'Fabiana Melo', email: 'fabiana@empresa.com', role: 'DevOps', perm: 'Write' },
                         { name: 'Carlos Santos', email: 'carlos@empresa.com', role: 'Support', perm: 'Read' },
                       ].map((u, i) => (
                         <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '16px 8px' }}>
                               <div style={{ fontWeight: 700, color: '#1E293B', fontSize: 14 }}>{u.name}</div>
                               <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '16px 8px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{u.role}</td>
                            <td style={{ padding: '16px 8px' }}>
                               <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: '#F1F5F9', color: '#475569' }}>{u.perm}</span>
                            </td>
                            <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                               <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Edit3 size={16} /></button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          )}

          {(activeTab !== 'operacoes' && activeTab !== 'clientes' && activeTab !== 'financeiro' && activeTab !== 'colaboradores') && (
            <div style={s.card}>
               <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748B' }}>
                  <Zap size={32} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p style={{ fontWeight: 800 }}>Módulo LogDock</p>
                  <p style={{ fontSize: 13 }}>A seção {activeTab} está sendo sincronizada com o cluster do tenant.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* CHAT DRAWER */}
      {isInlineChatOpen && (
        <div style={s.chatDrawer}>
          <style>{`
            @keyframes scaleUpChat {
              0% { opacity: 0; transform: scale(0.9) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div style={s.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={s.chatAvatar}>{client.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Suporte {client.name.split(' ')[0]}</div>
                <div style={s.chatStatus}><span style={s.chatStatusDot} /> Online no painel</div>
              </div>
            </div>
            <button onClick={() => setIsInlineChatOpen(false)} style={s.chatClose}><X size={18} /></button>
          </div>
          <div style={s.chatBody}>
            {chatHistory.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'hub' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{ ...s.chatMsg, backgroundColor: msg.sender === 'hub' ? ACCENT : '#FFF', color: msg.sender === 'hub' ? '#FFF' : '#1E293B', border: msg.sender === 'hub' ? 'none' : '1px solid #E2E8F0' }}>{msg.text}</div>
                <span style={s.chatTime}>{msg.time}</span>
              </div>
            ))}
          </div>
          <form style={s.chatForm} onSubmit={e => e.preventDefault()}>
            <input type="text" placeholder="Digite uma mensagem..." style={s.chatInput} />
            <button type="submit" style={s.chatSend}><Save size={14} /></button>
          </form>
        </div>
      )}

      {/* MODALS */}
      {/* MODAL EDITAR CADASTRO */}
      <LogtaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Cadastro da Empresa"
        subtitle="Atualize os dados, senha, logo e o plano da empresa."
        width={720}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '12px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nome da Empresa</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <Building2 size={18} color="#94A3B8" />
                <input defaultValue={client.name} style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-mail de Acesso (Tenant)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <Mail size={18} color="#94A3B8" />
                <input defaultValue={client.email} style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Nova Senha de Acesso</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <Key size={18} color="#94A3B8" />
                <input type="password" defaultValue="••••••••" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>URL da Logo (Foto)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <UserCheck size={18} color="#94A3B8" />
                <input defaultValue="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=256&h=256&fit=crop&q=80" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 11, color: '#64748B', fontWeight: 500 }}>A mesma logo configurada no Logta SaaS aparece aqui automaticamente.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Plano Contratado</span>
              <select style={{ padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', fontSize: 14, fontWeight: 700, outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)', fontFamily: 'inherit' }}>
                <option value="Start">Logta Start</option>
                <option value="Pro">Logta Pro</option>
                <option value="Enterprise" selected>Logta Enterprise</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Limite de Veículos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <Truck size={18} color="#94A3B8" />
                <input type="number" defaultValue="500" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CNPJ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <FileText size={18} color="#94A3B8" />
                <input defaultValue="45.201.606/0001-92" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Telefone</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 16, backgroundColor: '#FFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                <Phone size={18} color="#94A3B8" />
                <input defaultValue="(11) 99102-3821" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 14, fontWeight: 700, color: '#1E293B', width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button onClick={() => setIsEditModalOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, border: '1px solid rgba(0, 0, 0, 0.1)', backgroundColor: 'white', color: '#64748B', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { toastSuccess('Cadastro atualizado!'); setIsEditModalOpen(false); }} style={{ backgroundColor: '#0061FF', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 999, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <CircleCheck size={18} /> Salvar Alterações
            </button>
          </div>
        </div>
      </LogtaModal>

      <LogtaModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} title="Políticas & Entitlements">
         <div style={{ padding: 24 }}>
            <p>Configuração de limites de infraestrutura para o tenant.</p>
            <button style={s.saveBtn} onClick={() => setIsPolicyModalOpen(false)}>Fechar</button>
         </div>
      </LogtaModal>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  header: { padding: '20px 72px 20px', marginTop: 50, marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.02)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.15s ease' },
  clientName: { margin: 0, fontSize: '26px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.8px' },
  statusBadge: { padding: '6px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', border: '1px solid rgba(0, 97, 255, 0.2)' },
  headerActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  chatBtn: { backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid rgba(0,0,0,0.08)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', flexShrink: 0 },
  editBtn: { backgroundColor: ACCENT, color: 'white', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  shieldBtn: { backgroundColor: '#EFF6FF', color: ACCENT, border: '1px solid rgba(0, 97, 255, 0.2)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0, 97, 255, 0.08)', flexShrink: 0 },
  deleteBtn: { backgroundColor: '#FFF5F5', color: '#E53E3E', border: '1px solid rgba(229, 62, 62, 0.15)', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  content: { padding: '0 0 15px 27px', marginLeft: 40, marginRight: 40, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 0, alignItems: 'flex-start', backgroundColor: '#FFFFFF', fontWeight: 800 },
  sidebarGroup: { display: 'flex', flexDirection: 'column', gap: 24, border: '1px solid #E2E8F0', borderRadius: '16px', padding: '12px 0', marginBottom: '16px' },
  sidebarGroupTitle: { fontSize: '10px', fontWeight: 500, color: 'rgba(161, 161, 161, 1)', textTransform: 'uppercase', paddingLeft: '16px', paddingTop: '4px', paddingBottom: '4px', marginBottom: '6px' },
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24, paddingRight: '27px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' },
  cardTitle: { margin: '0 0 24px 0', fontSize: '19px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' },
  auditRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' },
  snapTitle: { margin: 0, fontSize: '14px', fontWeight: 600, color: '#1E293B' },
  snapSub: { margin: '4px 0 0 0', fontSize: '12px', color: '#94A3B8', fontWeight: 500 },
  chatDrawer: { position: 'fixed', bottom: '24px', right: '24px', width: '444px', height: '720px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '24px', boxShadow: '0 20px 40px -5px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', zIndex: 9999, animation: 'scaleUpChat 0.25s ease-out', overflow: 'hidden' },
  chatHeader: { padding: '16px 12px 15px 27px', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  chatAvatar: { width: 32, height: 32, borderRadius: '50%', backgroundColor: ACCENT, border: '2px solid #FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12 },
  chatStatus: { fontSize: 10, color: ACCENT, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 },
  chatStatusDot: { width: 6, height: 6, background: ACCENT, borderRadius: '50%' },
  chatClose: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' },
  chatBody: { flex: 1, padding: '16px 27px', overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' },
  chatMsg: { padding: '10px 14px', borderRadius: '16px', fontSize: 13, fontWeight: 500, maxWidth: '80%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  chatTime: { fontSize: 9, color: '#94A3B8', marginTop: 4, fontWeight: 700 },
  chatForm: { padding: '16px 27px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 8, backgroundColor: '#FFF' },
  chatInput: { flex: 1, border: '1px solid #E2E8F0', borderRadius: '999px', padding: '10px 16px', fontSize: 13, fontWeight: 700, outline: 'none' },
  chatSend: { width: 36, height: 36, borderRadius: '50%', border: 'none', background: ACCENT, color: '#FFF', cursor: 'pointer' },
  saveBtn: { padding: '12px 24px', borderRadius: '999px', border: 'none', background: `linear-gradient(135deg, ${ACCENT} 0%, #0046C7 100%)`, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default LogDockClientProfile;
