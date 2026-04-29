import React, { useState, useEffect } from 'react';
import {
   Settings, ShieldCheck, DollarSign, FileText, 
   Zap, RefreshCw, Eye, Edit3, Plus, 
   Download, Copy, CheckCircle2, Globe, 
   Link as LinkIcon, Database, HardDrive, Mail,
   Cloud, Video, FolderKanban, ShieldAlert
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';

const Integrations = () => {
  const [loading, setLoading] = useState(false);
  const [googleConfig, setGoogleConfig] = useState<any>(null);

  const fetchConfigs = async () => {
    const { data } = await supabase
      .from('master_settings')
      .select('value')
      .eq('key', 'GOOGLE_SERVICE_ACCOUNT_KEY')
      .maybeSingle();
    
    setGoogleConfig(data?.value || null);
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText('https://rrjnkmgkhbtapumgmhhr.supabase.co/functions/v1/hub-core/webhook-asaas');
    toastSuccess('Endpoint copiado para a área de transferência.');
  };

  return (
    <div style={styles.outerContainer} className="animate-fade-in">
      <div style={styles.innerContainer}>
        {/* PAGE TITLE */}
        <div style={styles.headerTitleRow}>
          <h1 style={styles.pageTitle}>Integrações & Conectores Master</h1>
          <p style={styles.pageSub}>Gerencie a conectividade global do ecossistema e chaves de alta segurança.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* MASTER GUARD INFO */}
          <div style={styles.guardBanner}>
            <div style={styles.guardIcon}>
              <ShieldCheck size={28} color="var(--primary)" />
            </div>
            <div>
               <h3 style={styles.guardTitle}>Protocolo de Alta Governança</h3>
               <p style={styles.guardSub}>Chaves e segredos são armazenados com criptografia em repouso no cofre master.</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
               <div style={styles.guardLabel}>ESTADO DE ACESSO</div>
               <div style={styles.guardBadge}>
                  <div style={styles.statusDot} /> MASTER ADMIN
               </div>
            </div>
          </div>

          <div style={styles.integrationGrid}>
            {/* MODULO GOOGLE CLOUD - NEW */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{...styles.planIcon, backgroundColor: '#fef2f2', color: '#ef4444'}}><Cloud size={24} /></div>
                <div>
                  <h3 style={styles.cardTitle}>Google Cloud & Workspace</h3>
                  <p style={styles.cardSub}>Integração com Google Meet, Drive e Agenda.</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{...styles.statusBadge, 
                    backgroundColor: googleConfig ? '#ecfdf5' : '#fff7ed', 
                    color: googleConfig ? '#10b981' : '#f97316'
                  }}>
                    {googleConfig ? 'ATIVO' : 'PENDENTE'}
                  </span>
                </div>
              </div>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>
                  <Video size={16} color={googleConfig ? '#10b981' : '#94a3b8'} />
                  <span style={styles.featureText}>Geração de links Google Meet via API</span>
                </div>
                <div style={styles.featureItem}>
                  <FolderKanban size={16} color={googleConfig ? '#10b981' : '#94a3b8'} />
                  <span style={styles.featureText}>Sincronização de arquivos no Google Drive</span>
                </div>
              </div>

              <div style={styles.configArea}>
                 <label style={styles.infoLabel}>SERVICE ACCOUNT ID</label>
                 <div style={styles.codeBlock}>
                    <code>{googleConfig?.client_email || 'Aguardando configuração...'}</code>
                 </div>
              </div>

              <button style={{ ...styles.actionBtn, marginTop: '20px', color: '#ef4444', borderColor: '#fee2e2' }}>
                <Settings size={14} /> RE-CONFIGURAR CHAVE JSON
              </button>
            </div>

            {/* MODULO ASAAS */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{...styles.planIcon, backgroundColor: '#eff6ff', color: 'var(--primary)'}}><DollarSign size={24} /></div>
                <div>
                  <h3 style={styles.cardTitle}>Gateway de Pagamento (Asaas)</h3>
                  <p style={styles.cardSub}>Processamento de fluxos financeiros master.</p>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{...styles.statusBadge, backgroundColor: '#ecfdf5', color: '#10b981'}}>CONECTADO</span>
                </div>
              </div>

              <div style={styles.statsMiniRow}>
                <div style={styles.miniStat}>
                    <label style={styles.infoLabel}>AMBIENTE</label>
                    <div style={styles.miniStatValue}>PRODUÇÃO</div>
                </div>
                <div style={styles.miniStat}>
                    <label style={styles.infoLabel}>STATUS WEBHOOK</label>
                    <div style={{...styles.miniStatValue, color: '#10b981'}}>OK (200)</div>
                </div>
              </div>

              <div style={styles.configArea}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={styles.infoLabel}>API KEY MASTER</label>
                 </div>
                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ fontSize: '11px', color: 'var(--text-muted)', flex: 1 }}>$a***************************************</code>
                    <Eye size={14} color="#94a3b8" style={{cursor: 'pointer'}} />
                 </div>
              </div>

              <button style={{ ...styles.actionBtn, marginTop: '20px' }}>
                <Settings size={14} /> AJUSTES DE FATURAMENTO
              </button>
            </div>

            {/* WEBHOOKS & LOGS */}
            <div style={{...styles.card, gridColumn: 'span 2'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                   <h3 style={styles.cardTitle}><Zap size={18} color="#f59e0b" fill="#f59e0b" /> Webhooks de Sistema</h3>
                   <p style={styles.cardSub}>Monitoramento de eventos recebidos por aplicações externas.</p>
                </div>
                <button style={styles.secondaryBtn}><RefreshCw size={14} /> ATUALIZAR LOGS</button>
              </div>
              
              <div style={styles.webhookUrlArea}>
                <label style={styles.infoLabel}>ENDPOINT DE ESCUTA (GLOBAL)</label>
                <div style={styles.urlInputRow}>
                   <code style={styles.urlCode}>
                      .../functions/v1/hub-core/webhook-asaas
                   </code>
                   <button style={styles.copyBtn} onClick={handleCopyWebhook}>
                      <Copy size={16} />
                   </button>
                </div>
              </div>

              <div style={styles.logList}>
                {[
                  { type: 'BILLING_SUCCESS', time: 'Agora mesmo', status: 200, origin: 'Asaas' },
                  { type: 'GOOGLE_AUTH_REFRESH', time: '14 min atrás', status: 200, origin: 'Google' },
                  { type: 'WEBHOOK_FAILURE', time: '2h atrás', status: 401, origin: 'Asaas' },
                ].map((log, idx) => (
                  <div key={idx} style={styles.logItem}>
                     <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{...styles.statusDot, backgroundColor: log.status === 200 ? '#10b981' : '#ef4444'}} />
                        <div style={styles.logInfo}>
                           <div style={styles.logType}>{log.type}</div>
                           <div style={styles.logOrigin}>{log.origin} &bull; {log.time}</div>
                        </div>
                     </div>
                     <div style={{...styles.statusBadge, backgroundColor: log.status === 200 ? '#f0fdf4' : '#fef2f2', color: log.status === 200 ? '#10b981' : '#ef4444'}}>
                        HTTP {log.status}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  outerContainer: { padding: '0', minHeight: '100vh' },
  innerContainer: { maxWidth: '1400px', margin: '0 auto' },
  headerTitleRow: { marginBottom: '32px' },
  pageTitle: { fontSize: '28px', fontWeight: '500', color: 'var(--primary)', letterSpacing: '0.4px', marginBottom: '4px' },
  pageSub: { fontSize: '15px', color: 'var(--text-muted)', fontWeight: '400', letterSpacing: '0.2px' },
  
  guardBanner: { backgroundColor: '#1e293b', padding: '28px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #334155', boxShadow: 'var(--shadow-lg)' },
  guardIcon: { backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '14px', borderRadius: '16px' },
  guardTitle: { margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: '500', letterSpacing: '0.4px' },
  guardSub: { margin: '4px 0 0', color: '#94a3b8', fontSize: '13px', fontWeight: '400', letterSpacing: '0.2px' },
  guardLabel: { fontSize: '10px', color: 'var(--primary)', fontWeight: '700', marginBottom: '6px', letterSpacing: '1px' },
  guardBadge: { color: '#10b981', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '6px 14px', borderRadius: '20px' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%' },

  integrationGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  card: { backgroundColor: 'white', padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' },
  cardTitle: { fontSize: '18px', fontWeight: '500', color: 'var(--text-main)', margin: 0, letterSpacing: '0.3px' },
  cardSub: { fontSize: '14px', color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: '400' },
  planIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusBadge: { padding: '6px 14px', borderRadius: '12px', fontSize: '10px', fontWeight: '600', letterSpacing: '0.6px' },
  
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' },
  featureItem: { display: 'flex', gap: '12px', alignItems: 'center' },
  featureText: { fontSize: '13px', color: 'var(--text-main)', fontWeight: '500', letterSpacing: '0.2px' },
  
  configArea: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '20px', border: '1px solid var(--border)' },
  infoLabel: { fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
  codeBlock: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' },
  
  statsMiniRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  miniStat: { padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: '#f8fafc' },
  miniStatValue: { fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', letterSpacing: '0.2px' },

  actionBtn: { width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-muted)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.3px' },
  secondaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', cursor: 'pointer' },

  webhookUrlArea: { padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '32px' },
  urlInputRow: { display: 'flex', gap: '12px', marginTop: '12px' },
  urlCode: { fontSize: '12px', color: 'var(--text-main)', fontWeight: '500', backgroundColor: '#fff', padding: '12px 18px', borderRadius: '14px', flex: 1, border: '1px solid var(--border)', overflow: 'hidden', textOverflow: 'ellipsis' },
  copyBtn: { padding: '12px', backgroundColor: 'var(--primary-light)', border: 'none', borderRadius: '14px', color: 'var(--primary)', cursor: 'pointer' },

  logList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '20px', border: '1px solid #f1f5f9', backgroundColor: 'white' },
  logInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  logType: { fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', letterSpacing: '0.2px' },
  logOrigin: { fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }
};

export default Integrations;
