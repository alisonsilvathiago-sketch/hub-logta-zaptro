import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, Edit2, 
  Trash2, BookOpen, Layers, Save, X, 
  ExternalLink, ChevronRight, Layout,
  Eye, HelpCircle
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';

export const MasterKnowledge: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'categories'>('articles');
  
  const [showArtModal, setShowArtModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category_id: '',
    is_public: true,
    author_id: ''
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    icon: 'Book',
    display_order: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: catData } = await supabase.from('kb_categories').select('*').order('display_order', { ascending: true });
      const { data: artData } = await supabase.from('kb_articles').select('*, kb_categories(name)').order('created_at', { ascending: false });
      
      setCategories(catData || []);
      setArticles(artData || []);
    } catch (err) {
      toastError('Erro ao carregar dados da Central de Ajuda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveArticle = async () => {
    if (!newArticle.title || !newArticle.category_id) return toastError('Título e Categoria são obrigatórios.');
    const tId = toastLoading('Salvando artigo...');
    try {
      const { error } = await supabase.from('kb_articles').upsert(editingItem ? { ...newArticle, id: editingItem.id } : newArticle);
      if (error) throw error;
      toastSuccess('Artigo salvo com sucesso!');
      setShowArtModal(false);
      fetchData();
    } catch (err) {
      toastError('Erro ao salvar artigo.');
    } finally {
      toastDismiss(tId);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Excluir este artigo?')) return;
    try {
      const { error } = await supabase.from('kb_articles').delete().eq('id', id);
      if (error) throw error;
      toastSuccess('Artigo excluído.');
      fetchData();
    } catch (err) {
      toastError('Erro ao excluir artigo.');
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Biblioteca Central Unificada</h1>
          <p style={styles.subtitle}>Gestão de conhecimento, documentações, logs e mídias integradas entre Zaptro, Logta e LogDock.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.catBtn} onClick={() => setActiveTab(activeTab === 'articles' ? 'categories' : 'articles')}>
              {activeTab === 'articles' ? <Layers size={18} /> : <FileText size={18} />}
              {activeTab === 'articles' ? 'Gerenciar Categorias' : 'Gerenciar Artigos'}
           </button>
           <button style={styles.addBtn} onClick={() => { setEditingItem(null); setShowArtModal(true); }}>
              <Plus size={18} /> Publicar na Biblioteca
           </button>
        </div>
      </header>

      <div style={HUB_METRIC_GRID_STYLE}>
         <HubMetricCard label="Total de Artigos" value={articles.length} icon={FileText} accent="#0061FF" />
         <HubMetricCard label="Categorias Ativas" value={categories.length} icon={Layers} accent="#10B981" />
         <HubMetricCard label="Visualizações (30d)" value="1.2k" icon={Eye} accent="#F59E0B" />
      </div>

      <div style={styles.searchBar}>
         <div style={styles.searchWrapper}>
            <Search size={20} color="#94a3b8" />
            <input style={styles.searchInput} placeholder="Buscar artigo por título ou categoria..." />
         </div>
         <div style={styles.filters}>
            <button style={styles.filterBtn}><Filter size={16} /> Status</button>
            <button style={styles.filterBtn}><Filter size={16} /> Recentemente Editados</button>
         </div>
      </div>

      {loading ? (
        <div style={styles.loader}>Sincronizando biblioteca...</div>
      ) : activeTab === 'articles' ? (
        <div style={styles.grid}>
          {articles.map(art => (
            <div key={art.id} style={styles.card}>
               <div style={styles.cardHeader}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                     <div style={styles.cardCategory}>{art.kb_categories?.name?.toUpperCase()}</div>
                     <div style={{ ...styles.cardCategory, backgroundColor: art.system === 'logta' ? 'rgba(0, 97, 255, 0.12)' : art.system === 'zaptro' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', color: art.system === 'logta' ? '#0061FF' : art.system === 'zaptro' ? '#10B981' : '#F59E0B' }}>
                       {(art.system || 'logdock').toUpperCase()}
                     </div>
                  </div>
                  <div style={styles.cardActions}>
                     <button style={styles.actionBtn} onClick={() => { setEditingItem(art); setNewArticle(art); setShowArtModal(true); }}><Edit2 size={14} /></button>
                     <button style={styles.actionBtn} onClick={() => handleDeleteArticle(art.id)}><Trash2 size={14} /></button>
                  </div>
               </div>
               <h3 style={styles.cardTitle}>{art.title}</h3>
               <p style={styles.cardSnippet}>{art.content.substring(0, 100)}...</p>
               <div style={styles.cardFooter}>
                  <span style={styles.cardStatus}>{art.is_public ? '● Público' : '○ Privado'}</span>
                  <span style={styles.cardDate}>{new Date(art.created_at).toLocaleDateString()}</span>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.list}>
           {categories.map(cat => (
             <div key={cat.id} style={styles.listItem}>
                <div style={styles.listIcon}><BookOpen size={20} /></div>
                <div style={styles.listInfo}>
                   <div style={styles.listName}>{cat.name}</div>
                   <div style={styles.listMeta}>{articles.filter(a => a.category_id === cat.id).length} artigos vinculados</div>
                </div>
                <div style={styles.listActions}>
                   <button style={styles.actionBtn}><Edit2 size={16} /></button>
                   <button style={styles.actionBtn}><Trash2 size={16} /></button>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Article Modal */}
      <LogtaModal isOpen={showArtModal} onClose={() => setShowArtModal(false)} size="lg" title={editingItem ? 'Editar Artigo' : 'Publicar Novo Artigo'}>
         <div style={styles.form}>
            <div style={{...styles.fRow, gridTemplateColumns: '2fr 1fr 1fr'}}>
               <div style={styles.fGroup}>
                  <label style={styles.fLabel}>Título do Documento / Artigo</label>
                  <input style={styles.input} value={newArticle.title} onChange={e => setNewArticle({...newArticle, title: e.target.value})} placeholder="Ex: Manual de faturamento unificado..." />
               </div>
               <div style={styles.fGroup}>
                  <label style={styles.fLabel}>Categoria</label>
                  <select style={styles.input} value={newArticle.category_id} onChange={e => setNewArticle({...newArticle, category_id: e.target.value})}>
                     <option value="">Selecionar...</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
               <div style={styles.fGroup}>
                  <label style={styles.fLabel}>Sistema Vinculado</label>
                  <select style={styles.input} value={(newArticle as any).system || 'logdock'} onChange={e => setNewArticle({...newArticle, system: e.target.value} as any)}>
                     <option value="logdock">LogDock Central</option>
                     <option value="logta">Logta SaaS</option>
                     <option value="zaptro">Zaptro CRM</option>
                     <option value="all">Unificados (Todos)</option>
                  </select>
               </div>
            </div>
            <div style={styles.fGroup}>
               <label style={styles.fLabel}>Conteúdo do Artigo (Markdown Suportado)</label>
               <textarea style={styles.textarea} value={newArticle.content} onChange={e => setNewArticle({...newArticle, content: e.target.value})} placeholder="Escreva o passo a passo detalhadamente..." />
            </div>
            <button style={styles.submitBtn} onClick={handleSaveArticle}>SALVAR E PUBLICAR AGORA</button>
         </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '0', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  bread: { fontSize: '11px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '1px', marginBottom: '8px' },
  title: { fontSize: '29px', fontWeight: '700', color: '#000000', letterSpacing: 0, marginBottom: '8px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  headerActions: { display: 'flex', gap: '12px' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '24px', fontWeight: '600', cursor: 'pointer' },
  catBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '24px', fontWeight: '600', color: 'var(--text-main)', cursor: 'pointer' },

  controls: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px', gap: '20px' },
  searchWrapper: { flex: 1, position: 'relative', display: 'flex', alignItems: 'center', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '24px', padding: '0 16px' },
  searchInput: { flex: 1, padding: '16px', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '600' },
  filters: { display: 'flex', gap: '10px' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '22px', fontSize: '13px', fontWeight: '700', color: '#64748b' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' },
  cardCategory: { padding: '4px 8px', backgroundColor: '#ebebeb', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#64748b' },
  cardActions: { display: 'flex', gap: '4px' },
  actionBtn: { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px', lineHeight: '1.4' },
  cardSnippet: { fontSize: '13px', color: '#64748b', lineHeight: '1.6', flex: 1, marginBottom: '20px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #e8e8e8' },
  cardStatus: { fontSize: '11px', fontWeight: '700', color: '#10b981' },
  cardDate: { fontSize: '11px', color: '#94a3b8' },

  list: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid var(--border)', overflow: 'hidden' },
  listItem: { display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e8e8e8', gap: '20px' },
  listIcon: { width: '40px', height: '40px', backgroundColor: '#ebebeb', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  listInfo: { flex: 1 },
  listName: { fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' },
  listMeta: { fontSize: '12px', color: '#94a3b8' },
  listActions: { display: 'flex', gap: '8px' },

  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  fRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  fGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fLabel: { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  input: { padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', outline: 'none' },
  textarea: { padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', outline: 'none', minHeight: '100px', resize: 'none' },
  submitBtn: { marginTop: '10px', padding: '16px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '22px', fontWeight: '600', cursor: 'pointer' }
};

export default MasterKnowledge;
