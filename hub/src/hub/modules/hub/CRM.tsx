import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, TrendingUp, Target, 
  Search, Plus, MapPin, Mail, Phone,
  ChevronRight, Calendar, DollarSign,
  Filter, MoreVertical, MessageSquare,
  Clock, CheckCircle, AlertCircle, 
  Layout, List, Kanban, ArrowUpRight,
  Star, Zap, Shield, Trash2,
  TrendingDown, UserPlus, FileText,
  Smartphone, ExternalLink, MailQuestion
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { supabase } from '@core/lib/supabase';
import LogtaModal from '@shared/components/Modal';
import Pagination from '@shared/components/Pagination';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';

const MasterCRM: React.FC = () => {

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [newLead, setNewLead] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    potential_value: 0,
    city: '',
    contact_name: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('hub_crm_per_page');
    return saved === 'all' ? 'all' : Number(saved || 20);
  });
  const [totalItems, setTotalItems] = useState(0);

  const funnelStages = [
    { id: 'novo', name: 'Novas Oportunidades', color: '#D9FF00' },
    { id: 'contato', name: 'Qualificação', color: '#6366F1' },
    { id: 'negociacao', name: 'Negociação', color: '#f59e0b' },
    { id: 'proposta', name: 'Apresentação', color: '#38bdf8' },
    { id: 'fechamento', name: 'Fechado / Ganho', color: '#10b981' }
  ];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Pagination
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
      setTotalItems(count || 0);
    } catch (err: any) {
      toastError('Erro ao carregar leads do pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
    localStorage.setItem('hub_crm_per_page', String(val));
  };

  useEffect(() => {
    fetchLeads();
  }, [currentPage, itemsPerPage]);

  const handleAddLead = async () => {
    const tid = toastLoading('Registrando oportunidade no pipeline...');
    try {
      const { error } = await supabase
        .from('leads')
        .insert([{
          ...newLead,
          status: 'novo'
        }]);

      if (error) throw error;
      
      toastSuccess('Oportunidade cadastrada com sucesso!');
      setIsLeadModalOpen(false);
      setNewLead({ name: '', company_name: '', email: '', phone: '', potential_value: 0, city: '', contact_name: '' });
      fetchLeads();
    } catch (err: any) {
      toastError('Erro ao cadastrar: ' + err.message);
    } finally {
      toastDismiss(tid);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    const tid = toastLoading('Atualizando estágio do funil...');
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (error) throw error;
      
      toastSuccess('Pipeline atualizado!');
      fetchLeads();
    } catch (err: any) {
      toastError('Erro ao mover lead.');
    } finally {
      toastDismiss(tid);
    }
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 className="h1-style" style={{ margin: 0 }}>Gestão de Expansão & Vendas</h1>
          <p className="text-subtitle" style={{ margin: '4px 0 0 0' }}>Centralize leads e negociações em um único ecossistema.</p>
        </div>
        <div style={styles.headerActions}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={styles.viewToggle}>
              <button 
                style={{...styles.toggleBtn, ...(viewMode === 'kanban' ? styles.toggleActive : {})}}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={14} /> Kanban
              </button>
              <button 
                style={{...styles.toggleBtn, ...(viewMode === 'list' ? styles.toggleActive : {})}}
                onClick={() => setViewMode('list')}
              >
                <List size={14} /> Lista
              </button>
            </div>
            <button style={styles.addBtn} onClick={() => setIsLeadModalOpen(true)}>
              <UserPlus size={18} /> Nova Lead ⚡
            </button>
          </div>
        </div>
      </header>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, backgroundColor: '#6366F115'}}>
                <Target size={20} color="#6366F1" />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Pipeline Total</p>
                <h3 style={styles.statValue}>R$ {(leads.reduce((acc, curr) => acc + (Number(curr.potential_value) || 0), 0) / 1000).toFixed(1)}k</h3>
              </div>
              <div style={{...styles.statTrend, color: '#10B981'}}>
                +12% <TrendingUp size={12} />
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, backgroundColor: '#6366F1'}}>
                <CheckCircle size={20} color="#FFFFFF" />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Taxa de Conversão</p>
                <h3 style={styles.statValue}>18.4%</h3>
              </div>
              <div style={{...styles.statTrend, color: '#64748B'}}>
                Média do trimestre
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, backgroundColor: '#6366F115'}}>
                <Zap size={20} color="#6366F1" />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Leads em Risco</p>
                <h3 style={styles.statValue}>12</h3>
              </div>
              <div style={{...styles.statTrend, color: '#64748B'}}>
                Sem contato há 7+ dias
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={{...styles.statIconBox, backgroundColor: '#4F46E5'}}>
                <Star size={20} color="#FFFFFF" />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Ticket Médio SaaS</p>
                <h3 style={styles.statValue}>R$ 1.450</h3>
              </div>
              <div style={{...styles.statTrend, color: '#64748B'}}>
                Mix de planos
              </div>
            </div>
          </div>

          {viewMode === 'kanban' ? (
            <div style={styles.kanbanBoard}>
              {funnelStages.map(stage => (
                  <div key={stage.id} style={styles.kanbanColumn}>
                    <header style={styles.columnHeader}>
                        <div style={{...styles.columnDot, backgroundColor: stage.color}}></div>
                        <h4 style={styles.columnTitle}>{stage.name}</h4>
                        <span style={styles.columnCount}>{leads.filter(l => l.status === stage.id).length}</span>
                    </header>
                    <div style={styles.columnScroll}>
                        {leads.filter(l => l.status === stage.id).map(lead => (
                            <div 
                              key={lead.id} 
                              style={{...styles.leadCard, cursor: 'pointer'}} 
                              onClick={() => setSelectedLead(lead)}
                              className="hover-scale"
                            >
                              <div style={styles.cardTop}>
                                  <span style={{...styles.potentialTag, 
                                    backgroundColor: Number(lead.potential_value) > 10000 ? '#fef3c7' : '#f1f5f9', 
                                    color: Number(lead.potential_value) > 10000 ? '#92400e' : '#64748b'
                                  }}>{Number(lead.potential_value) > 10000 ? 'ALTO VALOR' : 'PADRÃO'}</span>
                                  <span style={styles.cardValue}>R$ {Number(lead.potential_value).toLocaleString()}</span>
                              </div>
                              <h5 style={styles.leadName}>{lead.name}</h5>
                              <div style={styles.leadLoc}><MapPin size={10} /> {lead.city || 'Local não informado'}</div>
                              <footer style={styles.cardFooter}>
                                  <div style={styles.leadUser}><Users size={12} /> {lead.contact_name || lead.company_name}</div>
                                  <div style={styles.leadTime}><Clock size={12} /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}</div>
                              </footer>
                            </div>
                        ))}
                        <button style={styles.columnAddBtn} onClick={() => setIsLeadModalOpen(true)}><Plus size={14} /> Adicionar nesta etapa</button>
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                      <tr>
                        <th style={styles.th}>TRANSPORTADORA</th>
                        <th style={styles.th}>CONTATO</th>
                        <th style={styles.th}>VALOR POTENCIAL</th>
                        <th style={styles.th}>ETAPA</th>
                        <th style={styles.th}>CADASTRO</th>
                        <th style={styles.th}>AÇÕES</th>
                      </tr>
                  </thead>
                  <tbody>
                      {leads.map(lead => (
                        <tr 
                          key={lead.id} 
                          style={{...styles.tr, cursor: 'pointer'}} 
                          onClick={() => setSelectedLead(lead)}
                          className="hover-scale"
                        >
                            <td style={styles.td}>
                              <div>
                                  <div style={styles.lNameTable}>{lead.name}</div>
                                  <div style={styles.lLocTable}>{lead.city}</div>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.lContactTable}>
                                  <span>{lead.contact_name}</span>
                                  <span style={{fontSize: '11px', color: '#94a3b8'}}>{lead.email}</span>
                              </div>
                            </td>
                            <td style={styles.td}>
                              <div style={{fontWeight: '500', color: 'var(--primary)', letterSpacing: '0.3px'}}>R$ {Number(lead.potential_value).toLocaleString()}</div>
                            </td>
                            <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                              <select 
                                value={lead.status} 
                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                style={{...styles.statusBadge, border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', outline: 'none'}}
                              >
                                  {funnelStages.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                              </select>
                            </td>
                            <td style={styles.td}>
                              <div style={styles.lTimeTable}>{new Date(lead.created_at).toLocaleDateString()}</div>
                            </td>
                            <td style={styles.td}>
                              <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}><MoreVertical size={18} /></button>
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <Pagination 
                  currentPage={currentPage}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
            </div>
          )}

      {/* LEAD DETAIL MODAL */}
      <LogtaModal 
        isOpen={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        size="xl"
        title={selectedLead?.name}
        subtitle={`${selectedLead?.city} • ID: ${selectedLead?.id?.substring(0,8)}`}
        icon={<Briefcase />}
      >
        {selectedLead && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
             <div>
                <div style={styles.infoGrid}>
                   <div style={styles.iGroup}>
                      <label style={styles.iLabel}>VALOR DA OPORTUNIDADE</label>
                      <div style={styles.modalPrice}>R$ {Number(selectedLead.potential_value).toLocaleString()}</div>
                   </div>
                   <div style={styles.iGroup}>
                      <label style={styles.iLabel}>ESTÁGIO ATUAL</label>
                      <select 
                        value={selectedLead.status}
                        onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)}
                        style={styles.input}
                      >
                         {funnelStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                </div>

                <h5 style={styles.logTitle}>HISTÓRICO DE INTERAÇÕES</h5>
                <div style={styles.interactionLog}>
                   <div style={styles.logItem}>
                      <div style={styles.logDot}></div>
                      <div>
                         <p style={styles.logText}>Lead qualificado e inserido no pipeline corporativo.</p>
                         <span style={styles.logDate}>{new Date(selectedLead.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid var(--border)' }}>
                   <h5 style={{...styles.logTitle, fontSize: '12px', marginBottom: '16px'}}>DADOS DE CONTATO</h5>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px' }}>
                         <Users size={16} color="#94a3b8" /> {selectedLead.contact_name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px' }}>
                         <Mail size={16} color="#94a3b8" /> {selectedLead.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569', fontSize: '13px' }}>
                         <Phone size={16} color="#94a3b8" /> {selectedLead.phone}
                      </div>
                   </div>
                </div>

                <button style={{ ...styles.secondaryBtn, width: '100%', color: '#ef4444', borderColor: '#fee2e2' }}>
                  <Trash2 size={16} /> REMOVER OPORTUNIDADE
                </button>
             </div>
          </div>
        )}
      </LogtaModal>

      {/* NEW LEAD MODAL */}
      <LogtaModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
        size="lg" 
        title="Adicionar ao Pipeline"
        subtitle="Cadastre um novo prospecto no funil de expansão master."
        icon={<Target />}
        primaryAction={{
          label: 'CADASTRAR OPORTUNIDADE',
          onClick: handleAddLead
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsLeadModalOpen(false)
        }}
      >
         <div style={styles.form}>
            <div style={styles.formGrid2}>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>NOME DA TRANSPORTADORA</label>
                  <input 
                    style={styles.input} 
                    placeholder="Ex: TransLog S.A." 
                    value={newLead.name}
                    onChange={e => setNewLead({...newLead, name: e.target.value})}
                  />
               </div>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>CIDADE / UF</label>
                  <input 
                    style={styles.input} 
                    placeholder="Ex: Curitiba, PR" 
                    value={newLead.city}
                    onChange={e => setNewLead({...newLead, city: e.target.value})}
                  />
               </div>
            </div>

            <div style={styles.formGrid2}>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>NOME DO CONTATO</label>
                  <input 
                    style={styles.input} 
                    placeholder="Ex: João Silva" 
                    value={newLead.contact_name}
                    onChange={e => setNewLead({...newLead, contact_name: e.target.value})}
                  />
               </div>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>TELEFONE / WHATSAPP</label>
                  <input 
                    style={styles.input} 
                    placeholder="+5511999999999" 
                    value={newLead.phone}
                    onChange={e => setNewLead({...newLead, phone: e.target.value})}
                  />
               </div>
            </div>

            <div style={styles.formGrid2}>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>E-MAIL COMERCIAL</label>
                  <input 
                    style={styles.input} 
                    placeholder="contato@empresa.com" 
                    value={newLead.email}
                    onChange={e => setNewLead({...newLead, email: e.target.value})}
                  />
               </div>
               <div style={styles.inputGroup}>
                  <label style={styles.label}>VALOR POTENCIAL (R$)</label>
                  <input 
                    type="number"
                    style={styles.input} 
                    placeholder="0.00" 
                    value={newLead.potential_value}
                    onChange={e => setNewLead({...newLead, potential_value: Number(e.target.value)})}
                  />
               </div>
            </div>
         </div>
      </LogtaModal>
    </div>
  );
};

const styles = {
  container: { padding: '40px', backgroundColor: 'transparent', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' },
  bread: { fontSize: '10px', fontWeight: '700', color: '#6366F1', marginBottom: '8px', letterSpacing: '1px', textTransform: 'uppercase' as const },
  title: { fontSize: '26px', fontWeight: '600', color: '#111827', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: '#6B7280', fontSize: '14px', fontWeight: '400' },
  headerActions: { display: 'flex', gap: '20px', alignItems: 'center' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: '#111827', color: '#D9FF00', border: 'none', borderRadius: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)', transition: 'all 0.2s', letterSpacing: '0.4px' },
  
  tabSwitch: { display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '16px', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '12px', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#64748b', transition: 'all 0.2s' },
  tabActive: { backgroundColor: 'white', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },

  viewToggle: { display: 'flex', backgroundColor: '#F1F5F9', padding: '4px', borderRadius: '12px' },
  toggleBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: 'none', borderRadius: '8px', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b', transition: 'all 0.2s' },
  toggleActive: { backgroundColor: 'white', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  statCard: { 
    backgroundColor: 'white', 
    padding: '24px', 
    borderRadius: '32px', 
    border: '1px solid #E2E8F0', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '16px', 
    position: 'relative' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  statIconBox: { 
    width: '48px', 
    height: '48px', 
    borderRadius: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  statContent: { 
    display: 'flex', 
    flexDirection: 'column' as const 
  },
  statLabel: { 
    fontSize: '11px', 
    fontWeight: '600', 
    color: '#94A3B8', 
    margin: 0, 
    textTransform: 'uppercase' as const, 
    letterSpacing: '0.8px' 
  },
  statValue: { 
    fontSize: '24px', 
    fontWeight: '500', 
    color: '#0F172A', 
    margin: '4px 0 0', 
    letterSpacing: '0.2px' 
  },
  statTrend: { 
    position: 'absolute' as const, 
    top: '24px', 
    right: '24px', 
    fontSize: '12px', 
    fontWeight: '600', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '4px', 
    letterSpacing: '0.2px' 
  },

  kanbanBoard: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', minHeight: '700px', alignItems: 'flex-start' },
  kanbanColumn: { backgroundColor: '#F8FAFC', borderRadius: '24px', padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '16px', minHeight: '600px', border: '1px solid #F1F5F9' },
  columnHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '0 4px' },
  columnDot: { width: '10px', height: '10px', borderRadius: '50%' },
  columnTitle: { fontSize: '13px', fontWeight: '700', color: '#111827', flex: 1, letterSpacing: '-0.2px' },
  columnCount: { fontSize: '11px', fontWeight: '700', color: '#6B7280', backgroundColor: 'white', padding: '2px 10px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  columnScroll: { display: 'flex', flexDirection: 'column' as const, gap: '14px' },
  
  leadCard: { backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', cursor: 'pointer', transition: 'all 0.2s ease-in-out' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  potentialTag: { fontSize: '9px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', letterSpacing: '0.8px' },
  cardValue: { fontSize: '13px', fontWeight: '700', color: '#111827', letterSpacing: '-0.2px' },
  leadName: { fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '6px', letterSpacing: '-0.3px', lineHeight: '1.4' },
  leadLoc: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', marginTop: '16px', paddingTop: '16px' },
  leadUser: { fontSize: '11px', fontWeight: '600', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px' },
  leadTime: { fontSize: '10px', fontWeight: '500', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' },
  columnAddBtn: { border: '1px dashed #CBD5E1', background: 'transparent', borderRadius: '16px', padding: '14px', color: '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' },

  tableWrapper: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { backgroundColor: '#F8FAFC', padding: '18px 24px', textAlign: 'left' as const, fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '1px' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' },
  td: { padding: '18px 24px' },
  lNameTable: { fontSize: '14px', fontWeight: '600', color: '#111827', letterSpacing: '-0.2px' },
  lLocTable: { fontSize: '12px', color: '#94A3B8', fontWeight: '400' },
  lContactTable: { display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  lTimeTable: { fontSize: '12px', fontWeight: '500', color: '#6B7280' },
  statusBadge: { fontSize: '10px', fontWeight: '800', padding: '6px 12px', borderRadius: '20px', letterSpacing: '0.5px', textTransform: 'uppercase' },
  iconBtn: { padding: '8px', border: 'none', background: 'none', color: '#94A3B8', cursor: 'pointer' },

  modalPrice: { fontSize: '24px', fontWeight: '700', color: '#6366F1', letterSpacing: '-1px' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' },
  iGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  iLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' as const, letterSpacing: '1px' },
  iValue: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  interactionLog: { display: 'flex', flexDirection: 'column' as const, gap: '16px' },
  logTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '12px', letterSpacing: '-0.2px' },
  logItem: { display: 'flex', gap: '16px' },
  logDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1', marginTop: '6px' },
  logText: { fontSize: '13px', color: '#374151', lineHeight: '1.5' },
  logDate: { fontSize: '11px', color: '#94A3B8', fontWeight: '500' },
  secondaryBtn: { padding: '12px 24px', backgroundColor: 'white', border: '1px solid #F1F5F9', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' },

  form: { padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  formGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  label: { fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '1px' },
  input: { padding: '14px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontWeight: '500', outline: 'none', transition: 'all 0.2s', width: '100%' }
};

export default MasterCRM;
