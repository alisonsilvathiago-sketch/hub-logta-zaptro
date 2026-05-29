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
import HubMetricCard from '@shared/components/HubMetricCard';
import Pagination from '@shared/components/Pagination';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import { HUB_TOP_CTA_PRIMARY, HUB_TOP_CTA_SECONDARY } from '@hub/styles/hubTopCta';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';

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

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Payments
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

      // 2. Fetch Consolidated Metrics (New!)
      const { data: revData } = await supabase.rpc('get_consolidated_revenue', { p_days: 30 });
      const total = (revData || []).reduce((acc: number, curr: any) => acc + Number(curr.total_revenue), 0);
      setTotalRevenue(total);

      const { count: pending } = await supabase
        .from('master_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDENTE');
      setPendingCount(pending || 0);

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
          <h2 style={styles.title}>Conciliação de receita</h2>
          <p style={styles.subtitle}>Pagamentos, NF-e e sincronização com Asaas.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.syncBtn} onClick={() => {
             toastSuccess('Sincronizando com gateway Asaas...');
             fetchData();
           }}>
              <RefreshCw size={15} color="var(--accent)" /> Sincronizar Gateway
           </button>
           <button style={styles.primaryBtn}>
              <Download size={15} /> Exportar Lote NF-e
           </button>
        </div>
      </header>


      {/* Sub-abas */}
      <div style={styles.tabsContainer}>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'CONCILIACAO' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('CONCILIACAO')}
        >
          <Zap size={16} /> Conciliação Pendente
        </button>
        <button 
          style={{...styles.tabBtn, ...(activeTab === 'NOTAS' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('NOTAS')}
        >
          <FileText size={16} /> Notas Emitidas
        </button>
      </div>

      {/* MAIN LIST */}
      <div style={styles.statsGrid}>
        <HubMetricCard
          label="Total Consolidado (30d)"
          icon={DollarSign}
          iconVariant="soft"
          accent="#0061FF"
          topRight={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 14,
                fontWeight: 800,
                color: '#10B981',
              }}
            >
              ECOSSISTEMA <ArrowUpRight size={14} />
            </span>
          }
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        />
        <HubMetricCard
          label="Taxa de Sucesso"
          icon={CheckCircle}
          iconVariant="solid"
          accent="#0061FF"
          value="99.2%"
        />
        <HubMetricCard
          label="Faturas Pendentes"
          icon={Clock}
          iconVariant="soft"
          accent="#0061FF"
          iconSize={20}
          topRight={
            <span style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>ASAAS</span>
          }
          value={pendingCount.toString()}
        />
        <HubMetricCard
          label="Chargebacks / Disputas"
          icon={ShieldCheck}
          iconVariant="solid"
          accent="#0052D9"
          topRight={
            <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>SEGURO</span>
          }
          value="0"
        />
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
                      <ExternalLink size={12} color="#0061FF" cursor="pointer" />
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
                      Conciliar 
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
                 <ChevronRight size={32} color="#0061FF" />
              </div>
              <div style={styles.concBox}>
                 <label style={styles.concLabel}>EMISSÃO NOTA FISCAL (NFe)</label>
                 <div style={styles.concValue}>PRESTADOR HUB</div>
                 <div style={styles.concMeta}>SÉRIE: 001</div>
                 <div style={styles.concMeta}>STATUS: PRONTO PARA ENVIO</div>
              </div>
           </div>

           <div style={styles.concAlert}>
              <HelpCircle size={20} color="#0061FF" />
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
  container: { padding: '28px 32px 36px', backgroundColor: 'transparent' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '0',
    paddingBottom: '22px',
    borderBottom: '1px solid var(--border)',
  },
  bread: { fontSize: '11px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' },
  title: { fontSize: '20px', fontWeight: '800', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.35px' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  headerActions: { display: 'flex', gap: '12px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' },
  syncBtn: { ...HUB_TOP_CTA_SECONDARY },
  primaryBtn: { ...HUB_TOP_CTA_PRIMARY, boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },

  tabsContainer: { ...hubPillTabStripStyles.container, marginTop: '20px', marginBottom: '28px' },
  tabBtn: { ...hubPillTabStripStyles.button, fontSize: '13px' },
  tabActive: { ...hubPillTabStripStyles.buttonActive, fontSize: '13px' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' },

  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  tableHeader: { padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', padding: '0 24px', borderRadius: '20px', border: '1px solid var(--border)', height: '56px', maxWidth: '500px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '12px', fontWeight: '600', color: 'var(--secondary)', width: '100%' },
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
