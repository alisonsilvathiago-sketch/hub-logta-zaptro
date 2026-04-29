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

const WorkflowManagement: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'workflows' | 'notifications' | 'integracoes'>('workflows');
  const [loading, setLoading] = useState(true);
  
  // States for Workflows
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Partial<Workflow> | null>(null);

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
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Fluxos & Notificações (Brain)</h1>
          <p style={styles.subtitle}>Gerencie a inteligência operacional e a matriz de comunicação global do ecossistema.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.refreshBtn} onClick={fetchData} title="Sincronizar Matriz">
              <RefreshCw size={18} />
           </button>
           <button style={styles.primaryBtn} onClick={() => { setSelectedWorkflow({}); setIsModalOpen(true); }}>
              <Plus size={18} /> Novo Workflow
           </button>
        </div>
      </header>

      <div style={styles.tabContainer}>
         <button 
            style={{...styles.tab, ...(activeTab === 'workflows' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('workflows')}
         >
            <Cpu size={16} /> Fluxos Operacionais
         </button>
         <button 
            style={{...styles.tab, ...(activeTab === 'notifications' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('notifications')}
         >
            <BellRing size={16} /> Matriz de E-mails (Brain)
         </button>
         <button 
            style={{...styles.tab, ...(activeTab === 'integracoes' ? styles.activeTab : {})}}
            onClick={() => setActiveTab('integracoes')}
         >
            <Globe size={16} /> Integrações & API
         </button>
      </div>

      {activeTab === 'workflows' && (
        <>
          <div style={styles.statsRow}>
             <div style={styles.statBox}>
                <div style={styles.statIcon}><Zap size={20} color="var(--primary)" /></div>
                <div style={styles.statInfo}>
                   <div style={styles.statLabel}>Fluxos Ativos</div>
                   <div style={styles.statValue}>{workflows.filter(w => w.is_active).length}</div>
                </div>
             </div>
             <div style={styles.statBox}>
                <div style={styles.statIcon}><Activity size={20} color="#10b981" /></div>
                <div style={styles.statInfo}>
                   <div style={styles.statLabel}>Execuções / 24h</div>
                   <div style={styles.statValue}>1,284</div>
                </div>
             </div>
             <div style={styles.statBox}>
                <div style={styles.statIcon}><Layers size={20} color="#F59E0B" /></div>
                <div style={styles.statInfo}>
                   <div style={styles.statLabel}>SLA de Automação</div>
                   <div style={styles.statValue}>99.8%</div>
                </div>
             </div>
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
                    <div style={{...styles.statusDot, backgroundColor: wf.is_active ? '#10b981' : '#f43f5e'}} />
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
                          <div style={{...styles.toggleBg, backgroundColor: n.is_active ? '#10b981' : '#cbd5e1'}}>
                             <div style={{...styles.toggleDot, transform: n.is_active ? 'translateX(18px)' : 'translateX(2px)'}} />
                          </div>
                          <span style={{fontSize: '11px', fontWeight: '600', color: n.is_active ? '#10b981' : '#94a3b8'}}>
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

      {activeTab === 'integracoes' && <IntegrationsContent />}

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
    </div>
  );
};

const IntegrationsContent: React.FC = () => {
  const [googleConfig, setGoogleConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfigs = async () => {
      const { data } = await supabase
        .from('master_settings')
        .select('value')
        .eq('key', 'GOOGLE_SERVICE_ACCOUNT_KEY')
        .maybeSingle();
      setGoogleConfig(data?.value || null);
    };
    fetchConfigs();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/webhook-asaas');
    toastSuccess('Endpoint copiado para a área de transferência.');
  };

  return (
    <div style={styles.notifSection}>
      <div style={styles.notifHeader}>
        <h2 style={styles.sectionTitle}>Integrações & Conectores Master</h2>
        <p style={styles.sectionSub}>Gerencie a conectividade global do ecossistema e chaves de alta segurança.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={styles.guardBanner}>
          <div style={styles.guardIcon}><ShieldCheck size={28} color="var(--primary)" /></div>
          <div>
             <h3 style={styles.guardTitle}>Protocolo de Alta Governança</h3>
             <p style={styles.guardSub}>Chaves e segredos são armazenados com criptografia em repouso no cofre master.</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
             <div style={styles.guardLabel}>ESTADO DE ACESSO</div>
             <div style={styles.guardBadge}><div style={styles.statusDot} /> MASTER ADMIN</div>
          </div>
        </div>

        <div style={styles.integrationGrid}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.planIcon, backgroundColor: '#fef2f2', color: '#ef4444'}}><Cloud size={24} /></div>
              <div>
                <h3 style={styles.cardTitle}>Google Cloud & Workspace</h3>
                <p style={styles.cardSub}>Meet, Drive e Agenda.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{...styles.statusBadge, backgroundColor: googleConfig ? '#ecfdf5' : '#fff7ed', color: googleConfig ? '#10b981' : '#f97316'}}>
                  {googleConfig ? 'ATIVO' : 'PENDENTE'}
                </span>
              </div>
            </div>
            <div style={styles.configArea}>
               <label style={styles.infoLabel}>SERVICE ACCOUNT ID</label>
               <div style={styles.codeBlock}><code>{googleConfig?.client_email || 'Aguardando configuração...'}</code></div>
            </div>
            <button style={{ ...styles.actionBtn, marginTop: '20px', color: '#ef4444', borderColor: '#fee2e2' }}>
              <Settings size={14} /> RE-CONFIGURAR CHAVE
            </button>
          </div>

          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{...styles.planIcon, backgroundColor: '#eff6ff', color: 'var(--primary)'}}><DollarSign size={24} /></div>
              <div>
                <h3 style={styles.cardTitle}>Gateway Asaas</h3>
                <p style={styles.cardSub}>Fluxos financeiros master.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span style={{...styles.statusBadge, backgroundColor: '#ecfdf5', color: '#10b981'}}>CONECTADO</span>
              </div>
            </div>
            <div style={styles.configArea}>
               <label style={styles.infoLabel}>API KEY MASTER</label>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>$a***************************************</code>
                  <Eye size={14} color="#94a3b8" />
               </div>
            </div>
            <button style={{ ...styles.actionBtn, marginTop: '20px' }}><Settings size={14} /> AJUSTES</button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
               <h3 style={styles.cardTitle}><Zap size={18} color="#f59e0b" fill="#f59e0b" /> Webhooks Ativos</h3>
               <p style={styles.cardSub}>Escuta global de eventos externos.</p>
            </div>
            <button style={styles.refreshBtn}><RefreshCw size={14} /></button>
          </div>
          <div style={styles.webhookUrlArea}>
            <label style={styles.infoLabel}>ENDPOINT (ASAAS)</label>
            <div style={styles.urlInputRow}>
               <code style={styles.urlCode}>.../functions/v1/hub-core/webhook-asaas</code>
               <button style={styles.copyBtn} onClick={handleCopyWebhook}><Copy size={16} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: '500', color: 'var(--primary)', letterSpacing: '0.4px', margin: 0 },
  subtitle: { fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '400', letterSpacing: '0.2px' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-muted)' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },
  
  tabContainer: { display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '1px' },
  tab: { padding: '12px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', backgroundColor: 'transparent', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', letterSpacing: '0.4px' },
  activeTab: { color: 'var(--primary)', borderBottomColor: 'var(--primary)', backgroundColor: 'var(--primary-light)', borderRadius: '12px 12px 0 0' },

  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
  statBox: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: 'var(--shadow-sm)' },
  statIcon: { width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statValue: { fontSize: '24px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px' },

  workflowGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },
  wfCard: { backgroundColor: 'white', borderRadius: '28px', border: '1px solid var(--border)', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' },
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

  notifSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px', boxShadow: 'var(--shadow-lg)' },
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
  guardBanner: { backgroundColor: '#1e293b', padding: '28px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #334155', boxShadow: 'var(--shadow-lg)', marginBottom: '32px' },
  guardIcon: { backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '14px', borderRadius: '16px' },
  guardTitle: { margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '500', letterSpacing: '0.4px' },
  guardSub: { margin: '4px 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '400', letterSpacing: '0.2px' },
  guardLabel: { fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginBottom: '6px', letterSpacing: '1px' },
  guardBadge: { color: '#10b981', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '20px' },
  integrationGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' },
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
