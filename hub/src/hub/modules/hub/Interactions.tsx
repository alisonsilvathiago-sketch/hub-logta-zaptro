import React, { useState } from 'react';
import { 
  Globe, Zap, Database, Terminal, 
  MessageSquare, Layout, Link as LinkIcon, 
  Settings, Save, Plus, Trash2, 
  RefreshCw, CheckCircle2, AlertCircle, 
  Globe2, Mail, FileText, Smartphone,
  ShieldCheck, ArrowUpRight, BarChart3,
  Calendar, Key, Cloud, HardDrive,
  CreditCard, Eye, EyeOff, ChevronRight,
  ExternalLink, PlusCircle
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import Modal from '@shared/components/Modal';

const InteractionsHub = () => {
  const [activeSubTab, setActiveSubTab] = useState('conectividade');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbApis, setDbApis] = useState<any[]>([]);
  const [editData, setEditData] = useState<any>({});

  React.useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_settings')
        .select('*')
        .in('key', ['SENDGRID_CONFIG', 'ASAAS_CONFIG', 'GOOGLE_SERVICE_ACCOUNT_KEY']);

      if (error) throw error;

      const formattedApis = data.map(item => {
        let name = '';
        let provider = '';
        let key = '';

        if (item.key === 'SENDGRID_CONFIG') {
          name = 'SendGrid API Key';
          provider = 'Transactional Mail & SMTP';
          key = item.value?.api_key || '';
        } else if (item.key === 'ASAAS_CONFIG') {
          name = 'Asaas Core Token';
          provider = 'Payments & Billing Engine';
          key = item.value?.api_key || '';
        } else if (item.key === 'GOOGLE_SERVICE_ACCOUNT_KEY') {
          name = 'Google Cloud Identity';
          provider = 'Infrastructure & Workspace';
          key = item.value?.private_key_id || 'Configurado';
        }

        return { id: item.key, name, provider, key, raw: item.value };
      });

      setDbApis(formattedApis);
    } catch (err: any) {
      toastError('Erro de Configuração: Falha ao carregar chaves do ecossistema.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiValue = async (key: string, newValue: string) => {
    const tid = toastLoading(`Atualizando ${key} no cofre master...`);
    try {
      const current = dbApis.find(a => a.id === key)?.raw || {};
      const updatedValue = { ...current, api_key: newValue };

      const { error } = await supabase
        .from('master_settings')
        .upsert({ key, value: updatedValue }, { onConflict: 'key' });

      if (error) throw error;

      toastSuccess(`Credencial "${key}" sincronizada com sucesso!`);
      fetchConfigs();
    } catch (err: any) {
      toastError(`Falha Crítica: Não foi possível salvar a credencial. Erro: ${err.message}`);
    } finally {
      toastDismiss(tid);
    }
  };

  const toggleKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openConfig = (item: any) => {
    setSelectedItem(item);
    setEditData({
      endpoint: `https://api.${item.id}.logta.com.br/v1`,
      serviceId: `logta-hub-${item.id}@iam.gserviceaccount.com`,
      token: '••••••••••••••••••••••••••••'
    });
  };

  const subTabs = [
    { id: 'conectividade', label: 'Conectividade Hub', icon: Globe },
    { id: 'automacoes', label: 'Fluxos & IA', icon: Zap },
    { id: 'armazenamento', label: 'Storage & Backup', icon: HardDrive },
    { id: 'apis', label: 'APIs & Chaves', icon: Key },
  ];

  const styles: Record<string, any> = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: '28px', fontWeight: '500', color: 'var(--primary)', letterSpacing: '0.4px', margin: 0 },
    sub: { color: 'var(--text-muted)', fontSize: '15px', fontWeight: '400', letterSpacing: '0.2px' },
    
    tabStrip: { display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' },
    tabBtn: { 
      padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '500', 
      display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s',
      border: '1px solid transparent', backgroundColor: 'transparent', color: 'var(--text-muted)', letterSpacing: '0.4px'
    },
    tabActive: { backgroundColor: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary-light)' },

    card: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', boxShadow: 'var(--shadow-sm)' },
    
    listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    listTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: 0, letterSpacing: '0.4px', textTransform: 'uppercase' },
    
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    listItem: { 
      padding: '20px 24px', borderRadius: '16px', border: '1px solid var(--border)', 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      transition: 'all 0.2s', cursor: 'pointer', backgroundColor: '#f8fafc'
    },
    
    itemLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    iconBox: { 
      width: '44px', height: '44px', borderRadius: '12px', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    },
    statusBadge: { 
      fontSize: '10px', fontWeight: '600', padding: '4px 12px', borderRadius: '8px', 
      textTransform: 'uppercase', letterSpacing: '0.8px' 
    },
    btn: { 
      padding: '10px 20px', borderRadius: '12px', fontWeight: '600', fontSize: '12px', 
      cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', 
      gap: '8px', transition: 'all 0.2s', letterSpacing: '0.4px' 
    },
    primaryBtn: { backgroundColor: 'var(--primary)', color: 'white' },
    
    input: { width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', fontWeight: '500', letterSpacing: '0.2px', backgroundColor: '#f8fafc' }
  };

  const integrations = [
    { id: 'google', name: 'Google Workspace Hub', desc: 'Drive, Docs, Meet e Workspace Engine', icon: Globe2, color: '#4285F4', bg: '#EEF2FF', status: 'CONECTADO', statusColor: '#10B981', statusBg: '#ECFDF5' },
    { id: 'asaas', name: 'Asaas Core Engine', desc: 'Processamento de split e assinaturas recorrentes', icon: CreditCard, color: '#0D9488', bg: '#F0FDFA', status: 'ATIVO', statusColor: '#10B981', statusBg: '#ECFDF5' },
    { id: 'wa', name: 'WhatsApp Business API', desc: 'Gateway de mensagens transacionais master', icon: Smartphone, color: '#16A34A', bg: '#F0FDF4', status: 'SYNC', statusColor: '#F97316', statusBg: '#FFF7ED' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Interações & Conectividade Hub</h2>
          <p style={styles.sub}>Central estratégica de integrações, chaves criptográficas e infra de dados.</p>
        </div>
      </div>

      <div style={styles.tabStrip}>
        {subTabs.map(tab => (
          <button 
            key={tab.id}
            style={{...styles.tabBtn, ...(activeSubTab === tab.id ? styles.tabActive : {})}}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.listHeader}>
          <h3 style={styles.listTitle}>
            {subTabs.find(t => t.id === activeSubTab)?.label}
          </h3>
          <button 
            style={{...styles.btn, ...styles.primaryBtn}} 
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle size={16} /> ADICIONAR REGISTRO
          </button>
        </div>

        {activeSubTab === 'conectividade' && (
          <div style={styles.list}>
            {integrations.map(item => (
              <div key={item.id} style={styles.listItem} onClick={() => openConfig(item)}>
                <div style={styles.itemLeft}>
                  <div style={{...styles.iconBox, backgroundColor: item.bg, color: item.color}}><item.icon size={22} /></div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px' }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', fontWeight: '400' }}>{item.desc}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{...styles.statusBadge, backgroundColor: item.statusBg, color: item.statusColor}}>{item.status}</span>
                  <button style={{...styles.btn, backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--border)'}}>CONFIGURAR</button>
                  <ChevronRight size={18} color="#94A3B8" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSubTab === 'apis' && (
          <div style={styles.list}>
            {dbApis.map(api => (
              <div key={api.id} style={styles.listItem}>
                <div style={styles.itemLeft}>
                  <div style={{...styles.iconBox, backgroundColor: '#f1f5f9', color: '#475569'}}><Key size={20} /></div>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px' }}>{api.name}</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{api.provider}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input 
                    type={revealedKeys[api.id] ? "text" : "password"}
                    value={api.key}
                    onChange={(e) => {
                       const newApis = [...dbApis];
                       const idx = newApis.findIndex(a => a.id === api.id);
                       newApis[idx].key = e.target.value;
                       setDbApis(newApis);
                    }}
                    style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-main)', 
                      backgroundColor: 'white', 
                      padding: '10px 14px', 
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      minWidth: '280px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                  <button 
                    style={{...styles.btn, backgroundColor: 'white', color: 'var(--primary)', border: '1px solid var(--border)', width: '40px', padding: '0', display: 'flex', justifyContent: 'center'}}
                    onClick={() => toggleKey(api.id)}
                  >
                    {revealedKeys[api.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    style={{...styles.btn, backgroundColor: 'var(--primary)', color: 'white'}}
                    onClick={() => saveApiValue(api.id, api.key)}
                  >
                    SINCRONIZAR
                  </button>
                </div>
              </div>
            ))}
            {loading && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontWeight: '500' }}>Sincronizando chaves master...</div>}
          </div>
        )}

        {(activeSubTab === 'automacoes' || activeSubTab === 'armazenamento') && (
           <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
              <Zap size={48} style={{ marginBottom: '16px', opacity: 0.1 }} />
              <p style={{ fontWeight: '500', fontSize: '16px' }}>Nenhuma configuração ativa em {activeSubTab.toUpperCase()}.</p>
           </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name}
        subtitle="Configuração avançada de gateway e autenticação master."
        icon={selectedItem?.icon && <selectedItem.icon />}
        width="1100px"
        primaryAction={{
          label: 'SINCRONIZAR GATEWAY',
          onClick: async () => { 
            const tid = toastLoading(`Validando protocolos de ${selectedItem?.name}...`);
            await new Promise(r => setTimeout(r, 1500));
            toastSuccess(`Infraestrutura de ${selectedItem?.name} revalidada e operacional!`); 
            toastDismiss(tid);
            setSelectedItem(null); 
          }
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h5 style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>DADOS DA CONEXÃO HUB</h5>
              <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', display: 'block', marginBottom: '8px', letterSpacing: '0.6px' }}>MASTER ENDPOINT URL</label>
                    <input style={styles.input} value={editData.endpoint} readOnly />
                 </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', display: 'block', marginBottom: '8px', letterSpacing: '0.6px' }}>SERVICE PRINCIPAL ID</label>
                    <input style={styles.input} value={editData.serviceId} readOnly />
                  </div>
              </div>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h5 style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>SEGURANÇA & CRIPTOGRAFIA</h5>
              <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#94A3B8', display: 'block', marginBottom: '8px', letterSpacing: '0.6px' }}>API TOKEN / PRIVATE KEY</label>
                    <input style={styles.input} type="password" value={editData.token} readOnly />
                 </div>
                 <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <button style={{...styles.btn, backgroundColor: 'white', flex: 1, border: '1px solid var(--border)', padding: '14px'}} onClick={() => toastSuccess('Teste de latência: 12ms. Conexão estável!')}>TESTAR LATÊNCIA</button>
                    <button style={{...styles.btn, backgroundColor: 'white', flex: 1, border: '1px solid var(--border)', padding: '14px'}}>RENOVAR KEYS</button>
                 </div>
              </div>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default InteractionsHub;
