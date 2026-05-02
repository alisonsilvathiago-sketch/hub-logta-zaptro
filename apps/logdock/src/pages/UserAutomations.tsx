import React, { useState, useEffect } from 'react';
import { 
  Zap, Plus, Settings2, Clock,
  MessageSquare, ChevronDown, Info,
  Folder, Type, FileText, Image as ImageIcon,
  Play, Archive, Mic, X, Send,
  ChevronRight, Trash2, CheckCircle2,
  Calendar, Search, File
} from 'lucide-react';
import LogtaModal from '@shared/components/Modal';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';
import { toast } from 'react-hot-toast';

type AutomationType = 'classify' | 'rename' | 'pdf' | 'image' | 'video' | 'zip' | 'audio' | null;

const AutomationsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isFreqMenuOpen, setIsFreqMenuOpen] = useState(false);
  const [frequency, setFrequency] = useState('Diariamente');
  const [suggestion, setSuggestion] = useState('');
  
  // Automation Modal State
  const [selectedAuto, setSelectedAuto] = useState<AutomationType>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [organizeBy, setOrganizeBy] = useState('Mes');
  const [isSaving, setIsSaving] = useState(false);
  
  // Folders State
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  useEffect(() => {
    if (user && profile) {
      fetchFolders();
    }
  }, [user, profile]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('company_id', profile?.company_id);
      if (error) throw error;
      setFolders(data || []);
    } catch (err) {
      console.error('Erro ao buscar pastas:', err);
    }
  };

  const handleSaveAutomation = async () => {
    if (!selectedAuto || !selectedFolderId) {
      toast.error('Selecione uma pasta para aplicar a automação.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('folder_automations')
        .insert({
          company_id: profile?.company_id,
          folder_id: selectedFolderId,
          type: selectedAuto,
          frequency: frequency,
          config: { organizeBy, activeStep },
          created_by: user?.id
        });

      if (error) throw error;
      toast.success('Automação ativada e sincronizada com sucesso!');
      setSelectedAuto(null);
    } catch (err: any) {
      toast.error('Erro ao salvar automação: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const automationOptions = [
    { id: 'classify' as const, title: 'Escolha uma categoria para classificar os arquivos', icon: <Folder size={20} color="#94A3B8" /> },
    { id: 'rename' as const, title: 'Configurar uma regra que renomeia os arquivos', icon: <Type size={20} color="#94A3B8" /> },
    { id: 'pdf' as const, title: 'Converter arquivos em PDFs', icon: <FileText size={20} color="#94A3B8" /> },
    { id: 'image' as const, title: 'Escolha um formato de imagem para converter os arquivos', icon: <ImageIcon size={20} color="#94A3B8" /> },
    { id: 'video' as const, title: 'Escolha um formato de arquivo para converter os vídeos', icon: <Play size={20} color="#94A3B8" /> },
    { id: 'zip' as const, title: 'Descompactar arquivos', icon: <Archive size={20} color="#94A3B8" /> },
    { id: 'audio' as const, title: 'Escolha um formato para converter os arquivos de áudio', icon: <Mic size={20} color="#94A3B8" /> },
  ];

  const handleSendSuggestion = () => {
    if (!suggestion) return;
    toast.success('Sugestão enviada com sucesso!');
    setSuggestion('');
    setIsSuggestModalOpen(false);
  };

  const renderAutomationContent = () => {
    switch (selectedAuto) {
      case 'classify':
        return (
          <div style={styles.autoStepBox}>
            <div style={styles.autoStepHeader}>
              <Folder size={18} color="#FFF" />
              <div style={{ flex: 1 }}>Então, <strong>organizar em pastas agrupadas por</strong></div>
              <Trash2 size={16} color="#666" style={{ cursor: 'pointer' }} />
              <ChevronDown size={16} color="#666" />
            </div>
            <div style={styles.radioList}>
              {[
                { id: 'Mes', label: 'Mês', desc: 'Mês em que seu conteúdo foi adicionado ao LogDock' },
                { id: 'Ano', label: 'Ano', desc: 'Ano em que seu conteúdo foi adicionado ao LogDock' },
                { id: 'Palavra', label: 'Palavra-chave', desc: 'Agrupar por palavras-chave específicas' },
              ].map(opt => (
                <div key={opt.id} style={styles.radioItem} onClick={() => setOrganizeBy(opt.id)}>
                  <div style={{...styles.radioCircle, borderColor: organizeBy === opt.id ? '#0061FF' : '#444'}}>
                    {organizeBy === opt.id && <div style={styles.radioInner} />}
                  </div>
                  <div>
                    <div style={styles.radioLabel}>{opt.label}</div>
                    <div style={styles.radioDesc}>{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'rename':
        return (
          <div style={styles.autoStepBox}>
            <div style={styles.autoStepHeader}>
              <Type size={18} color="#FFF" />
              <div style={{ flex: 1 }}>Então <strong>renomeá-los para</strong></div>
              <Trash2 size={16} color="#666" style={{ cursor: 'pointer' }} />
              <ChevronDown size={16} color="#666" />
            </div>
            <div style={{ padding: '20px' }}>
                <button style={styles.ruleBtn}>Adicionar regra de nomenclatura</button>
            </div>
          </div>
        );
      case 'zip':
        return (
          <div style={styles.autoStepBox}>
            <div style={styles.autoStepHeader}>
              <Archive size={18} color="#FFF" />
              <div style={{ flex: 1 }}>Então, <strong>descompactar</strong></div>
              <Trash2 size={16} color="#666" style={{ cursor: 'pointer' }} />
              <ChevronDown size={16} color="#666" />
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.selectRow}>
                    <select style={styles.modalSelect}>
                        <option>Todos os tipos de arquivos compatíveis</option>
                    </select>
                </div>
                <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} /> Arquivos com mais de 256 MB não serão descompactados
                </div>
            </div>
          </div>
        );
      case 'pdf':
      case 'image':
      case 'video':
      case 'audio':
        return (
          <div style={styles.autoStepBox}>
            <div style={styles.autoStepHeader}>
              {selectedAuto === 'pdf' ? <FileText size={18} color="#FFF" /> : 
               selectedAuto === 'image' ? <ImageIcon size={18} color="#FFF" /> :
               selectedAuto === 'video' ? <Play size={18} color="#FFF" /> :
               <Mic size={18} color="#FFF" />}
              <div style={{ flex: 1 }}>Então, <strong>converter os arquivos</strong></div>
              <Trash2 size={16} color="#666" style={{ cursor: 'pointer' }} />
              <ChevronDown size={16} color="#666" />
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.selectRow}>
                    <select style={styles.modalSelect}>
                        <option>Todos os tipos de arquivos compatíveis</option>
                    </select>
                    <span style={{ color: '#666' }}>em</span>
                    <select style={styles.modalSelect}>
                        {selectedAuto === 'pdf' && <option>PDFs</option>}
                        {selectedAuto === 'image' && <><option>png</option><option>jpg</option></>}
                        {selectedAuto === 'video' && <><option>mov</option><option>mp4</option></>}
                        {selectedAuto === 'audio' && <><option>mp3</option><option>wav</option></>}
                    </select>
                </div>
                <div style={{ fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={12} /> Arquivos com mais de 2048 MB não serão convertidos
                </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  const renderVisualPreview = () => {
    return (
        <div style={styles.visualPreview}>
            {selectedAuto === 'classify' && (
                <div style={styles.previewBox}>
                    <div style={styles.previewContent}>
                        <div style={styles.previewTitle}>Setembro</div>
                        <div style={styles.previewList}>
                            <div style={styles.previewFile}><FileText size={14} color="#0061FF" /> Doc_1.pdf</div>
                            <div style={styles.previewFile}><ImageIcon size={14} color="#10B981" /> Photo.jpg</div>
                        </div>
                    </div>
                </div>
            )}
            {selectedAuto === 'zip' && (
                <div style={styles.previewFlow}>
                    <div style={styles.flowIcon}><Archive size={40} color="#0061FF" /></div>
                    <ChevronRight size={32} color="#444" />
                    <div style={styles.zipResultGrid}>
                        {[1, 2, 3, 4].map(i => <div key={i} style={styles.zipResultItem}><ImageIcon size={20} color="#94A3B8" /></div>)}
                    </div>
                </div>
            )}
            {(selectedAuto === 'rename' || selectedAuto === 'pdf' || selectedAuto === 'image' || selectedAuto === 'video' || selectedAuto === 'audio') && (
                <div style={styles.previewFlow}>
                    <div style={{ position: 'relative' }}>
                        <div style={styles.flowIcon}>
                            {selectedAuto === 'video' ? <Play size={40} color="#0061FF" /> : 
                             selectedAuto === 'audio' ? <Mic size={40} color="#0061FF" /> :
                             <File size={40} color="#0061FF" />}
                        </div>
                        <div style={styles.fileNameBadge}>MeuArquivo.{selectedAuto === 'video' ? 'mov' : selectedAuto === 'audio' ? 'wav' : 'doc'}</div>
                    </div>
                    <ChevronRight size={32} color="#444" />
                    <div style={{ position: 'relative' }}>
                        <div style={styles.flowIcon}>
                            {selectedAuto === 'video' ? <Play size={40} color="#FFF" /> : 
                             selectedAuto === 'audio' ? <Mic size={40} color="#FFF" /> :
                             <File size={40} color="#FFF" />}
                        </div>
                        <div style={styles.fileNameBadge}>MeuArquivo.{selectedAuto === 'pdf' ? 'pdf' : selectedAuto === 'video' ? 'mp4' : selectedAuto === 'audio' ? 'mp3' : 'png'}</div>
                        {selectedAuto === 'pdf' && <div style={styles.badgePdf}>PDF</div>}
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <h1 style={styles.title}>Automações</h1>
          <Info size={18} color="#94A3B8" style={{ cursor: 'pointer' }} />
        </div>
        
        <div style={styles.actionRow}>
          <button style={styles.createBtn} onClick={() => setSelectedAuto('classify')}>
            <Plus size={18} /> Criar automação
          </button>
          
          <button style={styles.suggestBtn} onClick={() => setIsSuggestModalOpen(true)}>
            <MessageSquare size={18} /> Sugerir uma automação
          </button>
          
          <div style={{ position: 'relative' }}>
            <button style={styles.freqBtn} onClick={() => setIsFreqMenuOpen(!isFreqMenuOpen)}>
              <Clock size={18} /> {frequency} <ChevronDown size={14} />
            </button>
            {isFreqMenuOpen && (
              <div style={styles.freqMenu}>
                {['De hora em hora', 'A cada 6 horas', 'Diariamente', 'Semanalmente', 'Imediatamente'].map(f => (
                  <div 
                    key={f} 
                    style={{...styles.freqItem, color: frequency === f ? '#0061FF' : '#FFF'}} 
                    onClick={() => { setFrequency(f); setIsFreqMenuOpen(false); }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Adicionar uma automação</h2>
        <div style={styles.grid}>
          {automationOptions.map(opt => (
            <div key={opt.id} style={styles.autoCard} onClick={() => setSelectedAuto(opt.id)}>
              <div style={styles.iconBox}>{opt.icon}</div>
              <span style={styles.autoTitle}>{opt.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Automation Modal */}
      <LogtaModal 
        isOpen={!!selectedAuto} 
        onClose={() => setSelectedAuto(null)} 
        title="Criar uma pasta automatizada"
        size="xl"
        darkMode={true}
      >
        <div style={styles.autoModalBody}>
            <div style={styles.modalLeft}>
                <div style={styles.autoTimeline}>
                    {/* Trigger Step */}
                    <div style={styles.timelineItem}>
                        <div style={styles.timelineIcon}><div style={styles.minusIcon} /></div>
                        <div style={styles.autoStepBox}>
                            <div style={styles.autoStepHeader}>
                                <div style={{ flex: 1 }}>Quando <strong>arquivos forem adicionados à pasta</strong></div>
                                <ChevronDown size={16} color="#666" />
                            </div>
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '10px', color: '#666', fontWeight: '900', letterSpacing: '0.5px' }}>SELECIONE A PASTA DESTINO</label>
                                <select 
                                  style={{...styles.modalSelect, width: '100%'}} 
                                  value={selectedFolderId} 
                                  onChange={(e) => setSelectedFolderId(e.target.value)}
                                >
                                    <option value="">Escolher pasta existente...</option>
                                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={styles.timelineLine} />

                    {/* Action Step */}
                    <div style={styles.timelineItem}>
                        <div style={styles.timelineIcon}><div style={styles.actionCircle}>{selectedAuto === 'classify' ? <Folder size={14} /> : <Zap size={14} />}</div></div>
                        {renderAutomationContent()}
                    </div>

                    <div style={styles.timelineLine} />

                    {/* Add Step */}
                    <div style={styles.timelineItem}>
                        <div style={styles.addCircle}><Plus size={20} /></div>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#FFF' }}>Adicionar passo</span>
                    </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.checkbox}><CheckCircle2 size={18} color="#0061FF" /></div>
                    <span style={{ fontSize: '13px', color: '#FFF' }}>Salvar ações como modelo de fluxo de trabalho</span>
                    <Info size={14} color="#666" />
                </div>
            </div>

            <div style={styles.modalRight}>
                {renderVisualPreview()}
            </div>
        </div>

        <div style={styles.modalFooter}>
            <button style={styles.opinionBtn}>Enviar opinião</button>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button style={styles.cancelBtn} onClick={() => setSelectedAuto(null)}>Cancelar</button>
                <button 
                  style={{...styles.saveBtn, opacity: isSaving ? 0.7 : 1}} 
                  onClick={handleSaveAutomation} 
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </div>
      </LogtaModal>

      {/* Suggestion Modal */}
      <LogtaModal 
        isOpen={isSuggestModalOpen} 
        onClose={() => setIsSuggestModalOpen(false)} 
        title="Dar uma opinião ou sugerir uma automação"
        size="md"
      >
        <div style={styles.modalContent}>
          <p style={styles.modalSub}>Queremos facilitar a sua vida. O que o LogDock pode automatizar para você?</p>
          <div style={styles.textareaWrapper}>
            <textarea 
              style={styles.textarea} 
              placeholder="Você pode escrever o que quiser aqui..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              maxLength={5000}
            />
          </div>
          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={() => setIsSuggestModalOpen(false)}>Cancelar</button>
            <button style={styles.sendBtn} onClick={handleSendSuggestion}>Enviar</button>
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '40px', padding: '40px', minHeight: '100vh', backgroundColor: '#F9F9F7' },
  header: { display: 'flex', flexDirection: 'column', gap: '24px' },
  titleRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  title: { fontSize: '24px', fontWeight: '900', color: '#1E1E1E', margin: 0 },
  actionRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  createBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '800', fontSize: '13px', color: '#1E1E1E', cursor: 'pointer' },
  suggestBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '12px', fontWeight: '800', fontSize: '13px', color: '#1E1E1E', cursor: 'pointer' },
  freqBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', backgroundColor: '#1E1E1E', borderRadius: '12px', fontWeight: '800', fontSize: '13px', color: '#FFF', cursor: 'pointer', border: 'none' },
  freqMenu: { position: 'absolute', top: '50px', left: 0, width: '200px', backgroundColor: '#1E1E1E', borderRadius: '12px', padding: '8px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
  freqItem: { padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#FFF', cursor: 'pointer', borderRadius: '8px' },
  section: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionTitle: { fontSize: '15px', fontWeight: '800', color: '#64748B' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' },
  autoCard: { display: 'flex', alignItems: 'center', gap: '20px', padding: '24px', backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' },
  iconBox: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  autoTitle: { fontSize: '14px', fontWeight: '600', color: '#1E1E1E', flex: 1 },
  
  // Modal Styles
  autoModalBody: { display: 'flex', backgroundColor: '#1E1E1E', minHeight: '500px' },
  modalLeft: { flex: 1, padding: '40px', display: 'flex', flexDirection: 'column' },
  modalRight: { flex: 1, backgroundColor: '#0F172A11', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  autoTimeline: { display: 'flex', flexDirection: 'column', gap: '0' },
  timelineItem: { display: 'flex', gap: '20px', alignItems: 'flex-start' },
  timelineLine: { width: '2px', height: '32px', backgroundColor: '#333', marginLeft: '17px' },
  timelineIcon: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  minusIcon: { width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #444', backgroundColor: '#1E1E1E', position: 'relative' },
  actionCircle: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' },
  addCircle: { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', cursor: 'pointer' },
  autoStepBox: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column' },
  autoStepHeader: { padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #333', color: '#FFF', fontSize: '14px' },
  selectorBtn: { backgroundColor: '#333', border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#FFF', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  ruleBtn: { width: '100%', padding: '12px', backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#FFF', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },
  
  // Radio Styles
  radioList: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  radioItem: { display: 'flex', gap: '16px', cursor: 'pointer' },
  radioCircle: { width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
  radioInner: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0061FF' },
  radioLabel: { fontSize: '14px', fontWeight: '700', color: '#FFF' },
  radioDesc: { fontSize: '12px', color: '#666', marginTop: '4px' },
  
  // Visual Preview
  visualPreview: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1D5DB44', borderRadius: '24px' },
  zipResultGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' },
  zipResultItem: { width: '40px', height: '40px', backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fileNameBadge: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1E1E1E', color: '#FFF', fontSize: '9px', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap' },
  previewBox: { backgroundColor: '#FFF', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '280px' },
  previewTitle: { fontSize: '13px', fontWeight: '800', color: '#1E1E1E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  previewList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  previewFile: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#666', fontWeight: '600' },
  previewFlow: { display: 'flex', alignItems: 'center', gap: '32px' },
  flowIcon: { padding: '24px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
  badgePdf: { position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#EF4444', color: '#FFF', fontSize: '10px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px' },
  
  // Modal Footer
  modalFooter: { padding: '24px 40px', borderTop: '1px solid #333', backgroundColor: '#1E1E1E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  opinionBtn: { background: 'none', border: 'none', color: '#FFF', fontWeight: '800', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' },
  cancelBtn: { padding: '10px 24px', backgroundColor: '#333', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' },
  saveBtn: { padding: '10px 24px', backgroundColor: '#0061FF', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: '900', cursor: 'pointer' },
  
  selectRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  modalSelect: { backgroundColor: '#333', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#FFF', fontSize: '13px', fontWeight: '600' }
};

export default AutomationsPage;
