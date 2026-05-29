import React, { useState, useEffect } from 'react';
import { 
  Zap, Play, Pause, Settings, Plus, 
  Search, Filter, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, MoreVertical,
  Activity, Database, Globe, Mail, 
  MessageSquare, Trash2, Edit3, Save, X,
  Terminal, Share2, Layers, Cpu, Shield,
  Bell, BellRing, Eye, EyeOff, RefreshCw,
  ShieldCheck, DollarSign, FileText, Download, Copy,
  Link as LinkIcon, Cloud, Video, FolderKanban, ShieldAlert
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { HUB_PAGE_SUBTITLE, HUB_SIDEBAR_NAV_LABEL } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_SECTION_NAV } from '@hub/styles/hubMasterSectionNavStyles';

export type WorkflowSectionId = 'workflows' | 'notifications' | 'events' | 'executions';

export const WORKFLOW_SECTIONS: {
  id: WorkflowSectionId;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: 'workflows', label: 'Fluxos operacionais', icon: Cpu },
  { id: 'notifications', label: 'Matriz de e-mails (Brain)', icon: BellRing },
  { id: 'events', label: 'Eventos, filas & SLA', icon: Layers },
  { id: 'executions', label: 'Histórico de execuções', icon: Activity },
];

type WorkflowManagementProps = {
  embedded?: boolean;
  activeSection?: WorkflowSectionId;
  onSectionChange?: (id: WorkflowSectionId) => void;
};

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  action: string;
  is_active: boolean;
  icon_name: string;
  metadata: any;
  created_at: string;
}

interface NotificationSetting {
  id: string;
  event_type: string;
  kind: string;
  is_active: boolean;
  priority: 'CRITICO' | 'IMPORTANTE' | 'INFORMATIVO';
  target_role: string;
}

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({
  embedded = false,
  activeSection,
  onSectionChange,
}) => {
  const { profile } = useAuth();
  const [internalTab, setInternalTab] = useState<WorkflowSectionId>('workflows');
  const activeTab = embedded && activeSection ? activeSection : internalTab;
  const setActiveTab = (id: WorkflowSectionId) => {
    if (embedded && onSectionChange) onSectionChange(id);
    else setInternalTab(id);
  };
  const [loading, setLoading] = useState(true);
  
  // States for Workflows
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Partial<Workflow> | null>(null);
  
  // Optional Flows Presets and Modals
  const [isOptionalModalOpen, setIsOptionalModalOpen] = useState(false);
  const optionalPresets = [
    { name: 'Aviso de Backup Semanal (Opcional)', trigger: 'SYSTEM_CRON', action: 'send_email', metadata: { schedule: 'weekly', send_to: 'admin' } },
    { name: 'Relatório de Inadimplência via Zap (Opcional)', trigger: 'payment_received', action: 'BLOCK_OPERATIONAL_FLOW', metadata: { delay: '48h', warn: true } },
    { name: 'Alerta de Geofencing Crítico (Opcional)', trigger: 'DELIVERY_LOCATION_MISMATCH_DETECTED', action: 'BLOCK_AND_REQUIRE_VISUAL_OVERRIDE', metadata: { require_photo: true } },
    { name: 'Relatório ROI Diário do Hub (Opcional)', trigger: 'lead_converted', action: 'provision_company', metadata: { calculate_roi: true } }
  ];

  const handleInstallOptional = async (preset: any) => {
    const tid = toastLoading(`Instalando fluxo opcional "${preset.name}"...`);
    try {
      const { error } = await supabase
        .from('hub_workflows')
        .insert([{
          name: preset.name,
          trigger: preset.trigger,
          action: preset.action,
          is_active: true,
          metadata: preset.metadata
        }]);

      if (error) throw error;
      toastSuccess(`Fluxo opcional "${preset.name}" instalado com sucesso!`);
      setIsOptionalModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Erro ao registrar fluxo opcional: ' + err.message);
    } finally {
      toastDismiss(tid);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    const isConfirmed = window.confirm('Deseja realmente excluir este workflow permanentemente?');
    if (!isConfirmed) return;
    const tid = toastLoading('Excluindo workflow do banco...');
    try {
      const { error } = await supabase
        .from('hub_workflows')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toastSuccess('Workflow excluído com sucesso!');
      fetchData();
    } catch (err: any) {
      toastError('Erro ao excluir workflow.');
    } finally {
      toastDismiss(tid);
    }
  };

  // States for Notifications (The Brain)
  const [notifs, setNotifs] = useState<NotificationSetting[]>([]);
  const [apiConfig, setApiConfig] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wfRes, notifRes, cfgRes] = await Promise.all([
        supabase.from('hub_workflows').select('*').order('created_at', { ascending: false }),
        supabase.from('master_notification_settings').select('*').order('priority', { ascending: true }),
        supabase.from('master_settings').select('value').eq('key', 'ZAPTRO_MAIL_API_CONFIG').maybeSingle()
      ]);

      if (wfRes.error) throw wfRes.error;
      if (notifRes.error) throw notifRes.error;

      setWorkflows(wfRes.data || []);
      setNotifs(notifRes.data || []);
      setApiConfig(cfgRes.data?.value || null);
    } catch (err: any) {
      toastError('Erro de Sincronização: Falha ao carregar matriz operacional.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleWorkflow = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hub_workflows')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, is_active: !currentStatus } : w));
      toastSuccess(`Fluxo ${!currentStatus ? 'ativado' : 'pausado'} no cluster master.`);
    } catch (err: any) {
      toastError('Erro de Comando: Falha ao alternar estado do workflow.');
    }
  };

  const toggleNotification = async (id: string, current: boolean, event: string) => {
    const tid = toastLoading(`Modificando política de notificação para ${event}...`);
    try {
      const { error } = await supabase
        .from('master_notification_settings')
        .update({ is_active: !current })
        .eq('id', id);

      if (error) throw error;
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_active: !current } : n));
      toastSuccess(`Alerta "${event}" ${!current ? 'ativado' : 'desativado'}.`);
    } catch (err: any) {
      toastError('Falha Crítica: Não foi possível alterar a política de e-mail.');
    } finally {
      toastDismiss(tid);
    }
  };

  const handleTestEmail = async (notif: NotificationSetting) => {
    const tid = toastLoading(`Disparando teste de e-mail (${notif.kind})...`);
    try {
      const response = await fetch(`${import.meta.env.VITE_ZAPTRO_MAIL_API_URL}/v1/internal/raw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Zaptro-Internal-Secret': 'HUB_MASTER_TEST_SECRET'
        },
        body: JSON.stringify({
          to: profile?.email,
          subject: `[TESTE HUB] ${notif.event_type}`,
          template: notif.kind,
          context: {
            user_name: profile?.full_name || 'Admin',
            event_details: 'Este é um disparo de validação da Matriz Master.'
          }
        })
      });

      if (!response.ok) throw new Error('Falha na API de e-mail.');
      toastSuccess(`E-mail de teste enviado para ${profile?.email}!`);
    } catch (err) {
      toastError('Erro de Disparo: Verifique se a Mail API está online.');
    } finally {
      toastDismiss(tid);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow?.name || !selectedWorkflow?.trigger) {
      toastError('Verifique os campos: Nome e Gatilho são obrigatórios.');
      return;
    }

    const tId = toastLoading('Sincronizando fluxo com o motor de automação...');
    try {
      if (selectedWorkflow.id) {
        const { error } = await supabase
          .from('hub_workflows')
          .update(selectedWorkflow)
          .eq('id', selectedWorkflow.id);
        if (error) throw error;
        toastSuccess('Workflow master atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('hub_workflows')
          .insert([{ ...selectedWorkflow, is_active: true }]);
        if (error) throw error;
        toastSuccess('Novo fluxo operacional registrado no ecossistema!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toastError('Erro de Persistência: Falha ao salvar configuração.');
    } finally {
      toastDismiss(tId);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={HUB_MASTER_SECTION_NAV.mainInner}>
            <header style={{ ...styles.header, marginBottom: embedded ? 24 : 32 }}>
              <div>
                <h1 style={{ ...styles.title, fontSize: embedded ? 22 : 29 }}>Fluxos & Notificações (Brain)</h1>
                <p style={styles.subtitle}>Gerencie a inteligência operacional e a matriz de comunicação global do ecossistema.</p>
              </div>
              <div style={styles.headerActions}>
                <button type="button" style={styles.refreshBtn} onClick={fetchData} title="Sincronizar Matriz">
                  <RefreshCw size={18} />
                </button>
                <button
                  type="button"
                  style={{ ...styles.primaryBtn, backgroundColor: '#0061FF' }}
                  onClick={() => setIsOptionalModalOpen(true)}
                  title="Fluxos Opcionais"
                >
                  <Layers size={18} /> Fluxos Opcionais
                </button>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={() => {
                    setSelectedWorkflow({});
                    setIsModalOpen(true);
                  }}
                >
                  <Plus size={18} /> Novo Workflow
                </button>
              </div>
            </header>

      {activeTab === 'workflows' && (
        <>
          <div
            style={{
              ...HUB_METRIC_GRID_STYLE,
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
            }}
          >
            <HubMetricCard
              className="hub-metric-card premium-card hub-metric-card--elevated"
              hover={false}
              label="Fluxos ativos"
              icon={Zap}
              iconVariant="soft"
              accent="#0061FF"
              iconSize={20}
              value={loading ? '—' : workflows.filter((w) => w.is_active).length}
            />
            <HubMetricCard
              className="hub-metric-card premium-card hub-metric-card--elevated"
              hover={false}
              label="Execuções / 24h"
              icon={Activity}
              iconVariant="solid"
              accent="#0061FF"
              iconSize={20}
              value="1,284"
            />
            <HubMetricCard
              className="hub-metric-card premium-card hub-metric-card--elevated"
              hover={false}
              label="SLA de automação"
              icon={Layers}
              iconVariant="soft"
              accent="#F59E0B"
              softBg="rgba(245, 158, 11, 0.12)"
              iconSize={20}
              value="99.8%"
            />
          </div>

          <div style={styles.workflowGrid}>
            {loading ? (
              <div style={styles.loadingState}>Sincronizando cluster de automação...</div>
            ) : workflows.length === 0 ? (
               <div style={styles.loadingState}>Nenhum protocolo operacional detectado.</div>
            ) : workflows.map(wf => (
              <div 
                key={wf.id} 
                style={{...styles.wfCard, opacity: wf.is_active ? 1 : 0.7, cursor: 'pointer'}}
                className="hover-scale"
                onClick={() => { setSelectedWorkflow(wf); setIsModalOpen(true); }}
              >
                <div style={styles.wfCardHeader}>
                  <div style={{...styles.wfIcon, backgroundColor: wf.is_active ? 'var(--primary)' : '#94a3b8'}}>
                    <Zap size={18} color="white" />
                  </div>
                  <div style={styles.wfStatus}>
                    <div style={{...styles.statusDot, backgroundColor: wf.is_active ? '#0061FF' : '#f43f5e'}} />
                    {wf.is_active ? 'ATIVO' : 'PAUSADO'}
                  </div>
                </div>
                
                <h3 style={styles.wfTitle}>{wf.name}</h3>
                
                <div style={styles.wfFlow}>
                  <div style={styles.wfStep}>
                    <div style={styles.wfStepLabel}>Gatilho</div>
                    <div style={styles.wfStepValue}>{wf.trigger.replace(/_/g, ' ')}</div>
                  </div>
                  <div style={styles.wfArrow}><ChevronRight size={14} color="#cbd5e1" /></div>
                  <div style={styles.wfStep}>
                    <div style={styles.wfStepLabel}>Ação</div>
                    <div style={styles.wfStepValue}>{wf.action.replace(/_/g, ' ')}</div>
                  </div>
                </div>

                <div style={styles.wfFooter}>
                  <div style={styles.wfMeta}>
                    <Clock size={12} /> {new Date(wf.created_at).toLocaleDateString()}
                  </div>
                  <div style={styles.wfActions}>
                    <button 
                      style={styles.actionIconBtn} 
                      onClick={(e) => { e.stopPropagation(); toggleWorkflow(wf.id, wf.is_active); }}
                    >
                      {wf.is_active ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button 
                      style={styles.actionIconBtn} 
                      onClick={(e) => { e.stopPropagation(); setSelectedWorkflow(wf); setIsModalOpen(true); }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      style={{...styles.actionIconBtn, color: '#ef4444', borderColor: '#fee2e2'}} 
                      onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'notifications' && (
        <div style={styles.notifSection}>
           <div style={styles.notifHeader}>
              <h2 style={styles.sectionTitle}>Matriz de Comunicação Automatizada</h2>
              <p style={styles.sectionSub}>Defina quais eventos críticos do sistema disparam e-mails via SendGrid.</p>
           </div>

           <div style={styles.notifGrid}>
              {loading ? (
                 <div style={styles.loadingState}>Lendo configurações do cofre...</div>
              ) : notifs.map(n => (
                 <div 
                    key={n.id} 
                    style={{...styles.notifCard, cursor: 'pointer'}}
                    className="hover-scale"
                 >
                    <div style={styles.notifCardMain}>
                       <div style={{...styles.priorityBadge, 
                          backgroundColor: n.priority === 'CRITICO' ? '#fef2f2' : n.priority === 'IMPORTANTE' ? '#eff6ff' : '#f8fafc',
                          color: n.priority === 'CRITICO' ? '#ef4444' : n.priority === 'IMPORTANTE' ? 'var(--primary)' : '#64748b'
                       }}>
                          {n.priority}
                       </div>
                       <div style={styles.notifInfo}>
                          <h4 style={styles.notifEvent}>{n.event_type.replace(/_/g, ' ')}</h4>
                          <p style={styles.notifKind}>Template: <span style={{color: 'var(--primary)', fontWeight: '600'}}>{n.kind}</span></p>
                       </div>
                    </div>
                    <div style={styles.notifActions}>
                       <div style={styles.toggleWrapper} onClick={() => toggleNotification(n.id, n.is_active, n.event_type)}>
                          <div style={{...styles.toggleBg, backgroundColor: n.is_active ? '#0061FF' : '#cbd5e1'}}>
                             <div style={{...styles.toggleDot, transform: n.is_active ? 'translateX(18px)' : 'translateX(2px)'}} />
                          </div>
                          <span style={{fontSize: '11px', fontWeight: '600', color: n.is_active ? '#0061FF' : '#94a3b8'}}>
                             {n.is_active ? 'ATIVO' : 'OFF'}
                          </span>
                       </div>
                       <button 
                         style={styles.miniBtn} 
                         title="Testar Envio"
                         onClick={() => handleTestEmail(n)}
                       >
                         <Mail size={14} />
                       </button>
                    </div>
                 </div>
              ))}
           </div>

           {apiConfig && (
              <div style={styles.apiAlert}>
                 <Shield size={18} />
                 <span>O motor de e-mails está apontado para <strong>{apiConfig.url}</strong></span>
              </div>
           )}
        </div>
      )}

      {activeTab === 'events' && (
        <div style={styles.notifSection}>
           <div style={styles.notifHeader}>
              <h2 style={styles.sectionTitle}>Eventos, Filas & SLA</h2>
              <p style={styles.sectionSub}>Monitoramento de barramentos de eventos ativos, filas BullMQ/Memória e latência de processamento.</p>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div style={styles.card}>
                 <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700' }}>Fila Principal (BullMQ / Redis)</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: 'Envio de E-mails Transacionais', count: '0 pendentes', status: 'Ativo', color: '#0061FF' },
                      { name: 'Processamento de Webhooks Asaas', count: '2 na fila', status: 'Processando', color: '#f59e0b' },
                      { name: 'Sincronização de Logs de Auditoria', count: '0 pendentes', status: 'Ativo', color: '#0061FF' },
                    ].map((f, i) => (
                       <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div>
                             <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{f.name}</div>
                             <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{f.count}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: f.color }}>
                             <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: f.color }} />
                             {f.status}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              <div style={styles.card}>
                 <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700' }}>Monitoramento de SLA & Latência</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { metric: 'Latência Média de Resposta', value: '18ms', desc: 'Processamento de gatilho' },
                      { metric: 'Taxa de Sucesso dos Fluxos', value: '99.82%', desc: 'Sem falhas críticas' },
                      { metric: 'Uptime do Barramento de Eventos', value: '100%', desc: 'Serviço operacional' },
                    ].map((s, i) => (
                       <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div>
                             <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{s.metric}</div>
                             <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{s.desc}</div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>{s.value}</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'executions' && (
        <div style={styles.notifSection}>
           <div style={styles.notifHeader}>
              <h2 style={styles.sectionTitle}>Histórico de Execuções</h2>
              <p style={styles.sectionSub}>Trilha de auditoria das últimas ações executadas automaticamente pelos workflows ativos.</p>
           </div>
           
           <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                       <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Workflow / Ação</th>
                       <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Gatilho</th>
                       <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Duração</th>
                       <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Status</th>
                       <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Data / Hora</th>
                    </tr>
                 </thead>
                 <tbody>
                    {[
                      { wf: 'Notificar Nova Empresa', trigger: 'CLIENT_SIGNUP', duration: '12ms', status: 'SUCCESS', time: 'Hoje, 16:12' },
                      { wf: 'Enviar Alerta de Faturamento', trigger: 'BILLING_OVERDUE', duration: '45ms', status: 'SUCCESS', time: 'Hoje, 14:05' },
                      { wf: 'Sincronizar Backups Mensais', trigger: 'SYSTEM_CRON', duration: '120ms', status: 'SUCCESS', time: 'Ontem, 00:01' },
                      { wf: 'Verificar Saúde da Infraestrutura', trigger: 'SYSTEM_TICK', duration: '8ms', status: 'SUCCESS', time: 'Ontem, 23:55' },
                    ].map((ex, i) => (
                       <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: '#0F172A' }}>{ex.wf}</td>
                          <td style={{ padding: '16px 24px', fontSize: '12px' }}><code style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: '700' }}>{ex.trigger}</code></td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B', fontWeight: '500' }}>{ex.duration}</td>
                          <td style={{ padding: '16px 24px', fontSize: '12px' }}>
                             <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', backgroundColor: '#EFF6FF', color: '#0061FF' }}>{ex.status}</span>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '13px', color: '#94a3b8', textAlign: 'right', fontWeight: '500' }}>{ex.time}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}
      </div>

      {/* MODAL WORKFLOW */}
      <LogtaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedWorkflow?.id ? 'Configurar Inteligência' : 'Nova Automação Master'}
        icon={<Zap />}
        size="md"
        primaryAction={{
           label: 'SALVAR PROTOCOLO',
           onClick: handleSaveWorkflow
        }}
      >
        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.label}>NOME DO FLUXO</label>
            <input 
              type="text" 
              style={styles.input} 
              placeholder="Ex: Provisionamento Automático de Empresa"
              value={selectedWorkflow?.name || ''}
              onChange={e => setSelectedWorkflow({...selectedWorkflow, name: e.target.value})}
            />
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>GATILHO (TRIGGER)</label>
              <select 
                style={styles.select}
                value={selectedWorkflow?.trigger || ''}
                onChange={e => setSelectedWorkflow({...selectedWorkflow, trigger: e.target.value})}
              >
                <option value="">Selecione um evento...</option>
                <option value="lead_converted">Lead Convertido</option>
                <option value="payment_received">Pagamento Recebido</option>
                <option value="subscription_expired">Assinatura Expirada</option>
                <option value="LOGISTICS_DELAY_DETECTED">Atraso Logístico</option>
                <option value="SECURITY_CRITICAL_ALERT">Alerta de Segurança</option>
                <option value="DOCUMENT_ERROR_DETECTED">Erro de Documentação</option>
                <option value="DELIVERY_LOCATION_MISMATCH_DETECTED">Divergência de GPS</option>
                <option value="webhook_received">Webhook Externo</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>AÇÃO MASTER</label>
              <select 
                style={styles.select}
                value={selectedWorkflow?.action || ''}
                onChange={e => setSelectedWorkflow({...selectedWorkflow, action: e.target.value})}
              >
                <option value="">Selecione uma ação...</option>
                <option value="provision_company">Provisionar Empresa</option>
                <option value="send_email">Enviar E-mail</option>
                <option value="SEND_LOGISTICS_DELAY_NOTICE">Notificar Atraso</option>
                <option value="ESCALATE_TO_SECURITY_AUDIT">Auditoria de Segurança</option>
                <option value="NOTIFY_SECURITY_BREACH">Alertar Invasão/Falha</option>
                <option value="BLOCK_OPERATIONAL_FLOW">Bloquear Fluxo Operacional</option>
                <option value="BLOCK_AND_REQUIRE_VISUAL_OVERRIDE">Bloquear e Exigir Foto</option>
                <option value="create_subscription">Criar Assinatura</option>
                <option value="block_access">Bloquear Acesso</option>
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
             <label style={styles.label}>METADATA OPERACIONAL (JSON)</label>
             <textarea 
                style={styles.textarea} 
                placeholder='{"delay": "5m", "notify_admin": true}'
                value={typeof selectedWorkflow?.metadata === 'string' ? selectedWorkflow.metadata : JSON.stringify(selectedWorkflow?.metadata || {}, null, 2)}
                onChange={e => {
                  try {
                    setSelectedWorkflow({...selectedWorkflow, metadata: JSON.parse(e.target.value)});
                  } catch {
                    setSelectedWorkflow({...selectedWorkflow, metadata: e.target.value});
                  }
                }}
             />
          </div>
        </div>
      </LogtaModal>

      {/* MODAL FLUXOS OPCIONAIS */}
      <LogtaModal 
        isOpen={isOptionalModalOpen} 
        onClose={() => setIsOptionalModalOpen(false)} 
        title="Catálogo de Fluxos Opcionais"
        subtitle="Ative extensões inteligentes de monitoramento e automação pré-configuradas no ecossistema."
        icon={<Layers />}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '10px' }}>
          {optionalPresets.map((preset, idx) => (
            <div key={idx} style={{ padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#EFF6FF', color: '#0061FF', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.8px' }}>
                  OPCIONAL PRESET
                </span>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748B' }}>
                  Ação: {preset.action.replace(/_/g, ' ')}
                </span>
              </div>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{preset.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                Gatilho associado: <code style={{ fontFamily: 'monospace', color: '#0061FF', fontWeight: '700' }}>{preset.trigger}</code>
              </p>
              <button 
                style={{ ...styles.primaryBtn, width: '100%', backgroundColor: '#0061FF', marginTop: 'auto', justifyContent: 'center' }}
                onClick={() => handleInstallOptional(preset)}
              >
                <Plus size={16} /> ATIVAR ESTE FLUXO
              </button>
            </div>
          ))}
        </div>
      </LogtaModal>
    </div>
  );
};


const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '29px', fontWeight: '600', color: '#000000', letterSpacing: 0, margin: 0 },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },
  
  tabContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '8px 32px',
    marginBottom: '32px',
    borderBottom: '1px solid var(--border, #E2E8F0)',
    paddingBottom: 0,
  },
  tab: {
    position: 'relative',
    border: 'none',
    background: 'none',
    padding: '14px 0',
    marginBottom: '-1px',
    fontSize: '14px',
    lineHeight: 1.35,
    fontWeight: 500,
    fontFamily: 'inherit',
    letterSpacing: 0,
    color: 'var(--text-secondary, #64748B)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'color 0.15s ease, border-color 0.15s ease, font-weight 0.15s ease',
    outline: 'none',
    borderBottom: '3px solid transparent',
    WebkitFontSmoothing: 'antialiased',
  },
  tabActive: {
    color: 'var(--primary, #0061FF)',
    fontWeight: 600,
    borderBottom: '3px solid var(--primary, #0061FF)',
  },

  workflowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },
  wfCard: { backgroundColor: 'var(--bg-card, #fff)', borderRadius: '28px', border: '1px solid var(--border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', transition: 'all 0.2s', boxShadow: 'none' },
  wfCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  wfIcon: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  wfStatus: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', backgroundColor: '#f1f5f9', padding: '6px 14px', borderRadius: '20px', letterSpacing: '0.6px' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%' },
  wfTitle: { fontSize: '18px', fontWeight: '500', color: 'var(--text-main)', margin: 0, letterSpacing: '0.3px' },
  wfFlow: { backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border)' },
  wfStep: { flex: 1 },
  wfStepLabel: { fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.6px' },
  wfStepValue: { fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', textTransform: 'capitalize', letterSpacing: '0.2px' },
  wfFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' },
  wfMeta: { fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '400' },
  wfActions: { display: 'flex', gap: '10px' },
  actionIconBtn: { padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' },

  notifSection: { backgroundColor: 'var(--bg-card, #fff)', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px', boxShadow: 'none' },
  notifHeader: { marginBottom: '32px' },
  sectionTitle: { fontSize: '20px', fontWeight: '500', color: 'var(--text-main)', margin: '0 0 8px 0', letterSpacing: '0.4px' },
  sectionSub: { fontSize: '14px', color: 'var(--text-muted)', fontWeight: '400', letterSpacing: '0.2px' },
  notifGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  notifCard: { padding: '20px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' },
  notifCardMain: { display: 'flex', flexDirection: 'column', gap: '10px' },
  priorityBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.8px', width: 'fit-content' },
  notifEvent: { margin: 0, fontSize: '15px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px', textTransform: 'capitalize' },
  notifKind: { margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.4px' },
  notifActions: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' },
  toggleWrapper: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  toggleBg: { width: '36px', height: '20px', borderRadius: '20px', position: 'relative', transition: 'all 0.2s' },
  toggleDot: { width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  miniBtn: { padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-muted)', cursor: 'pointer' },

  apiAlert: { marginTop: '40px', padding: '16px 24px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' },

  loadingState: { padding: '80px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', fontWeight: '500' },
  
  modalBody: { padding: '10px', display: 'flex', flexDirection: 'column', gap: '24px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  label: { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', fontWeight: '500', backgroundColor: '#f8fafc', letterSpacing: '0.2px' },
  select: { padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', fontWeight: '500', backgroundColor: 'white' },
  textarea: { padding: '16px 18px', borderRadius: '16px', border: '1px solid var(--border)', outline: 'none', fontSize: '13px', fontWeight: '500', fontFamily: 'monospace', minHeight: '120px', backgroundColor: '#f8fafc', letterSpacing: '0.2px' },
  
  // Integration Styles
  guardBanner: { backgroundColor: '#1e293b', padding: '28px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #334155', boxShadow: 'none', marginBottom: '32px' },
  guardIcon: { backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '14px', borderRadius: '16px' },
  guardTitle: { margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '500', letterSpacing: '0.4px' },
  guardSub: { margin: '4px 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '400', letterSpacing: '0.2px' },
  guardLabel: { fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginBottom: '6px', letterSpacing: '1px' },
  guardBadge: { color: '#0061FF', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0, 97, 255, 0.1)', padding: '6px 14px', borderRadius: '20px' },
  integrationGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { backgroundColor: 'var(--bg-card, #fff)', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'none', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '500', color: 'var(--text-main)', margin: 0, letterSpacing: '0.3px' },
  cardSub: { fontSize: '14px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: '400' },
  planIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { padding: '6px 14px', borderRadius: '12px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.6px' },
  configArea: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border)' },
  infoLabel: { fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  codeBlock: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' },
  webhookUrlArea: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '12px' },
  urlInputRow: { display: 'flex', gap: '12px', marginTop: '12px' },
  urlCode: { fontSize: '12px', color: 'var(--text-main)', fontWeight: '500', backgroundColor: '#fff', padding: '12px 18px', borderRadius: '14px', flex: 1, border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis' },
  copyBtn: { padding: '12px', backgroundColor: 'var(--primary-light)', border: 'none', borderRadius: '14px', color: 'var(--primary)', cursor: 'pointer' },
  actionBtn: { width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },
};

export default WorkflowManagement;
