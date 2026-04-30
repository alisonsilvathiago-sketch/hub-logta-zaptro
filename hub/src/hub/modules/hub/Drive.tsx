import React, { useState, useEffect } from 'react';
import { 
  Folder, File, Upload, Share2, Search, Filter, 
  MoreVertical, Download, Trash2, RotateCcw, 
  ExternalLink, FileText, Image as ImageIcon, 
  Film, Music, Shield, Clock, Users, Plus,
  ChevronRight, ArrowUpRight, Activity, Database,
  FileCheck, PenTool, LayoutGrid, List as ListIcon,
  Eye, Archive, Globe, Lock, Car, MessageSquare,
  HardDrive, Star, Info, MoreHorizontal, Settings
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import Button from '@shared/components/Button';
import LogtaModal from '@shared/components/Modal';

interface DriveFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  version: number;
  company_id: string;
  folder_id: string | null;
  created_at: string;
  deleted_at: string | null;
  ocr_text?: string;
  ai_analysis?: any;
  entity_type?: string;
  client_id?: string;
  vehicle_id?: string;
  category?: string;
}

const HubDrive: React.FC = () => {
  const { profile } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'clientes' | 'veiculos' | 'zaptro' | 'logta' | 'trash'>('all');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<DriveFile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from('files').select('*');

      if (activeTab === 'trash') {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
        if (activeTab === 'clientes') query = query.eq('entity_type', 'cliente');
        if (activeTab === 'veiculos') query = query.eq('entity_type', 'veiculo');
        if (activeTab === 'zaptro') query = query.eq('entity_type', 'zaptro');
        if (activeTab === 'logta') query = query.eq('entity_type', 'logta');
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      toastError('Erro ao carregar o Hub Drive.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tid = toastLoading(`Fazendo upload de ${file.name}...`);
    try {
      const companyId = profile?.company_id || 'master-root';
      
      // Usa o novo serviço de arquivamento inteligente
      const { saveEntityToDrive } = await import('@core/lib/driveIntelligence');
      const result = await saveEntityToDrive({
        company_id: companyId,
        type: activeTab === 'all' || activeTab === 'trash' ? 'geral' : (activeTab as any),
        file,
        category: 'documentos',
        metadata: { uploaded_by: profile?.id }
      });

      if (!result.success) throw result.error;

      toastDismiss(tid);
      toastSuccess('Arquivo enviado e organizado automaticamente!');
      fetchData();
    } catch (err: any) {
      toastDismiss(tid);
      toastError(`Falha no upload: ${err.message}`);
    }
  };

  const getFileIcon = (type: string) => {
    if (!type) return <File size={24} color="#94A3B8" />;
    if (type.includes('pdf')) return <FileText size={24} color="#EF4444" />;
    if (type.includes('image')) return <ImageIcon size={24} color="#10B981" />;
    if (type.includes('video')) return <Film size={24} color="#6366F1" />;
    if (type.includes('audio')) return <Music size={24} color="#F59E0B" />;
    return <File size={24} color="#94A3B8" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.container}>
      {/* SIDEBAR TIPO GOOGLE DRIVE */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <label style={styles.newBtn}>
            <Plus size={20} /> Novo
            <input type="file" hidden onChange={handleUpload} />
          </label>
        </div>

        <nav style={styles.nav}>
          <button 
            style={{...styles.navItem, ...(activeTab === 'all' ? styles.navActive : {})}}
            onClick={() => setActiveTab('all')}
          >
            <HardDrive size={18} /> Meu Drive
          </button>
          <button 
            style={{...styles.navItem, ...(activeTab === 'clientes' ? styles.navActive : {})}}
            onClick={() => setActiveTab('clientes')}
          >
            <Folder size={18} color="#6366F1" /> Clientes
          </button>
          <button 
            style={{...styles.navItem, ...(activeTab === 'veiculos' ? styles.navActive : {})}}
            onClick={() => setActiveTab('veiculos')}
          >
            <Folder size={18} color="#10B981" /> Veículos
          </button>
          <button 
            style={{...styles.navItem, ...(activeTab === 'zaptro' ? styles.navActive : {})}}
            onClick={() => setActiveTab('zaptro')}
          >
            <MessageSquare size={18} color="#F59E0B" /> Zaptro (Conversas)
          </button>
          <button 
            style={{...styles.navItem, ...(activeTab === 'logta' ? styles.navActive : {})}}
            onClick={() => setActiveTab('logta')}
          >
            <Archive size={18} color="#6366F1" /> Logta (Arquivos)
          </button>

          <div style={styles.navDivider} />

          <button 
            style={{...styles.navItem, ...(activeTab === 'trash' ? styles.navActive : {})}}
            onClick={() => setActiveTab('trash')}
          >
            <Trash2 size={18} /> Lixeira
          </button>
        </nav>

        <div style={styles.storageBrief}>
          <div style={styles.storageLabel}>
            <span>Espaço em uso</span>
            <span>72%</span>
          </div>
          <div style={styles.storageBar}><div style={{...styles.storageFill, width: '72%'}} /></div>
          <p style={styles.storageText}>3.2 GB de 5 GB utilizados</p>
          <button style={styles.upgradeBtn}>Fazer Upgrade</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={20} color="#64748B" />
            <input 
              type="text" 
              placeholder="Pesquisar arquivos e pastas..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={styles.headerActions}>
            <button style={styles.iconBtn}><Clock size={20} /></button>
            <button style={styles.iconBtn}><Settings size={20} /></button>
            <div style={styles.userAvatar}>A</div>
          </div>
        </header>

        <div style={styles.content}>
          <div style={styles.contentHeader}>
            <div style={styles.breadcrumb}>
              <span>Meu Drive</span>
              {activeTab !== 'all' && (
                <>
                  <ChevronRight size={16} color="#94A3B8" />
                  <span style={{color: '#1E293B', fontWeight: '700'}}>{activeTab.toUpperCase()}</span>
                </>
              )}
            </div>
            <div style={styles.viewToggles}>
              <button 
                style={{...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {})}}
                onClick={() => setViewMode('grid')}
              ><LayoutGrid size={18} /></button>
              <button 
                style={{...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {})}}
                onClick={() => setViewMode('list')}
              ><ListIcon size={18} /></button>
            </div>
          </div>

          <div style={viewMode === 'grid' ? styles.grid : styles.list}>
            {loading ? (
              <div style={styles.emptyState}>Carregando biblioteca...</div>
            ) : filteredFiles.length === 0 ? (
              <div style={styles.emptyState}>
                <Archive size={48} color="#E2E8F0" />
                <p>Nenhum arquivo nesta pasta.</p>
              </div>
            ) : (
              filteredFiles.map(file => (
                <div 
                  key={file.id} 
                  style={viewMode === 'grid' ? styles.fileCard : styles.fileRow}
                  onClick={() => {
                    setSelectedItem(file);
                    setIsDetailsOpen(true);
                  }}
                >
                  <div style={styles.fileIcon}>
                    {getFileIcon(file.type)}
                  </div>
                  <div style={styles.fileInfo}>
                    <span style={styles.fileName}>{file.name}</span>
                    <span style={styles.fileMeta}>{formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</span>
                  </div>
                  <button style={styles.moreBtn}><MoreHorizontal size={18} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* DETAIL MODAL (SIDEBAR FEEL) */}
      <LogtaModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedItem?.name || 'Detalhes'}
        size="lg"
      >
        {selectedItem && (
          <div style={styles.detailsBody}>
            <div style={styles.previewBox}>
              {getFileIcon(selectedItem.type)}
              <p>{selectedItem.type}</p>
            </div>
            
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <label>Proprietário</label>
                <div>Logta Cloud Master</div>
              </div>
              <div style={styles.detailItem}>
                <label>Última modificação</label>
                <div>{new Date(selectedItem.created_at).toLocaleString()}</div>
              </div>
              <div style={styles.detailItem}>
                <label>Localização</label>
                <div style={{color: '#6366F1'}}>{selectedItem.path}</div>
              </div>
            </div>

            <div style={styles.detailsActions}>
               <button style={styles.actionBtnPrimary} onClick={() => window.open(selectedItem.path, '_blank')}>
                 <Download size={18} /> Download
               </button>
               <button style={styles.actionBtnSecondary}><Share2 size={18} /> Compartilhar</button>
               <button style={styles.actionBtnDanger}><Trash2 size={18} /> Excluir</button>
            </div>
          </div>
        )}
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', backgroundColor: 'white', overflow: 'hidden' },
  sidebar: { width: '280px', borderRight: '1px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { marginBottom: '24px' },
  newBtn: { 
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', 
    backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: '700', cursor: 'pointer',
    width: 'fit-content'
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { 
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
    border: 'none', background: 'none', borderRadius: '12px', cursor: 'pointer',
    color: '#64748B', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s',
    textAlign: 'left'
  },
  navActive: { backgroundColor: '#EEF2FF', color: '#6366F1' },
  navDivider: { height: '1px', backgroundColor: '#E2E8F0', margin: '16px 0' },
  
  storageBrief: { padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '20px', marginTop: 'auto' },
  storageLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '8px' },
  storageBar: { height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', marginBottom: '8px' },
  storageFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: '3px' },
  storageText: { fontSize: '11px', color: '#64748B', marginBottom: '12px' },
  upgradeBtn: { width: '100%', padding: '8px', border: '1px solid #6366F1', color: '#6366F1', backgroundColor: 'white', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

  main: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF' },
  header: { height: '72px', padding: '0 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#F1F5F9', padding: '10px 24px', borderRadius: '12px', width: '500px' },
  searchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500' },
  headerActions: { display: 'flex', gap: '20px', alignItems: 'center' },
  iconBtn: { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' },

  content: { flex: 1, padding: '32px', overflowY: 'auto' },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '600', color: '#64748B' },
  viewToggles: { display: 'flex', gap: '8px' },
  viewBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' },
  viewBtnActive: { color: '#6366F1' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '24px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  
  fileCard: { 
    padding: '20px', border: '1px solid #E2E8F0', borderRadius: '20px', 
    display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer',
    transition: 'all 0.2s', position: 'relative'
  },
  fileRow: {
    padding: '16px 24px', border: '1px solid #E2E8F0', borderRadius: '16px',
    display: 'flex', alignItems: 'center', gap: '24px', cursor: 'pointer'
  },
  fileIcon: { width: '48px', height: '48px', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  fileName: { fontSize: '14px', fontWeight: '700', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta: { fontSize: '12px', color: '#94A3B8', fontWeight: '500' },
  moreBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' },

  emptyState: { padding: '80px', textAlign: 'center', color: '#94A3B8' },

  // Details
  detailsBody: { display: 'flex', flexDirection: 'column', gap: '32px' },
  previewBox: { height: '200px', backgroundColor: '#F8FAFC', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E2E8F0' },
  detailsGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' },
  detailsActions: { display: 'flex', gap: '12px' },
  actionBtnPrimary: { flex: 1, padding: '14px', backgroundColor: '#1E293B', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  actionBtnSecondary: { flex: 1, padding: '14px', backgroundColor: 'white', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  actionBtnDanger: { padding: '14px', backgroundColor: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '12px', cursor: 'pointer' }
};

export default HubDrive;

export default HubDrive;
