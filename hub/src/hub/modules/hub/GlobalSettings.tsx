import React, { useState, useEffect } from 'react';
import { useAuth } from '@core/context/AuthContext';
import { useSystemConfig } from '@core/context/SystemConfigContext';
import { 
  Globe, Users, Terminal, ShieldCheck, 
  Palette, Database, Save, 
  RefreshCw, Zap, User,
  Activity, Cpu, Network, Shield,
  Layout, Link as LinkIcon, Smartphone,
  Bell, Workflow, Plug,
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sub-componentes
import EvolutionManager from './EvolutionManager';
import TeamHub from './TeamHub';
import WorkflowManagement, { WORKFLOW_SECTIONS, type WorkflowSectionId } from './Workflows';
import IntegrationsPage, { INTEGRATION_TABS } from './IntegrationsPage';
import HubNotifications from '@hub/pages/HubNotifications';
import Button from '@shared/components/Button';
import HubMasterSectionAside from '@hub/components/HubMasterSectionAside';
import { HUB_PAGE_SUBTITLE, HUB_SIDEBAR_NAV_LABEL } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_SECTION_NAV } from '@hub/styles/hubMasterSectionNavStyles';

type SettingsNavTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Rota dedicada em settings (ex.: `/master/settings/evolution`). */
  dedicatedPath?: string;
  badge?: string;
};

type SettingsNavSection = { title: string; items: SettingsNavTab[] };

const SETTINGS_NAV_SECTIONS: SettingsNavSection[] = [
  {
    title: 'Configuração',
    items: [
      { id: 'geral', label: 'Geral & Branding', icon: <Globe size={18} strokeWidth={2} /> },
      { id: 'equipe', label: 'Equipe & Acesso', icon: <Users size={18} strokeWidth={2} /> },
      { id: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={18} strokeWidth={2} /> },
      { id: 'notificacoes', label: 'Notificações', icon: <Bell size={18} strokeWidth={2} /> },
    ],
  },
  {
    title: 'Fluxos e integrações',
    items: [
      { id: 'automacoes', label: 'Automações', icon: <Workflow size={18} strokeWidth={2} /> },
      { id: 'integracoes', label: 'Integrações', icon: <Plug size={18} strokeWidth={2} /> },
      {
        id: 'evolution',
        label: 'Motores WhatsApp',
        icon: <Smartphone size={18} strokeWidth={2} />,
        dedicatedPath: '/master/settings/evolution',
      },
    ],
  },
  {
    title: 'API e laboratório',
    items: [
      { id: 'api', label: 'API & Developers', icon: <Terminal size={18} strokeWidth={2} /> },
      { id: 'labs', label: 'Labs / Beta', icon: <Zap size={18} strokeWidth={2} />, badge: 'Beta' },
    ],
  },
];

const MasterSettings: React.FC = () => {
  const { profile } = useAuth();
  const { configs: globalConfigs, refreshConfigs } = useSystemConfig();
  const location = useLocation();
  const navigate = useNavigate();
  
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/settings/equipe')) return 'equipe';
    if (path.includes('/settings/evolution')) return 'evolution';
    if (path.includes('/settings/sistema')) return 'sistema';
    
    // Check fallback search params
    const queryTab = new URLSearchParams(location.search).get('tab');
    if (queryTab) return queryTab;
    
    return 'geral';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const workflowSub: WorkflowSectionId = (() => {
    const sub = searchParams.get('sub');
    return WORKFLOW_SECTIONS.some((s) => s.id === sub) ? (sub as WorkflowSectionId) : 'workflows';
  })();
  const integrationSub = (() => {
    const sub = searchParams.get('sub');
    const valid = INTEGRATION_TABS.some((t) => t.id === sub);
    return valid ? (sub as (typeof INTEGRATION_TABS)[number]['id']) : 'google';
  })();

  const settingsBackFooter = (
    <>
      <div style={HUB_MASTER_SECTION_NAV.sidebarSectionRule} aria-hidden />
      <button
        type="button"
        className="hub-sidebar-item expanded"
        onClick={() => navigate('/master/settings?tab=geral')}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          width: '100%',
          boxSizing: 'border-box',
          marginTop: 4,
        }}
      >
        <span style={{ ...HUB_SIDEBAR_NAV_LABEL, flex: 1, textAlign: 'left', color: '#6b7280' }}>
          ← Todas as configurações
        </span>
      </button>
    </>
  );
  
  // Local states for form management
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [systemLockdown, setSystemLockdown] = useState(false);

  // Sync local state when global configs load
  useEffect(() => {
    if (globalConfigs) {
      setPlatformName(globalConfigs.platformName);
      setSupportEmail(globalConfigs.supportEmail);
      setPrimaryColor(globalConfigs.primaryColor);
      setAllowRegistration(globalConfigs.allowRegistration);
      setSystemLockdown(globalConfigs.systemLockdown || false);
    }
  }, [globalConfigs]);

  // Update tab if URL changes (e.g. from profile pop-up or back button)
  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname, location.search]);

  const handleSaveAll = async () => {
    if (!profile?.id) return;

    // Validação de Campos Obrigatórios
    if (!platformName || !supportEmail) {
       toastError('Erro de Configuração! Os campos Nome da Plataforma e E-mail de Suporte são obrigatórios.');
       return;
    }

    setLoading(true);
    const tid = toastLoading('Sincronizando cérebro da plataforma e propagando DNS...');

    try {
      const configEntries = [
        { key: 'PLATFORM_NAME', value: platformName },
        { key: 'SUPPORT_EMAIL', value: supportEmail },
        { key: 'PRIMARY_COLOR', value: primaryColor },
        { key: 'ALLOW_REGISTRATION', value: allowRegistration.toString() },
        { key: 'SYSTEM_LOCKDOWN', value: systemLockdown.toString() }
      ];

      for (const entry of configEntries) {
        const { error } = await supabase
          .from('master_settings')
          .upsert({ key: entry.key, value: entry.value }, { onConflict: 'key' });
        if (error) throw error;
      }

      await supabase.from('master_audit_logs').insert({
        actor_id: profile.id,
        target_type: 'SYSTEM',
        action: 'UPDATE_CONFIGS',
        details: `Configurações globais atualizadas: Nome=${platformName}, Cor=${primaryColor}`,
        metadata: { platformName, primaryColor, supportEmail }
      });

      await refreshConfigs();
      toastDismiss(tid);
      toastSuccess('Configurações Globais Propagadas com Sucesso! O ecossistema foi atualizado. ');
    } catch (err: any) {
      toastDismiss(tid);
      toastError(`Falha Crítica ao Salvar: ${err.message}. Verifique a conexão com o banco de dados.`);
    } finally {
      setLoading(false);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'geral': return (
        <GeralTab 
          name={platformName} setName={setPlatformName} 
          email={supportEmail} setEmail={setSupportEmail}
          reg={allowRegistration} setReg={setAllowRegistration}
          color={primaryColor} setColor={setPrimaryColor}
          lockdown={systemLockdown} setLockdown={setSystemLockdown}
          onSave={handleSaveAll}
          loading={loading}
        />
      );
      case 'equipe': return <TeamHub />;
      case 'evolution': return <EvolutionManager />;
      case 'seguranca': return (
        <div style={styles.tabContent}>
           <div style={styles.tabHeader}>
              <h3 style={styles.tabTitle}>Segurança & Governança de Borda</h3>
              <p style={styles.tabSub}>Controle central de acesso, autenticação multifator e firewall perimetral do ecossistema.</p>
           </div>
           
           <div style={{...styles.card, border: '1px solid #FEE2E2', backgroundColor: '#FEF2F2', marginBottom: '32px'}}>
              <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
                 <div style={{...styles.logoPreview, backgroundColor: '#EF4444'}}><ShieldCheck size={24} /></div>
                 <div>
                    <h4 style={{margin: 0, fontSize: '15px', fontWeight: '800', color: '#991B1B'}}>Central de Segurança Ativa</h4>
                    <p style={{margin: '4px 0 0', fontSize: '12px', color: '#B91C1C'}}>Configure 2FA, políticas de sessão e firewall perimetral nesta aba.</p>
                 </div>
              </div>
           </div>

           <div style={styles.fGrid}>
              <div style={styles.fGroup}>
                 <label style={styles.fLabel}>Política de 2FA para Admins</label>
                 <select style={styles.input} defaultValue="OBRIGATORIO">
                    <option value="OBRIGATORIO">Obrigatório (Recomendado)</option>
                    <option value="OPCIONAL">Opcional</option>
                 </select>
              </div>
              <div style={styles.fGroup}>
                 <label style={styles.fLabel}>Sessão de Inatividade</label>
                 <select style={styles.input} defaultValue="30">
                    <option value="15">15 Minutos</option>
                    <option value="30">30 Minutos</option>
                    <option value="60">1 Hora</option>
                 </select>
              </div>
           </div>
        </div>
      );
      case 'automacoes':
        return (
          <WorkflowManagement
            embedded
            activeSection={workflowSub}
            onSectionChange={(id) => {
              const params = new URLSearchParams(location.search);
              params.set('tab', 'automacoes');
              params.set('sub', id);
              navigate({ pathname: '/master/settings', search: params.toString() }, { replace: true });
            }}
          />
        );
      case 'integracoes':
        return (
          <IntegrationsPage
            embedded
            activeSubTab={integrationSub}
            onSubTabChange={(id) => {
              const params = new URLSearchParams(location.search);
              params.set('tab', 'integracoes');
              if (id === 'google') params.delete('sub');
              else params.set('sub', id);
              navigate({ pathname: '/master/settings', search: params.toString() }, { replace: true });
            }}
          />
        );
      case 'notificacoes':
        return <HubNotifications embedded />;
      case 'api': return <div style={styles.tabPlaceholder}>API & Developers: Documentação, tokens, webhooks e logs de API.</div>;
      case 'labs': return <div style={styles.tabPlaceholder}>Labs / Beta: Funcionalidades experimentais e recursos beta.</div>;
      default: return <div style={styles.tabPlaceholder}>Selecione um módulo no menu lateral.</div>;
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={HUB_MASTER_SECTION_NAV.layout} className="hub-settings-layout">
        {activeTab === 'automacoes' ? (
          <HubMasterSectionAside
            heading="Automações"
            ariaLabel="Seções de automação"
            items={WORKFLOW_SECTIONS.map((s) => ({ id: s.id, label: s.label, icon: s.icon }))}
            activeId={workflowSub}
            onSelect={(id) => {
              const params = new URLSearchParams(location.search);
              params.set('tab', 'automacoes');
              params.set('sub', id);
              navigate({ pathname: '/master/settings', search: params.toString() }, { replace: true });
            }}
            footer={settingsBackFooter}
          />
        ) : activeTab === 'integracoes' ? (
          <HubMasterSectionAside
            heading="Integrações"
            ariaLabel="Seções de integrações"
            items={INTEGRATION_TABS.map((t) => ({ id: t.id, label: t.label, icon: t.icon }))}
            activeId={integrationSub}
            onSelect={(id) => {
              const params = new URLSearchParams(location.search);
              params.set('tab', 'integracoes');
              if (id === 'google') params.delete('sub');
              else params.set('sub', id);
              navigate({ pathname: '/master/settings', search: params.toString() }, { replace: true });
            }}
            footer={settingsBackFooter}
          />
        ) : (
        <aside style={HUB_MASTER_SECTION_NAV.sidebarWrapper}>
          <nav style={HUB_MASTER_SECTION_NAV.sidebar} aria-label="Seções de configuração">
            <h2 style={HUB_MASTER_SECTION_NAV.sidebarHeading}>Configurações</h2>
            <div style={HUB_MASTER_SECTION_NAV.sidebarHeadingRule} aria-hidden="true" />
            {SETTINGS_NAV_SECTIONS.map((section, sIdx) => (
              <div key={section.title} style={HUB_MASTER_SECTION_NAV.sidebarSection}>
                {sIdx > 0 ? <div style={HUB_MASTER_SECTION_NAV.sidebarSectionRule} aria-hidden="true" /> : null}
                <div className="hub-settings-section-label" style={HUB_MASTER_SECTION_NAV.sidebarSectionLabel}>
                  {section.title}
                </div>
                <div style={HUB_MASTER_SECTION_NAV.sidebarSectionItems}>
                  {section.items.map((tab) => {
                    const isActive =
                      activeTab === tab.id ||
                      (!!tab.dedicatedPath &&
                        (location.pathname === tab.dedicatedPath ||
                          location.pathname.startsWith(`${tab.dedicatedPath}/`)));
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          if (tab.dedicatedPath) navigate(tab.dedicatedPath);
                          else if (tab.id === 'equipe') navigate('/master/settings/equipe');
                          else navigate(`/master/settings?tab=${tab.id}`);
                        }}
                        className={`hub-sidebar-item expanded${isActive ? ' active' : ''}`}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          backgroundColor: 'transparent',
                          boxShadow: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span style={{ ...HUB_SIDEBAR_NAV_LABEL, flex: 1, textAlign: 'left' }}>{tab.label}</span>
                        {tab.badge ? (
                          <span style={styles.navItemBadge}>{tab.badge}</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>
        )}

        <main style={{ ...HUB_MASTER_SECTION_NAV.main, paddingTop: 38 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: 0, right: 0, zIndex: 10, gap: 8 }}>
            <button
              type="button"
              className="hub-btn-secondary"
              style={styles.refreshBtn}
              onClick={refreshConfigs}
              disabled={loading}
              title="Recarregar configurações"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={HUB_MASTER_SECTION_NAV.mainInner}>{renderActiveTab()}</div>
        </main>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES ---

const SettingsCard = ({ title, subtitle, children, onSave, loading }: any) => {
  return (
    <div style={{ marginBottom: '40px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>{subtitle}</p>}
      </div>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        <div style={{ padding: '24px' }}>{children}</div>
        {onSave && (
          <div
            style={{
              backgroundColor: '#F9FAFB',
              borderTop: '1px solid #E5E7EB',
              padding: '12px 24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              className="hub-btn-primary hub-btn-primary--flat"
              onClick={onSave}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsRow = ({ label, description, children, noBorder }: any) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(150px, 260px) 1fr',
      gap: '32px',
      padding: '20px 0',
      borderBottom: noBorder ? 'none' : '1px solid #F3F4F6',
    }} className="settings-row-entry">
      <div>
        <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '4px' }}>{label}</label>
        {description && <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.4 }}>{description}</p>}
      </div>
      <div style={{ maxWidth: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
        {children}
      </div>
    </div>
  );
};

const GeralTab = ({ name, setName, email, setEmail, reg, setReg, color, setColor, lockdown, setLockdown, onSave, loading }: any) => {
  return (
    <div style={styles.geralTabContent}>
       <div style={{ ...styles.tabHeader, borderBottom: '1px solid #E5E7EB', paddingBottom: '24px', marginBottom: '32px' }}>
          <h3 style={{ ...styles.tabTitle, fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>Identidade & Branding Global</h3>
          <p style={{ ...styles.tabSub, fontSize: '14px', color: '#6B7280' }}>Configure a presença da marca Logta e regras básicas de entrada na plataforma.</p>
       </div>

       <SettingsCard 
         title="Identidade da Plataforma" 
         subtitle="Configurações gerais e canais de suporte da organização."
         onSave={onSave}
         loading={loading}
       >
          <SettingsRow label="Nome da Plataforma (Hub)">
             <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Logta HQ" />
          </SettingsRow>
          <SettingsRow label="E-mail de Suporte Central" noBorder>
             <input style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="master@logta.com" />
          </SettingsRow>
       </SettingsCard>

       <SettingsCard 
         title="Branding e Customização" 
         subtitle="Defina a cor principal e o logotipo corporativo."
         onSave={onSave}
         loading={loading}
       >
          <SettingsRow label="Cor Primária do Hub">
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                <input 
                   type="color" 
                   value={color || '#0061FF'} 
                   onChange={e => setColor(e.target.value)} 
                   style={{...styles.input, padding: '2px', height: '36px', width: '48px', flex: 'none', cursor: 'pointer', minHeight: 'unset'}}
                />
                <input style={{...styles.input, flex: 1}} value={color} onChange={e => setColor(e.target.value)} />
             </div>
          </SettingsRow>
          <SettingsRow label="Logo Principal (Master)" noBorder>
             <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%' }}>
                <div style={{ ...styles.logoPreview, backgroundColor: color || '#0061FF', width: '44px', height: '44px', fontSize: '18px', borderRadius: '8px' }}>L</div>
                <div style={{ flex: 1 }}>
                   <p style={{ margin: '0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>A logo enviada aqui será replicada em todas as áreas não customizadas.</p>
                </div>
                <Button variant="outline" size="sm" label="Alterar Logo" style={{ flexShrink: 0 }} />
             </div>
          </SettingsRow>
       </SettingsCard>

       <SettingsCard 
         title="Políticas de Acesso" 
         subtitle="Gerenciamento de convites e segurança de borda da infraestrutura."
         onSave={onSave}
         loading={loading}
       >
          <SettingsRow label="Políticas de Registro">
             <select style={styles.input} value={reg.toString()} onChange={e => setReg(e.target.value === 'true')}>
                <option value="true">Aberto (Landing Page)</option>
                <option value="false">Restrito (Apenas Convite)</option>
             </select>
          </SettingsRow>
          <SettingsRow label="Master Lockdown (Gateway)" noBorder>
             <select 
               style={{...styles.input, backgroundColor: lockdown ? '#FEF2F2' : '#FFFFFF', borderColor: lockdown ? '#EF4444' : '#E5E7EB'}} 
               value={lockdown.toString()} 
               onChange={e => setLockdown(e.target.value === 'true')}
             >
                <option value="false">Operação Normal</option>
                <option value="true">LOCKDOWN ATIVO (Restringir Acessos)</option>
             </select>
          </SettingsRow>
       </SettingsCard>
    </div>
  );
};

const GoogleWorkspaceTab = () => {
  const [gcpKey, setGcpKey] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SAVING' | 'ERROR'>('IDLE');

  useEffect(() => {
    const fetchKey = async () => {
      const { data } = await supabase.from('master_settings').select('value').eq('key', 'GOOGLE_SERVICE_ACCOUNT_KEY').single();
      if (data) setGcpKey(typeof data.value === 'string' ? data.value : JSON.stringify(data.value, null, 2));
    };
    fetchKey();
  }, []);

  const handleSaveKey = async () => {
    setStatus('SAVING');
    const tid = toastLoading('Configurando orquestração Google...');
    try {
      const parsed = JSON.parse(gcpKey);
      const { error } = await supabase.from('master_settings').upsert({ key: 'GOOGLE_SERVICE_ACCOUNT_KEY', value: parsed }, { onConflict: 'key' });
      if (error) throw error;
      toastSuccess('Google Hub Workspace Ativado!');
      setStatus('IDLE');
    } catch (err: any) {
      toastError('JSON Inválido: ' + err.message);
      setStatus('ERROR');
    } finally {
      toastDismiss(tid);
    }
  };

  return (
    <div style={styles.tabContent}>
       <h3 style={styles.tabTitle}>Google Cloud & Workspace Hub</h3>
       <p style={styles.tabSub}>Integração nativa para Meet e Agenda no ecossistema Logta.</p>
       
       <div style={styles.fGroup}>
          <label style={styles.fLabel}>Service Account JSON Key</label>
          <textarea 
             style={{...styles.textarea, minHeight: '350px', fontFamily: 'monospace', fontSize: '12px'}} 
             placeholder='Cole o JSON da sua Service Account aqui...'
             value={gcpKey}
             onChange={e => setGcpKey(e.target.value)}
          />
       </div>

        <div style={{marginTop: '24px'}}>
           <Button 
             variant="primary" 
             icon={<Save size={18} />} 
             label="Salvar Integração Google" 
             onClick={handleSaveKey} 
             loading={status === 'SAVING'} 
           />
        </div>
    </div>
  );
};

const CoreStatusTab = () => {
  const [activeMetric, setActiveMetric] = useState<'cpu' | 'ram' | 'req'>('cpu');

  const chartData = [
    { time: '16:45', cpu: 14, ram: 38, req: 85 },
    { time: '16:50', cpu: 22, ram: 39, req: 112 },
    { time: '16:55', cpu: 18, ram: 38, req: 95 },
    { time: '17:00', cpu: 42, ram: 41, req: 210 },
    { time: '17:05', cpu: 31, ram: 43, req: 165 },
    { time: '17:10', cpu: 27, ram: 40, req: 140 },
    { time: '17:15', cpu: 35, ram: 42, req: 195 },
    { time: '17:20', cpu: 39, ram: 45, req: 240 }
  ];

  const getMetricColor = () => {
    if (activeMetric === 'cpu') return '#0061FF';
    if (activeMetric === 'ram') return '#0061FF';
    return '#F59E0B';
  };

  const getMetricGradientId = () => {
    return `color${activeMetric.toUpperCase()}`;
  };

  return (
    <div style={styles.tabContent}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <div>
           <h3 style={styles.tabTitle}>Status do Núcleo (Logta Engine)</h3>
           <p style={styles.tabSub}>Monitoramento de saúde dos microsserviços e tabelas críticas em tempo real.</p>
         </div>
         <span style={{ 
           fontSize: '10px', 
           fontWeight: '800', 
           letterSpacing: '0.5px', 
           color: '#0061FF', 
           background: '#EFF6FF', 
           padding: '6px 12px', 
           borderRadius: '20px',
           display: 'flex',
           alignItems: 'center',
           gap: '6px'
         }}>
           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0061FF', boxShadow: '0 0 8px #0061FF' }} />
           TEMPO REAL CONECTADO
         </span>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { id: 'cpu', label: 'Supabase DB', status: 'Online', icon: <Database size={20} />, latency: '12ms', color: '#0061FF', bg: 'rgba(0, 97, 255, 0.08)' },
            { id: 'ram', label: 'Edge Runtime', status: 'Online', icon: <Cpu size={20} />, latency: '45ms', color: '#0061FF', bg: 'rgba(0, 97, 255, 0.08)' },
            { id: 'req', label: 'Mail Server', status: 'Online', icon: <LinkIcon size={20} />, latency: '110ms', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
          ].map((item) => (
            <div 
              key={item.id} 
              onClick={() => setActiveMetric(item.id as any)}
              style={{
                ...styles.statusCard,
                cursor: 'pointer',
                border: activeMetric === item.id ? `2px solid ${item.color}` : '1px solid #E2E8F0',
                transition: 'all 0.2s ease',
                transform: activeMetric === item.id ? 'translateY(-2px)' : 'none',
                boxShadow: activeMetric === item.id ? `0 10px 20px -5px ${item.color}15` : 'none'
              }}
            >
               <div style={{ ...styles.statusIcon, backgroundColor: item.bg, color: item.color, border: 'none' }}>{item.icon}</div>
               <div style={styles.statusInfo}>
                  <div style={styles.statusLabel}>{item.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0061FF' }} />
                    <span style={{ ...styles.statusValue, fontSize: '15px' }}>{item.status}</span>
                  </div>
                  <div style={styles.statusMeta}>Latência: <span style={{ color: item.color, fontWeight: 700 }}>{item.latency}</span></div>
               </div>
            </div>
          ))}
       </div>

       <div style={{ ...styles.card, padding: '28px', borderRadius: '28px' }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
             <div>
               <h4 style={{margin: 0, fontSize: '16px', fontWeight: '800', color: '#0F172A', letterSpacing: '0.3px'}}>Telemetria de Carga Unificada</h4>
               <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748B' }}>Visualizando estatísticas de {activeMetric.toUpperCase()} em tempo real do ecossistema.</p>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
               {(['cpu', 'ram', 'req'] as const).map(m => (
                 <button
                   key={m}
                   onClick={() => setActiveMetric(m)}
                   style={{
                     padding: '6px 14px',
                     borderRadius: '12px',
                     fontSize: '11px',
                     fontWeight: '800',
                     border: 'none',
                     cursor: 'pointer',
                     backgroundColor: activeMetric === m ? getMetricColor() : '#F1F5F9',
                     color: activeMetric === m ? 'white' : '#64748B',
                     transition: 'all 0.2s'
                   }}
                 >
                   {m.toUpperCase()}
                 </button>
               ))}
               <Button variant="outline" size="sm" label="Reiniciar Serviços" style={{ marginLeft: '12px' }} />
             </div>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={getMetricGradientId()} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={getMetricColor()} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={getMetricColor()} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="time" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: '700' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: '700' }} 
                  domain={[0, activeMetric === 'req' ? 300 : 100]}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{
                          backgroundColor: '#0F172A',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                          border: 'none',
                          fontSize: '12px'
                        }}>
                          <div style={{ fontWeight: '700', marginBottom: '4px', color: '#94A3B8' }}>{payload[0].payload.time}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getMetricColor() }} />
                            <span>{activeMetric.toUpperCase()}: <strong>{payload[0].value}{activeMetric === 'req' ? ' reqs/s' : '%'}</strong></span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeMetric} 
                  stroke={getMetricColor()} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill={`url(#${getMetricGradientId()})`} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};

// --- ESTILOS ---

const styles: Record<string, any> = {
  container: { padding: '0', backgroundColor: '#FFFFFF', width: '100%' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap' as const,
    marginBottom: '28px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1d21',
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.35,
      },
  subtitle: { ...HUB_PAGE_SUBTITLE, padding: '6px 0 0 0', maxWidth: '520px' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: {
    width: '40px',
    height: '40px',
    padding: 0,
    minWidth: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },

  layout: {
    display: 'grid',
    gridTemplateColumns: '240px 1fr',
    gap: 0,
    alignItems: 'flex-start',
  },
  sidebarWrapper: {
    position: 'sticky',
    top: '0',
    alignSelf: 'flex-start',
    maxHeight: 'calc(100vh - 48px)',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    minHeight: 'min(800px, 80vh)',
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: 'transparent',
    padding: '0 12px 0 0',
    borderRadius: 0,
    border: 'none',
    borderRight: '1px solid #E5E7EB',
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E1 transparent',
  },
  sidebarHeading: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#1a1d21',
    letterSpacing: '-0.02em',
    lineHeight: 1.3,
      },
  sidebarHeadingRule: {
    height: 1,
    backgroundColor: '#eceef1',
    margin: '12px 0 14px',
    borderRadius: 1,
    flexShrink: 0,
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  sidebarSectionRule: {
    height: 1,
    backgroundColor: '#F1F5F9',
    margin: '14px 0 12px',
    flexShrink: 0,
  },
  sidebarSectionLabel: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#94A3B8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0 8px 8px',
    lineHeight: 1.3,
      },
  sidebarSectionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  navItemBadge: {
    fontSize: '9px',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '8px',
    border: '1px solid rgba(249, 115, 22, 0.45)',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
  },
  navItemExternalIcon: {
    color: '#94A3B8',
    opacity: 0.85,
    flexShrink: 0,
  },

  content: {
    backgroundColor: '#FFFFFF',
    padding: '0 var(--hub-shell-space-page-x, 24px) 64px var(--hub-shell-space-page-x, 24px)',
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
    minHeight: 'min(700px, 70vh)',
    marginTop: 0,
    marginBottom: 0,
    position: 'relative',
  },
  tabHeader: { marginBottom: '32px' },
  tabTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#1a1d21',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
    lineHeight: 1.35,
        backgroundImage: 'none',
    WebkitBackgroundClip: 'unset',
    backgroundClip: 'unset',
  },
  tabSub: {
    ...HUB_PAGE_SUBTITLE,
    fontWeight: 400,
    fontSize: '12px',
    color: 'rgba(115, 115, 115, 1)',
  },
  tabPlaceholder: {
    height: '384px',
    maxHeight: '428px',
    marginTop: '7px',
    marginBottom: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontWeight: '500',
  },

  /** Conteúdo padrão das abas (exceto Geral, que usa `geralTabContent`) */
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  /** Aba Geral — alinhado ao modelo de perfil (margens, topo, sem row-gap) */
  geralTabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    fontWeight: 800,
  },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    fontWeight: 400,
    outline: 'none',
    fontSize: '13px',
    color: '#111827',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    minHeight: '38px',
    boxSizing: 'border-box' as const,
    width: '100%',
  },
  textarea: { padding: '18px', borderRadius: '22px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '500', outline: 'none', resize: 'vertical' },

  card: { padding: '24px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e8eaed' },
  logoPreview: { width: '56px', height: '56px', color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '24px' },
  secondaryBtn: { padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.2px' },

  statusCard: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' },
  statusIcon: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statusValue: { fontSize: '16px', fontWeight: '600', color: '#1e293b', letterSpacing: '0.2px' },
  statusMeta: { fontSize: '11px', color: '#0061FF', fontWeight: '500', marginTop: '2px', letterSpacing: '0.2px' }
};

export default MasterSettings;

