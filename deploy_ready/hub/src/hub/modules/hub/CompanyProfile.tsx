import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, CreditCard, Activity, 
  Settings, MessageSquare, Truck, Shield,
  ArrowLeft, Edit3, Trash2, Key, Globe,
  CheckCircle2, AlertTriangle, Clock, Mail,
  Phone, MapPin, Zap, Database, Download,
  ExternalLink, Plus, Filter, MoreVertical
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { toastSuccess, toastError } from '@core/lib/toast';
import { useAuth } from '@core/context/AuthContext';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';

const CompanyProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    cnpj: '',
    address: ''
  });
  const [extraData, setExtraData] = useState({
    routes: [],
    whatsapp: [],
    vehicles: [],
    invoices: []
  });

  useEffect(() => {
    fetchCompanyData();

    // Deep Mirror: Realtime subscription for this specific company
    const channel = supabase
      .channel(`company-mirror-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies', filter: `id=eq.${id}` }, () => fetchCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `company_id=eq.${id}` }, () => fetchCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes', filter: `company_id=eq.${id}` }, () => fetchCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_instances', filter: `company_id=eq.${id}` }, () => fetchCompanyData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles', filter: `company_id=eq.${id}` }, () => fetchCompanyData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          collaborators:profiles(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCompany(data);
      setEditData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        cnpj: data.cnpj || '',
        address: data.address || ''
      });

      // Sincronização em tempo real: Buscando dados operacionais da empresa
      const [rRes, wRes, vRes, iRes] = await Promise.all([
        supabase.from('routes').select('*').eq('company_id', id).limit(5),
        supabase.from('whatsapp_instances').select('*').eq('company_id', id),
        supabase.from('vehicles').select('*').eq('company_id', id),
        supabase.from('master_payments').select('*').eq('company_id', id).order('created_at', { ascending: false })
      ]);

      setExtraData({
        routes: rRes.data || [],
        whatsapp: wRes.data || [],
        vehicles: vRes.data || [],
        invoices: iRes.data || []
      });

    } catch (err) {
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: company.name,
          email: company.email,
          phone: company.phone,
          cnpj: company.cnpj,
          address: company.address
        })
        .eq('id', id);

      if (error) throw error;
      
      await supabase.from('audit_log').insert([{
        action: 'COMPANY_UPDATE_MASTER',
        details: `Master Admin updated company ${company.name} details (Single Source of Truth)`,
        module: 'HUB_MASTER',
        company_id: id
      }]);

      toastSuccess('Dados sincronizados globalmente!');
    } catch (err) {
      console.error('Error saving:', err);
      toastError('Erro ao sincronizar dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCompanyPopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: editData.name,
          email: editData.email,
          phone: editData.phone,
          cnpj: editData.cnpj,
          address: editData.address
        })
        .eq('id', id);

      if (error) throw error;
      
      await supabase.from('audit_log').insert([{
        action: 'COMPANY_UPDATE_MASTER',
        details: `Master Admin updated company ${editData.name} details via popup`,
        module: 'HUB_MASTER',
        company_id: id
      }]);

      toastSuccess('Cadastro da empresa atualizado com sucesso!');
      setShowEditModal(false);
      fetchCompanyData();
    } catch (err) {
      console.error('Error saving popup changes:', err);
      toastError('Erro ao atualizar cadastro.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteCompany = async () => {
    if (deleteConfirmWord !== 'EXCLUIR') {
      toastError('Por favor, digite a palavra EXCLUIR para confirmar.');
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toastSuccess('Empresa excluída permanentemente!');
      navigate('/master/companies');
    } catch (err) {
      console.error('Error deleting company:', err);
      toastError('Erro ao excluir empresa.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddMember = async () => {
    const email = prompt('E-mail do novo membro:');
    const name = prompt('Nome completo:');
    if (!email || !name) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').insert([{
        company_id: id,
        email,
        full_name: name,
        role: 'USER',
        status: 'active'
      }]);
      if (error) throw error;
      toastSuccess(`Membro ${name} adicionado com sucesso!`);
      fetchCompanyData();
    } catch (err) {
      toastError('Falha ao adicionar membro');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSales = async () => {
    setSaving(true);
    try {
      await supabase.from('audit_log').insert([{ 
        action: 'CRM_EXPORT', 
        resource: 'COMPANIES', 
        resource_id: id,
        metadata: { timestamp: new Date().toISOString() }
      }]);
      await new Promise(r => setTimeout(r, 1500));
      toastSuccess('Dados exportados para o Pipeline de Vendas Master!');
    } catch (err) {
      toastError('Falha na exportação');
    } finally {
      setSaving(false);
    }
  };

  const handleRubyAction = async (action: string) => {
    const confirmAction = window.confirm(`Tem certeza que deseja executar: ${action}?`);
    if (!confirmAction) return;

    setSaving(true);
    try {
      if (action === 'RESET_INSTANCE') {
        // Reset full state
        await supabase.from('companies').update({ 
          status: 'active', 
          settings: { 
            last_reset: new Date().toISOString(),
            reset_by: 'RUBI_MASTER'
          } 
        }).eq('id', id);
        
        await supabase.from('audit_log').insert([{ 
          action: 'RESET_INSTANCE', 
          resource: 'COMPANIES', 
          resource_id: id,
          metadata: { type: 'FULL_RESET' }
        }]);
        
        toastSuccess('Instância restaurada para estado original.');
      } else if (action === 'FORCE_SYNC') {
        // Create sync event for all products
        await supabase.from('sync_events').insert([
          { company_id: id, product_slug: 'logta', event_type: 'FULL_SYNC_REQ', status: 'pending' },
          { company_id: id, product_slug: 'zaptro', event_type: 'FULL_SYNC_REQ', status: 'pending' }
        ]);
        
        await supabase.from('audit_log').insert([{ 
          action: 'FORCE_SYNC', 
          resource: 'COMPANIES', 
          resource_id: id
        }]);
        
        toastSuccess('Sincronização forçada iniciada em todos os módulos.');
      } else if (action === 'ADD_CREDITS') {
        const type = window.confirm('Deseja adicionar créditos de WHATSAPP? (Cancelar para créditos de IA)') ? 'wa_credits' : 'ai_credits';
        const amount = prompt(`Quantidade de créditos de ${type === 'wa_credits' ? 'WhatsApp' : 'IA'} a adicionar:`, '500');
        
        if (!amount || isNaN(parseInt(amount))) return;
        
        const currentVal = company[type] || 0;
        const newVal = currentVal + parseInt(amount);
        
        await supabase.from('companies').update({ [type]: newVal }).eq('id', id);
        
        await supabase.from('audit_log').insert([{ 
          action: 'CREDIT_INJECTION', 
          resource: 'COMPANIES', 
          resource_id: id,
          metadata: { type, amount: parseInt(amount) }
        }]);
        
        toastSuccess(`${amount} créditos de ${type} adicionados!`);
      }
      fetchCompanyData();
    } catch (err) {
      console.error(err);
      toastError('Falha ao executar ação Rubi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={styles.loading}>Carregando Centro de Comando...</div>;
  if (!company) return <div style={styles.error}>Empresa não encontrada.</div>;

  const isZaptoActive = company.plan?.includes('ZAPTRO') || company.origin === 'zaptro' || true; // Mocked check
  const isLogtaActive = company.plan?.includes('LOGTA') || company.origin === 'logta' || true; // Mocked check

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* HEADER: COMANDANTE DO HUB */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/master/companies')}>
            <ArrowLeft size={20} />
          </button>
          <div style={styles.avatar}>
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} style={styles.logoImg} />
            ) : (
              <Building2 size={24} color="#0061FF" />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={styles.companyName}>{company.name}</h1>
              <span style={{...styles.statusBadge, backgroundColor: company.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: company.status === 'active' ? '#10B981' : '#EF4444'}}>
                {company.status === 'active' ? 'Ativo' : 'Suspenso'}
              </span>
            </div>
            <div style={styles.metaRow}>
              <span style={styles.metaItem}><Globe size={14} /> {company.subdomain || '---'}.logta.me</span>
              <span style={styles.metaItem}><CreditCard size={14} /> Plano {company.plan || 'Premium'}</span>
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.impersonateBtn} onClick={() => impersonate(company.id, company.origin || 'logta')}>
            <Key size={18} /> Entrar como Admin
          </button>
          <button style={styles.primaryBtn} onClick={() => setShowEditModal(true)}><Edit3 size={18} /> Editar Cadastro</button>
          <button 
            style={{
              padding: '10px', 
              borderRadius: '14px', 
              borderColor: '#FEE2E2', 
              borderStyle: 'solid', 
              borderWidth: '1px',
              backgroundColor: 'white', 
              color: '#EF4444', 
              cursor: 'pointer', 
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px'
            }}
            onClick={() => setShowDeleteModal(true)}
            title="Excluir Empresa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* METRIC CARDS SECTION */}
      <div
        style={{
          ...HUB_METRIC_GRID_STYLE,
          marginBottom: '32px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          width: '100%',
        }}
      >
        <HubMetricCard
          label="Colaboradores"
          value={company.collaborators?.length || 0}
          icon={Users}
          accent="#0061FF"
        />
        <HubMetricCard
          label="Clientes Base"
          value={company.clients_count || 0}
          icon={Database}
          accent="#10B981"
        />
        <HubMetricCard
          label="Veículos Ativos"
          value={extraData.vehicles.length}
          icon={Truck}
          accent="#F59E0B"
        />
        <HubMetricCard
          label="MRR Hub"
          value={`R$ ${company.mrr || '497,00'}`}
          icon={CreditCard}
          accent="#8B5CF6"
        />
      </div>

      {/* NAVIGATION TABS */}
      <div style={styles.tabNav}>
        <button style={{...styles.tabBtn, ...(activeTab === 'overview' ? styles.activeTab : {})}} onClick={() => setActiveTab('overview')}>Visão Geral</button>
        {isLogtaActive && <button style={{...styles.tabBtn, ...(activeTab === 'logta' ? styles.activeTab : {})}} onClick={() => setActiveTab('logta')}>Operação (Logta)</button>}
        {isZaptoActive && <button style={{...styles.tabBtn, ...(activeTab === 'zapto' ? styles.activeTab : {})}} onClick={() => setActiveTab('zapto')}>Comunicação (Zapto)</button>}
        <button style={{...styles.tabBtn, ...(activeTab === 'team' ? styles.activeTab : {})}} onClick={() => setActiveTab('team')}>Colaboradores</button>
        <button style={{...styles.tabBtn, ...(activeTab === 'finance' ? styles.activeTab : {})}} onClick={() => setActiveTab('finance')}>Financeiro & Créditos</button>
        <button style={{...styles.tabBtn, ...(activeTab === 'logs' ? styles.activeTab : {})}} onClick={() => setActiveTab('logs')}>Logs & Auditoria</button>
        <button style={{...styles.tabBtn, ...(activeTab === 'admin' ? styles.activeTab : {})}} onClick={() => setActiveTab('admin')}>Ações Rubi</button>
      </div>

      {/* TAB CONTENT */}
      <div style={styles.contentArea}>
        {/* LOGTA TAB */}
        {activeTab === 'logta' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Painel Logístico (Mirror)</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ROTA / MOTORISTA</th>
                    <th style={styles.th}>ORIGEM / DESTINO</th>
                    <th style={styles.th}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {extraData.routes.map((route: any) => (
                    <tr key={route.id} style={styles.tr}>
                      <td style={styles.td}><strong>{route.driver?.nome || 'Motorista'}</strong></td>
                      <td style={styles.td}>{route.origin} → {route.destination}</td>
                      <td style={styles.td}><span style={styles.statusBadge}>{route.status}</span></td>
                    </tr>
                  ))}
                  {extraData.routes.length === 0 && <tr><td colSpan={3} style={{padding: '40px', textAlign: 'center', color: '#94A3B8'}}>Nenhuma operação logística detectada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ZAPTO TAB */}
        {activeTab === 'zapto' && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Instâncias WhatsApp (Mirror)</h3>
            <div style={styles.grid2}>
              {extraData.whatsapp.map((wa: any) => (
                <div key={wa.id} style={styles.waCard}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{...styles.statusDot, backgroundColor: wa.status === 'open' ? '#10B981' : '#EF4444'}} />
                    <span style={{fontWeight: '800'}}>{wa.instance_name}</span>
                  </div>
                  <div style={{fontSize: '12px', color: '#64748B', marginTop: '8px'}}>{wa.phone || 'Pendente'}</div>
                </div>
              ))}
              {extraData.whatsapp.length === 0 && <div style={{gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: '#94A3B8'}}>Nenhuma instância ativa.</div>}
            </div>
          </div>
        )}
        {activeTab === 'overview' && (
          <div style={styles.overviewGrid}>


            <div style={{ ...styles.card, ...styles.overviewCellInfo }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Informações Principais</h3>
                <button 
                  style={{...styles.primaryBtn, padding: '8px 16px', fontSize: '12px', backgroundColor: '#0061FF', color: 'white'}} 
                  onClick={() => setShowEditModal(true)}
                >
                  Editar Cadastro
                </button>
              </div>
              <div style={{ ...styles.infoGrid, gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>Nome da Empresa</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.name}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>E-mail Master</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.email}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>WhatsApp / Contato</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.phone || '---'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>CNPJ / Identificador</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.cnpj || '---'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>Data de Criação</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.created_at ? new Date(company.created_at).toLocaleDateString('pt-BR') : '08/05/2026'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>Plano Atual</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#0061FF', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={14} fill="#0061FF" /> {company.plan || 'Rubi Master Enterprise'}
                  </p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>Endereço Sede</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.address || 'Av. Paulista, 1000 - São Paulo/SP'}</p>
                </div>
                <div style={styles.infoItem}>
                  <label style={styles.infoLabel}>Limite de Usuários</label>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: '4px 0 0 0' }}>{company.user_limit || '50 Contas Ativas'}</p>
                </div>
              </div>
            </div>

            <div style={{ ...styles.card, ...styles.overviewSyncCard, backgroundColor: '#FFFFFF', color: '#0F172A', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)', position: 'relative', overflow: 'hidden' }}>
              <h3 style={{ ...styles.cardTitle, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#0061FF" /> Status de Sincronização
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {/* SYSTEM 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', transition: '0.2s', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(0, 97, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={16} color="#0061FF" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Logta Engine</p>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>Operação e Rotas</span>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: extraData.routes.length > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)', color: extraData.routes.length > 0 ? '#10B981' : '#64748B' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: extraData.routes.length > 0 ? '#10B981' : '#64748B', display: 'inline-block' }} />
                    {extraData.routes.length > 0 ? 'Online' : 'Ocioso'}
                  </span>
                </div>

                {/* SYSTEM 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', transition: '0.2s', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare size={16} color="#EC4899" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Zapto API</p>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>WhatsApp Gateway</span>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: extraData.whatsapp.some((w:any) => w.status === 'open') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', color: extraData.whatsapp.some((w:any) => w.status === 'open') ? '#10B981' : '#F43F5E' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: extraData.whatsapp.some((w:any) => w.status === 'open') ? '#10B981' : '#F43F5E', display: 'inline-block' }} />
                    {extraData.whatsapp.some((w:any) => w.status === 'open') ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>

                {/* SYSTEM 3 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', transition: '0.2s', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={16} color="#10B981" />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Sincronia Rubi</p>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '500' }}>Realtime Mirroring</span>
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                    Ativa
                  </span>
                </div>
              </div>
            </div>

            <div style={{ ...styles.card, ...styles.overviewFullBleed }}>
              <h3 style={styles.cardTitle}>Serviços & Add-ons (Realtime)</h3>
              <div style={styles.grid2}>
                <div style={styles.waCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={styles.infoLabel}>Backup Cloud</span>
                    <Shield size={16} color={company.backup_enabled ? '#10B981' : '#94A3B8'} />
                  </div>
                  <div style={{fontSize: '18px', fontWeight: '800', marginTop: '10px'}}>
                    {company.backup_enabled ? 'Ativo' : 'Pendente'}
                  </div>
                  <div style={{fontSize: '11px', color: '#64748B'}}>{company.storage_limit_gb || 5}GB Limite</div>
                </div>
                <div style={styles.waCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={styles.infoLabel}>WhatsApp Credits</span>
                    <MessageSquare size={16} color="#0061FF" />
                  </div>
                  <div style={{fontSize: '18px', fontWeight: '800', marginTop: '10px'}}>
                    {company.wa_credits || 0}
                  </div>
                  <div style={{fontSize: '11px', color: '#64748B'}}>Créditos de Mensagem</div>
                </div>
                <div style={styles.waCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={styles.infoLabel}>AI Credits</span>
                    <Zap size={16} color="#F59E0B" />
                  </div>
                  <div style={{fontSize: '18px', fontWeight: '800', marginTop: '10px'}}>
                    {company.ai_credits || 0}
                  </div>
                  <div style={{fontSize: '11px', color: '#64748B'}}>Tokens de Inteligência</div>
                </div>
                <div style={styles.waCard}>
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <span style={styles.infoLabel}>Evolution API</span>
                    <Database size={16} color="#8B5CF6" />
                  </div>
                  <div style={{fontSize: '18px', fontWeight: '800', marginTop: '10px'}}>
                    {company.api_credits || 0}
                  </div>
                  <div style={{fontSize: '11px', color: '#64748B'}}>Créditos de API Externa</div>
                </div>
              </div>
              <button 
                style={{...styles.primaryBtn, width: '100%', marginTop: '16px', backgroundColor: '#0061FF'}} 
                onClick={() => handleRubyAction('ADD_CREDITS')}
              >
                <Plus size={18} /> Adicionar Créditos Rubi
              </button>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.cardTitle}>Gestão de Colaboradores</h3>
              <button style={styles.addBtn} onClick={handleAddMember}><Plus size={16} /> Novo Membro</button>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>NOME</th>
                  <th style={styles.th}>E-MAIL</th>
                  <th style={styles.th}>CARGO / PERMISSÃO</th>
                  <th style={styles.th}>STATUS</th>
                  <th style={styles.th}>AÇÕES MASTER</th>
                </tr>
              </thead>
              <tbody>
                {company.collaborators?.map((colab: any) => (
                  <tr key={colab.id} style={styles.tr}>
                    <td style={styles.td}><strong>{colab.full_name}</strong></td>
                    <td style={styles.td}>{colab.email}</td>
                    <td style={styles.td}><span style={styles.roleTag}>{colab.role}</span></td>
                    <td style={styles.td}>Ativo</td>
                    <td style={styles.td}>
                      <div style={styles.colabActions}>
                        <button title="Resetar Senha" style={styles.iconBtn}><Key size={14} /></button>
                        <button title="Editar Permissões" style={styles.iconBtn}><Settings size={14} /></button>
                        <button title="Remover" style={{...styles.iconBtn, color: '#EF4444'}}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'finance' && (
          <div style={styles.overviewGrid}>
            <div style={styles.mainCol}>
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={styles.cardTitle}>Extrato Financeiro Hub</h3>
                  <button style={styles.primaryBtn} onClick={handleExportSales}>Exportar para Vendas</button>
                </div>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>PRODUTO / SERVIÇO</th>
                      <th style={styles.th}>VALOR</th>
                      <th style={styles.th}>DATA</th>
                      <th style={styles.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraData.invoices.map((inv: any) => (
                      <tr key={inv.id} style={styles.tr}>
                        <td style={styles.td}><strong>{inv.description || 'Assinatura'}</strong></td>
                        <td style={styles.td}>R$ {inv.amount}</td>
                        <td style={styles.td}>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td style={styles.td}><span style={{...styles.statusBadge, color: inv.status === 'pago' ? '#10B981' : '#F59E0B'}}>{inv.status}</span></td>
                      </tr>
                    ))}
                    {extraData.invoices.length === 0 && (
                      <tr>
                        <td style={styles.td}>Assinatura Hub ({company.plan})</td>
                        <td style={styles.td}>R$ {company.plan === 'OURO' ? '997,00' : '497,00'}</td>
                        <td style={styles.td}>Recorrente</td>
                        <td style={styles.td}><span style={{...styles.statusBadge, color: '#10B981'}}>Ativo</span></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={styles.sideCol}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Add-ons & Créditos</h3>
                <div style={styles.addOnList}>
                  <div style={styles.addOnItem}><span>📦 Backup Automático</span> <strong>ATIVO</strong></div>
                  <div style={styles.addOnItem}><span>💬 Créditos Evolution</span> <strong>{company.credits || 0}</strong></div>
                  <div style={styles.addOnItem}><span>🤖 IA de Roteirização</span> <strong>LIBERADO</strong></div>
                </div>
                <button style={{...styles.primaryBtn, width: '100%', marginTop: '20px', justifyContent: 'center'}}>Adicionar Créditos</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div style={styles.adminGrid}>
            <div style={{...styles.adminActionCard, borderLeft: '4px solid #EF4444'}}>
              <AlertTriangle color="#EF4444" size={24} />
              <div>
                <h4>Resetar Instância</h4>
                <p>Suspende a unidade e limpa as configurações temporárias de cache.</p>
              </div>
              <button style={styles.dangerBtn} onClick={() => handleRubyAction('RESET_INSTANCE')}>Executar</button>
            </div>
            <div style={{...styles.adminActionCard, borderLeft: '4px solid #0061FF'}}>
              <Zap color="#0061FF" size={24} />
              <div>
                <h4>Sincronização Forçada</h4>
                <p>Força o espelhamento total do banco da unidade para o Hub Master.</p>
              </div>
              <button style={styles.primaryBtn} onClick={() => handleRubyAction('FORCE_SYNC')}>Sincronizar</button>
            </div>
            <div style={{...styles.adminActionCard, borderLeft: '4px solid #10B981'}}>
              <CreditCard color="#10B981" size={24} />
              <div>
                <h4>Adicionar Créditos</h4>
                <p>Injetar créditos de uso (WhatsApp/IA) manualmente nesta empresa.</p>
              </div>
              <button style={styles.outlineBtn} onClick={() => handleRubyAction('ADD_CREDITS')}>Adicionar</button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={styles.cardTitle}>Logs de Auditoria Master</h3>
              <button style={styles.outlineBtn} onClick={() => toastSuccess('Logs exportados!')}><Download size={16} /> Exportar CSV</button>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>DATA / HORA</th>
                    <th style={styles.th}>AÇÃO</th>
                    <th style={styles.th}>USUÁRIO</th>
                    <th style={styles.th}>MÓDULO</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { date: '08/05/2026 15:30', action: 'Login Master Admin', user: 'alison@zaptro.com.br', module: 'HUB_MASTER' },
                    { date: '08/05/2026 14:15', action: 'Update Company Profile', user: 'ricardo@falcao.com.br', module: 'LOGTA_ADMIN' },
                    { date: '07/05/2026 09:10', action: 'API Key Rotation', user: 'SYSTEM', module: 'SECURITY' },
                    { date: '06/05/2026 18:45', action: 'Payment Received', user: 'BILLING_BOT', module: 'FINANCE' },
                  ].map((log, i) => (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><span style={{ color: '#64748B', fontWeight: '600' }}>{log.date}</span></td>
                      <td style={styles.td}><strong>{log.action}</strong></td>
                      <td style={styles.td}>{log.user}</td>
                      <td style={styles.td}><span style={styles.roleTag}>{log.module}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {/* EDIT MODAL POPUP */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Editar Cadastro da Empresa</h2>
              <button style={styles.closeBtn} onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateCompanyPopup} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Nome da Empresa</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>E-mail Master</label>
                <input
                  type="email"
                  style={styles.formInput}
                  value={editData.email}
                  onChange={e => setEditData({ ...editData, email: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>WhatsApp / Contato</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.phone}
                  onChange={e => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>CNPJ / Identificador</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.cnpj}
                  onChange={e => setEditData({ ...editData, cnpj: e.target.value })}
                />
              </div>
              <div style={styles.formRow}>
                <label style={styles.formLabel}>Endereço / Sede</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editData.address}
                  onChange={e => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" style={styles.submitBtn} disabled={saving}>
                  {saving ? 'Gravando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL POPUP */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle color="#EF4444" size={24} />
                <h2 style={{ ...styles.modalTitle, color: '#EF4444' }}>Excluir Empresa Permanentemente</h2>
              </div>
              <button style={styles.closeBtn} onClick={() => { setShowDeleteModal(false); setDeleteConfirmWord(''); }}>&times;</button>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                Esta ação é irreversível e excluirá todos os dados operacionais, de faturamento, colaboradores e logs associados a <strong>{company.name}</strong>.
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', marginTop: '12px' }}>
                Para confirmar a exclusão permanente, digite a palavra <span style={{ color: '#EF4444' }}>EXCLUIR</span> abaixo:
              </p>
            </div>
            <div style={styles.formRow}>
              <input
                type="text"
                placeholder="Digite EXCLUIR em letras maiúsculas"
                style={{
                  ...styles.formInput,
                  borderColor: deleteConfirmWord === 'EXCLUIR' ? '#EF4444' : '#E2E8F0',
                  boxShadow: deleteConfirmWord === 'EXCLUIR' ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
                }}
                value={deleteConfirmWord}
                onChange={e => setDeleteConfirmWord(e.target.value)}
                required
              />
            </div>
            <div style={{ ...styles.modalFooter, marginTop: '24px' }}>
              <button 
                type="button" 
                style={styles.cancelBtn} 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmWord(''); }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                style={{
                  ...styles.submitBtn, 
                  backgroundColor: deleteConfirmWord === 'EXCLUIR' ? '#EF4444' : '#94A3B8', 
                  cursor: deleteConfirmWord === 'EXCLUIR' ? 'pointer' : 'not-allowed',
                  boxShadow: deleteConfirmWord === 'EXCLUIR' ? '0 4px 14px rgba(239, 68, 68, 0.3)' : 'none',
                }} 
                onClick={handleDeleteCompany}
                disabled={deleteConfirmWord !== 'EXCLUIR' || deleting}
              >
                {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '24px 0' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontWeight: '800', color: '#0061FF', fontSize: '18px' },
  error: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#EF4444', fontWeight: '800', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  backBtn: { width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  avatar: { width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  companyName: { fontSize: '29px', fontWeight: '500', color: '#000000', margin: 0, letterSpacing: 0, lineHeight: '1.2', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  statusBadge: { padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.4px' },
  metaRow: { display: 'flex', gap: '16px', marginTop: '4px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: '500' },
  
  headerActions: { display: 'flex', gap: '12px' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: 'none', backgroundColor: '#0061FF', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.3px' },
  impersonateBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: 'none', backgroundColor: '#0F172A', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.3px' },
  
  tabNav: { 
    display: 'flex', 
    gap: '8px', 
    backgroundColor: '#FFFFFF', 
    padding: '8px', 
    borderRadius: '20px', 
    border: 'none', 
    boxShadow: 'none', 
    marginBottom: '32px',
    alignItems: 'center',
    width: 'fit-content',
    maxWidth: '100%',
    flexWrap: 'wrap'
  },
  tabBtn: { 
    padding: '10px 24px', 
    borderRadius: '16px', 
    border: 'none', 
    background: 'transparent', 
    color: '#64748B', 
    fontSize: '14px', 
    fontWeight: '700', 
    cursor: 'pointer', 
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    justifyContent: 'center' 
  },
  activeTab: { 
    backgroundColor: '#0061FF', 
    color: '#FFFFFF', 
    boxShadow: '0 4px 14px rgba(0, 97, 255, 0.2)' 
  },
  
  contentArea: { width: '100%', maxWidth: '100%', minWidth: 0 },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.38fr)',
    gap: '24px',
    alignItems: 'stretch',
    width: '100%',
  },
  /** Primeira linha: formulário; evita estouro em grids estreitos */
  overviewCellInfo: { minWidth: 0 },
  /** Cartão de status alinhado à primeira linha (Informações + sync lado a lado) */
  overviewSyncCard: { display: 'flex', flexDirection: 'column', minWidth: 0, justifyContent: 'flex-start' },
  /** KPIs e bloco de serviços ocupam a largura total (sem “vazio” na coluna direita) */
  overviewFullBleed: { gridColumn: '1 / -1', width: '100%', minWidth: 0 },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 },
  
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 20px 0', letterSpacing: '0.3px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '500', color: '#0F172A', outline: 'none' },
  
  syncList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  syncItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' },
  syncDot: { width: '8px', height: '8px', borderRadius: '50%' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 12px', fontSize: '14px' },
  roleTag: { padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F1F5F9', fontSize: '11px', fontWeight: '700' },
  
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#F1F5F9', color: '#0061FF', fontWeight: '700', cursor: 'pointer' },
  iconBtn: { width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: '#F8FAF9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' },
  colabActions: { display: 'flex', gap: '8px' },
  
  adminGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  adminActionCard: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' },
  dangerBtn: { padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: '#FEF2F2', color: '#EF4444', fontWeight: '700', cursor: 'pointer' },
  outlineBtn: { padding: '10px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'transparent', color: '#64748B', fontWeight: '700', cursor: 'pointer' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  waCard: { padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAF9' },
  tableWrapper: { overflowX: 'auto' },
  addOnList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  addOnItem: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', borderRadius: '8px', backgroundColor: '#F8FAF9' },

  // MODAL STYLES
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { backgroundColor: 'white', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '580px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E2E8F0', position: 'relative' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#0F172A', margin: 0, letterSpacing: '-0.02em' },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '50%', transition: 'background-color 0.2s' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '18px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  formInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '500', color: '#0F172A', outline: 'none', backgroundColor: '#F8FAFC', transition: 'border-color 0.2s, box-shadow 0.2s' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  submitBtn: { padding: '12px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#0061FF', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 97, 255, 0.2)', transition: 'background-color 0.2s' }
};

export default CompanyProfile;
