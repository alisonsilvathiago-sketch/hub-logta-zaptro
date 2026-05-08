import React, { useState, useEffect } from 'react';
import { useAuth } from '@core/context/AuthContext';
import { useSystemConfig } from '@core/context/SystemConfigContext';
import { 
  Globe, Users, Terminal, ShieldCheck, 
  Palette, Database, Save, 
  RefreshCw, Zap, HardDrive, User,
  Activity, Cpu, Network, Shield,
  CreditCard, Layout, Link as LinkIcon, Smartphone,
  Bell,
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useLocation } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sub-componentes
import EvolutionManager from './EvolutionManager';
import TeamHub from './TeamHub';
import { useNavigate } from 'react-router-dom';
import Button from '@shared/components/Button';

type SettingsNavTab = {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Rota absoluta fora de `/master/settings/*` (ex.: central de alertas). */
  externalPath?: string;
};

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

  const tabs: SettingsNavTab[] = [
    { id: 'geral', label: 'Geral & Branding', icon: <Globe size={18} /> },
    { id: 'equipe', label: 'Equipe Master', icon: <Users size={18} /> },
    { id: 'evolution', label: 'Evolution API Hub', icon: <Smartphone size={18} /> },
    { id: 'notificacoes', label: 'Notificações', icon: <Bell size={18} />, externalPath: '/master/notifications' },
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
          lockdown={systemLockdown} setLockdown={setSystemLockdown}
        />
      );
      case 'equipe': return <TeamHub />;
      case 'evolution': return <EvolutionManager />;
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
           <Button 
             variant="primary" 
             icon={<Save size={18} />} 
             label={loading ? 'Propagando...' : 'Propagar Alterações'} 
             onClick={handleSaveAll} 
             disabled={loading} 
           />
        </div>
      </header>

      <div style={styles.layout}>
        {/* SIDEBAR TABS FIXED */}
        <aside style={styles.sidebarWrapper}>
          <nav style={styles.sidebar}>
            {tabs.map((tab) => {
              const isExternal = Boolean(tab.externalPath);
              const isActive = isExternal
                ? location.pathname.startsWith('/master/notifications')
                : activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    tab.externalPath ? navigate(tab.externalPath) : navigate(`/master/settings/${tab.id}`)
                  }
                  style={{
                    ...styles.tabBtn,
                    ...(isActive ? styles.tabBtnActive : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.tabIcon,
                      backgroundColor: isActive ? 'var(--primary)' : 'rgba(241, 245, 249, 0.65)',
                      color: isActive ? '#fff' : 'var(--text-secondary, #64748B)',
                    }}
                  >
                    {tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
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

const GeralTab = ({ name, setName, email, setEmail, reg, setReg, color, setColor, lockdown, setLockdown }: any) => {
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
                   value={color || '#0061FF'} 
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
          <div style={styles.fGroup}>
             <label style={{...styles.fLabel, color: lockdown ? '#EF4444' : '#94A3B8'}}>MASTER LOCKDOWN (GATEWAY)</label>
             <select 
               style={{...styles.input, backgroundColor: lockdown ? '#FEF2F2' : '#F8FAFC', borderColor: lockdown ? '#EF4444' : '#E2E8F0'}} 
               value={lockdown.toString()} 
               onChange={e => setLockdown(e.target.value === 'true')}
             >
                <option value="false">Operação Normal</option>
                <option value="true">LOCKDOWN ATIVO (Restringir Acessos)</option>
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
              <Button variant="outline" size="sm" label="Alterar Logo" style={{ marginLeft: 'auto' }} />
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
       <p style={styles.tabSub}>Integração nativa para Meet, LogDock e Agenda em todo o monorepo.</p>
       
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
    if (activeMetric === 'ram') return '#10B981';
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
           color: '#10B981', 
           background: '#ECFDF5', 
           padding: '6px 12px', 
           borderRadius: '20px',
           display: 'flex',
           alignItems: 'center',
           gap: '6px'
         }}>
           <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
           TEMPO REAL CONECTADO
         </span>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { id: 'cpu', label: 'Supabase DB', status: 'Online', icon: <Database size={20} />, latency: '12ms', color: '#0061FF', bg: 'rgba(0, 97, 255, 0.08)' },
            { id: 'ram', label: 'Edge Runtime', status: 'Online', icon: <Cpu size={20} />, latency: '45ms', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)' },
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
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981' }} />
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
  container: { padding: '0', minHeight: '100vh', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  badge: { fontSize: '10px', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.8px', marginBottom: '8px', textTransform: 'uppercase' },
  title: { fontSize: '34px', fontWeight: '500', color: '#0F172A', letterSpacing: '0.4px', margin: 0, lineHeight: '1.2' },
  subtitle: { fontSize: '13px', color: '#64748B', fontWeight: '400', lineHeight: '1.6' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', cursor: 'pointer', color: '#64748b' },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '40px', alignItems: 'flex-start' },
  sidebarWrapper: { 
    // Removido o fixo/sticky para rolar normal
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'white', padding: '16px', borderRadius: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '22px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-secondary, #64748B)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.18s ease, color 0.18s ease',
    letterSpacing: '0',
    boxSizing: 'border-box',
    width: '100%',
  },
  tabBtnActive: {
    backgroundColor: 'var(--accent-light, #F0F7FF)',
    color: 'var(--text-primary, #0F172A)',
  },
  tabIcon: { width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },

  content: { backgroundColor: 'white', padding: '40px', borderRadius: '40px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', minHeight: '700px' },
  tabHeader: { marginBottom: '32px' },
  tabTitle: { fontSize: '24px', fontWeight: '500', color: '#0F172A', marginBottom: '8px', letterSpacing: '0.3px' },
  tabSub: { fontSize: '13px', color: '#64748B', fontWeight: '400', lineHeight: '1.5' },
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

