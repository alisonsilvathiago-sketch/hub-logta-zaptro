import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Calendar, Clock, User, 
  Database, Activity, Lock, RefreshCw, FileText,
  AlertCircle, CheckCircle2, Info, X
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { HUB_PAGE_SUBTITLE } from '@hub/styles/hubPageTypography';
import Pagination from '@shared/components/Pagination';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_email?: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('master_audit_logs')
        .select('*, profiles:user_id(email)', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs(data?.map(log => ({
        ...log,
        user_email: (log.profiles as any)?.email || 'Sistema'
      })) || []);
      setTotalItems(count || 0);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, searchTerm]);

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return '#EF4444';
    if (action.includes('INSERT') || action.includes('CREATE')) return '#0061FF';
    if (action.includes('UPDATE')) return '#F59E0B';
    if (action.includes('LOGIN')) return '#0061FF';
    return '#64748B';
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Trilha de Auditoria (Caixa Preta)</h1>
          <p style={styles.subtitle}>Registro imutável de todas as ações administrativas e alterações de dados no ecossistema.</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchLogs}>
          <RefreshCw size={18} />
        </button>
      </header>

      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Buscar por ação, tabela ou ID..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>DATA / HORA</th>
              <th style={styles.th}>USUÁRIO</th>
              <th style={styles.th}>AÇÃO</th>
              <th style={styles.th}>TABELA</th>
              <th style={styles.th}>DETALHES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={styles.loadingTd}>Lendo registros imutáveis...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={styles.loadingTd}>Nenhum registro encontrado.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.timeCell}>
                      <Calendar size={12} /> {new Date(log.created_at).toLocaleDateString()}
                      <span style={{ marginLeft: '8px', opacity: 0.6 }}>
                        <Clock size={12} /> {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <User size={14} color="#0061FF" />
                      {log.user_email}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ 
                      ...styles.actionBadge, 
                      backgroundColor: `${getActionColor(log.action)}15`, 
                      color: getActionColor(log.action) 
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.tableCell}>
                      <Database size={14} color="#94A3B8" />
                      {log.table_name}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <button 
                      style={styles.viewBtn}
                      onClick={() => {
                        console.log('Detalhes:', log);
                        alert(`DADOS ORIGINAIS:\n${JSON.stringify(log.old_data, null, 2)}\n\nNOVOS DADOS:\n${JSON.stringify(log.new_data, null, 2)}`);
                      }}
                    >
                      <Eye size={14} /> Ver JSON
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div style={styles.footer}>
          <Pagination 
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>
    </div>
  );
};

const Eye = ({ size }: { size: number }) => <FileText size={size} />;

const styles: Record<string, any> = {
  container: { padding: '0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '29px', fontWeight: '800', color: '#000000', margin: 0 },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  refreshBtn: { width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', color: '#64748B' },
  filterBar: { marginBottom: '24px' },
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '0 16px', borderRadius: '14px', border: '1px solid #E2E8F0' },
  searchInput: { flex: 1, border: 'none', padding: '14px 0', outline: 'none', fontSize: '14px', fontWeight: '500' },
  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' },
  th: { padding: '16px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 24px', fontSize: '14px', color: '#1E293B' },
  timeCell: { display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B', fontWeight: '500' },
  userCell: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#0F172A' },
  tableCell: { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontFamily: 'monospace' },
  actionBadge: { padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
  viewBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748B' },
  loadingTd: { padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '15px' },
  footer: { padding: '16px 24px', borderTop: '1px solid #F1F5F9' }
};

export default AuditLogs;
