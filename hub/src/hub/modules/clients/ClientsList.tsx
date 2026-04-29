import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Filter, MoreVertical, 
  ChevronRight, Mail, Phone, MapPin, ExternalLink,
  MessageSquare, UserPlus, Globe, CheckCircle2,
  TrendingUp, TrendingDown, DollarSign, Package,
  Zap, AlertTriangle, Sparkles, Clock
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';

const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');

  // Cores automáticas para avatares baseados na inicial
  const getAvatarColor = (name: string) => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, companies(*)')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    // 1. Filtro de Busca
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Filtro de Segmento
    if (activeSegment === 'all') return true;
    if (activeSegment === 'active') return c.status !== 'inactive';
    if (activeSegment === 'risk') return c.status === 'risk' || (c.health_score && c.health_score < 50); 
    if (activeSegment === 'vip') return c.plan === 'OURO' || c.is_vip === true; 
    
    return true;
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* PAGE TITLE */}
      <div style={styles.headerTitleRow}>
        <h1 style={styles.pageTitle}>Gestão de Clientes</h1>
        <p style={styles.pageSub}>Visualize e gerencie toda sua base de clientes e parceiros estratégicos</p>
      </div>

      <header style={styles.header}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            style={{...styles.segmentBtn, ...(activeSegment === 'all' ? styles.activeSegment : {})}}
            onClick={() => setActiveSegment('all')}
          >Todos <span style={styles.countBadge}>{contacts.length}</span></button>
          <button 
            style={{...styles.segmentBtn, ...(activeSegment === 'active' ? styles.activeSegment : {})}}
            onClick={() => setActiveSegment('active')}
          >Ativos <span style={styles.countBadge}>{contacts.filter(c => c.status !== 'inactive').length}</span></button>
          <button 
            style={{...styles.segmentBtn, ...(activeSegment === 'risk' ? styles.activeSegment : {})}}
            onClick={() => setActiveSegment('risk')}
          >Em Risco <span style={styles.countBadge}>3</span></button>
          <button 
            style={{...styles.segmentBtn, ...(activeSegment === 'vip' ? styles.activeSegment : {})}}
            onClick={() => setActiveSegment('vip')}
          >VIPs <span style={styles.countBadge}>8</span></button>
        </div>
        <button style={styles.addBtn} onClick={() => navigate('/master/crm?tab=pipeline')}>
          <UserPlus size={18} /> Novo Cliente
        </button>
      </header>

      {/* DASHBOARD SUMMARY */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#EEF2FF'}}><Users size={20} color="#6366F1" /></div>
          <div>
            <p style={styles.summaryLabel}>Total de Clientes</p>
            <h3 style={styles.summaryValue}>{contacts.length}</h3>
          </div>
          <div style={{...styles.trendTag, color: '#10B981'}}>+4 <TrendingUp size={12} /></div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#ECFDF5'}}><CheckCircle2 size={20} color="#10B981" /></div>
          <div>
            <p style={styles.summaryLabel}>Clientes Ativos</p>
            <h3 style={styles.summaryValue}>{contacts.filter(c => c.status !== 'inactive').length}</h3>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#FFF7ED'}}><DollarSign size={20} color="#F59E0B" /></div>
          <div>
            <p style={styles.summaryLabel}>MRR Estimado</p>
            <h3 style={styles.summaryValue}>R$ 42.800</h3>
          </div>
          <div style={{...styles.trendTag, color: '#10B981'}}>+8.2% <TrendingUp size={12} /></div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#FEF2F2'}}><TrendingDown size={20} color="#EF4444" /></div>
          <div>
            <p style={styles.summaryLabel}>Taxa de Churn</p>
            <h3 style={styles.summaryValue}>2.4%</h3>
          </div>
        </div>
      </div>

      {/* AI INSIGHT BANNER */}
      <div style={styles.aiBanner}>
        <div style={styles.aiIconBox}><Sparkles size={20} color="white" /></div>
        <div style={{flex: 1}}>
          <h4 style={styles.aiTitle}>Inteligência de Base</h4>
          <p style={styles.aiText}>Detectamos <b>3 clientes</b> com queda de atividade superior a 30% nos últimos 7 dias. Recomendamos contato preventivo.</p>
        </div>
        <button style={styles.aiActionBtn}>Ver Detalhes</button>
      </div>

      {/* CONTROLS */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94A3B8" />
          <input 
            type="text" 
            placeholder="Buscar por nome, email ou empresa..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button style={styles.filterBtn}><Filter size={18} /> Filtros</button>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>CLIENTE / EMPRESA</th>
              <th style={styles.th}>VOLUME / MRR</th>
              <th style={styles.th}>CONTATO</th>
              <th style={styles.th}>SAÚDE / STATUS</th>
              <th style={{...styles.th, textAlign: 'right'}}>AÇÕES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={styles.loadingTd}>Carregando base de clientes...</td></tr>
            ) : filteredContacts.length === 0 ? (
              <tr><td colSpan={5} style={styles.loadingTd}>Nenhum cliente encontrado.</td></tr>
            ) : filteredContacts.map((c, i) => (
              <tr key={i} style={styles.tr} onClick={() => navigate(`/master/clientes/${c.id}`)}>
                <td style={styles.td}>
                  <div style={styles.uInfo}>
                    <div style={{...styles.uAvatar, backgroundColor: getAvatarColor(c.name)}}>{c.name[0]}</div>
                    <div>
                      <strong style={styles.uName}>{c.name}</strong>
                      <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        <span style={styles.brandTag}>{c.companies?.origin?.toUpperCase() || 'LOGTA'}</span>
                        <div style={styles.uSubtext}>{c.companies?.name || 'Pessoa Física'}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.volumeCell}>
                    <div style={styles.mrrText}>R$ 497,00</div>
                    <div style={styles.orderCount}><Package size={12} /> 124 pedidos</div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.contactCell}>
                    <span style={styles.contactItem}><Mail size={12} /> {c.email || 'N/A'}</span>
                    <span style={styles.contactItem}><Phone size={12} /> {c.phone || '---'}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                    <div style={{...styles.statusBadge, color: i % 5 === 0 ? '#EF4444' : '#10B981'}}>
                      <div style={{...styles.statusDot, backgroundColor: i % 5 === 0 ? '#EF4444' : '#10B981'}} /> 
                      {i % 5 === 0 ? 'Em Risco' : 'Engajado'}
                    </div>
                    <div style={styles.lastActivity}><Clock size={10} /> há 2 dias</div>
                  </div>
                </td>
                <td style={{...styles.td, textAlign: 'right'}}>
                  <div style={styles.actions}>
                    <button style={styles.actionBtn} title="Abrir Chat"><MessageSquare size={16} /></button>
                    <button style={{...styles.actionBtn, backgroundColor: '#EEF2FF', color: '#6366F1'}} title="Ver Perfil"><ExternalLink size={16} /></button>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '20px 0 40px' },
  headerTitleRow: { marginBottom: '32px' },
  pageTitle: { fontSize: '28px', fontWeight: '500', color: '#0F172A', margin: 0, letterSpacing: '0.4px' },
  pageSub: { fontSize: '14px', color: '#94A3B8', fontWeight: '400', marginTop: '4px', letterSpacing: '0.2px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '32px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1.5px' },
  subtitle: { color: '#64748B', fontSize: '15px', fontWeight: '500' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px', height: '46px', backgroundColor: '#6366F1', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)', letterSpacing: '0.3px' },
  
  controls: { display: 'flex', gap: '16px', marginBottom: '24px' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', transition: 'all 0.2s' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '500', color: '#0F172A', letterSpacing: '0.2px' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B', letterSpacing: '0.2px' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { textAlign: 'left', backgroundColor: '#F4F4F4' },
  th: { padding: '18px 32px', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #F4F4F4', cursor: 'pointer', transition: 'background 0.2s' },
  td: { padding: '20px 32px' },
  loadingTd: { padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' },
  
  uInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  uAvatar: { width: '44px', height: '44px', borderRadius: '18px', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#6366F1', fontSize: '18px' },
  uName: { fontSize: '15px', fontWeight: '600', color: '#0F172A', display: 'block', letterSpacing: '0.2px' },
  uSubtext: { fontSize: '12px', color: '#94A3B8', fontWeight: '500', letterSpacing: '0.2px' },
  
  brandTag: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '600', background: '#F4F4F4', color: '#64748B', letterSpacing: '0.5px' },
  contactCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: '500', letterSpacing: '0.1px' },
  
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  
  actions: { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' },
  actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  summaryCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' },
  summaryIcon: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: '11px', fontWeight: '600', color: '#94A3B8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' },
  summaryValue: { fontSize: '24px', fontWeight: '500', color: '#0F172A', margin: '4px 0 0 0', letterSpacing: '0.2px' },
  trendTag: { position: 'absolute', top: '24px', right: '24px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.2px' },
  
  aiBanner: { backgroundColor: '#1F2937', borderRadius: '24px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  aiIconBox: { width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  aiTitle: { color: 'white', fontSize: '14px', fontWeight: '600', margin: 0, letterSpacing: '0.3px' },
  aiText: { color: '#94A3B8', fontSize: '13px', margin: '2px 0 0 0', fontWeight: '400', letterSpacing: '0.1px' },
  aiActionBtn: { padding: '8px 16px', borderRadius: '12px', border: '1px solid #374151', backgroundColor: 'transparent', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', letterSpacing: '0.3px' },
  
  segmentBtn: { padding: '10px 16px', borderRadius: '14px', border: 'none', background: 'transparent', color: '#64748B', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  activeSegment: { backgroundColor: '#F1F5F9', color: '#6366F1' },
  countBadge: { padding: '2px 8px', borderRadius: '8px', backgroundColor: 'white', border: '1px solid #E2E8F0', fontSize: '10px', color: '#94A3B8' },
  
  volumeCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  mrrText: { fontSize: '14px', fontWeight: '600', color: '#0F172A', letterSpacing: '0.2px' },
  orderCount: { fontSize: '11px', fontWeight: '500', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.2px' },
  lastActivity: { fontSize: '10px', fontWeight: '600', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.2px' }
};

export default ClientsList;
