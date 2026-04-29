import React, { useState, useEffect } from 'react';
import { useAuth } from '@core/context/AuthContext';
import { useSystemConfig } from '@core/context/SystemConfigContext';
import { 
  Globe, Users, Terminal, ShieldCheck, 
  Bell, Palette, Database, Save, 
  RefreshCw, Zap, HardDrive, User,
  Activity, Cpu, Network, Shield,
  CreditCard, Layout, Link as LinkIcon, Smartphone
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useLocation } from 'react-router-dom';

// Sub-componentes
import MasterBilling from './Billing';
import InteractionsTab from './Interactions';
import EvolutionManager from './EvolutionManager';
import HubNotifications from '../../pages/HubNotifications';
import MasterStaff from './Staff';

const MasterSettings: React.FC = () => {
  const { profile } = useAuth();
  const { configs: globalConfigs, refreshConfigs } = useSystemConfig();
  const location = useLocation();
  
  // Get initial tab from URL or default to 'geral'
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'geral';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  
  // Local states for form management
  const [platformName, setPlatformName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Sync local state when global configs load
  useEffect(() => {
    if (globalConfigs) {
      setPlatformName(globalConfigs.platformName);
      setSupportEmail(globalConfigs.supportEmail);
      setPrimaryColor(globalConfigs.primaryColor);
      setAllowRegistration(globalConfigs.allowRegistration);
    }
  }, [globalConfigs]);

  // Update tab if URL changes (e.g. from profile pop-up)
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

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
        { key: 'ALLOW_REGISTRATION', value: allowRegistration.toString() }
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
      toastSuccess('Configurações Globais Propagadas com Sucesso! O ecossistema foi atualizado. 🚀');
    } catch (err: any) {
      toastDismiss(tid);
      toastError(`Falha Crítica ao Salvar: ${err.message}. Verifique a conexão com o banco de dados.`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Geral & Branding', icon: <Globe size={18} /> },
    { id: 'equipe', label: 'Equipe Master', icon: <Users size={18} /> },
    { id: 'financeiro', label: 'Faturamento Master', icon: <CreditCard size={18} /> },
    { id: 'interacoes', label: 'Interações & Hub', icon: <LinkIcon size={18} /> },
    { id: 'evolution', label: 'Evolution API Hub', icon: <Smartphone size={18} /> },
    { id: 'notificacoes', label: 'Central de Alertas', icon: <Bell size={18} /> },
    { id: 'sistema', label: 'Status do Núcleo', icon: <Database size={18} /> },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'geral': return (
        <GeralTab 
          name={platformName} setName={setPlatformName} 
          email={supportEmail} setEmail={setSupportEmail}
          reg={allowRegistration} setReg={setAllowRegistration}
          color={primaryColor} setColor={setPrimaryColor}
        />
      );
      case 'equipe': return <MasterStaff />;
      case 'financeiro': return <MasterBilling summaryOnly={true} />;
      case 'interacoes': return <InteractionsTab />;
      case 'evolution': return <EvolutionManager />;
      case 'notificacoes': return <HubNotifications />;
      case 'sistema': return <CoreStatusTab />;
      default: return <div style={styles.tabPlaceholder}>Selecione um módulo no menu lateral.</div>;
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <div style={styles.badge}>MASTER HQ • CENTRAL DE ORQUESTRAÇÃO</div>
          <h1 style={styles.title}>Painel de Controle Master</h1>
          <p style={styles.subtitle}>Gestão unificada de regras, infraestrutura e governança do ecossistema.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.refreshBtn} onClick={refreshConfigs} disabled={loading}><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
           <button style={styles.saveBtn} onClick={handleSaveAll} disabled={loading}>
              <Save size={18} /> {loading ? 'Propagando...' : 'Propagar Alterações'}
           </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* SIDEBAR TABS FIXED */}
        <aside style={styles.sidebarWrapper}>
          <nav style={styles.sidebar}>
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabBtn,
                  ...(activeTab === tab.id ? styles.tabBtnActive : {})
                }}
              >
                <div style={{
                  ...styles.tabIcon,
                  backgroundColor: activeTab === tab.id ? 'var(--primary)' : '#f1f5f9',
                  color: activeTab === tab.id ? 'white' : '#64748b'
                }}>
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* CONTENT AREA */}
        <main style={styles.content}>
           {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES ---

const GeralTab = ({ name, setName, email, setEmail, reg, setReg, color, setColor }: any) => {
  return (
    <div style={styles.tabContent}>
       <div style={styles.tabHeader}>
          <h3 style={styles.tabTitle}>Identidade & Branding Global</h3>
          <p style={styles.tabSub}>Configure a presença da marca Logta e regras básicas de entrada na plataforma.</p>
       </div>

       <div style={styles.fGrid}>
          <div style={styles.fGroup}>
             <label style={styles.fLabel}>Nome da Plataforma (Hub)</label>
             <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Logta HQ" />
          </div>
          <div style={styles.fGroup}>
             <label style={styles.fLabel}>E-mail de Suporte Central</label>
             <input style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="master@logta.com" />
          </div>
          <div style={styles.fGroup}>
             <label style={styles.fLabel}>Cor Primária do Hub</label>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                   type="color" 
                   value={color || '#6366F1'} 
                   onChange={e => setColor(e.target.value)} 
                   style={{...styles.input, padding: '2px', height: '48px', width: '60px', flex: 'none', cursor: 'pointer'}}
                />
                <input style={{...styles.input, flex: 1}} value={color} onChange={e => setColor(e.target.value)} />
             </div>
          </div>
          <div style={styles.fGroup}>
             <label style={styles.fLabel}>Políticas de Registro</label>
             <select style={styles.input} value={reg.toString()} onChange={e => setReg(e.target.value === 'true')}>
                <option value="true">Aberto (Landing Page)</option>
                <option value="false">Restrito (Apenas Convite)</option>
             </select>
          </div>
       </div>

       <div style={{...styles.card, marginTop: '32px', backgroundColor: '#f8fafc'}}>
          <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
             <div style={{...styles.logoPreview, backgroundColor: color}}>L</div>
             <div>
                <h4 style={{margin: 0, fontSize: '15px', fontWeight: '800'}}>Logo Principal (Master)</h4>
                <p style={{margin: '4px 0 0', fontSize: '12px', color: '#64748b'}}>A logo enviada aqui será replicada em todas as áreas não customizadas.</p>
             </div>
             <button style={{...styles.secondaryBtn, marginLeft: 'auto'}}>Alterar Logo</button>
          </div>
       </div>
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
       <p style={styles.tabSub}>Integração nativa para Meet, Drive e Agenda em todo o monorepo.</p>
       
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
          <button style={styles.saveBtn} onClick={handleSaveKey} disabled={status === 'SAVING'}>
             <Save size={18} /> Salvar Integração Google
          </button>
       </div>
    </div>
  );
};

const CoreStatusTab = () => {
  return (
    <div style={styles.tabContent}>
       <h3 style={styles.tabTitle}>Status do Núcleo (Logta Engine)</h3>
       <p style={styles.tabSub}>Monitoramento de saúde dos microsserviços e tabelas críticas.</p>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { label: 'Supabase DB', status: 'Online', icon: <Database size={20} color="#10b981" />, latency: '12ms' },
            { label: 'Edge Runtime', status: 'Online', icon: <Cpu size={20} color="#10b981" />, latency: '45ms' },
            { label: 'Mail Server', status: 'Online', icon: <LinkIcon size={20} color="#10b981" />, latency: '110ms' },
          ].map((item, i) => (
            <div key={i} style={styles.statusCard}>
               <div style={styles.statusIcon}>{item.icon}</div>
               <div style={styles.statusInfo}>
                  <div style={styles.statusLabel}>{item.label}</div>
                  <div style={styles.statusValue}>{item.status}</div>
                  <div style={styles.statusMeta}>Latência: {item.latency}</div>
               </div>
            </div>
          ))}
       </div>

       <div style={styles.card}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
             <h4 style={{margin: 0, fontSize: '16px', fontWeight: '600', letterSpacing: '0.3px'}}>Monitoramento de Carga</h4>
             <button style={styles.secondaryBtn}>Reiniciar Serviços</button>
          </div>
          <div style={{ height: '200px', backgroundColor: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
             Visualização Gráfica do Núcleo (Engine Analytics)
          </div>
       </div>
    </div>
  );
};

// --- ESTILOS ---

const styles: Record<string, any> = {
  container: { padding: '40px', minHeight: '100vh', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  badge: { fontSize: '10px', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' },
  title: { fontSize: '34px', fontWeight: '500', color: '#0F172A', letterSpacing: '0.4px', margin: 0, lineHeight: '1.2' },
  subtitle: { fontSize: '16px', color: '#64748B', fontWeight: '400', lineHeight: '1.6' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', color: '#64748b' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'flex-start' },
  sidebarWrapper: { 
    // Removido o fixo/sticky para rolar normal
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'white', padding: '16px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', border: 'none', backgroundColor: 'transparent', borderRadius: '22px', fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', letterSpacing: '0.2px' },
  tabBtnActive: { backgroundColor: '#f8fafc', color: '#000000' },
  tabIcon: { width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },

  content: { backgroundColor: 'white', padding: '40px', borderRadius: '40px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', minHeight: '700px' },
  tabHeader: { marginBottom: '32px' },
  tabTitle: { fontSize: '24px', fontWeight: '500', color: '#0F172A', marginBottom: '8px', letterSpacing: '0.3px' },
  tabSub: { fontSize: '15px', color: '#64748B', fontWeight: '400', lineHeight: '1.5' },
  tabPlaceholder: { height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: '500' },

  fGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' },
  input: { padding: '14px 18px', borderRadius: '18px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '500', outline: 'none', fontSize: '14px', transition: 'all 0.2s' },
  textarea: { padding: '18px', borderRadius: '22px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '500', outline: 'none', resize: 'vertical' },

  card: { padding: '24px', backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0' },
  logoPreview: { width: '56px', height: '56px', color: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '24px' },
  secondaryBtn: { padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.2px' },

  statusCard: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', alignItems: 'center' },
  statusIcon: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  statusValue: { fontSize: '16px', fontWeight: '600', color: '#1e293b', letterSpacing: '0.2px' },
  statusMeta: { fontSize: '11px', color: '#10b981', fontWeight: '500', marginTop: '2px', letterSpacing: '0.2px' }
};

export default MasterSettings;

