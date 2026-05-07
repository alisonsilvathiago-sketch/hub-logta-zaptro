import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Folder, File, Upload, Share2, Search, Filter, 
  MoreVertical, Download, Trash2, RotateCcw, 
  ExternalLink, FileText, Image as ImageIcon, 
  Film, Music, Shield, Clock, Users, Plus,
  ChevronRight, ArrowUpRight, Activity, Database,
  FileCheck, PenTool, LayoutGrid, List as ListIcon,
  Eye, Archive, Globe, Lock, Car, MessageSquare,
  HardDrive, Star, Info, MoreHorizontal, Settings,
  ArrowLeft, Copy, Edit3, ShieldAlert, CheckCircle2,
  AlertTriangle, MousePointer2, RefreshCw, Box,
  Truck, ClipboardCheck, History, MoreCircle,
  FileSearch, LockKeyhole
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import Button from '@shared/components/Button';
import LogtaModal from '@shared/components/Modal';

// --- Interfaces ---
interface LogDockFile {
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
  entity_type?: string;
  client_id?: string;
  category?: string;
  is_public: boolean;
  status?: 'em_rota' | 'entregue' | 'pendente' | 'problema';
  ai_analysis?: any;
  ocr_text?: string;
}

interface LogDockFolder {
  id: string;
  name: string;
  parent_id: string | null;
  company_id: string;
  created_at: string;
  status?: 'em_rota' | 'entregue' | 'pendente' | 'problema'; // Mocked for logistics
  type?: 'container' | 'standard';
}

// --- Components ---

const ContextMenu: React.FC<{ 
  x: number; y: number; onClose: () => void; onAction: (action: string) => void; itemType: 'file' | 'folder' | 'bg' 
}> = ({ x, y, onClose, onAction, itemType }) => {
  useEffect(() => {
    const handleGlobalClick = () => onClose();
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [onClose]);

  return (
    <div style={styles.contextMenu} onClick={e => e.stopPropagation()}>
      <div style={{...styles.contextMenuPos, top: y, left: x}}>
        {itemType !== 'bg' && (
          <>
            <button style={styles.contextItem} onClick={() => onAction('open')}><Eye size={16} /> Abrir</button>
            <button style={styles.contextItem} onClick={() => onAction('download')}><Download size={16} /> Download</button>
            <button style={styles.contextItem} onClick={() => onAction('share')}><Share2 size={16} /> Compartilhar</button>
            <div style={styles.contextDivider} />
            <button style={styles.contextItem} onClick={() => onAction('rename')}><Edit3 size={16} /> Renomear</button>
            <button style={{...styles.contextItem, color: '#EF4444'}} onClick={() => onAction('delete')}><Trash2 size={16} /> Excluir</button>
          </>
        )}
        {itemType === 'bg' && (
          <>
            <button style={styles.contextItem} onClick={() => onAction('new_container')}><Plus size={16} /> Novo Container</button>
            <button style={styles.contextItem} onClick={() => onAction('upload')}><Upload size={16} /> Upload de Arquivo</button>
            <div style={styles.contextDivider} />
            <button style={styles.contextItem} onClick={() => onAction('refresh')}><RotateCcw size={16} /> Atualizar</button>
          </>
        )}
      </div>
    </div>
  );
};

const HubLogDock: React.FC = () => {
  const { profile } = useAuth();
  const [files, setFiles] = useState<LogDockFile[]>([]);
  const [folders, setFolders] = useState<LogDockFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'all' | 'doc' | 'midia' | 'pod' | 'op' | 'time' | 'api' | 'trash'>('all');
  const [selectedItem, setSelectedItem] = useState<LogDockFile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'file' | 'folder' | 'bg'; item?: any } | null>(null);
  const [storageStats, setStorageStats] = useState({ used: 0, total: 10 * 1024 * 1024 * 1024, percent: 0 }); // 10GB for LogDock
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Auto-Initialization ---
  const initDefaultFolders = async () => {
    if (!profile?.company_id) return;
    
    const { data: existing } = await supabase.from('folders').select('name').eq('company_id', profile.company_id);
    const existingNames = (existing || []).map(f => f.name);
    
    const defaults = ['📦 Entregas Ativas', '🧾 Comprovantes (POD)', '🚚 Operações Diárias', '💬 Conversas WhatsApp', '📄 Documentos Fiscais'];
    const toCreate = defaults.filter(name => !existingNames.includes(name));
    
    if (toCreate.length > 0) {
      await supabase.from('folders').insert(toCreate.map(name => ({
        name,
        company_id: profile.company_id,
        created_by: profile.id,
        type: name.includes('Entregas') || name.includes('Operação') ? 'container' : 'standard',
        status: 'pendente'
      })));
      fetchData();
    }
  };

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const isMaster = profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN';
      let fileQuery = supabase.from('files').select('*');
      
      if (!isMaster) {
        fileQuery = fileQuery.eq('company_id', profile?.company_id);
      }
      
      if (activeTab === 'trash') {
        fileQuery = fileQuery.not('deleted_at', 'is', null);
      } else {
        fileQuery = fileQuery.is('deleted_at', null);
        // Map tabs to categories/types
        if (activeTab === 'doc') fileQuery = fileQuery.eq('category', 'documentos');
        if (activeTab === 'midia') fileQuery = fileQuery.in('type', ['image/jpeg', 'image/png', 'video/mp4']);
        if (activeTab === 'pod') fileQuery = fileQuery.eq('entity_type', 'pod');
        if (activeTab === 'op') fileQuery = fileQuery.eq('entity_type', 'logta');
      }

      const { data: fileData, error: fileError } = await fileQuery.order('created_at', { ascending: false });
      if (fileError) throw fileError;
      
      setFiles(fileData || []);

      let folderQuery = supabase.from('folders').select('*');
      if (!isMaster) {
        folderQuery = folderQuery.eq('company_id', profile?.company_id);
      }
      
      const { data: folderData, error: folderError } = await folderQuery;
      if (folderError) throw folderError;
      
      setFolders(folderData || []);

      const totalSize = (fileData || []).reduce((acc, f) => acc + (f.size || 0), 0);
      const usedPercent = Math.min(Math.round((totalSize / storageStats.total) * 100), 100);
      setStorageStats(prev => ({ ...prev, used: totalSize, percent: usedPercent }));

    } catch (err) {
      toastError('Erro ao carregar o LogDock.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      fetchData();
      if (profile.company_id) {
        initDefaultFolders();
      }
    }
  }, [activeTab, profile?.id, profile?.company_id]);

  // --- Handlers ---
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const tid = toastLoading(`Armazenando no Container: ${file.name}...`);
    try {
      const companyId = profile?.company_id || 'master-root';
      const { saveEntityToLogDock } = await import('@core/lib/logDockIntelligence');
      
      const result = await saveEntityToLogDock({
        company_id: companyId,
        type: activeTab === 'all' || activeTab === 'trash' ? 'geral' : (activeTab as any),
        file,
        category: 'documentos',
        metadata: { uploaded_by: profile?.id }
      });

      if (!result.success) throw result.error;

      toastDismiss(tid);
      toastSuccess('Arquivo arquivado no LogDock com sucesso!');
      fetchData();
    } catch (err: any) {
      toastDismiss(tid);
      toastError(`Falha no LogDock: ${err.message}`);
    } finally {
        toastDismiss(tid);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'file' | 'folder' | 'bg', item?: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, item });
  };

  const handleContextAction = async (action: string) => {
    const item = contextMenu?.item;
    setContextMenu(null);

    switch (action) {
      case 'download':
        if (item?.path) {
          const { data } = await supabase.storage.from('logdock').createSignedUrl(item.path, 60);
          if (data?.signedUrl) window.open(data.signedUrl, '_blank');
        }
        break;
      case 'delete':
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
        break;
      case 'share':
        navigator.clipboard.writeText(`https://logdock.com.br/s/${item.id}`);
        toastSuccess('Link seguro LogDock copiado!');
        break;
      case 'upload':
        fileInputRef.current?.click();
        break;
      case 'refresh':
        fetchData();
        break;
      case 'new_container':
        setIsNewFolderModalOpen(true);
        setNewFolderName('');
        break;
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await supabase.from('folders').insert({
        name: newFolderName.trim(),
        company_id: profile?.company_id,
        created_by: profile?.id,
        type: 'container',
        status: 'pendente'
      });
      setIsNewFolderModalOpen(false);
      toastSuccess(`Container "${newFolderName}" criado com sucesso!`);
      fetchData();
    } catch (err) {
      toastError('Erro ao criar container');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await supabase.from('files').update({ deleted_at: new Date().toISOString() }).eq('id', itemToDelete.id);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      toastSuccess('Item movido para a lixeira do LogDock');
      fetchData();
    } catch (err) {
      toastError('Erro ao excluir item');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnalyzeIA = async () => {
    if (!selectedItem) return;
    setIsAnalyzing(true);
    const tid = toastLoading(`IA Master analisando ${selectedItem.name}...`);
    try {
      const { analyzeFileIntelligence } = await import('@core/lib/logDockIntelligence');
      const result = await analyzeFileIntelligence(selectedItem.id, selectedItem.path, selectedItem.name);
      
      if (result.success) {
        toastDismiss(tid);
        toastSuccess('Análise concluída com sucesso!');
        // Refresh data to get the new analysis
        fetchData();
        // Close and reopen to update selectedItem (or update it locally)
        setIsDetailsOpen(false);
      } else {
        throw result.error;
      }
    } catch (err) {
      toastDismiss(tid);
      toastError('Erro na análise da IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (!type) return <File size={24} color="#94A3B8" />;
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <FileText size={24} color="#EF4444" />;
    if (t.includes('image')) return <ImageIcon size={24} color="#10B981" />;
    if (t.includes('video')) return <Film size={24} color="#0061FF" />;
    if (t.includes('audio')) return <Music size={24} color="#F59E0B" />;
    return <File size={24} color="#94A3B8" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'em_rota': return <span style={{...styles.statusBadge, backgroundColor: '#EFF6FF', color: '#3B82F6'}}>Em Rota</span>;
      case 'entregue': return <span style={{...styles.statusBadge, backgroundColor: '#F0FDF4', color: '#10B981'}}>Entregue</span>;
      case 'pendente': return <span style={{...styles.statusBadge, backgroundColor: '#FFF7ED', color: '#F59E0B'}}>Pendente</span>;
      case 'problema': return <span style={{...styles.statusBadge, backgroundColor: '#FEF2F2', color: '#EF4444'}}>Problema</span>;
      default: return null;
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.container} onContextMenu={e => handleContextMenu(e, 'bg')}>
      <input type="file" ref={fileInputRef} hidden onChange={e => handleUpload(e.target.files)} />
      
      <LogtaModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Novo Container"
        subtitle="Crie um novo container seguro para sua operação"
        icon={<Box color="#2563EB" />}
        primaryAction={{
          label: 'Criar Container',
          onClick: handleCreateFolder,
          loading: isCreatingFolder,
          disabled: !newFolderName.trim()
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsNewFolderModalOpen(false)
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#64748B', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Identificador do Container
          </label>
          <input 
            type="text" 
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            placeholder="Ex: Entrega #4592 - Cliente XPTO"
            style={styles.modalInput}
          />
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Item"
        subtitle={`Tem certeza que deseja arquivar "${itemToDelete?.name}" na lixeira?`}
        icon={<Trash2 color="#EF4444" />}
        primaryAction={{
          label: 'Arquivar na Lixeira',
          onClick: handleDeleteItem,
          loading: isDeleting,
          danger: true
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsDeleteModalOpen(false)
        }}
      >
        <div style={{ padding: '8px 0', color: '#64748B', fontSize: '15px', lineHeight: '1.6' }}>
          O item será protegido pelo Guardião da lixeira por 30 dias antes da exclusão permanente.
        </div>
      </LogtaModal>
      
      {/* SIDEBAR LOGDOCK */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <button style={styles.newBtn} onClick={() => handleContextAction('upload')}>
            <Plus size={20} /> Novo Arquivo
          </button>
        </div>

        <nav style={styles.nav}>
          <button style={{...styles.navItem, ...(activeTab === 'all' ? styles.navActive : {})}} onClick={() => setActiveTab('all')}><Box size={18} /> Todos os Containers</button>
          <button style={{...styles.navItem, ...(activeTab === 'doc' ? styles.navActive : {})}} onClick={() => setActiveTab('doc')}><FileText size={18} color="#EF4444" /> Documentos Fiscais</button>
          <button style={{...styles.navItem, ...(activeTab === 'midia' ? styles.navActive : {})}} onClick={() => setActiveTab('midia')}><ImageIcon size={18} color="#10B981" /> Mídias da Operação</button>
          <button style={{...styles.navItem, ...(activeTab === 'pod' ? styles.navActive : {})}} onClick={() => setActiveTab('pod')}><ClipboardCheck size={18} color="#F59E0B" /> Comprovantes (POD)</button>
          <button style={{...styles.navItem, ...(activeTab === 'op' ? styles.navActive : {})}} onClick={() => setActiveTab('op')}><Truck size={18} color="#2563EB" /> Operações Ativas</button>
          <button style={{...styles.navItem, ...(activeTab === 'time' ? styles.navActive : {})}} onClick={() => setActiveTab('time')}><History size={18} color="#0061FF" /> Timeline do LogDock</button>
          <button style={{...styles.navItem, ...(activeTab === 'api' ? styles.navActive : {})}} onClick={() => setActiveTab('api')}><Zap size={18} color="#F59E0B" /> API & Integrações</button>
          <div style={styles.navDivider} />
          <button style={{...styles.navItem, ...(activeTab === 'trash' ? styles.navActive : {})}} onClick={() => setActiveTab('trash')}><Trash2 size={18} /> Lixeira Segura</button>
        </nav>

        <div style={styles.storageBrief}>
          <div style={styles.storageLabel}><span>LogDock Storage</span><span>{storageStats.percent}%</span></div>
          <div style={styles.storageBar}><div style={{...styles.storageFill, width: `${storageStats.percent}%`}} /></div>
          <p style={styles.storageText}>{formatSize(storageStats.used)} de {formatSize(storageStats.total)}</p>
          <button style={styles.upgradeBtn}>Expandir Container</button>
        </div>
      </aside>

      <main 
        style={{...styles.main, border: isDragging ? '2px dashed #2563EB' : 'none'}}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div style={styles.dragOverlay}>
            <Upload size={64} className="animate-bounce" />
            <h2 style={{fontWeight: '900', fontSize: '24px'}}>Solte para armazenar no LogDock</h2>
          </div>
        )}

        {/* HEADER BUSCA */}
        <header style={styles.header}>
          <div style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" />
            <input type="text" placeholder="Buscar em containers, notas, clientes ou motoristas..." style={styles.searchInput} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button style={styles.filterBtn}><Filter size={18} /> Filtros</button>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.iconBtn}><Bell size={20} /></button>
            <button style={styles.iconBtn}><Settings size={20} /></button>
            <div style={styles.userAvatar}>{profile?.full_name?.[0] || 'L'}</div>
          </div>
        </header>

        {/* CONTEÚDO LOGDOCK */}
        <div style={styles.content}>
          
          {/* DASHBOARD OVERVIEW (DROPBOX STYLE) */}
          {activeTab === 'all' && !searchTerm && (
            <div style={styles.dashboardSection}>
               <h3 style={styles.sectionTitle}>Visão Geral da Operação</h3>
               <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                     <div style={{...styles.statIcon, backgroundColor: '#EFF6FF'}}><Box color="#3B82F6" /></div>
                     <div style={styles.statInfo}>
                        <span style={styles.statValue}>{folders.length}</span>
                        <span style={styles.statLabel}>Containers Ativos</span>
                     </div>
                  </div>
                  <div style={styles.statCard}>
                     <div style={{...styles.statIcon, backgroundColor: '#F0FDF4'}}><FileCheck color="#10B981" /></div>
                     <div style={styles.statInfo}>
                        <span style={styles.statValue}>{files.length}</span>
                        <span style={styles.statLabel}>Arquivos Protegidos</span>
                     </div>
                  </div>
                  <div style={styles.statCard}>
                     <div style={{...styles.statIcon, backgroundColor: '#FEF2F2'}}><AlertTriangle color="#EF4444" /></div>
                     <div style={styles.statInfo}>
                        <span style={styles.statValue}>3</span>
                        <span style={styles.statLabel}>Pendências POD</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          <div style={styles.contentHeader}>
            <div style={styles.breadcrumb}>
              <span>LogDock</span>
              {activeTab !== 'all' && (
                <><ChevronRight size={16} color="#94A3B8" /><span style={{color: '#2563EB', fontWeight: '900'}}>{activeTab.toUpperCase()}</span></>
              )}
            </div>
            <div style={styles.viewToggles}>
              <button style={{...styles.viewBtn, ...(viewMode === 'grid' ? styles.viewBtnActive : {})}} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
              <button style={{...styles.viewBtn, ...(viewMode === 'list' ? styles.viewBtnActive : {})}} onClick={() => setViewMode('list')}><ListIcon size={18} /></button>
            </div>
          </div>

          <div style={viewMode === 'grid' ? styles.grid : styles.list}>
            {loading ? (
              <div style={styles.emptyState}><RefreshCw className="animate-spin" size={32} color="#2563EB" /><p>Acessando o LogDock...</p></div>
            ) : (folders.length === 0 && filteredFiles.length === 0) ? (
              <div style={styles.emptyState}><Archive size={48} color="#E2E8F0" /><p>Este container está vazio.</p></div>
            ) : (
              <>
                {/* RENDER CONTAINERS (FOLDERS) */}
                {folders.map(folder => (
                  <div 
                    key={folder.id} 
                    style={viewMode === 'grid' ? styles.folderCard : styles.fileRow} 
                    onContextMenu={e => handleContextMenu(e, 'folder', folder)}
                  >
                    <div style={styles.folderIcon}>
                       {folder.type === 'container' ? <Box size={32} color="#2563EB" /> : <Folder size={32} color="#94A3B8" />}
                    </div>
                    <div style={styles.fileInfo}>
                       <span style={styles.fileName}>{folder.name}</span>
                       <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <span style={styles.fileMeta}>Container</span>
                          {folder.status && getStatusBadge(folder.status)}
                       </div>
                    </div>
                    <button style={styles.moreBtn} onClick={e => { e.stopPropagation(); handleContextMenu(e as any, 'folder', folder); }}><MoreHorizontal size={18} /></button>
                  </div>
                ))}

                {/* RENDER FILES */}
                {filteredFiles.map(file => (
                  <div 
                    key={file.id} 
                    style={viewMode === 'grid' ? styles.fileCard : styles.fileRow} 
                    onContextMenu={e => handleContextMenu(e, 'file', file)} 
                    onClick={() => { setSelectedItem(file); setIsDetailsOpen(true); }}
                  >
                    <div style={styles.fileIcon}>{getFileIcon(file.type)}</div>
                    <div style={styles.fileInfo}>
                       <span style={styles.fileName}>{file.name}</span>
                       <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <span style={styles.fileMeta}>{formatSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}</span>
                          {file.status && getStatusBadge(file.status)}
                       </div>
                    </div>
                    <button style={styles.moreBtn} onClick={e => { e.stopPropagation(); handleContextMenu(e as any, 'file', file); }}><MoreHorizontal size={18} /></button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* API & INTEGRATIONS TAB */}
          {activeTab === 'api' && (
            <div style={styles.apiDashboard}>
               <div style={styles.apiHeader}>
                  <h3 style={styles.sectionTitle}>LogDock Integration Engine</h3>
                  <p style={{color: '#64748B', fontSize: '14px'}}>Conecte sua operação externa diretamente ao LogDock via REST API.</p>
               </div>

               <div style={styles.apiKeyCard}>
                  <div style={styles.apiCardTitle}>Chave de API Master</div>
                  <div style={styles.apiKeyBox}>
                     <code>ld_live_4592_zaptro_logta_hub_2026</code>
                     <button style={styles.copyBtn}><Copy size={16} /></button>
                  </div>
                  <p style={{fontSize: '12px', color: '#94A3B8', marginTop: '12px'}}>Use esta chave para autenticar requisições de upload autônomo.</p>
               </div>

               <div style={styles.apiGrid}>
                  <div style={styles.apiGridItem}>
                     <h4 style={styles.apiItemTitle}><Globe size={16} /> Webhooks</h4>
                     <p style={styles.apiItemText}>Receba notificações em tempo real quando um arquivo for validado pela IA.</p>
                     <button style={styles.actionBtnSmall}>Configurar Endpoint</button>
                  </div>
                  <div style={styles.apiGridItem}>
                     <h4 style={styles.apiItemTitle}><Database size={16} /> Documentação</h4>
                     <p style={styles.apiItemText}>Consulte nossa documentação técnica para integrar SAP, TOTVS ou ERPs próprios.</p>
                     <button style={styles.actionBtnSmall}>Acessar Docs</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* CONTEXT MENU */}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} itemType={contextMenu.type} onClose={() => setContextMenu(null)} onAction={handleContextAction} />}

      {/* DETAILS MODAL */}
      <LogtaModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={selectedItem?.name || 'Detalhes do Arquivo'} size="lg">
        {selectedItem && (
          <div style={styles.detailsBody}>
            <div style={styles.previewBox}>
               {getFileIcon(selectedItem.type)}
               <p style={{marginTop: '16px', fontWeight: '900', color: '#1E293B', fontSize: '18px'}}>{selectedItem.name}</p>
               {selectedItem.status && getStatusBadge(selectedItem.status)}
            </div>
            
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}><label style={styles.detailLabel}>Certificado de Origem</label><div style={styles.detailValue}>LogDock Secure Cloud</div></div>
              <div style={styles.detailItem}><label style={styles.detailLabel}>Integridade Guardião</label><div style={{...styles.detailValue, color: '#10B981'}}>Verificado ✓</div></div>
              <div style={styles.detailItem}><label style={styles.detailLabel}>Data de Entrada</label><div style={styles.detailValue}>{new Date(selectedItem.created_at).toLocaleString()}</div></div>
              <div style={styles.detailItem}><label style={styles.detailLabel}>Visibilidade</label><div style={styles.detailValue}>{selectedItem.is_public ? <span style={{color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '4px'}}><Globe size={14} /> Link Público Ativo</span> : <span style={{color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px'}}><LockKeyhole size={14} /> Somente Interno</span>}</div></div>
            </div>

            <div style={styles.detailsActions}>
               <button style={styles.actionBtnPrimary} onClick={() => handleContextAction('download')}><Download size={18} /> Baixar Arquivo</button>
               <button style={styles.actionBtnSecondary} onClick={handleAnalyzeIA} disabled={isAnalyzing}>
                  <PenTool size={18} /> {isAnalyzing ? 'Analisando...' : 'Analisar com IA'}
               </button>
               <button style={styles.actionBtnSecondary} onClick={() => handleContextAction('share')}><Share2 size={18} /> Gerar Link LogDock</button>
               <button style={styles.actionBtnDanger} onClick={() => handleContextAction('delete')}><Trash2 size={18} /></button>
            </div>

            {selectedItem.ai_analysis && (
              <div style={styles.analysisSection}>
                <h4 style={styles.analysisTitle}><Shield size={16} /> Relatório da IA Master</h4>
                <div style={styles.analysisGrid}>
                  <div style={styles.analysisItem}>
                    <strong>Resumo:</strong> {selectedItem.ai_analysis.summary}
                  </div>
                  {selectedItem.ai_analysis.risks && (
                    <div style={styles.analysisItem}>
                      <strong>Riscos Detectados:</strong>
                      <ul style={{margin: '8px 0', paddingLeft: '20px'}}>
                        {selectedItem.ai_analysis.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </LogtaModal>

      {/* GUARDIAN ACCESS GATE */}
      {!(profile?.role === 'MASTER' || profile?.role === 'MASTER_ADMIN' || profile?.role === 'ADMIN') && (
        <div style={styles.guardianOverlay}>
          <ShieldAlert size={64} color="#EF4444" />
          <h2 style={{marginTop: '20px', color: '#1E293B', fontWeight: '900', fontSize: '28px'}}>Guardião: Acesso Negado</h2>
          <p style={{color: '#64748B', maxWidth: '400px', textAlign: 'center', fontWeight: '600', fontSize: '16px', lineHeight: '1.6'}}>O seu perfil não possui autorização para gerenciar este nível de armazenamento. Entre em contato com o administrador master.</p>
          <Button label="Voltar para Segurança" onClick={() => window.location.href = '/master'} />
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#FFF', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" },
  sidebar: { width: '300px', borderRight: '1px solid #F1F5F9', padding: '32px 24px', display: 'flex', flexDirection: 'column', backgroundColor: '#FBFBFE' },
  sidebarHeader: { marginBottom: '40px' },
  newBtn: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 32px', backgroundColor: '#2563EB', border: 'none', borderRadius: '18px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.25)', fontWeight: '900', cursor: 'pointer', width: '100%', transition: 'all 0.2s', fontSize: '16px', color: '#FFF' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', border: 'none', background: 'none', borderRadius: '14px', cursor: 'pointer', color: '#64748B', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', textAlign: 'left' },
  navActive: { backgroundColor: '#FFF', color: '#2563EB', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9' },
  navDivider: { height: '1px', backgroundColor: '#F1F5F9', margin: '24px 0' },
  storageBrief: { padding: '24px', backgroundColor: 'white', borderRadius: '24px', marginTop: 'auto', border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
  storageLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '900', marginBottom: '14px', color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.8px' },
  storageBar: { height: '10px', backgroundColor: '#F1F5F9', borderRadius: '10px', marginBottom: '14px', overflow: 'hidden' },
  storageFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: '10px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' },
  storageText: { fontSize: '13px', color: '#94A3B8', marginBottom: '18px', fontWeight: '700' },
  upgradeBtn: { width: '100%', padding: '12px', border: '2.5px solid #2563EB', color: '#2563EB', backgroundColor: 'white', borderRadius: '14px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#FFF', position: 'relative' },
  dragOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(37, 99, 235, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 100, backdropFilter: 'blur(10px)', color: '#2563EB', animation: 'fadeIn 0.3s' },
  header: { height: '80px', padding: '0 40px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF' },
  searchContainer: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#F8FAFC', padding: '14px 28px', borderRadius: '20px', width: '650px', border: '1px solid #F1F5F9' },
  searchInput: { border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '16px', fontWeight: '600', color: '#1E293B' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#94A3B8', fontWeight: '800', cursor: 'pointer', fontSize: '14px' },
  headerActions: { display: 'flex', gap: '24px', alignItems: 'center' },
  iconBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', transition: 'all 0.2s' },
  userAvatar: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' },
  content: { flex: 1, padding: '40px', overflowY: 'auto' },
  dashboardSection: { marginBottom: '48px' },
  sectionTitle: { fontSize: '12px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  statCard: { backgroundColor: '#FFF', border: '1px solid #F1F5F9', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  statIcon: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statInfo: { display: 'flex', flexDirection: 'column' },
  statValue: { fontSize: '24px', fontWeight: '900', color: '#0F172A' },
  statLabel: { fontSize: '13px', fontWeight: '700', color: '#94A3B8' },
  contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '14px', fontSize: '28px', fontWeight: '900', color: '#0F172A', letterSpacing: '-1px' },
  viewToggles: { display: 'flex', gap: '8px', backgroundColor: '#F8FAFC', padding: '6px', borderRadius: '14px', border: '1px solid #F1F5F9' },
  viewBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center' },
  viewBtnActive: { color: '#2563EB', backgroundColor: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  folderCard: { padding: '32px', backgroundColor: '#FFF', border: '1px solid #F1F5F9', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  folderIcon: { width: '72px', height: '72px', backgroundColor: '#F8FAFC', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileCard: { padding: '32px', border: '1px solid #F1F5F9', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', backgroundColor: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' },
  fileRow: { padding: '18px 32px', border: '1px solid #F1F5F9', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '32px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: '#FFF' },
  fileIcon: { width: '64px', height: '64px', backgroundColor: '#F8FAFC', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  fileName: { fontSize: '17px', fontWeight: '800', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  fileMeta: { fontSize: '13px', color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statusBadge: { padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', width: 'fit-content' },
  moreBtn: { background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '10px', borderRadius: '50%' },
  emptyState: { padding: '140px', textAlign: 'center', color: '#CBD5E1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', fontWeight: '800' },
  contextMenu: { position: 'fixed', inset: 0, zIndex: 1000 },
  contextMenuPos: { position: 'absolute', backgroundColor: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', padding: '12px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '6px' },
  contextItem: { padding: '14px 18px', background: 'none', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', color: '#475569', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  contextDivider: { height: '1px', backgroundColor: '#F1F5F9', margin: '8px 0' },
  detailsBody: { display: 'flex', flexDirection: 'column', gap: '40px', padding: '20px 0' },
  previewBox: { height: '300px', backgroundColor: '#FBFBFE', borderRadius: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #F1F5F9', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.02)' },
  detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '12px' },
  detailLabel: { fontSize: '12px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' },
  detailValue: { fontSize: '17px', fontWeight: '800', color: '#0F172A' },
  detailsActions: { display: 'flex', gap: '20px', marginTop: '20px' },
  actionBtnPrimary: { flex: 1, padding: '20px', backgroundColor: '#2563EB', color: 'white', borderRadius: '20px', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', fontSize: '16px', boxShadow: '0 12px 24px rgba(37,99,235,0.25)' },
  actionBtnSecondary: { flex: 1, padding: '20px', backgroundColor: 'white', border: '2px solid #E2E8F0', color: '#0F172A', borderRadius: '20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', fontSize: '16px' },
  actionBtnDanger: { width: '72px', height: '72px', backgroundColor: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  guardianOverlay: { position: 'absolute', inset: 0, backgroundColor: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 1000, padding: '40px', textAlign: 'center' },
  modalInput: { width: '100%', padding: '20px 24px', borderRadius: '20px', border: '2px solid #F1F5F9', fontSize: '18px', fontWeight: '700', color: '#0F172A', outline: 'none', backgroundColor: '#F8FAFC', transition: 'all 0.2s', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)' },
  analysisSection: { marginTop: '24px', padding: '20px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' },
  analysisTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '900', color: '#1E293B', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  analysisGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  analysisItem: { fontSize: '14px', color: '#475569', lineHeight: '1.5' },
  apiDashboard: { display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0' },
  apiHeader: { marginBottom: '8px' },
  apiKeyCard: { padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' },
  apiCardTitle: { fontSize: '12px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' },
  apiKeyBox: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #F1F5F9', fontStyle: 'normal' },
  copyBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' },
  apiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' },
  apiGridItem: { padding: '24px', backgroundColor: '#FFF', borderRadius: '20px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px' },
  apiItemTitle: { fontSize: '16px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' },
  apiItemText: { fontSize: '14px', color: '#64748B', lineHeight: '1.5' },
  actionBtnSmall: { alignSelf: 'flex-start', padding: '8px 16px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },
};

export default HubLogDock;
