import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, User, FileText, 
  ArrowRight, Filter, Download, 
  Eye, Zap, RefreshCw, Search,
  Calendar
} from 'lucide-react';
import { supabase } from '@shared/lib/supabase';
import { useAuth } from '@shared/context/AuthContext';

const UserInteractions: React.FC = () => {
  const { user, profile } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      fetchActivities();
    }
  }, [user, profile]);

  const fetchActivities = async () => {
    try {
      // Simulating real activity fetch from file_logs / interactions table
      const { data, error } = await supabase
        .from('file_logs')
        .select('*')
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        // Fallback for demo if table doesn't exist
        const mockData = [
          { id: 1, type: 'upload', file_name: 'Comprovante_Frete_092.pdf', user_name: 'Alison Thiago', created_at: new Date().toISOString() },
          { id: 2, type: 'automation', file_name: 'Video_Treinamento.mov', action: 'Conversão para MP4', created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: 3, type: 'view', file_name: 'Relatorio_Mensal.xlsx', user_name: 'Equipe Financeira', created_at: new Date(Date.now() - 7200000).toISOString() },
          { id: 4, type: 'download', file_name: 'Contrato_Zaptro.zip', user_name: 'Cliente Alpha', created_at: new Date(Date.now() - 86400000).toISOString() },
        ];
        setActivities(mockData);
      } else {
        setActivities(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Download size={16} color="#0061FF" />;
      case 'automation': return <Zap size={16} color="#F59E0B" />;
      case 'view': return <Eye size={16} color="#10B981" />;
      case 'download': return <FileText size={16} color="#6366F1" />;
      default: return <Activity size={16} color="#94A3B8" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'upload': return 'Novo Arquivo';
      case 'automation': return 'Automação';
      case 'view': return 'Visualização';
      case 'download': return 'Download';
      default: return 'Atividade';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Interações</h1>
          <p style={styles.subtitle}>Acompanhe em tempo real tudo o que acontece com seus documentos logísticos.</p>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94A3B8" />
            <input type="text" placeholder="Filtrar atividades..." style={styles.searchInput} />
          </div>
          <button style={styles.filterBtn}><Filter size={18} /> Filtros</button>
        </div>
      </div>

      <div style={styles.timeline}>
        {loading ? (
          <div style={styles.loadingBox}><RefreshCw size={24} className="animate-spin" color="#0061FF" /></div>
        ) : activities.length === 0 ? (
          <div style={styles.emptyState}>Nenhuma atividade registrada.</div>
        ) : (
          activities.map((act, index) => (
            <div key={act.id} style={styles.timelineItem}>
              <div style={styles.timelineSidebar}>
                <div style={styles.timeLabel}>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div style={styles.timelineLine} />
              </div>
              
              <div style={styles.activityCard}>
                <div style={styles.cardIcon}>{getIcon(act.type)}</div>
                <div style={styles.cardContent}>
                  <div style={styles.cardHeader}>
                    <span style={styles.activityLabel}>{getLabel(act.type)}</span>
                    <span style={styles.activityTime}>{new Date(act.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.activityDesc}>
                    <strong>{act.user_name || 'Sistema'}</strong> {act.type === 'automation' ? `executou: ${act.action}` : `interagiu com`} 
                    <span style={styles.fileName}>{act.file_name}</span>
                  </div>
                </div>
                <button style={styles.viewBtn}><ArrowRight size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px', backgroundColor: '#F8F9FA', minHeight: '100vh', animation: 'fadeIn 0.5s ease-out' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1E1E1E', marginBottom: '8px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '15px', color: '#64748B', fontWeight: '500' },
  headerActions: { display: 'flex', gap: '12px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', backgroundColor: '#FFF', borderRadius: '14px', border: '1px solid #E2E8F0', width: '280px' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: '14px', color: '#1E1E1E', width: '100%' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#FFF', color: '#1E1E1E', border: '1px solid #E2E8F0', borderRadius: '14px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },

  timeline: { display: 'flex', flexDirection: 'column', paddingLeft: '20px' },
  timelineItem: { display: 'flex', gap: '24px', minHeight: '100px' },
  timelineSidebar: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' },
  timeLabel: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', marginBottom: '8px' },
  timelineLine: { width: '2px', flex: 1, backgroundColor: '#E2E8F0', borderRadius: '1px' },

  activityCard: { flex: 1, backgroundColor: '#FFF', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px', transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' },
  cardIcon: { width: '48px', height: '48px', backgroundColor: '#F1F5F9', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  activityLabel: { fontSize: '11px', fontWeight: '900', color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  activityTime: { fontSize: '12px', color: '#94A3B8' },
  activityDesc: { fontSize: '14px', color: '#1E1E1E', lineHeight: '1.4' },
  fileName: { color: '#0061FF', fontWeight: '700', marginLeft: '6px' },
  viewBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' },

  loadingBox: { padding: '80px', display: 'flex', justifyContent: 'center' },
  emptyState: { padding: '40px', textAlign: 'center' as const, color: '#94A3B8', fontSize: '14px' }
};

export default UserInteractions;
