import React, { useState, useEffect } from 'react';
import { 
  Database, Shield, RefreshCw, 
  Search, Filter, Trash2, Download, 
  Terminal, History, DatabaseBackup, 
  AlertTriangle, CheckCircle2, Building2,
  HardDrive, Activity, HardDriveDownload, Clock,
  Upload, FileText, Layers, CreditCard,
  ChevronRight, ArrowUpRight, BarChart3,
  ExternalLink, Lock, Settings
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import { useAuth } from '@core/context/AuthContext';
import SyncIndicator from '../../components/SyncIndicator';

const UpStorageBackup: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'backups' | 'storage' | 'plans'>('backups');
  const [backups, setBackups] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [storageStats, setStorageStats] = useState({
    limit_mb: 50,
    used_bytes: 0,
    used_percentage: 0,
    extra_credits: 0
  });

  const [stats, setStats] = useState({
    totalCount: 0,
    totalSize: 0,
    failedCount: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'backups') {
        await fetchBackups();
      } else if (activeTab === 'storage') {
        await fetchFiles();
      }
      await fetchStorageUsage();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    const { data, error } = await supabase
      .from('backups')
      .select('*, companies(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toastError('Erro ao carregar backups');
    } else {
      setBackups(data || []);
      const totalSize = data?.reduce((acc, curr) => acc + (curr.size_bytes || 0), 0) || 0;
      const failed = data?.filter(b => b.status === 'ERROR' || b.status === 'FAILED').length || 0;
      setStats({
        totalCount: data?.length || 0,
        totalSize,
        failedCount: failed
      });
    }
  };

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('files')
      .select('*, companies(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toastError('Erro ao carregar arquivos');
    } else {
      setFiles(data || []);
    }
  };

  const fetchStorageUsage = async () => {
    const { data, error } = await supabase
      .from('company_storage')
      .select('*')
      .single();

    if (!error && data) {
      const usedMB = data.used_bytes / (1024 * 1024);
      const totalLimit = data.limit_mb + (data.extra_credits_mb || 0);
      setStorageStats({
        limit_mb: totalLimit,
        used_bytes: data.used_bytes,
        used_percentage: Math.min(100, (usedMB / totalLimit) * 100),
        extra_credits: data.extra_credits_mb || 0
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?.company_id) return;

    const tid = toastLoading(`Fazendo upload de ${file.name}...`);
    try {
      const filePath = `${profile.company_id}/${Date.now()}_${file.name}`;
      
      // 1. Upload to Storage
      const { error: storageError } = await supabase.storage
        .from('hub-storage')
        .upload(filePath, file);

      if (storageError) throw storageError;

      // 2. Register in Database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          company_id: profile.company_id,
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          module: 'UpStorage',
          created_by: profile.id
        });

      if (dbError) throw dbError;

      // 3. Update Storage Usage (Simulated for now, would be a trigger in production)
      await supabase.rpc('increment_storage_usage', { 
        company_id: profile.company_id, 
        bytes: file.size 
      });

      toastDismiss(tid);
      toastSuccess('Arquivo enviado com sucesso para o UpStorage!');
      fetchFiles();
      fetchStorageUsage();
    } catch (err: any) {
      toastDismiss(tid);
      toastError('Erro no upload: ' + err.message);
    }
  };

  const handleManualBackup = async () => {
    const tid = toastLoading('Iniciando processamento de backup...');
    try {
      // Simulação do Engine de Backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      toastDismiss(tid);
      toastSuccess('Backup solicitado com sucesso! Você receberá uma notificação ao concluir.');
      fetchBackups();
    } catch (err) {
      toastDismiss(tid);
      toastError('Falha ao acionar motor de backup');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderBackupTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.tableCard}>
        <div style={styles.cardHeader}>
          <div style={styles.headerInfo}>
             <h3 style={styles.cardTitle}>Snapshots do Ecossistema</h3>
             <p style={styles.cardSub}>Histórico completo de backups automáticos e manuais</p>
          </div>
          <button style={styles.primaryBtn} onClick={handleManualBackup}>
            <DatabaseBackup size={18} /> Novo Backup Manual
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Data / Hora</th>
              <th style={styles.th}>Empresa</th>
              <th style={styles.th}>Tipo</th>
              <th style={styles.th}>Tamanho</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.id} style={styles.tr}>
                <td style={styles.td}>
                   <div style={styles.dateTime}>
                      <Clock size={14} color="#64748b" />
                      {new Date(b.created_at).toLocaleString()}
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.companyCell}>
                      <Building2 size={16} color="#6366F1" />
                      {b.companies?.name || 'Hub Master'}
                   </div>
                </td>
                <td style={styles.td}>
                   <span style={{
                     ...styles.badge, 
                     backgroundColor: b.type === 'automatic' ? '#F1F5F9' : '#E0F2FE',
                     color: b.type === 'automatic' ? '#64748B' : '#0284C7'
                   }}>
                      {b.type === 'automatic' ? 'AUTOMÁTICO' : 'MANUAL'}
                   </span>
                </td>
                <td style={styles.td}>{formatSize(b.size_bytes || 0)}</td>
                <td style={styles.td}>
                   <div style={{
                     ...styles.statusTag, 
                     color: b.status === 'completed' || b.status === 'ok' || b.status === 'SUCCESS' ? '#10B981' : '#EF4444'
                   }}>
                      {b.status === 'completed' || b.status === 'ok' || b.status === 'SUCCESS' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      {b.status?.toUpperCase()}
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.actions}>
                      <button style={styles.iconBtn} title="Download"><Download size={16} /></button>
                      <button style={styles.iconBtn} title="Restaurar Snapshot"><History size={16} /></button>
                      <button style={{...styles.iconBtn, color: '#EF4444'}} title="Excluir"><Trash2 size={16} /></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStorageTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.storageGrid}>
        {/* FILE EXPLORER */}
        <div style={{...styles.tableCard, flex: 2}}>
          <div style={styles.cardHeader}>
            <div style={styles.headerInfo}>
               <h3 style={styles.cardTitle}>UpStorage - Explorador de Arquivos</h3>
               <p style={styles.cardSub}>Gestão centralizada de documentos, mídias e anexos</p>
            </div>
            <div style={styles.headerActions}>
               <div style={styles.searchBox}>
                 <Search size={18} color="#94A3B8" />
                 <input 
                   placeholder="Buscar arquivos..." 
                   style={styles.searchInput}
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
               <label style={styles.primaryBtn}>
                 <Upload size={18} /> Upload de Arquivo
                 <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
               </label>
            </div>
          </div>
          
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome do Arquivo</th>
                <th style={styles.th}>Módulo</th>
                <th style={styles.th}>Empresa</th>
                <th style={styles.th}>Tamanho</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {files.map(f => (
                <tr key={f.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.fileCell}>
                      <FileText size={18} color="#64748B" />
                      <span style={styles.fileName}>{f.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.moduleBadge}>{f.module || 'Documentos'}</span>
                  </td>
                  <td style={styles.td}>{f.companies?.name || 'N/A'}</td>
                  <td style={styles.td}>{formatSize(f.size || 0)}</td>
                  <td style={styles.td}>{new Date(f.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.iconBtn}><ExternalLink size={16} /></button>
                      <button style={styles.iconBtn}><Download size={16} /></button>
                      <button style={{...styles.iconBtn, color: '#EF4444'}}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* STORAGE INFO SIDEBAR */}
        <div style={styles.sidebarCol}>
           <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>Uso do Armazenamento</h4>
              <div style={styles.progressContainer}>
                 <div style={styles.progressHeader}>
                    <span style={styles.progressLabel}>Espaço Utilizado</span>
                    <span style={styles.progressValue}>{storageStats.used_percentage.toFixed(1)}%</span>
                 </div>
                 <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${storageStats.used_percentage}%`}} />
                 </div>
                 <p style={styles.usageText}>
                   <strong>{formatSize(storageStats.used_bytes)}</strong> de {storageStats.limit_mb}MB
                 </p>
              </div>
              <div style={styles.divider} />
              <button style={styles.upgradeBtn} onClick={() => setActiveTab('plans')}>
                <CreditCard size={18} /> Comprar mais Créditos
              </button>
           </div>

           <div style={styles.infoCard}>
              <h4 style={styles.infoTitle}>Dicas de UpStorage</h4>
              <ul style={styles.tipsList}>
                <li>Use o bucket 'midia_clientes' para fotos de WhatsApp.</li>
                <li>Arquivos no 'documentos' são protegidos por RLS.</li>
                <li>Backups manuais não consomem sua cota de storage de arquivos.</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );

  const renderPlansTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.plansHeader}>
        <h2 style={styles.plansTitle}>Expanda seu Armazenamento</h2>
        <p style={styles.plansSub}>Créditos recorrentes ou avulsos estilo Evolution para sua empresa nunca parar.</p>
      </div>

      <div style={styles.plansGrid}>
        {[
          { name: 'Start', space: '500MB', price: '29,90', icon: <HardDrive size={32} color="#6366F1" />, features: ['Backup Diário', 'Suporte Prioritário', 'Storage Privado'] },
          { name: 'Business', space: '2GB', price: '59,90', icon: <Layers size={32} color="#6366F1" />, features: ['Backup 2x ao dia', 'Restauração Imediata', 'Storage Ilimitado p/ Mídia'], popular: true },
          { name: 'Enterprise', space: '10GB', price: '149,90', icon: <Database size={32} color="#6366F1" />, features: ['Backup Real-time', 'Gestão Master Assistida', 'SLA de 99.9%'] }
        ].map((p, i) => (
          <div key={i} style={{...styles.planCard, border: p.popular ? '2px solid #6366F1' : '1px solid #E2E8F0'}}>
            {p.popular && <span style={styles.popularBadge}>MAIS VENDIDO</span>}
            <div style={styles.planIcon}>{p.icon}</div>
            <h3 style={styles.planName}>{p.name}</h3>
            <div style={styles.planPrice}>
              <span style={styles.currency}>R$</span>
              <span style={styles.amount}>{p.price}</span>
              <span style={styles.period}>/mês</span>
            </div>
            <div style={styles.planSpace}>{p.space} de Espaço</div>
            <div style={styles.planFeatures}>
              {p.features.map((f, j) => (
                <div key={j} style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            <button style={{...styles.planBtn, backgroundColor: p.popular ? '#6366F1' : 'white', color: p.popular ? 'white' : '#0F172A'}}>
              Ativar Plano
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* HEADER SECTION */}
      <div style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={styles.pageTitle}>Governança de Dados & UpStorage</h1>
            <SyncIndicator />
          </div>
          <p style={styles.pageSub}>Snapshots críticos, redundância e gestão de armazenamento SaaS</p>
        </div>
        
        <div style={styles.headerActions}>
          <div style={styles.usageBadge}>
             <HardDrive size={16} color="#6366F1" />
             <span>{formatSize(storageStats.used_bytes)} / {storageStats.limit_mb}MB</span>
          </div>
          <button style={styles.refreshBtn} onClick={fetchData}>
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={styles.tabsWrapper}>
        <div 
          style={{...styles.tab, borderBottom: activeTab === 'backups' ? '3px solid #6366F1' : 'none', color: activeTab === 'backups' ? '#0F172A' : '#64748B'}}
          onClick={() => setActiveTab('backups')}
        >
          <Database size={18} /> Backups do Sistema
        </div>
        <div 
          style={{...styles.tab, borderBottom: activeTab === 'storage' ? '3px solid #6366F1' : 'none', color: activeTab === 'storage' ? '#0F172A' : '#64748B'}}
          onClick={() => setActiveTab('storage')}
        >
          <HardDrive size={18} /> UpStorage (Arquivos)
        </div>
        <div 
          style={{...styles.tab, borderBottom: activeTab === 'plans' ? '3px solid #6366F1' : 'none', color: activeTab === 'plans' ? '#0F172A' : '#64748B'}}
          onClick={() => setActiveTab('plans')}
        >
          <CreditCard size={18} /> Planos & Créditos
        </div>
      </div>

      {/* CONTENT AREA */}
      {activeTab === 'backups' && renderBackupTab()}
      {activeTab === 'storage' && renderStorageTab()}
      {activeTab === 'plans' && renderPlansTab()}

    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: '#F6F7F8', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  headerInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  pageTitle: { fontSize: '32px', fontWeight: '800', color: '#1F2937', margin: 0, letterSpacing: '-1.5px' },
  pageSub: { fontSize: '14px', color: '#6B7280', fontWeight: '500' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '16px' },
  usageBadge: { 
    display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#FFFFFF', 
    padding: '10px 16px', borderRadius: '24px', border: '1px solid #E5E7EB',
    fontSize: '13px', fontWeight: '700', color: '#1F2937', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  refreshBtn: { 
    width: '44px', height: '44px', borderRadius: '24px', border: '1px solid #E5E7EB', 
    backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', 
    cursor: 'pointer', color: '#6B7280', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  
  tabsWrapper: { display: 'flex', gap: '32px', borderBottom: '1px solid #E5E7EB', marginBottom: '32px' },
  tab: { 
    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 4px', 
    fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' 
  },

  tabContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: '24px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  cardHeader: { padding: '24px 32px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#1F2937', margin: 0 },
  cardSub: { fontSize: '13px', color: '#6B7280', fontWeight: '500', margin: 0 },
  primaryBtn: { backgroundColor: '#6366F1', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.2)' },
  
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#F9FAFB', padding: '10px 16px', borderRadius: '24px', width: '300px', border: '1px solid #E5E7EB' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '600', width: '100%', color: '#1F2937' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px 32px', fontSize: '11px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.2s' },
  td: { padding: '16px 32px', fontSize: '14px', color: '#374151', fontWeight: '600' },
  
  dateTime: { display: 'flex', alignItems: 'center', gap: '8px' },
  companyCell: { display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', color: '#1F2937' },
  badge: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' },
  statusTag: { display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '12px' },
  actions: { display: 'flex', gap: '8px' },
  iconBtn: { width: '34px', height: '34px', borderRadius: '10px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' },
  
  fileCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  fileName: { fontWeight: '700', color: '#1F2937' },
  moduleBadge: { padding: '4px 8px', backgroundColor: '#F3F4F6', borderRadius: '6px', fontSize: '11px', color: '#6B7280', fontWeight: '700' },

  storageGrid: { display: 'flex', gap: '24px' },
  sidebarCol: { flex: 0.8, display: 'flex', flexDirection: 'column', gap: '24px' },
  infoCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  infoTitle: { fontSize: '16px', fontWeight: '800', color: '#1F2937', margin: '0 0 20px 0' },
  
  progressContainer: { marginTop: '16px' },
  progressHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressLabel: { fontSize: '12px', color: '#6B7280', fontWeight: '600' },
  progressValue: { fontSize: '12px', color: '#1F2937', fontWeight: '800' },
  progressBar: { height: '10px', backgroundColor: '#F3F4F6', borderRadius: '5px', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: '5px' },
  usageText: { fontSize: '12px', color: '#9CA3AF', marginTop: '12px', textAlign: 'center' },
  
  divider: { height: '1px', backgroundColor: '#F3F4F6', margin: '20px 0' },
  upgradeBtn: { width: '100%', backgroundColor: '#1F2937', color: 'white', border: 'none', padding: '14px', borderRadius: '24px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  
  tipsList: { padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' },
  tipItem: { fontSize: '13px', color: '#6B7280', fontWeight: '500', lineHeight: '1.5' },

  plansHeader: { textAlign: 'center', marginBottom: '40px' },
  plansTitle: { fontSize: '32px', fontWeight: '800', color: '#1F2937', margin: 0, letterSpacing: '-1.5px' },
  plansSub: { fontSize: '16px', color: '#6B7280', fontWeight: '500', marginTop: '8px' },
  plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  planCard: { backgroundColor: '#FFFFFF', padding: '40px 32px', borderRadius: '24px', textAlign: 'center', position: 'relative', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  popularBadge: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#6366F1', color: 'white', fontSize: '10px', fontWeight: '800', padding: '4px 12px', borderRadius: '24px' },
  planIcon: { marginBottom: '24px' },
  planName: { fontSize: '20px', fontWeight: '800', color: '#1F2937', margin: 0 },
  planPrice: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px', marginTop: '16px' },
  currency: { fontSize: '14px', fontWeight: '700', color: '#6B7280' },
  amount: { fontSize: '36px', fontWeight: '800', color: '#1F2937' },
  period: { fontSize: '14px', fontWeight: '600', color: '#9CA3AF' },
  planSpace: { margin: '20px 0', fontSize: '15px', fontWeight: '700', color: '#6366F1' },
  planFeatures: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600', color: '#6B7280', textAlign: 'left' },
  planBtn: { width: '100%', padding: '16px', borderRadius: '24px', border: '1px solid #E5E7EB', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#FFFFFF' }
};

export default UpStorageBackup;
