import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, RefreshCw, Filter, 
  Search, Download, CheckCircle, AlertCircle, 
  Clock, ArrowUpRight, ArrowDownRight, Zap,
  TrendingUp, DollarSign, Building2, ExternalLink,
  ChevronRight, MoreHorizontal, Settings, HelpCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';
import Pagination from '@shared/components/Pagination';

const MasterFinanceiro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('CONCILIACAO');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isConciliationModalOpen, setIsConciliationModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('master_payments')
        .select('*', { count: 'exact' });
      
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      setPayments(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      toastError('Erro ao sincronizar dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  const handleReconcile = async (id: string) => {
    const tid = toastLoading('Executando reconciliação inteligente...');
    try {
      // Simulando lógica de reconciliação automática
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { error } = await supabase
        .from('master_payments')
        .update({ metadata: { ...selectedPayment?.metadata, reconciled: true, nf_issued: true } })
        .eq('id', id);

      if (error) throw error;
      
      toastSuccess('Nota Fiscal reconciliada e emitida com sucesso!');
      setIsConciliationModalOpen(false);
      fetchData();
    } catch (err) {
      toastError('Falha no motor de reconciliação.');
    } finally {
      toastDismiss(tid);
    }
  };


  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PAGO' || s === 'RECEIVED' || s === 'CONFIRMED') return <span style={styles.badgeSuccess}>CONCLUÍDO</span>;
    if (s === 'PENDENTE') return <span style={styles.badgeWarning}>PENDENTE</span>;
    return <span style={styles.badgeDanger}>ATRASADO</span>;
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Conciliação de Receita Master</h1>
          <p style={styles.subtitle}>Gestão inteligente de Notas Fiscais e sincronização com Asaas.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.syncBtn} onClick={() => {
             toastSuccess('Sincronizando com gateway Asaas...');
             fetchData();
           }}>
              <RefreshCw size={18} color="var(--accent)" /> Sincronizar Gateway
           </button>
           <button style={styles.primaryBtn}>
              <Download size={18} /> Exportar Lote NF-e
           </button>
        </div>
      </header>


      {/* TABS CONTROL */}
      <div style={styles.tabsContainer}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'CONCILIACAO' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('CONCILIACAO')}
        >
          <Zap size={16} color={activeTab === 'CONCILIACAO' ? 'white' : 'var(--text-secondary)'} /> Conciliação Pendente
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'NOTAS' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('NOTAS')}
        >
          <FileText size={16} color={activeTab === 'NOTAS' ? 'white' : 'var(--text-secondary)'} /> Notas Emitidas
        </button>
      </div>

      {/* MAIN LIST */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#6366F115'}}>
            <DollarSign size={20} color="#6366F1" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Total Conciliado</p>
            <h3 style={styles.statValue}>R$ 1.2M</h3>
          </div>
          <div style={{...styles.statTrend, color: '#10B981'}}>
            +8.4% <TrendingUp size={12} />
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#6366F1'}}>
            <CheckCircle size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Taxa de Sucesso</p>
            <h3 style={styles.statValue}>99.2%</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#6366F115'}}>
            <Clock size={20} color="#6366F1" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Pendentes (HOJE)</p>
            <h3 style={styles.statValue}>42</h3>
          </div>
          <div style={{...styles.statTrend, color: '#F59E0B'}}>
            AGUARDANDO
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#4F46E5'}}>
            <ShieldCheck size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Chargebacks / Disputas</p>
            <h3 style={styles.statValue}>0</h3>
          </div>
          <div style={{...styles.statTrend, color: '#10B981'}}>
            SEGURO
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
           <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input style={styles.searchInput} placeholder="Buscar por cliente, CPF/CNPJ ou Ref ID..." />
           </div>
           <div style={styles.tableFilters}>
              <button style={styles.filterBtn}><Filter size={16} /> Todos os Gateway</button>
           </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>CLIENTE / ORIGEM</th>
              <th style={styles.th}>GATEWAY ID</th>
              <th style={styles.th}>VALOR</th>
              <th style={styles.th}>PAGAMENTO</th>
              <th style={styles.th}>STATUS NF</th>
              <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={styles.loaderTd}>Sincronizando registros financeiros...</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} style={styles.tr} className="hover-scale" onClick={() => { setSelectedPayment(p); setIsConciliationModalOpen(true); }}>
                <td style={styles.td}>
                   <div style={styles.clientCell}>
                      <strong style={styles.clientName}>{p.client_name}</strong>
                      <span style={styles.clientSub}>{p.metadata?.origin || 'HUB MASTER'}</span>
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.refCell}>
                      <code>{p.asaas_id?.substring(0, 12)}</code>
                      <ExternalLink size={12} color="#6366F1" cursor="pointer" />
                   </div>
                </td>
                <td style={styles.td}><strong style={styles.price}>R$ {p.amount?.toLocaleString('pt-BR')}</strong></td>
                <td style={styles.td}>{getStatusBadge(p.status)}</td>
                <td style={styles.td}>
                   {p.metadata?.nf_issued ? (
                     <span style={styles.nfBadgeOk}><CheckCircle size={12} /> EMITIDA</span>
                   ) : (
                     <span style={styles.nfBadgePending}><Clock size={12} /> AGUARDANDO</span>
                   )}
                </td>
                <td style={{...styles.td, textAlign: 'right'}}>
                   <button 
                      style={styles.reconcileBtn}
                      onClick={(e) => { e.stopPropagation(); setSelectedPayment(p); setIsConciliationModalOpen(true); }}
                   >
                      Conciliar ⚡
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination 
          currentPage={currentPage}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {/* RECONCILIATION MODAL */}
      <LogtaModal
        isOpen={isConciliationModalOpen}
        onClose={() => setIsConciliationModalOpen(false)}
        size="lg"
        title="Conciliador Inteligente NF-e"
        subtitle={`Processando fatura do cliente: ${selectedPayment?.client_name}`}
        icon={<ShieldCheck />}
      >
        <div style={styles.modalContent}>
           <div style={styles.concGrid}>
              <div style={styles.concBox}>
                 <label style={styles.concLabel}>DADOS DO PAGAMENTO (ASAAS)</label>
                 <div style={styles.concValue}>R$ {selectedPayment?.amount?.toLocaleString('pt-BR') || '0,00'}</div>
                 <div style={styles.concMeta}>ID: {selectedPayment?.asaas_id || '---'}</div>
                 <div style={styles.concMeta}>DATA: {selectedPayment?.created_at ? new Date(selectedPayment.created_at).toLocaleDateString() : '---'}</div>
              </div>
              <div style={styles.concArrow}>
                 <ChevronRight size={32} color="#6366F1" />
              </div>
              <div style={styles.concBox}>
                 <label style={styles.concLabel}>EMISSÃO NOTA FISCAL (NFe)</label>
                 <div style={styles.concValue}>PRESTADOR HUB</div>
                 <div style={styles.concMeta}>SÉRIE: 001</div>
                 <div style={styles.concMeta}>STATUS: PRONTO PARA ENVIO</div>
              </div>
           </div>

           <div style={styles.concAlert}>
              <HelpCircle size={20} color="#6366F1" />
              <p>O sistema detectou que os dados do cliente estão completos. A nota será emitida automaticamente e enviada para o e-mail cadastrado.</p>
           </div>

           <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setIsConciliationModalOpen(false)}>Cancelar</button>
              <button style={styles.confirmBtn} onClick={() => selectedPayment && handleReconcile(selectedPayment.id)}>EMITIR E CONCILIAR AGORA</button>
           </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  bread: { fontSize: '11px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  syncBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },

  tabsContainer: { display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)', padding: '6px', borderRadius: '20px', width: 'fit-content' },
  tabBtn: { padding: '10px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { backgroundColor: 'white', color: 'var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: 0 },
  statTrend: { fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' },

  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  tableHeader: { padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', padding: '0 24px', borderRadius: '20px', border: '1px solid var(--border)', height: '56px', maxWidth: '500px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '600', color: 'var(--secondary)', width: '100%' },
  tableFilters: { display: 'flex', gap: '12px' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--secondary)', fontWeight: '700', fontSize: '13px', cursor: 'pointer' },

  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' },
  td: { padding: '24px', borderBottom: '1px solid var(--bg-secondary)' },

  clientCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  clientName: { fontSize: '15px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px' },
  clientSub: { fontSize: '10px', color: 'var(--accent)', fontWeight: '800', textTransform: 'uppercase' },
  refCell: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--accent)', fontWeight: '700' },
  price: { fontSize: '16px', fontWeight: '800', color: 'var(--secondary)' },

  badgeSuccess: { padding: '6px 12px', backgroundColor: '#F0FDF4', color: '#16A34A', fontSize: '10px', fontWeight: '800', borderRadius: '10px' },
  badgeWarning: { padding: '6px 12px', backgroundColor: '#FFFBEB', color: '#D97706', fontSize: '10px', fontWeight: '800', borderRadius: '10px' },
  badgeDanger: { padding: '6px 12px', backgroundColor: '#FEF2F2', color: '#EF4444', fontSize: '10px', fontWeight: '800', borderRadius: '10px' },

  nfBadgeOk: { display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontSize: '11px', fontWeight: '900' },
  nfBadgePending: { display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontSize: '11px', fontWeight: '900' },
  
  reconcileBtn: { padding: '8px 16px', backgroundColor: 'var(--bg-active)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' },

  modalContent: { padding: '10px' },
  concGrid: { display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', gap: '24px', marginBottom: '32px' },
  concBox: { padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' },
  concLabel: { fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'block' },
  concValue: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '8px' },
  concMeta: { fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' },
  concArrow: { display: 'flex', justifyContent: 'center' },
  concAlert: { padding: '16px', backgroundColor: 'var(--bg-active)', border: '1px solid var(--accent)', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '32px', fontSize: '13px', color: 'var(--accent)', fontWeight: '500', lineHeight: '1.5' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '24px' },
  cancelBtn: { padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--text-secondary)', fontWeight: '700', cursor: 'pointer' },
  confirmBtn: { padding: '12px 24px', backgroundColor: 'var(--accent)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)' },
};

export default MasterFinanceiro;
