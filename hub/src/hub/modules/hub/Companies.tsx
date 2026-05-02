import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Search, Filter, MoreVertical, 
  CheckCircle, ShieldAlert, Edit2, ExternalLink,
  ChevronRight, ArrowUpRight, DollarSign, Users,
  Globe, Mail, Phone, Plus, X, Save, Settings,
  Activity, CreditCard, Lock, History, UserPlus,
  ArrowDownRight, TrendingUp, Briefcase, Eye,
  Pause, Trash2, RefreshCw, Layers, GraduationCap, Zap
} from 'lucide-react';
import SyncIndicator from '../../components/SyncIndicator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell
} from 'recharts';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import LogtaModal from '@shared/components/Modal';
import Pagination from '@shared/components/Pagination';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import type { Company, Profile } from '@core/types';

// Mock data for charts if DB doesn't have enough history
const growthData = [
  { month: 'Jan', companies: 4 },
  { month: 'Fev', companies: 7 },
  { month: 'Mar', companies: 12 },
  { month: 'Abr', companies: 18 },
];

const CompanyManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, impersonate } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [companyRoutes, setCompanyRoutes] = useState<any[]>([]);
  const [companyVehicles, setCompanyVehicles] = useState<any[]>([]);
  const [companyWhatsApp, setCompanyWhatsApp] = useState<any[]>([]);
  const [companyPayments, setCompanyPayments] = useState<any[]>([]);
  const [companyIntegrations, setCompanyIntegrations] = useState<any[]>([]);
  const [companyLogs, setCompanyLogs] = useState<any[]>([]);
  const [companySecurityLogs, setCompanySecurityLogs] = useState<any[]>([]);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'operacao' | 'comunicacao' | 'usuarios' | 'financeiro' | 'integracoes' | 'logs' | 'acoes'>('geral');
  const [saving, setSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(() => {
    const saved = localStorage.getItem('hub_companies_per_page');
    return saved === 'all' ? 'all' : Number(saved || 20);
  });
  const [totalItems, setTotalItems] = useState(0);

  const [newCompany, setNewCompany] = useState({
    name: '',
    subdomain: '',
    plan: 'BRONZE' as Company['plan'],
    email: '',
    phone: '',
    cnpj: ''
  });

  const [currentFilter, setCurrentFilter] = useState<'todas' | 'ativas' | 'erros' | 'novas' | 'billing'>('todas');

  const logMasterAction = async (action: string, details: string, targetType: string = 'COMPANY', metadata: any = {}) => {
    try {
      if (!profile) return;
      
      const { error } = await supabase
        .from('master_audit_logs')
        .insert([{
          actor_id: profile.id,
          action: action,
          details: details,
          target_type: targetType,
          metadata: {
            ...metadata,
            ip_context: 'HUB_COMMAND_CENTER',
            browser: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        }]);

      if (error) console.error('Audit Error:', error);
    } catch (err) {
      console.error('Failed to log master action:', err);
    }
  };

  const handleUpdateCompanyStatus = async (companyId: string, newStatus: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', companyId);

      if (error) throw error;

      await logMasterAction(
        'STATUS_CHANGE', 
        `Instância alterada para ${newStatus}`, 
        'COMPANY', 
        { company_id: companyId, new_status: newStatus }
      );

      toastSuccess(`Status atualizado para ${newStatus}`);
      fetchData(); // Refresh list
      if (selectedCompany?.id === companyId) {
        setSelectedCompany({ ...selectedCompany, status: newStatus });
      }
    } catch (error: any) {
      toastError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async (companyId: string) => {
    try {
      await logMasterAction('IMPERSONATION', `Entrada em modo master na empresa ${companyId}`, 'AUTH');
      
      // Store current context for return
      localStorage.setItem('hub_master_return', 'true');
      localStorage.setItem('hub_original_profile', JSON.stringify(profile));
      
      // Target impersonation
      localStorage.setItem('logta-auth-token', companyId); // Shared storage key
      localStorage.setItem('logta-impersonated-company', companyId);
      
      toastSuccess('Modo Master Ativado. Redirecionando...');
      setTimeout(() => {
        window.location.href = `/app/inicio?impersonate=${companyId}`;
      }, 1500);
    } catch (error: any) {
      toastError('Erro ao assumir controle');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('companies')
        .select('*', { count: 'exact' });

      // Pagination
      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
      setTotalItems(count || 0);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
    localStorage.setItem('hub_companies_per_page', String(val));
  };

  const fetchCompanySpecificData = async (companyId: string) => {
    try {
      const [uRes, rRes, vRes, wRes, iRes, pRes, lRes, sRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('company_id', companyId),
        supabase.from('routes').select('*, driver:motoristas(nome), vehicle:vehicles(plate)').eq('company_id', companyId).limit(5),
        supabase.from('vehicles').select('*').eq('company_id', companyId),
        supabase.from('whatsapp_instances').select('*').eq('company_id', companyId),
        supabase.from('integrations').select('*').eq('company_id', companyId),
        supabase.from('master_payments').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
        supabase.from('audit_log').select('*, profiles:actor_id(full_name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
        supabase.from('security_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10),
         supabase.from('automation_logs').select('*').limit(10)
      ]);

      if (uRes.data) setCompanyUsers(uRes.data);
      if (rRes.data) setCompanyRoutes(rRes.data);
      if (vRes.data) setCompanyVehicles(vRes.data);
      if (wRes.data) setCompanyWhatsApp(wRes.data);
      if (iRes.data) setCompanyIntegrations(iRes.data);
      if (pRes.data) setCompanyPayments(pRes.data);
      if (lRes.data) setCompanyLogs(lRes.data);
      if (sRes.data) setCompanySecurityLogs(sRes.data);
      if (vRes.data) setAutomationLogs(vRes.data);
      
      // Calculate mini metrics
      setCompanyMetrics({
        routes: rRes.data?.length || 0,
        vehicles: vRes.data?.length || 0,
        drivers: new Set(rRes.data?.map(r => r.driver_id)).size || 0,
        whatsapp_active: wRes.data?.filter(i => i.status === 'open').length || 0,
        integrations_active: iRes.data?.filter(i => i.status === 'active').length || 0,
        total_billed: pRes.data?.filter(p => p.status === 'received' || p.status === 'pago').reduce((acc, p) => acc + parseFloat(p.amount), 0) || 0
      });

    } catch (err) {
      console.error('Error fetching company details:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ATIVO' ? 'SUSPENSO' : 'ATIVO';
    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await logMasterAction('STATUS_CHANGE', `Status alterado de ${currentStatus} para ${newStatus}`, id);
      toastSuccess(`Instância ${newStatus === 'ATIVO' ? 'ativada' : 'suspensa'} com sucesso!`);
      fetchData();
    } catch (err) {
      toastError('Erro ao alterar status da empresa');
    }
  };
  const toggleModule = async (companyId: string, moduleKey: string) => {
    if (!selectedCompany) return;
    const currentModules = selectedCompany.settings?.modules || [];
    const newModules = currentModules.includes(moduleKey)
      ? currentModules.filter((m: string) => m !== moduleKey)
      : [...currentModules, moduleKey];
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          settings: {
            ...selectedCompany.settings,
            modules: newModules
          }
        })
        .eq('id', companyId);
      if (error) throw error;
      toastSuccess('Permissões da instância atualizadas!');
      setSelectedCompany({
        ...selectedCompany,
        settings: { ...selectedCompany.settings, modules: newModules }
      });
      fetchData();
    } catch (err) {
      toastError('Falha ao atualizar módulos');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toastLoading('Iniciando instância Master...');
    
    try {
      const companyId = crypto.randomUUID();
      const { error } = await supabase
        .from('companies')
        .insert([{
          id: companyId,
          name: newCompany.name,
          subdomain: newCompany.subdomain.toLowerCase(),
          plan: newCompany.plan,
          status: 'active',
          settings: {
            cnpj: newCompany.cnpj,
            email: newCompany.email,
            phone: newCompany.phone,
            modules: ['logistics', 'finance', 'crm'],
            provisioned_at: new Date().toISOString()
          }
        }]);

      if (error) throw error;

      // Autoprovisionamento Master: Criando o perfil de Admin para o cliente
      await supabase.from('profiles').insert([{
        company_id: companyId,
        email: newCompany.email,
        full_name: `Admin ${newCompany.name}`,
        role: 'ADMIN',
        status: 'active'
      }]);

      await logMasterAction('COMPANY_CREATE', `Nova unidade ${newCompany.name} provisionada via Hub Master`, companyId);
      
      toastDismiss(toastId);
      toastSuccess('Nova empresa cadastrada e instância ativa!');
      setIsAddModalOpen(false);
      setNewCompany({ name: '', subdomain: '', plan: 'BRONZE', email: '', phone: '', cnpj: '' });
      fetchData();
    } catch (err: any) {
      toastDismiss(toastId);
      console.error('Erro Master:', err);
      toastError('Falha ao abrir unidade: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async (company: Company) => {
    try {
      await logMasterAction('IMPERSONATE', `Acesso administrativo iniciado (${company.origin})`, company.id);
      impersonate(company.id, company.origin);
    } catch (err) {
      console.error('Erro ao registrar acesso:', err);
      impersonate(company.id, company.origin);
    }
  };

  const openDetails = (company: Company) => {
    navigate(`/master/companies/${company.id}`);
  };

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.settings?.cnpj?.includes(searchTerm);
    
    if (!matchesSearch) return false;

    const statusStr = (c.status || '').toUpperCase();
    
    if (currentFilter === 'todas') return true;
    if (currentFilter === 'ativas') return statusStr === 'ACTIVE' || statusStr === 'ATIVO';
    if (currentFilter === 'erros') return statusStr === 'ERROR' || statusStr === 'INSTÁVEL' || statusStr === 'SUSPENSO';
    if (currentFilter === 'novas') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.created_at || Date.now()) > weekAgo;
    }
    if (currentFilter === 'billing') return c.plan === 'OURO' || c.plan === 'PRATA';
    
    return true;
  });

  const stats = {
    total: companies.length,
    activeCompanies: companies.filter(c => c.status === 'active' || c.status === 'trial').length,
    online: Math.floor(companies.length * 0.8), // Mocked status for now
    criticalErrors: companies.filter(c => c.plan === 'FREE').length, // Using FREE as mock for unstable
    revenue: companies.reduce((acc, c) => {
        const value = c.plan === 'OURO' ? 997 : c.plan === 'PRATA' ? 497 : 197;
        return acc + value;
    }, 0)
  };

  const insights = [
    { type: 'error', text: `${stats.criticalErrors} unidades com instabilidade na Evolution API detectada.` },
    { type: 'info', text: '5 empresas elegíveis para upgrade de plano baseado no uso de IA.' },
    { type: 'success', text: 'Sincronização global de frotas operando com latência de 45ms.' }
  ];

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* PAGE TITLE & ACTION */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Central de Comando Master</h1>
          <p style={styles.pageSub}>Governança global, faturamento e saúde das instâncias Logta & Zaptro.</p>
        </div>
        <div style={styles.headerActions}>
           <button style={styles.refreshBtn} onClick={fetchData}><RefreshCw size={18} /></button>
           <button style={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
             <Plus size={18} /> NOVA UNIDADE
           </button>
        </div>
      </div>

      {/* DASHBOARD MASTER (CONTROL CENTER VERSION) */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#0061FF15'}}>
            <Globe size={20} color="#0061FF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Unidade Global</p>
            <h3 style={styles.statValue}>{stats.total}</h3>
          </div>
          <div style={{...styles.statTrend, color: '#10B981'}}>
            OPERANDO
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#0061FF'}}>
            <Activity size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Online Agora</p>
            <h3 style={styles.statValue}>{stats.online}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#0061FF15'}}>
            <ShieldAlert size={20} color="#0061FF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Erros Críticos</p>
            <h3 style={styles.statValue}>{stats.criticalErrors}</h3>
          </div>
          <div style={{...styles.statTrend, color: '#EF4444'}}>
            ATENÇÃO
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.statIconBox, backgroundColor: '#0052D9'}}>
            <DollarSign size={20} color="#FFFFFF" />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Receita Global (MRR)</p>
            <h3 style={styles.statValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
            </h3>
          </div>
          <div style={{...styles.statTrend, color: '#10B981'}}>
            +4.2% <TrendingUp size={12} />
          </div>
        </div>
      </div>

      {/* DASHBOARD MASTER (CONTROL CENTER VERSION) */}

      {/* SEGMENTATION TABS */}
      <div style={styles.segmentTabs}>
         <button 
           style={{...styles.segmentBtn, ...(currentFilter === 'todas' ? styles.segmentBtnActive : {})}}
           onClick={() => setCurrentFilter('todas')}
         >
           Todas as Operações
         </button>
         <button 
           style={{...styles.segmentBtn, ...(currentFilter === 'ativas' ? styles.segmentBtnActive : {})}}
           onClick={() => setCurrentFilter('ativas')}
         >
           Unidades Ativas
         </button>
         <button 
           style={{...styles.segmentBtn, ...(currentFilter === 'erros' ? styles.segmentBtnActive : {})}}
           onClick={() => setCurrentFilter('erros')}
         >
           Erros & Alertas <span style={styles.tabCounter}>{stats.criticalErrors}</span>
         </button>
         <button 
           style={{...styles.segmentBtn, ...(currentFilter === 'novas' ? styles.segmentBtnActive : {})}}
           onClick={() => setCurrentFilter('novas')}
         >
           Novas Unidades
         </button>
         <button 
           style={{...styles.segmentBtn, ...(currentFilter === 'billing' ? styles.segmentBtnActive : {})}}
           onClick={() => setCurrentFilter('billing')}
         >
           Auto-Faturamento
         </button>
      </div>

      {/* CONTROLS & SEARCH */}
      <div style={styles.controls}>
        <div style={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Nível Google: Buscar por Nome, CNPJ, Domínio, ID ou Telefone..." 
            style={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={styles.controlActions}>
          <button style={styles.filterBtn}><Filter size={18} /> Filtro Granular</button>
          <button style={styles.syncBtn}><RefreshCw size={16} /> Forçar Sync Global</button>
        </div>
      </div>

      {/* MASTER INSTANCE TABLE */}
      <div style={styles.listCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
               <th style={styles.th}>INSTÂNCIA / MASTER</th>
               <th style={styles.th}>SISTEMAS</th>
               <th style={styles.th}>STATUS REAL</th>
               <th style={styles.th}>SAÚDE / MÉTRICAS</th>
               <th style={styles.th}>ÚLTIMA ATIVIDADE</th>
               <th style={{...styles.th, textAlign: 'right'}}>AÇÕES DE COMANDO</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr><td colSpan={6} style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>Arquitetando visualização master...</td></tr>
            ) : filteredCompanies.length === 0 ? (
               <tr><td colSpan={6} style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>Nenhuma unidade detectada na rede.</td></tr>
            ) : filteredCompanies.map(company => (
              <tr 
                key={company.id} 
                style={{...styles.tr, cursor: 'pointer'}} 
                onClick={() => openDetails(company)}
                className="hover-scale"
              >
                <td style={styles.td}>
                   <div style={styles.companyInfo}>
                      <div style={{...styles.avatar, backgroundColor: company.primary_color || '#0061FF'}}>
                        {(company.name || 'U')[0]}
                      </div>
                      <div>
                         <div style={styles.companyName}>{company.name}</div>
                         <div style={styles.subdomainLink}>
                            {company.subdomain || 'padrao'}.logta.app
                         </div>
                         <div style={styles.companyMeta}>ID: {company.id.substring(0,8)} | CNPJ: {company.settings?.cnpj || 'S/ CNPJ'}</div>
                      </div>
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.systemsGrid}>
                      <span style={styles.sysBadgeLogta} title="Logta Operacional"><Layers size={10} /> Logta</span>
                      <span style={styles.sysBadgeZapto} title="Zapto Comunicação"><Phone size={10} /> Zapto</span>
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={{
                      ...styles.statusBadgeMaster,
                      backgroundColor: company.status === 'ATIVO' ? '#ecfdf5' : '#fef2f2',
                      color: company.status === 'ATIVO' ? '#10b981' : '#ef4444'
                   }}>
                      <div style={{...styles.pulseDot, backgroundColor: company.status === 'ATIVO' ? '#10b981' : '#ef4444'}} />
                      {company.status === 'ATIVO' ? 'OPERANDO' : 'INSTÁVEL'}
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.metricsCell}>
                      <div style={styles.mrrValue}>R$ {company.plan === 'OURO' ? '997' : company.plan === 'PRATA' ? '497' : '197'},00</div>
                      <div style={styles.usageBar}><div style={{...styles.usageFill, width: '70%'}} /></div>
                      <div style={styles.usageText}>Uso: 70% (IA + WA)</div>
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.activityCell}>
                      <span style={styles.dateText}>Hoje às 14:30</span>
                      <span style={styles.deviceText}>Desktop / São Paulo</span>
                   </div>
                </td>
                <td style={styles.td}>
                   <div style={styles.actions}>
                      <button 
                         style={styles.actionBtnAdmin} 
                         title="Login como Admin (Impersonate)"
                         onClick={() => handleImpersonate(company)}
                      >
                         <Lock size={14} /> Entrar
                      </button>
                      <button 
                         style={styles.actionBtnView} 
                         title="Visualizar Painel"
                         onClick={() => openDetails(company)}
                      >
                         <Eye size={16} />
                      </button>
                      <button 
                         style={styles.actionBtnConfig} 
                         title="Configurações Master"
                      >
                         <Settings size={16} />
                      </button>
                      <button 
                         style={styles.actionBtnRestart} 
                         title="Reiniciar Integrações"
                      >
                         <RefreshCw size={16} />
                      </button>
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

      {/* MODAL DETALHES EMPRESA */}
      <LogtaModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        size="xl" 
        title={`Gerenciamento: ${selectedCompany?.name}`}
        subtitle="Controle total de infraestrutura, billing e logs de auditoria master."
        icon={<Settings />}
      >
         <div style={styles.modalContent}>
            <div style={styles.modalTabs}>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'geral' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('geral')}
               >
                  <Building2 size={16} /> Visão Geral
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'operacao' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('operacao')}
               >
                  <Layers size={16} /> Operação (Logta)
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'comunicacao' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('comunicacao')}
               >
                  <Phone size={16} /> Comunicação (Zapto)
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'usuarios' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('usuarios')}
               >
                  <Users size={16} /> Colaboradores
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'financeiro' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('financeiro')}
               >
                  <CreditCard size={16} /> Financeiro
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'integracoes' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('integracoes')}
               >
                  <Globe size={16} /> Integrações
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'logs' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('logs')}
               >
                  <History size={16} /> Logs
               </button>
               <button 
                  style={{...styles.tabBtn, ...(activeTab === 'acoes' ? styles.activeTab : {})}}
                  onClick={() => setActiveTab('acoes')}
               >
                  <Zap size={16} /> Ações Avançadas
               </button>
            </div>

            <div style={styles.tabContent}>
               {activeTab === 'geral' && selectedCompany && (
                  <div style={styles.geralContainer}>
                     <div style={styles.geralHeader}>
                        <div style={{...styles.geralAvatar, backgroundColor: selectedCompany.primary_color || '#0061FF'}}>{(selectedCompany.name || 'U')[0]}</div>
                        <div>
                           <h2 style={styles.geralTitle}>{selectedCompany.name}</h2>
                           <div style={styles.geralBadges}>
                              <span style={styles.statusBadgeLive}><div style={styles.statusDot} /> {selectedCompany.status}</span>
                              <span style={styles.planBadgeMaster}>{selectedCompany.plan} PLAN</span>
                           </div>
                        </div>
                     </div>
                     
                     <div style={styles.statsRow}>
                        <div style={styles.statBox}>
                           <div style={styles.statBoxLabel}>Instância Hub</div>
                           <div style={{...styles.statBoxValue, color: selectedCompany?.status === 'active' ? '#10B981' : '#EF4444'}}>
                              {selectedCompany?.status === 'active' ? 'Ativa' : 'Bloqueada'}
                           </div>
                        </div>
                        <div style={styles.statBox}>
                           <div style={styles.statBoxLabel}>Uso de IA</div>
                           <div style={styles.statBoxValue}>84%</div>
                        </div>
                        <div style={styles.statBox}>
                           <div style={styles.statBoxLabel}>Armazenamento</div>
                           <div style={styles.statBoxValue}>{selectedCompany?.storage_limit_gb || 5}GB</div>
                        </div>
                        <div style={styles.statBox}>
                           <div style={styles.statBoxLabel}>Ação Rápida</div>
                           <button 
                              style={{
                                padding: '4px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: selectedCompany?.status === 'active' ? '#FEE2E2' : '#DCFCE7',
                                color: selectedCompany?.status === 'active' ? '#EF4444' : '#10B981',
                                fontSize: '11px',
                                fontWeight: '800',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleUpdateCompanyStatus(selectedCompany!.id, selectedCompany?.status === 'active' ? 'blocked' : 'active')}
                              disabled={saving}
                           >
                              {selectedCompany?.status === 'active' ? 'Bloquear' : 'Ativar'}
                           </button>
                        </div>
                     </div>

                     <div style={styles.dadosGrid}>
                        <div style={styles.infoGroup}>
                           <label style={styles.infoLabel}>CNPJ / Documento</label>
                           <div style={styles.infoValue}>{selectedCompany.settings?.cnpj || 'Não informado'}</div>
                        </div>
                        <div style={styles.infoGroup}>
                           <label style={styles.infoLabel}>Subdomínio Ativo</label>
                           <div style={styles.infoValue}>{selectedCompany.subdomain}.logta.app</div>
                        </div>
                        <div style={styles.infoGroup}>
                           <label style={styles.infoLabel}>E-mail Principal</label>
                           <div style={styles.infoValue}>{selectedCompany.settings?.email || 'N/A'}</div>
                        </div>
                        <div style={styles.infoGroup}>
                           <label style={styles.infoLabel}>Data de Ativação</label>
                           <div style={styles.infoValue}>{new Date(selectedCompany.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'operacao' && (
                  <div style={styles.operacaoView}>
                    <header style={styles.listHeader}>
                       <div>
                          <h4 style={styles.listTitle}>Controle Logístico (Logta)</h4>
                          <p style={styles.sectionDesc}>Visualização em tempo real das rotas e frotas da unidade.</p>
                       </div>
                       <button 
                          style={styles.adminLinkBtn} 
                          onClick={() => handleImpersonate(selectedCompany!)}
                       >
                          <ExternalLink size={16} /> Abrir Painel Logta
                       </button>
                    </header>
                    
                    <div style={styles.statsGridSmall}>
                      <div style={styles.miniCard}>
                        <div style={styles.miniLabel}>Rotas Ativas</div>
                        <div style={styles.miniValue}>{companyMetrics?.routes || 0}</div>
                      </div>
                      <div style={styles.miniCard}>
                        <div style={styles.miniLabel}>Veículos</div>
                        <div style={styles.miniValue}>{companyMetrics?.vehicles || 0}</div>
                      </div>
                      <div style={styles.miniCard}>
                        <div style={styles.miniLabel}>Motoristas</div>
                        <div style={styles.miniValue}>{companyMetrics?.drivers || 0}</div>
                      </div>
                    </div>

                    <div style={styles.recentActivity}>
                       <h5 style={styles.subTitleSmall}>Últimas Rotas da Unidade</h5>
                       <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {companyRoutes.map(route => (
                             <div key={route.id} style={{display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                                <div>
                                   <div style={{fontWeight: '700', fontSize: '13px'}}>{route.driver?.nome || 'Motorista não vinculado'}</div>
                                   <div style={{fontSize: '11px', color: '#64748b'}}>{route.origin} → {route.destination}</div>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                   <span style={{...styles.statusBadge, fontSize: '10px', padding: '4px 8px'}}>{route.status}</span>
                                   <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>{route.vehicle?.plate}</div>
                                </div>
                             </div>
                          ))}
                          {companyRoutes.length === 0 && <div style={styles.emptyActivity}>Nenhuma rota crítica no momento.</div>}
                       </div>
                    </div>
                  </div>
               )}

               {activeTab === 'comunicacao' && (
                   <div style={styles.comunicacaoView}>
                     <header style={styles.listHeader}>
                        <div>
                           <h4 style={styles.listTitle}>Gestão de Canais (Zaptro)</h4>
                           <p style={styles.sectionDesc}>Controle de instâncias Evolution API e WhatsApp.</p>
                        </div>
                        <button style={styles.adminLinkBtn} onClick={() => handleImpersonate(selectedCompany!.id)}>
                           <ExternalLink size={16} /> Abrir Painel Zaptro
                        </button>
                     </header>

                     <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                        {companyWhatsApp.map(instance => (
                           <div key={instance.id} style={styles.evolutionCard}>
                             <div style={styles.evolutionHeader}>
                               <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                                 <div style={{...styles.evolutionIcon, backgroundColor: instance.status === 'open' ? '#10B981' : '#64748B'}}>
                                   <Phone size={24} color="#FFF" />
                                 </div>
                                 <div>
                                   <div style={styles.evolutionTitle}>{instance.instance_name}</div>
                                   <div style={styles.evolutionStatus}>
                                     <div style={{...styles.statusDot, backgroundColor: instance.status === 'open' ? '#10B981' : '#F43F5E'}} /> 
                                     {instance.status === 'open' ? 'Conectado' : 'Desconectado'}
                                   </div>
                                 </div>
                               </div>
                               <div style={{display: 'flex', gap: '8px'}}>
                                 <button style={styles.evoActionBtn}><RefreshCw size={14} /> QR Code</button>
                                 <button style={styles.evoActionBtn}><Layers size={14} /> Restart</button>
                                 <button style={{...styles.evoActionBtn, color: '#EF4444'}}><Pause size={14} /> Logout</button>
                               </div>
                             </div>
                             <div style={styles.creditsGrid}>
                               <div style={styles.creditCard}>
                                 <div style={styles.creditLabel}>Número Vinculado</div>
                                 <div style={styles.creditValue}>{instance.phone || 'Pendente'}</div>
                               </div>
                               <div style={styles.creditCard}>
                                 <div style={styles.creditLabel}>API Key (Zaptro)</div>
                                 <div style={{...styles.creditValue, fontSize: '10px'}}>{instance.apikey?.substring(0,12)}...</div>
                               </div>
                             </div>
                           </div>
                        ))}
                        {companyWhatsApp.length === 0 && (
                           <div style={styles.emptyState}>
                              <div style={{marginBottom: '12px'}}><PhoneOff size={32} color="#94a3b8" /></div>
                              Nenhuma instância WhatsApp configurada para esta unidade.
                           </div>
                        )}
                     </div>
                   </div>
                )}

               {activeTab === 'usuarios' && (
                  <div style={styles.usersList}>
                     <header style={styles.listHeader}>
                        <div>
                           <h4 style={styles.listTitle}>Controle de Colaboradores</h4>
                           <p style={styles.sectionDesc}>Gestão total de acessos e permissões.</p>
                        </div>
                        <button style={styles.smallAddBtn}><UserPlus size={14} /> Adicionar Colaborador</button>
                     </header>
                     <table style={styles.smallTable}>
                        <thead>
                           <tr>
                              <th>NOME</th>
                              <th>CARGO</th>
                              <th>EMAIL</th>
                              <th>AÇÕES MASTER</th>
                           </tr>
                        </thead>
                        <tbody>
                           {companyUsers.map(u => (
                              <tr key={u.id}>
                                 <td style={{fontWeight: '700'}}>{u.full_name}</td>
                                 <td><span style={styles.roleBadge}>{u.role}</span></td>
                                 <td style={{color: '#64748b'}}>{u.email || 'N/A'}</td>
                                 <td>
                                    <div style={{display: 'flex', gap: '8px'}}>
                                       <button style={styles.iconOnlyBtn} title="Editar Email"><Mail size={14} /></button>
                                       <button style={styles.iconOnlyBtn} title="Resetar Senha"><Lock size={14} /></button>
                                       <button style={{...styles.iconOnlyBtn, color: '#EF4444'}} title="Remover"><Trash2 size={14} /></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}

               {activeTab === 'financeiro' && (
                  <div style={styles.financeView}>
                     <div style={styles.planSummary}>
                        <div>
                           <div style={styles.infoLabel}>Plano SaaS Ativo</div>
                           <div style={{fontSize: '24px', fontWeight: '800', color: 'var(--primary)'}}>{selectedCompany?.plan?.toUpperCase()}</div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                           <div style={styles.infoLabel}>Total Faturado (Histórico)</div>
                           <div style={{fontSize: '24px', fontWeight: '800', color: '#10b981'}}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(companyMetrics.total_billed)}</div>
                        </div>
                     </div>
                     
                     <div style={styles.servicesGrid}>
                        <div style={styles.serviceItem}>
                           <div style={styles.serviceInfo}>
                              <div style={styles.serviceName}>Créditos IA</div>
                              <div style={styles.serviceStatus}>Ativo</div>
                           </div>
                           <button style={styles.serviceAction}>Atualizar</button>
                        </div>
                        <div style={styles.serviceItem}>
                           <div style={styles.serviceInfo}>
                              <div style={styles.serviceName}>WhatsApp Master</div>
                              <div style={styles.serviceStatus}>Ativo</div>
                           </div>
                           <button style={styles.serviceAction}>Renovar</button>
                        </div>
                        <div style={styles.serviceItem}>
                           <div style={styles.serviceInfo}>
                              <div style={styles.serviceName}>Backup Cloud</div>
                              <div style={styles.serviceStatus}>1.2GB / 5GB</div>
                           </div>
                           <button style={styles.serviceAction}>Comprar Espaço</button>
                        </div>
                     </div>

                     <h4 style={{marginTop: '24px', marginBottom: '16px', fontSize: '12px', fontWeight: '800', color: '#94A3B8'}}>HISTÓRICO FINANCEIRO</h4>
                     <div style={styles.billingRow}>
                        <span>Assinatura Enterprise - Abril 2026</span>
                        <span style={{color: '#10b981', fontWeight: '700'}}>PAGO</span>
                     </div>
                  </div>
               )}

               {activeTab === 'integracoes' && (
                  <div style={styles.integracoesGrid}>
                     <div style={styles.integracaoCard}>
                        <div style={styles.intIcon}><Layers size={20} /></div>
                        <div>
                           <div style={styles.intTitle}>Logta Operational</div>
                           <div style={{...styles.intStatus, color: '#10B981'}}>Conectado</div>
                        </div>
                     </div>
                     <div style={styles.integracaoCard}>
                        <div style={styles.intIcon}><Phone size={20} /></div>
                        <div>
                           <div style={styles.intTitle}>Zapto WhatsApp</div>
                           <div style={{...styles.intStatus, color: '#F59E0B'}}>Atenção (Reconectar)</div>
                        </div>
                     </div>
                     <div style={styles.integracaoCard}>
                        <div style={styles.intIcon}><Globe size={20} /></div>
                        <div>
                           <div style={styles.intTitle}>Google Workspace</div>
                           <div style={{...styles.intStatus, color: '#94A3B8'}}>Não configurado</div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'logs' && (
                  <div style={styles.logsView}>
                    <header style={styles.listHeader}>
                       <div>
                          <h4 style={styles.listTitle}>Rastreabilidade (Logs)</h4>
                          <p style={styles.sectionDesc}>Trilha auditável de todas as ações Master e Locais.</p>
                       </div>
                       <button style={styles.secondaryBtnSmall} onClick={() => fetchCompanySpecificData(selectedCompany!.id)}>
                          <RefreshCw size={14} /> Sincronizar
                       </button>
                    </header>

                    <div style={styles.auditList}>
                       <h5 style={styles.subTitleSmall}>Logs de Atividade Administrativa</h5>
                       {companyLogs.map(log => (
                          <div key={log.id} style={styles.logItemSmall}>
                             <div style={styles.logTime}>
                                <div style={{fontWeight: '800', fontSize: '11px', color: '#1e293b'}}>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                                <div style={{fontSize: '10px', color: '#94a3b8'}}>{new Date(log.created_at).toLocaleDateString()}</div>
                             </div>
                             <div style={styles.logBody}>
                                <div style={{fontWeight: '700', fontSize: '13px', color: '#334155'}}>{log.details}</div>
                                <div style={{fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px'}}>
                                   <span>USUÁRIO: {log.profiles?.full_name || 'SISTEMA'}</span>
                                   <span>•</span>
                                   <span style={{color: '#0061FF'}}>AÇÃO: {log.action}</span>
                                </div>
                             </div>
                          </div>
                       ))}
                       {companyLogs.length === 0 && <div style={styles.emptyActivity}>Nenhum registro de auditoria.</div>}

                       <h5 style={{...styles.subTitleSmall, marginTop: '24px'}}>Segurança e Acessos Negados</h5>
                       {companySecurityLogs.map(log => (
                          <div key={log.id} style={{...styles.logItemSmall, borderLeft: '4px solid #EF4444', backgroundColor: '#FEF2F2'}}>
                             <div style={styles.logTime}>
                                <div style={{fontWeight: '800', fontSize: '11px', color: '#991B1B'}}>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
                             </div>
                             <div style={styles.logBody}>
                                <div style={{fontWeight: '700', fontSize: '13px', color: '#991B1B'}}>{log.event_type}</div>
                                <div style={{fontSize: '11px', color: '#B91C1C'}}>IP: {log.ip_address} • {log.details}</div>
                             </div>
                          </div>
                       ))}
                       {companySecurityLogs.length === 0 && <div style={styles.emptyActivity}>Nenhuma ocorrência de segurança crítica.</div>}

                        <h5 style={{...styles.subTitleSmall, marginTop: '24px'}}>Decisões de IA (Inteligência Central)</h5>
                        {automationLogs.map(log => (
                           <div key={log.id} style={{...styles.logItemSmall, borderLeft: '4px solid #8B5CF6', backgroundColor: '#F5F3FF'}}>
                              <div style={styles.logTime}>
                                 <div style={{fontWeight: '800', fontSize: '11px', color: '#6D28D9'}}>{new Date(log.created_at).toLocaleTimeString()}</div>
                              </div>
                              <div style={styles.logBody}>
                                 <div style={{fontWeight: '700', fontSize: '13px', color: '#6D28D9'}}>{log.event_name}</div>
                                 <div style={{fontSize: '11px', color: '#7C3AED'}}>{JSON.stringify(log.details)}</div>
                              </div>
                           </div>
                        ))}
                        {automationLogs.length === 0 && <div style={styles.emptyActivity}>Nenhum log de automação recente.</div>}
                    </div>
                  </div>
               )}

               {activeTab === 'acoes' && (
                  <div style={styles.acoesView}>
                    <div style={styles.acoesHeader}>
                       <h4 style={styles.sectionTitle}>CÉREBRO MASTER HUB - AÇÕES DE CONTROLE</h4>
                       <span style={styles.dangerBadge}>MODO ADMINISTRADOR HUB ATIVO</span>
                    </div>
                    <div style={styles.acoesGrid}>
                       <button style={styles.masterActionBtn} onClick={() => handleImpersonate(selectedCompany!.id)}>
                         <div style={styles.masterActionIcon}><UserPlus size={20} /></div>
                         <div>
                            <div style={styles.masterActionTitle}>Assumir Controle (Deus Mode)</div>
                            <div style={styles.masterActionDesc}>Entrar na conta do cliente sem senha.</div>
                         </div>
                       </button>
                       <button style={styles.masterActionBtn}>
                         <div style={styles.masterActionIcon}><RefreshCw size={20} /></div>
                         <div>
                            <div style={styles.masterActionTitle}>{selectedCompany?.status === 'active' ? 'Bloquear Unidade' : 'Ativar Unidade'}</div>
                            <div style={styles.masterActionDesc}>Controlar acesso imediato da instância.</div>
                         </div>
                       </button>
                       <button style={styles.masterActionBtn}>
                         <div style={styles.masterActionIcon}><Save size={20} /></div>
                         <div>
                            <div style={styles.masterActionTitle}>Wipe Total (Reset)</div>
                            <div style={styles.masterActionDesc}>Limpar todos os dados da empresa.</div>
                         </div>
                       </button>
                       <button style={{...styles.masterActionBtn, borderLeftColor: '#EF4444'}}>
                         <div style={{...styles.masterActionIcon, backgroundColor: '#FEE2E2', color: '#EF4444'}}><ShieldAlert size={20} /></div>
                         <div>
                            <div style={styles.masterActionTitle}>Otimizar Banco de Dados</div>
                            <div style={styles.masterActionDesc}>VACUUM e Reindexação de tabelas.</div>
                         </div>
                       </button>
                    </div>
                  </div>
               )}
            </div>

            <footer style={styles.modalFooter}>
               <button style={styles.dangerBtn} onClick={() => { if(confirm('Excluir instância permanentemente?')) toastError('Funcionalidade Master Restrita'); }}>
                  <Trash2 size={16} /> Excluir Unidade
               </button>
               <button style={styles.saveBtn} onClick={() => setIsDetailsModalOpen(false)}>
                  Fechar Gerenciamento
               </button>
            </footer>
         </div>
      </LogtaModal>

      {/* MODAL ADICIONAR EMPRESA */}
      <LogtaModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        size="lg" 
        title="Ouvir Nova Instância Master"
        subtitle="Provisionamento automático de infraestrutura e banco de dados isolado."
        icon={<Globe />}
        primaryAction={{
          label: 'ATIVAR INSTÂNCIA AGORA ',
          onClick: handleCreateCompany,
          loading: saving
        }}
        secondaryAction={{
          label: 'Cancelar',
          onClick: () => setIsAddModalOpen(false)
        }}
      >
        <div style={styles.form}>
           <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Nome da Empresa</label>
                 <input 
                    style={styles.formInput} 
                    value={newCompany.name} 
                    required 
                    onChange={e => setNewCompany({...newCompany, name: e.target.value})} 
                    placeholder="Ex: Transportes Brasil LTDA"
                 />
              </div>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Subdomínio (Ex: brasil)</label>
                 <div style={styles.subdomainInputBox}>
                    <input 
                       style={styles.formInputSub} 
                       value={newCompany.subdomain} 
                       required 
                       onChange={e => setNewCompany({...newCompany, subdomain: e.target.value.replace(/[^a-z0-9]/gi, '')})} 
                       placeholder="brasil"
                    />
                    <span style={styles.subdomainSuffix}>.logta.app</span>
                 </div>
              </div>
           </div>
           
           <div style={styles.formGrid}>
             <div style={styles.inputGroup}>
               <label style={styles.label}>E-mail de Contato</label>
               <input 
                 style={styles.formInput} 
                 type="email"
                 value={newCompany.email} 
                 required 
                 onChange={e => setNewCompany({...newCompany, email: e.target.value})} 
                 placeholder="admin@empresa.com"
               />
             </div>
             <div style={styles.inputGroup}>
               <label style={styles.label}>Documento (CNPJ)</label>
               <input 
                 style={styles.formInput} 
                 value={newCompany.cnpj} 
                 required 
                 onChange={e => setNewCompany({...newCompany, cnpj: e.target.value})} 
                 placeholder="00.000.000/0001-00"
               />
             </div>
           </div>

           <div style={styles.inputGroup}>
              <label style={styles.label}>WhatsApp / Celular</label>
              <input 
                 style={styles.formInput} 
                 value={newCompany.phone} 
                 required 
                 onChange={e => setNewCompany({...newCompany, phone: e.target.value})} 
                 placeholder="(11) 99999-9999"
              />
           </div>

           <div style={styles.inputGroup}>
              <label style={styles.label}>Tier de Plano</label>
              <select 
                 style={styles.formInput} 
                 value={newCompany.plan} 
                 onChange={e => setNewCompany({...newCompany, plan: e.target.value as any})}
              >
                 <option value="BRONZE">Logta Essencial (BRONZE)</option>
                 <option value="PRATA">Logta Profissional (PRATA)</option>
                 <option value="OURO">Logta Enterprise 360° (OURO)</option>
              </select>
           </div>

        </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px', backgroundColor: 'transparent' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  pageTitle: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  pageSub: { color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500', marginTop: '6px' },
  headerActions: { display: 'flex', gap: '16px' },
  refreshBtn: { width: '48px', height: '48px', borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '48px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' },
  statIconBox: { width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statContent: { flex: 1 },
  statLabel: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: 0 },
  statTrend: { fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' },

  segmentTabs: { display: 'flex', gap: '8px', marginBottom: '32px', backgroundColor: 'var(--bg-secondary)', padding: '6px', borderRadius: '20px', width: 'fit-content' },
  segmentBtn: { padding: '10px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  segmentBtnActive: { backgroundColor: 'white', color: 'var(--accent)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  tabCounter: { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px' },

  controls: { display: 'flex', justifyContent: 'space-between', gap: '24px', marginBottom: '24px' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', padding: '0 24px', borderRadius: '20px', border: '1px solid var(--border)', height: '56px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '600', color: 'var(--secondary)', width: '100%' },
  controlActions: { display: 'flex', gap: '12px' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  syncBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', borderRadius: '20px', border: '1px solid var(--border)', backgroundColor: 'var(--secondary)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },

  listCard: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' },
  th: { padding: '20px 24px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' },
  tr: { borderBottom: '1px solid var(--bg-secondary)', transition: 'all 0.2s' },
  td: { padding: '24px' },
  
  companyInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatar: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: '700' },
  companyName: { fontSize: '16px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '4px' },
  subdomainLink: { fontSize: '13px', color: 'var(--accent)', fontWeight: '600' },
  companyMeta: { fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '500' },

  systemsGrid: { display: 'flex', gap: '8px' },
  sysBadgeLogta: { padding: '6px 12px', borderRadius: '10px', backgroundColor: '#F0F7FF', color: '#0052D9', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' },
  sysBadgeZapto: { padding: '6px 12px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' },

  statusBadgeMaster: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '12px', fontSize: '11px', fontWeight: '800', width: 'fit-content' },
  pulseDot: { width: '8px', height: '8px', borderRadius: '50%' },

  metricsCell: { width: '150px' },
  mrrValue: { fontSize: '14px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '8px' },
  usageBar: { height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' },
  usageFill: { height: '100%', backgroundColor: 'var(--accent)' },
  usageText: { fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '600' },

  activityCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#64748B', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.2px' },
  activeTab: { backgroundColor: '#0061FF', color: 'white', fontWeight: '500' },
  tabContent: { minHeight: '400px' },

  /* Form Styles */
  form: { padding: '10px 0' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '0.3px', marginLeft: '4px' },
  formInput: { padding: '14px 18px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '500', outline: 'none', transition: 'all 0.2s', backgroundColor: '#F8FAFC', color: '#0F172A' },
  subdomainInputBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '0 18px', transition: 'all 0.2s' },
  formInputSub: { border: 'none', backgroundColor: 'transparent', padding: '14px 0', outline: 'none', fontSize: '14px', fontWeight: '700', width: '100%', textAlign: 'right', color: '#0061FF' },
  subdomainSuffix: { fontSize: '14px', fontWeight: '600', color: '#94A3B8' },

  /* NEW MASTER HUB STYLES */
  financeView: { padding: '20px 0' },
  planSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '24px' },
  servicesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' },
  serviceItem: { backgroundColor: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: '14px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' },
  serviceStatus: { fontSize: '12px', color: '#64748B', fontWeight: '600' },
  serviceAction: { width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#0061FF', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
  
  logsView: { padding: '10px 0' },
  auditList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  logItemSmall: { display: 'flex', gap: '16px', padding: '12px', borderRadius: '12px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' },
  logTime: { width: '60px', display: 'flex', flexDirection: 'column', gap: '2px' },
  logBody: { flex: 1 },
  emptyActivity: { padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: '500' },
  
  acoesView: { padding: '10px 0' },
  acoesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '12px', fontWeight: '900', color: '#1E293B', margin: 0, letterSpacing: '0.5px' },
  dangerBadge: { padding: '4px 10px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', fontSize: '10px', fontWeight: '900' },
  acoesGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  masterActionBtn: { display: 'flex', gap: '16px', padding: '20px', borderRadius: '20px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderLeft: '4px solid #0061FF', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' },
  masterActionIcon: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F0F7FF', color: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  masterActionTitle: { fontSize: '14px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' },
  masterActionDesc: { fontSize: '12px', color: '#64748B', fontWeight: '500' },
  
  secondaryBtnSmall: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '11px', fontWeight: '700', cursor: 'pointer' },
  subTitleSmall: { fontSize: '11px', fontWeight: '900', color: '#94A3B8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' },
};

export default CompanyManagement;
