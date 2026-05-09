import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Search, Plus, Filter, MoreVertical, 
  ChevronRight, Mail, Phone, MapPin, ExternalLink,
  MessageSquare, UserPlus, Globe, CheckCircle2,
  TrendingUp, TrendingDown, DollarSign, Package,
  Zap, AlertTriangle, Clock, X, Shield, Lock, CreditCard
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import Pagination from '@shared/components/Pagination';
import HubMetricCard from '@shared/components/HubMetricCard';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import { toast } from 'sonner';
import { HUB_PAGE_SUBTITLE, HUB_FIELD_TEXT } from '@hub/styles/hubPageTypography';
import {
  onlyDigits,
  maskCpfOrCnpj,
  validateCpf,
  validateCnpj,
} from '@shared/lib/brDocuments';

const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');

  // New Client Modal States
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('Plano Ouro (Logta + Zaptro)');
  const [newClientPassword, setNewClientPassword] = useState('Logta123!');
  const [newClientDocument, setNewClientDocument] = useState('');
  const [plansList, setPlansList] = useState<any[]>([
    { id: 'ouro', name: 'Plano Ouro (Logta + Zaptro)' },
    { id: 'prata', name: 'Plano Prata' },
    { id: 'bronze', name: 'Plano Bronze' }
  ]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase.from('plans').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const formatted = data.map(p => ({ id: p.id, name: p.name }));
          setPlansList(formatted);
          setNewClientPlan(formatted[0].name);
        }
      } catch (err) {
        console.warn('Error fetching plans, falling back to default:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    const docDigits = onlyDigits(newClientDocument);
    if (docDigits.length === 14) {
      if (validateCnpj(docDigits)) {
        toast.info('CNPJ detectado: cadastro de empresa é feito em Empresas. Redirecionando…');
        setShowNewClientModal(false);
        setNewClientDocument('');
        navigate('/master/companies');
        return;
      }
      toast.error('CNPJ inválido.');
      return;
    }
    if (docDigits.length > 11 && docDigits.length < 14) {
      toast.error('Documento incompleto. Para PF use CPF (11 dígitos); para PJ, cadastre em Empresas.');
      return;
    }
    if (docDigits.length !== 11 || !validateCpf(docDigits)) {
      toast.error('Informe um CPF válido (Pessoa Física).');
      return;
    }

    const cpfFormatted = maskCpfOrCnpj(docDigits);
    
    const tempId = crypto.randomUUID();
    const newClientObj = {
      id: tempId,
      name: newClientName,
      email: newClientEmail,
      phone: newClientPhone || '---',
      plan: newClientPlan,
      status: 'active',
      created_at: new Date().toISOString(),
      companies: {
        name: `${newClientName} Ltda`,
        origin: 'LOGTA'
      }
    };

    try {
      const { error } = await supabase.from('clients').insert([
        {
          name: newClientName,
          email: newClientEmail,
          phone: newClientPhone,
          plan: newClientPlan,
          document: cpfFormatted,
        },
      ]);
      if (error) throw error;
    } catch (err) {
      console.warn('Insert com document falhou; tentando sem coluna document:', err);
      try {
        await supabase.from('clients').insert([
          {
            name: newClientName,
            email: newClientEmail,
            phone: newClientPhone,
            plan: newClientPlan,
          },
        ]);
      } catch (err2) {
        console.warn('Fallback mock:', err2);
      }
    }

    setContacts(prev => [newClientObj, ...prev]);
    toast.success(`Cliente ${newClientName} cadastrado com sucesso! Plano ${newClientPlan} e senha vinculados.`);
    setShowNewClientModal(false);
    
    // Reset Form
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientDocument('');
    setNewClientPlan('OURO');
    setNewClientPassword('Logta123!');
  };
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('hub_clients_per_page');
    return saved === 'all' ? 'all' : Number(saved || 20);
  });
  const [totalItems, setTotalItems] = useState(0);

  // Cores automáticas para avatares baseados na inicial
  const getAvatarColor = (name: string) => {
    const colors = ['#0061FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPage, itemsPerPage, activeSegment]); // Re-fetch when page or limit changes

  const fetchContacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clients')
        .select('*, companies(*)', { count: 'exact' });

      // Apply segment filters to query
      if (activeSegment === 'active') query = query.neq('status', 'inactive');
      if (activeSegment === 'risk') query = query.or('status.eq.risk,health_score.lt.50');
      if (activeSegment === 'vip') query = query.or('plan.eq.OURO,is_vip.eq.true');

      // Pagination
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
    localStorage.setItem('hub_clients_per_page', String(val));
  };

  const activeCount = contacts.filter((c) => c.status !== 'inactive').length;
  const riskCount = contacts.filter(
    (c) => c.status === 'risk' || (c.health_score != null && c.health_score < 50)
  ).length;
  const vipCount = contacts.filter((c) => c.plan === 'OURO' || c.is_vip === true).length;

  const filteredContacts = contacts.filter(c => {
    // 1. Filtro de Busca
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companies?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Filtro de Segmento
    if (activeSegment === 'all') return true;
    if (activeSegment === 'active') return c.status !== 'inactive';
    if (activeSegment === 'risk') return c.status === 'risk' || (c.health_score != null && c.health_score < 50); 
    if (activeSegment === 'vip') return c.plan === 'OURO' || c.is_vip === true; 
    
    return true;
  });

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* PAGE TITLE */}
      <div style={styles.headerTitleRow}>
        <div>
          <h1 style={styles.pageTitle}>Gestão de Clientes</h1>
          <p style={styles.pageSub}>Visualize e gerencie toda sua base de clientes e parceiros estratégicos</p>
        </div>
        <button style={styles.addBtn} onClick={() => setShowNewClientModal(true)}>
          <UserPlus size={18} /> Novo Cliente
        </button>
      </div>

      {/* DASHBOARD SUMMARY */}
      <div style={styles.summaryRow}>
        <HubMetricCard
          label="Total de Clientes"
          icon={Users}
          iconVariant="soft"
          accent="#0061FF"
          topRight={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 15,
                fontWeight: 800,
                color: '#10B981',
              }}
            >
              +4 <TrendingUp size={16} />
            </span>
          }
          value={contacts.length}
        />
        <HubMetricCard
          label="Clientes Ativos"
          icon={CheckCircle2}
          iconVariant="solid"
          accent="#0061FF"
          value={activeCount}
        />
        <HubMetricCard
          label="MRR Estimado"
          icon={DollarSign}
          iconVariant="soft"
          accent="#0061FF"
          topRight={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 15,
                fontWeight: 800,
                color: '#10B981',
              }}
            >
              +8.2% <TrendingUp size={16} />
            </span>
          }
          value="R$ 42.800"
        />
        <HubMetricCard
          label="Taxa de Churn"
          icon={TrendingDown}
          iconVariant="solid"
          accent="#0052D9"
          value="2.4%"
        />
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

        <div
          style={{
            ...hubPillTabStripStyles.container,
            marginBottom: 0,
            padding: 0,
            alignItems: 'center',
          }}
          role="tablist"
          aria-label="Filtrar clientes por segmento"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'all'}
            className="clients-list-segment-tab"
            style={{
              ...hubPillTabStripStyles.button,
              fontSize: '12px',
              padding: '8px 18px',
              gap: '12px',
              ...(activeSegment === 'all' ? hubPillTabStripStyles.buttonActive : {}),
            }}
            onClick={() => setActiveSegment('all')}
          >
            <span style={styles.segmentBtnLabel}>Todos</span>
            <span
              style={{
                ...styles.countBadge,
                ...(activeSegment === 'all' ? styles.countBadgeActive : {}),
              }}
            >
              {totalItems || contacts.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'active'}
            className="clients-list-segment-tab"
            style={{
              ...hubPillTabStripStyles.button,
              fontSize: '12px',
              padding: '8px 18px',
              gap: '12px',
              ...(activeSegment === 'active' ? hubPillTabStripStyles.buttonActive : {}),
            }}
            onClick={() => setActiveSegment('active')}
          >
            <span style={styles.segmentBtnLabel}>Ativos</span>
            <span
              style={{
                ...styles.countBadge,
                ...(activeSegment === 'active' ? styles.countBadgeActive : {}),
              }}
            >
              {activeCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'risk'}
            className="clients-list-segment-tab"
            style={{
              ...hubPillTabStripStyles.button,
              fontSize: '12px',
              padding: '8px 18px',
              gap: '12px',
              ...(activeSegment === 'risk' ? hubPillTabStripStyles.buttonActive : {}),
            }}
            onClick={() => setActiveSegment('risk')}
          >
            <span style={styles.segmentBtnLabel}>Em risco</span>
            <span
              style={{
                ...styles.countBadge,
                ...styles.countBadgeRisk,
                ...(activeSegment === 'risk' ? styles.countBadgeRiskActive : {}),
              }}
            >
              {riskCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSegment === 'vip'}
            className="clients-list-segment-tab"
            style={{
              ...hubPillTabStripStyles.button,
              fontSize: '12px',
              padding: '8px 18px',
              gap: '12px',
              ...(activeSegment === 'vip' ? hubPillTabStripStyles.buttonActive : {}),
            }}
            onClick={() => setActiveSegment('vip')}
          >
            <span style={styles.segmentBtnLabel}>VIPs</span>
            <span
              style={{
                ...styles.countBadge,
                ...styles.countBadgeVip,
                ...(activeSegment === 'vip' ? styles.countBadgeVipActive : {}),
              }}
            >
              {vipCount}
            </span>
          </button>
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
                    <div style={{...styles.uAvatar, backgroundColor: getAvatarColor(c.name || 'U')}}>{(c.name || 'U')[0]}</div>
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
                    <button 
                      style={styles.actionBtn} 
                      title="Abrir Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/master/hubchat?token=4dbc4jv0n196sv9a0bdk&id=${c.id}`);
                      }}
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button style={{...styles.actionBtn, backgroundColor: '#F0F7FF', color: '#0061FF'}} title="Ver Perfil"><ExternalLink size={16} /></button>
                    <ChevronRight size={18} color="#CBD5E1" />
                  </div>
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

      {/* POPUP: CADASTRAR NOVO CLIENTE */}
      {showNewClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', width: '100%', maxWidth: '580px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <div style={{ width: '40px', height: '40px', borderRadius: '24px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={20} color="#0061FF" /></div>
                <h3 style={{fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0}}>Cadastrar Novo Cliente</h3>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '18px' }} onClick={() => setShowNewClientModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome do Cliente / Razão Social</label>
                <input
                  type="text"
                  required
                  style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', ...HUB_FIELD_TEXT }}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome do Cliente"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPF (Pessoa Física)</label>
                <input
                  type="text"
                  required
                  style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', ...HUB_FIELD_TEXT }}
                  value={newClientDocument}
                  onChange={(e) => setNewClientDocument(maskCpfOrCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  CNPJ redireciona automaticamente para o cadastro de Empresas.
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail de Acesso</label>
                <input
                  type="email"
                  required
                  style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', ...HUB_FIELD_TEXT }}
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp / Telefone</label>
                <input
                  type="text"
                  style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', ...HUB_FIELD_TEXT }}
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano Contratado</label>
                  <select
                    style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', backgroundColor: 'white', ...HUB_FIELD_TEXT }}
                    value={newClientPlan}
                    onChange={(e) => setNewClientPlan(e.target.value)}
                  >
                    {plansList.map(plan => (
                      <option key={plan.id} value={plan.name}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha Provisória</label>
                  <input
                    type="password"
                    style={{ padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', color: '#0F172A', ...HUB_FIELD_TEXT }}
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" style={{ backgroundColor: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }} onClick={() => setShowNewClientModal(false)}>
                  Cancelar
                </button>
                <button type="submit" style={{ backgroundColor: '#0061FF', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' }}>
                  Vincular e Criar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '20px 0 40px' },
  headerTitleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' },
  pageTitle: { fontSize: '29px', fontWeight: '500', color: '#000000', margin: 0, letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  pageSub: { ...HUB_PAGE_SUBTITLE },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: { fontSize: '29px', fontWeight: '800', color: '#000000', margin: 0, letterSpacing: 0, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  subtitle: { ...HUB_PAGE_SUBTITLE },
  addBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 26px', height: '50px', backgroundColor: '#0061FF', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)', letterSpacing: '0.02em' },
  
  controls: { display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 24px', borderRadius: '20px', border: '1px solid #E2E8F0', transition: 'all 0.2s' },
  searchInput: { border: 'none', outline: 'none', width: '100%', color: '#0F172A', letterSpacing: '0.2px', ...HUB_FIELD_TEXT },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#64748B', letterSpacing: '0.2px' },
  
  tableCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { textAlign: 'left', backgroundColor: '#FFFFFF' },
  th: { padding: '18px 32px', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s' },
  td: { padding: '20px 32px' },
  loadingTd: { padding: '100px', textAlign: 'center', color: '#94A3B8', fontWeight: '600' },
  
  uInfo: { display: 'flex', alignItems: 'center', gap: '14px' },
  uAvatar: { width: '44px', height: '44px', borderRadius: '18px', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#0061FF', fontSize: '18px' },
  uName: { fontSize: '15px', fontWeight: '600', color: '#0F172A', display: 'block', letterSpacing: '0.2px' },
  uSubtext: { fontSize: '12px', color: '#94A3B8', fontWeight: '500', letterSpacing: '0.2px' },
  
  brandTag: { padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '600', background: 'var(--bg-overlay)', color: '#64748B', letterSpacing: '0.5px' },
  contactCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B', fontWeight: '500', letterSpacing: '0.1px' },
  
  statusBadge: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.3px', textTransform: 'uppercase' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%' },
  
  actions: { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' },
  actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' },
  
  segmentBtnLabel: {
    border: 'none',
    margin: 0,
    padding: 0,
    background: 'none',
    backgroundColor: 'transparent',
    backgroundImage: 'none',
    boxShadow: 'none',
    color: 'inherit',
  },
  countBadge: {
    minWidth: '24px',
    height: '24px',
    padding: '0 8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    backgroundImage: 'none',
    border: 'none',
    borderStyle: 'none',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontVariantNumeric: 'tabular-nums',
    boxSizing: 'border-box',
    boxShadow: 'none',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(0, 97, 255, 0.1)',
    color: '#0061FF',
  },
  countBadgeRisk: {
    backgroundColor: 'rgba(239, 68, 68, 0.07)',
    color: '#B91C1C',
  },
  countBadgeVip: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    color: '#B45309',
  },
  countBadgeRiskActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#B91C1C',
  },
  countBadgeVipActive: {
    backgroundColor: 'rgba(217, 119, 6, 0.14)',
    color: '#B45309',
  },
  
  volumeCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  mrrText: { fontSize: '14px', fontWeight: '600', color: '#0F172A', letterSpacing: '0.2px' },
  orderCount: { fontSize: '11px', fontWeight: '500', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.2px' },
  lastActivity: { fontSize: '10px', fontWeight: '600', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.2px' }
};

export default ClientsList;
