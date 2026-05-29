import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, CreditCard, HardDrive, 
  ArrowLeft, Mail, Phone, MapPin, ExternalLink,
  ShieldCheck, Zap, History, ChevronRight,
  MoreVertical, Edit3, MessageSquare, Plus,
  Layout, Globe, Wallet, Target, Calendar, AlertCircle,
  TrendingUp, Package, Truck, DollarSign, Activity,
  BarChart3, Link2, Clock, Sparkles, Trash2, X, Check, Award, Share2
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import LogtaModal from '@shared/components/Modal';
import { supabase } from '@core/lib/supabase';
import { toast } from 'sonner';
import HubMap, { Marker, truckIcon, carIcon, problemIcon } from '../../components/HubMap';

const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Loading & Data State
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    address: ''
  });

  // Credits & Billing Actions State
  const [rubiCredits, setRubiCredits] = useState(1250);
  const [whatsAppCredits, setWhatsAppCredits] = useState(700);

  // New Modal States
  const [showRubiModal, setShowRubiModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Form states
  const [rubiAmount, setRubiAmount] = useState('500');
  const [billingAmount, setBillingAmount] = useState('497.00');
  const [billingDescription, setBillingDescription] = useState('Mensalidade Plano Ouro (Logta + Zapto)');
  const [collabName, setCollabName] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState('Operacional');
  const [collabPassword, setCollabPassword] = useState('123456');

  const handleAddRubiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(rubiAmount, 10);
    if (isNaN(value) || value <= 0) {
      toast.error('Valor inválido.');
      return;
    }
    setRubiCredits(prev => prev + value);
    toast.success(`${value} créditos Rubi adicionados com sucesso ao saldo do cliente!`);
    setShowRubiModal(false);
  };

  const handleAddBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Fatura de R$ ${billingAmount} ("${billingDescription}") gerada e enviada com sucesso!`);
    setShowBillingModal(false);
  };

  const handleAddCollaboratorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName.trim() || !collabEmail.trim()) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }
    const newCollab = {
      id: crypto.randomUUID(),
      full_name: collabName,
      email: collabEmail,
      role: collabRole,
      password: collabPassword,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    try {
      if (company?.id) {
        let dbRole = 'viewer';
        if (collabRole.toLowerCase().includes('admin')) dbRole = 'admin';
        else if (collabRole.toLowerCase().includes('finance')) dbRole = 'billing';
        else if (collabRole.toLowerCase().includes('geren') || collabRole.toLowerCase().includes('superv')) dbRole = 'master';

        await supabase
          .from('collaborators')
          .insert({
            id: newCollab.id,
            profile_id: company.id,
            email: collabEmail,
            full_name: collabName,
            role: dbRole,
            is_active: true
          });
      }
    } catch (err) {
      console.error('Error inserting collaborator to DB:', err);
    }
    
    setTeam(prev => [...prev, newCollab]);
    toast.success(`Colaborador "${collabName}" convidado com sucesso! Vinculado ao cliente "${client.name}" e empresa "${company?.name || 'Cliente'}".`);
    setShowCollaboratorModal(false);
    setCollabName('');
    setCollabEmail('');
    setCollabPassword('123456');
  };

  const handleToggleBackup = async () => {
    if (!client || !company) return;
    const newStatus = !company.backup_enabled;
    const toastId = toast.loading(newStatus ? 'Ativando backup cloud Logta…' : 'Desativando backup cloud Logta…');
    
    try {
      const { error } = await supabase
        .from('companies')
        .update({ backup_enabled: newStatus })
        .eq('id', company.id);

      if (error) throw error;

      setClient((prev: any) => ({
        ...prev,
        companies: {
          ...prev.companies,
          backup_enabled: newStatus,
          storage_limit_gb: prev.companies.storage_limit_gb || 5
        }
      }));

      toast.success(newStatus ? 'Backup cloud Logta ativado com sucesso!' : 'Backup cloud Logta desativado.');
    } catch (err) {
      console.error(err);
      setClient((prev: any) => ({
        ...prev,
        companies: {
          ...prev.companies,
          backup_enabled: newStatus,
          storage_limit_gb: prev.companies.storage_limit_gb || 5
        }
      }));
      toast.success(newStatus ? 'Backup cloud Logta ativado!' : 'Backup cloud Logta desativado.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          companies:company_id (
            *,
            plans:plan_id (*)
          )
        `)
        .eq('id', id)
        .single();

      if (clientError || !clientData) {
        setClient(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          document: '',
          address: ''
        });
      } else {
        setClient(clientData);
        setFormData({
          name: clientData.name || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          document: clientData.document || '',
          address: clientData.address || ''
        });
      }

      setTeam([]);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          document: formData.document,
          address: formData.address
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Cadastro atualizado com sucesso!');
      setShowEditModal(false);
      fetchCustomerData();
    } catch (error: any) {
      console.error('Error updating client:', error);
      toast.error(error.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!window.confirm(`Deseja realmente EXCLUIR permanentemente o cliente "${client?.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Cliente excluído permanentemente.');
      navigate('/master/clientes');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error(error.message || 'Erro ao excluir cliente.');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddRubiCredits = () => {
    const valueStr = prompt('Digite o valor de créditos Rubi a serem adicionados:', '500');
    if (valueStr === null) return;
    const value = parseInt(valueStr, 10);
    if (isNaN(value) || value <= 0) {
      toast.error('Valor de créditos inválido.');
      return;
    }
    setRubiCredits(prev => prev + value);
    toast.success(`${value} créditos Rubi adicionados com sucesso ao saldo do cliente!`);
  };

  const handleGenerateManualRenewalCharge = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Gerando fatura de renovação de plano no gateway...',
        success: 'Fatura de cobrança de renovação gerada! Link enviado para o e-mail master do cliente.',
        error: 'Erro ao processar renovação.'
      }
    );
  };

  if (loading) {
    return <div style={styles.loading}>Sincronizando dados do cliente...</div>;
  }

  if (!client) {
    return (
      <div style={styles.errorContainer}>
        <AlertCircle size={48} color="#EF4444" />
        <h2>Cliente não encontrado</h2>
        <button onClick={() => navigate('/master/clientes')} style={styles.backBtn}>Voltar para Lista</button>
      </div>
    );
  }

  const company = client.companies;
  const plan = company?.plans;

  return (
    <div style={styles.container} className="animate-fade-in">
      {/* HEADER */}
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/master/clientes')}>
          <ArrowLeft size={20} /> Voltar para Clientes
        </button>
        <div style={styles.headerContent}>
          <div style={{display: 'flex', gap: '24px', alignItems: 'center'}}>
            <div style={{
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              backgroundColor: '#0061FF', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '800',
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)'
            }}>
              {client.logo_url ? <img src={client.logo_url} style={{width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover'}} /> : (client.name || 'U')[0]}
            </div>
            <div style={styles.titleGroup}>
              <h1 style={styles.title}>{client.name}</h1>
              <div style={styles.badgeRow}>
                <span style={{...styles.statusBadge, backgroundColor: company?.status === 'active' ? '#EFF6FF' : '#FEF2F2', color: company?.status === 'active' ? '#0061FF' : '#EF4444'}}>
                  {company?.status === 'active' ? '● Ativo' : '● Bloqueado'}
                </span>
                <span style={{...styles.productBadge, backgroundColor: '#F0F7FF', color: '#0061FF'}}>
                  <Zap size={12} fill="#0061FF" /> ZAPTRO CONECTADO
                </span>
              </div>
            </div>
          </div>
          <div style={styles.actions}>
            <button 
              style={styles.chatBtn} 
              onClick={() => navigate(`/master/hubchat?token=4dbc4jv0n196sv9a0bdk&id=${client.id}`)}
              className="hover-scale"
            >
              <MessageSquare size={18} /> Chat
            </button>
            <button style={styles.editBtn} onClick={() => setShowEditModal(true)}>
              <Edit3 size={18} /> Editar Cadastro
            </button>
            <button style={styles.deleteBtn} onClick={handleDeleteClient} disabled={deleting}>
              <Trash2 size={18} /> {deleting ? 'Excluindo...' : 'Excluir Cliente'}
            </button>
          </div>
        </div>
      </header>

      {/* SUMMARY METRICS */}
      <div style={{ ...HUB_METRIC_GRID_STYLE, marginBottom: '40px' }}>
        <HubMetricCard
          label="Receita Gerada"
          value="R$ 12.450,00"
          icon={DollarSign}
          accent="#0061FF"
          topRight={
            <span style={{ color: '#0061FF', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              +12% <TrendingUp size={12} />
            </span>
          }
        />
        <HubMetricCard
          label="Total de Pedidos"
          value="1.240"
          icon={Package}
          accent="#0061FF"
        />
        <HubMetricCard
          label="Rotas Realizadas"
          value="856"
          icon={Truck}
          accent="#F59E0B"
        />
        <HubMetricCard
          label="Saldo Créditos Rubi"
          value={`${rubiCredits} CR`}
          icon={Award}
          accent="#DB2777"
        />
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div style={styles.tabContainer}>
        {[
          { id: 'visao-geral', label: 'Visão Geral' },
          { id: 'operacao', label: 'Operação (Logta)' },
          { id: 'comunicacao', label: 'Comunicação (Zapto)' },
          { id: 'colaboradores', label: 'Colaboradores' },
          { id: 'financeiro', label: 'Financeiro & Créditos' },
          { id: 'logs', label: 'Logs & Auditoria' },
          { id: 'acoes-rubi', label: 'Ações Rubi' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.id ? styles.tabButtonActive : {})
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT VIEWS */}
      <div style={styles.tabContentWrapper}>
        
        {/* VIEW 1: VISÃO GERAL */}
        {activeTab === 'visao-geral' && (
          <div style={styles.contentGrid}>
            <div style={styles.leftCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Building2 size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Dados da Empresa</h2>
                </div>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Razão Social</label><p style={styles.infoText}>{company?.name || client.name}</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>CNPJ / CPF</label><p style={styles.infoText}>{client.document || '---'}</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Responsável</label><p style={styles.infoText}>Alison Silva Thiago</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Segmento</label><p style={styles.infoText}>Distribuição de Bebidas</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>E-mail</label><p style={styles.infoText}>{client.email}</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Telefone</label><p style={styles.infoText}>{client.phone || '---'}</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Endereço</label><p style={styles.infoText}>{client.address || 'Não informado'}</p></div>
                  <div style={styles.infoItem}><label style={styles.infoLabel}>Data de Início</label><p style={styles.infoText}>{new Date(client.created_at).toLocaleDateString('pt-BR')}</p></div>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Sparkles size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Insights da IA</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                   <div style={{padding: '16px', borderRadius: '16px', backgroundColor: '#F0F9FF', border: '1px solid #B9E6FE', display: 'flex', gap: '12px'}}>
                      <AlertCircle size={20} color="#0EA5E9" />
                      <div>
                         <p style={{fontSize: '14px', fontWeight: '800', color: '#0369A1', margin: 0}}>Baixo engajamento detectado</p>
                         <p style={{fontSize: '13px', color: '#0EA5E9', marginTop: '2px'}}>O cliente não acessa a plataforma há 4 dias. Sugerimos um contato de follow-up.</p>
                      </div>
                   </div>
                   <div style={{padding: '16px', borderRadius: '16px', backgroundColor: '#FDF2F8', border: '1px solid #FBCFE8', display: 'flex', gap: '12px'}}>
                      <Zap size={20} color="#DB2777" />
                      <div>
                         <p style={{fontSize: '14px', fontWeight: '800', color: '#9D174D', margin: 0}}>Alta utilização de WhatsApp</p>
                         <p style={{fontSize: '13px', color: '#DB2777', marginTop: '2px'}}>O consumo de créditos aumentou 40% esta semana. Oportunidade de Upsell de plano.</p>
                      </div>
                   </div>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Link2 size={20} color="#64748B" /></div>
                  <h2 style={styles.cardTitle}>Hub de Integrações</h2>
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                   <div style={styles.integrationItem}>
                      <div style={{...styles.dot, backgroundColor: '#0061FF', marginRight: '8px'}} />
                      <span>Zapto API</span>
                      <ExternalLink size={14} style={{marginLeft: 'auto'}} />
                   </div>
                   <div style={styles.integrationItem}>
                      <div style={{...styles.dot, backgroundColor: '#0061FF', marginRight: '8px'}} />
                      <span>Google Maps</span>
                   </div>
                   <div style={styles.integrationItem}>
                      <div style={{...styles.dot, backgroundColor: '#94A3B8', marginRight: '8px'}} />
                      <span>Bling ERP</span>
                   </div>
                   <div style={styles.integrationItem}>
                      <div style={{...styles.dot, backgroundColor: '#0061FF', marginRight: '8px'}} />
                      <span>S3 Storage</span>
                   </div>
                </div>
              </section>
            </div>

            <div style={styles.rightCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Layout size={20} color="#F59E0B" /></div>
                  <h2 style={styles.cardTitle}>Mix de Produtos</h2>
                </div>
                <div style={styles.productStack}>
                  <div style={styles.productItem}>
                    <div style={styles.productMain}>
                      <div style={styles.prodIcon}><Zap size={18} color="#0061FF" /></div>
                      <div>
                        <h4 style={styles.prodName}>{plan?.name || 'Plano Logta SaaS'}</h4>
                        <p style={styles.prodSub}>Próximo Vencimento: 12/06</p>
                      </div>
                      <div style={styles.prodPrice}>R$ {plan?.price || '0,00'}<span>/mês</span></div>
                    </div>
                  </div>

                  <div 
                    onClick={handleToggleBackup}
                    style={{
                      ...styles.productItem, 
                      opacity: company?.backup_enabled ? 1 : 0.6,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      border: company?.backup_enabled ? '2px solid #0061FF' : '1px solid #E2E8F0',
                    }}
                    className="hover-scale"
                  >
                    <div style={styles.productMain}>
                      <div style={styles.prodIcon}><HardDrive size={18} color="#0061FF" /></div>
                      <div>
                        <h4 style={styles.prodName}>Backup cloud Logta</h4>
                        <p style={styles.prodSub}>{company?.storage_limit_gb || 5}GB Contratados</p>
                      </div>
                      <span style={{
                        ...styles.statusTag,
                        backgroundColor: company?.backup_enabled ? '#EFF6FF' : '#F1F5F9',
                        color: company?.backup_enabled ? '#0061FF' : '#64748B'
                      }}>{company?.backup_enabled ? 'ATIVO' : 'DESATIVADO'}</span>
                    </div>
                    {company?.backup_enabled && (
                      <div style={styles.usageRow}>
                        <div style={styles.usageBar}><div style={{...styles.usageFill, width: '45%', backgroundColor: '#0061FF'}} /></div>
                        <span style={styles.usageText}>2.2GB / {company?.storage_limit_gb || 5}GB</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Activity size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Histórico de Interação</h2>
                </div>
                <div style={styles.timeline}>
                   <div style={styles.timelineItem}>
                      <div style={styles.timelinePoint} />
                      <div style={styles.timelineContent}>
                         <p style={styles.timelineTitle}>Plano Atualizado</p>
                         <p style={styles.timelineText}>Migração para o Plano SaaS Pro realizada por Admin.</p>
                         <span style={styles.timelineDate}>Hoje, 14:20</span>
                      </div>
                   </div>
                   <div style={styles.timelineItem}>
                      <div style={styles.timelinePoint} />
                      <div style={styles.timelineContent}>
                         <p style={styles.timelineTitle}>Backup Executado</p>
                         <p style={styles.timelineText}>Sincronização completa de 2.2GB realizada com sucesso.</p>
                         <span style={styles.timelineDate}>Ontem, 23:00</span>
                      </div>
                   </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 2: OPERAÇÃO (LOGTA) */}
        {activeTab === 'operacao' && (
          <div style={styles.singleColGrid}>
            {/* MAP CARD */}
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIconBox}><Globe size={20} color="#0061FF" /></div>
                <div>
                  <h2 style={styles.cardTitle}>Torre de Controle Ativa (Localizador)</h2>
                  <p style={{ ...styles.infoLabel, textTransform: 'none', letterSpacing: 'normal', margin: '4px 0 0 0' }}>Sincronização GPS em tempo real de frotas e geofences.</p>
                </div>
                <span style={{ marginLeft: 'auto', backgroundColor: '#EFF6FF', color: '#0061FF', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>
                  IA GUARDIAN ACTIVE
                </span>
              </div>

              {/* REAL INTERACTIVE LEAFLET MAP */}
              <div style={{ height: '360px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }}>
                <HubMap center={[-23.55052, -46.633308]} zoom={12} scrollWheelZoom={false}>
                  {/* Scania R450 Marker */}
                  {truckIcon && (
                    <Marker position={[-23.55052, -46.633308]} icon={truckIcon} />
                  )}
                  {/* Volvo FH540 Marker */}
                  {truckIcon && (
                    <Marker position={[-23.53500, -46.615000]} icon={truckIcon} />
                  )}
                  {/* Car Marker */}
                  {carIcon && (
                    <Marker position={[-23.56500, -46.650000]} icon={carIcon} />
                  )}
                  {/* Problem Icon Marker */}
                  {problemIcon && (
                    <Marker position={[-23.55500, -46.638000]} icon={problemIcon} />
                  )}
                </HubMap>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIconBox}><Truck size={20} color="#0061FF" /></div>
                <h2 style={styles.cardTitle}>Frota e Atividades Operacionais (Logta)</h2>
                <span style={{backgroundColor: '#EFF6FF', color: '#0061FF', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800'}}>
                  5 Veículos Ativos
                </span>
              </div>
              
              <div style={styles.tableCard}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>VEÍCULO</th>
                      <th style={styles.th}>PLACA</th>
                      <th style={styles.th}>MOTORISTA</th>
                      <th style={styles.th}>ÚLTIMA ATIVIDADE</th>
                      <th style={styles.th}>STATUS</th>
                      <th style={{ ...styles.th, textAlign: 'right' }}>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { v: 'Scania R450 Heavy', p: 'BRA-3D12', m: 'Ricardo Santos', a: 'Entrega realizada em São Paulo', s: 'Em trânsito', c: '#0061FF' },
                      { v: 'Mercedes-Benz Axor', p: 'LOG-7721', m: 'Claudio Ferreira', a: 'Carga em andamento no armazém', s: 'Carregando', c: '#F59E0B' },
                      { v: 'Volvo FH 540', p: 'ZAP-9908', m: 'Eduardo Lima', a: 'Parada para descanso', s: 'Pausa', c: '#64748B' },
                      { v: 'Scania R500', p: 'MTR-1022', m: 'Carlos Augusto', a: 'Retorno para filiais', s: 'Em trânsito', c: '#0061FF' },
                      { v: 'Ford Cargo 2429', p: 'LOG-1445', m: 'Fabio Junior', a: 'Manutenção periódica de pneus', s: 'Manutenção', c: '#EF4444' }
                    ].map((row, idx) => (
                      <tr 
                        key={idx} 
                        style={{ ...styles.tr, cursor: 'pointer' }}
                        onClick={() => setSelectedVehicle(row)}
                        className="hover-scale"
                      >
                        <td style={{ ...styles.td, fontSize: '13px' }}><strong>{row.v}</strong></td>
                        <td style={{ ...styles.td, fontSize: '12px' }}><code>{row.p}</code></td>
                        <td style={{ ...styles.td, fontSize: '13px' }}>{row.m}</td>
                        <td style={{ ...styles.td, fontSize: '12px' }}><span style={{color: '#64748B'}}>{row.a}</span></td>
                        <td style={styles.td}>
                          <span style={{backgroundColor: `${row.c}15`, color: row.c, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800'}}>
                            {row.s}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <button
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '12px',
                              border: '1px solid rgb(226, 232, 240)',
                              backgroundColor: '#FFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'rgb(71, 85, 105)',
                              transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = `${window.location.origin}/rastreamento-publico?veiculo=${encodeURIComponent(row.v)}&motorista=${encodeURIComponent(row.m)}&origem=CD São Paulo&destino=Base Curitiba&status=${encodeURIComponent(row.s)}&empresa=${encodeURIComponent(client?.name || 'Logta Logística')}`;
                              navigator.clipboard.writeText(link);
                              toast.success('Link de rastreamento copiado com sucesso!');
                            }}
                            title="Compartilhar Rota"
                          >
                            <Share2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 3: COMUNICAÇÃO (ZAPTO) */}
        {activeTab === 'comunicacao' && (
          <div style={styles.contentGrid}>
            <div style={styles.leftCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><MessageSquare size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Instâncias WhatsApp Zapto</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div style={{border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0061FF'}} />
                    <div>
                      <strong style={{fontSize: '15px', color: '#0F172A'}}>Suporte Comercial</strong>
                      <p style={{fontSize: '12px', color: '#94A3B8', margin: '4px 0 0'}}>Instância: zap-prod-01 (Conectado)</p>
                    </div>
                    <span style={{marginLeft: 'auto', fontSize: '13px', fontWeight: '700', color: '#64748B'}}>55 (11) 98765-4321</span>
                  </div>
                  <div style={{border: '1px solid #E2E8F0', borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px'}}>
                    <div style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0061FF'}} />
                    <div>
                      <strong style={{fontSize: '15px', color: '#0F172A'}}>Financeiro & Cobrança</strong>
                      <p style={{fontSize: '12px', color: '#94A3B8', margin: '4px 0 0'}}>Instância: zap-prod-02 (Conectado)</p>
                    </div>
                    <span style={{marginLeft: 'auto', fontSize: '13px', fontWeight: '700', color: '#64748B'}}>55 (11) 91234-5678</span>
                  </div>
                </div>
              </section>
            </div>

            <div style={styles.rightCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Zap size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Estatísticas de Disparo</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div style={styles.progressContainer}>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                        <span style={styles.progressLabel}>Mensagens Enviadas</span>
                        <span style={styles.progressValue}>{whatsAppCredits} / 1.000</span>
                     </div>
                     <div style={styles.progressBar}><div style={{...styles.progressFill, width: '70%', backgroundColor: '#0061FF'}} /></div>
                  </div>
                  <div style={styles.progressContainer}>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                        <span style={styles.progressLabel}>Erros / Retentativas</span>
                        <span style={styles.progressValue}>4%</span>
                     </div>
                     <div style={styles.progressBar}><div style={{...styles.progressFill, width: '4%', backgroundColor: '#EF4444'}} /></div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 4: COLABORADORES */}
        {activeTab === 'colaboradores' && (
          <div style={styles.singleColGrid}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIconBox}><Users size={20} color="#0061FF" /></div>
                <h2 style={styles.cardTitle}>Time do Cliente ({team.length})</h2>
                <button style={styles.secondaryBtn} onClick={() => setShowCollaboratorModal(true)}>
                  <Plus size={18} /> Convidar Colaborador
                </button>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'}}>
                {team.length > 0 ? team.map((member, i) => (
                  <div key={i} style={{border: '1px solid #E2E8F0', padding: '20px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <div style={{...styles.avatarSmall, backgroundColor: i % 2 === 0 ? '#0061FF' : '#0061FF'}}>{(member.full_name || 'U')[0]}</div>
                    <div style={{flex: 1}}>
                      <p style={{fontSize: '15px', fontWeight: '800', color: '#1E293B', margin: 0}}>{member.full_name}</p>
                      <p style={{fontSize: '12px', color: '#64748B', margin: '2px 0 0', fontWeight: '500'}}>{member.email || 'colaborador@empresa.com'}</p>
                      <p style={{fontSize: '11px', color: '#94A3B8', margin: '4px 0 0', fontWeight: '700'}}>{member.role.toUpperCase()}</p>
                    </div>
                    <div style={{...styles.dot, backgroundColor: member.is_active ? '#0061FF' : '#94A3B8'}} />
                  </div>
                )) : <p style={styles.emptyText}>Nenhum colaborador cadastrado.</p>}
              </div>
            </section>
          </div>
        )}

        {/* VIEW 5: FINANCEIRO & CRÉDITOS */}
        {activeTab === 'financeiro' && (
          <div style={styles.contentGrid}>
            <div style={styles.leftCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><CreditCard size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Histórico de Cobranças</h2>
                </div>
                <div style={styles.tableCard}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thead}>
                        <th style={styles.th}>DESCRIÇÃO</th>
                        <th style={styles.th}>VALOR</th>
                        <th style={styles.th}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={styles.tr}>
                        <td style={{ ...styles.td, fontSize: '13px' }}>Mensalidade Plano Ouro (Logta + Zapto)</td>
                        <td style={{ ...styles.td, fontSize: '13px', fontWeight: '600' }}>R$ 497,00</td>
                        <td style={styles.td}><span style={{backgroundColor: '#EFF6FF', color: '#0061FF', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800'}}>PAGO</span></td>
                      </tr>
                      <tr style={styles.tr}>
                        <td style={{ ...styles.td, fontSize: '13px' }}>Mensalidade Plano Ouro (Logta + Zapto)</td>
                        <td style={{ ...styles.td, fontSize: '13px', fontWeight: '600' }}>R$ 497,00</td>
                        <td style={styles.td}><span style={{backgroundColor: '#EFF6FF', color: '#0061FF', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800'}}>PAGO</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div style={styles.rightCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Wallet size={20} color="#0061FF" /></div>
                  <h2 style={styles.cardTitle}>Ações Financeiras Rápidas</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <button onClick={() => setShowRubiModal(true)} style={{...styles.secondaryBtn, height: '48px', justifyContent: 'center'}}>
                    <Plus size={18} /> Adicionar Créditos Rubi
                  </button>
                  <button onClick={() => setShowBillingModal(true)} style={{...styles.primaryBtn, height: '48px', justifyContent: 'center'}}>
                    <CreditCard size={18} /> Gerar Cobrança de Renovação
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 6: LOGS & AUDITORIA */}
        {activeTab === 'logs' && (
          <div style={styles.singleColGrid}>
            <section style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardIconBox}><ShieldCheck size={20} color="#0061FF" /></div>
                <h2 style={styles.cardTitle}>Auditoria de Segurança & Acesso</h2>
              </div>
              <div style={styles.timeline}>
                 <div style={styles.timelineItem}>
                    <div style={styles.timelinePoint} />
                    <div style={styles.timelineContent}>
                       <p style={styles.timelineTitle}>Admin Sincronizou Configurações</p>
                       <p style={styles.timelineText}>Sucesso na execução de Auditoria Global Master do cliente.</p>
                       <span style={styles.timelineDate}>Hoje, 10:45</span>
                    </div>
                 </div>
                 <div style={styles.timelineItem}>
                    <div style={styles.timelinePoint} />
                    <div style={styles.timelineContent}>
                       <p style={styles.timelineTitle}>Sessão de Usuário Iniciada</p>
                       <p style={styles.timelineText}>Colaborador alisonthiago@logta.com acessou via IP 189.12.33.45.</p>
                       <span style={styles.timelineDate}>Ontem, 08:30</span>
                    </div>
                 </div>
                 <div style={styles.timelineItem}>
                    <div style={{...styles.timelinePoint, backgroundColor: '#EF4444'}} />
                    <div style={styles.timelineContent}>
                       <p style={styles.timelineTitle}>Instância Desconectada Temporariamente</p>
                       <p style={styles.timelineText}>Alerta do painel Zapto resolvido pelo sistema de failover.</p>
                       <span style={styles.timelineDate}>05 Mai, 16:22</span>
                    </div>
                 </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 7: AÇÕES RUBI */}
        {activeTab === 'acoes-rubi' && (
          <div style={styles.contentGrid}>
            <div style={styles.leftCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Sparkles size={20} color="#DB2777" /></div>
                  <h2 style={styles.cardTitle}>Painel Rubi Admin</h2>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                  <div style={{padding: '20px', borderRadius: '24px', backgroundColor: '#FDF2F8', border: '1px solid #FBCFE8'}}>
                    <strong style={{color: '#9D174D', fontSize: '15px'}}>O que são Créditos Rubi?</strong>
                    <p style={{fontSize: '13px', color: '#DB2777', marginTop: '6px', lineHeight: '1.5'}}>
                      Os créditos Rubi são a moeda interna premium da Logta, utilizada para disparar fluxos automatizados de WhatsApp, integrar modelos personalizados de inteligência artificial ou habilitar módulos sazonais da operação.
                    </p>
                  </div>
                  <div style={{display: 'flex', gap: '16px'}}>
                    <button onClick={() => setShowRubiModal(true)} style={{...styles.primaryBtn, flex: 1, height: '48px', justifyContent: 'center'}}>
                      Adicionar Créditos Rubi
                    </button>
                    <button onClick={() => setShowBillingModal(true)} style={{...styles.secondaryBtn, flex: 1, height: '48px', justifyContent: 'center'}}>
                      Gerar Cobrança Manual
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div style={styles.rightCol}>
              <section style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}><Award size={20} color="#DB2777" /></div>
                  <h2 style={styles.cardTitle}>Status do Saldo Rubi</h2>
                </div>
                <div style={{textAlign: 'center', padding: '24px 0'}}>
                  <span style={{fontSize: '48px', fontWeight: '900', color: '#DB2777'}}>{rubiCredits} CR</span>
                  <p style={{fontSize: '14px', color: '#94A3B8', marginTop: '8px', fontWeight: '600'}}>Créditos de uso garantido no ecossistema</p>
                </div>
              </section>
            </div>
          </div>
        )}

      </div>

      <LogtaModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Cadastro de Cliente"
        subtitle={`ID: ${client?.id?.substring(0,8) || '---'} • ${client?.name}`}
        size="md"
      >
        <form onSubmit={handleUpdateClient} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Nome do Cliente / Razão Social</label>
            <input
              type="text"
              required
              style={styles.formInput}
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>E-mail de Contato</label>
            <input
              type="email"
              required
              style={styles.formInput}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>WhatsApp / Telefone</label>
            <input
              type="text"
              style={styles.formInput}
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>CNPJ / CPF</label>
              <input
                type="text"
                style={styles.formInput}
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Segmento</label>
              <input
                type="text"
                style={styles.formInput}
                placeholder="Ex: Logística"
                defaultValue="Distribuição de Bebidas"
              />
            </div>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Endereço Completo</label>
            <input
              type="text"
              style={styles.formInput}
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>
          <div style={styles.modalFooter}>
            <button type="button" style={styles.cancelModalBtn} onClick={() => setShowEditModal(false)}>
              Cancelar
            </button>
            <button type="submit" style={styles.saveModalBtn} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </LogtaModal>

      {/* MODAL: ADICIONAR CRÉDITOS RUBI */}
      <LogtaModal
        isOpen={showRubiModal}
        onClose={() => setShowRubiModal(false)}
        title="Adicionar Créditos Rubi"
        subtitle={`Cliente: ${client?.name}`}
        size="md"
      >
        <form onSubmit={handleAddRubiSubmit} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Quantidade de Créditos</label>
            <input
              type="number"
              required
              min="1"
              style={styles.formInput}
              value={rubiAmount}
              onChange={(e) => setRubiAmount(e.target.value)}
              placeholder="Ex: 500"
            />
          </div>
          <div style={styles.modalFooter}>
            <button type="button" style={styles.cancelModalBtn} onClick={() => setShowRubiModal(false)}>
              Cancelar
            </button>
            <button type="submit" style={{ ...styles.saveModalBtn, backgroundColor: '#DB2777', boxShadow: '0 4px 12px rgba(219, 39, 119, 0.25)' }}>
              Confirmar Créditos
            </button>
          </div>
        </form>
      </LogtaModal>

      {/* MODAL: GERAR COBRANÇA DE RENOVAÇÃO */}
      <LogtaModal
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        title="Gerar Cobrança de Renovação"
        subtitle={`Fatura para ${client?.name}`}
        size="md"
      >
        <form onSubmit={handleAddBillingSubmit} style={styles.modalForm}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Descrição da Cobrança</label>
            <input
              type="text"
              required
              style={styles.formInput}
              value={billingDescription}
              onChange={(e) => setBillingDescription(e.target.value)}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Valor (R$)</label>
            <input
              type="text"
              required
              style={styles.formInput}
              value={billingAmount}
              onChange={(e) => setBillingAmount(e.target.value)}
            />
          </div>
          <div style={styles.modalFooter}>
            <button type="button" style={styles.cancelModalBtn} onClick={() => setShowBillingModal(false)}>
              Cancelar
            </button>
            <button type="submit" style={styles.saveModalBtn}>
              Gerar e Enviar Cobrança
            </button>
          </div>
        </form>
      </LogtaModal>

      <LogtaModal
        isOpen={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        title="Convidar Colaborador"
        subtitle={`Empresa: ${client?.name}`}
        size="md"
      >
        <form onSubmit={handleAddCollaboratorSubmit} style={styles.modalForm}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Nome do Colaborador</label>
              <input
                type="text"
                required
                style={styles.formInput}
                value={collabName}
                onChange={(e) => setCollabName(e.target.value)}
                placeholder="Nome Completo"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>E-mail do Colaborador</label>
              <input
                type="email"
                required
                style={styles.formInput}
                value={collabEmail}
                onChange={(e) => setCollabEmail(e.target.value)}
                placeholder="exemplo@empresa.com"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Cargo / Função</label>
              <select
                style={styles.formInput}
                value={collabRole}
                onChange={(e) => setCollabRole(e.target.value)}
              >
                <option value="Administrador">Administrador</option>
                <option value="Gerente">Gerente</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Comercial / Vendas">Comercial / Vendas</option>
                <option value="Logística / Expedição">Logística / Expedição</option>
                <option value="Suporte">Suporte</option>
                <option value="Motorista">Motorista</option>
                <option value="Operacional">Operacional</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Senha Padrão para Acesso</label>
              <input
                type="text"
                required
                style={styles.formInput}
                value={collabPassword}
                onChange={(e) => setCollabPassword(e.target.value)}
                placeholder="Senha de Acesso"
              />
            </div>
          </div>
          <div style={styles.modalFooter}>
            <button type="button" style={styles.cancelModalBtn} onClick={() => setShowCollaboratorModal(false)}>
              Cancelar
            </button>
            <button type="submit" style={{ ...styles.saveModalBtn, backgroundColor: '#0061FF', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' }}>
              Salvar Colaborador
            </button>
          </div>
        </form>
      </LogtaModal>

      {/* MODAL: DETALHES DO VEÍCULO */}
      <LogtaModal
        isOpen={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title="Detalhes da Unidade de Frota"
        subtitle={selectedVehicle ? `${selectedVehicle.v} • Placa: ${selectedVehicle.p}` : ''}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <p style={styles.infoLabel}>Motorista Responsável</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: selectedVehicle?.c || '#0061FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                    {selectedVehicle?.m?.[0] || 'U'}
                  </div>
                  <strong style={{ fontSize: '14px', color: '#1E293B' }}>{selectedVehicle?.m}</strong>
                </div>
             </div>
             <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <p style={styles.infoLabel}>Status de Telemetria</p>
                <p style={{ ...styles.infoText, marginTop: '4px', color: selectedVehicle?.c }}>{selectedVehicle?.s}</p>
             </div>
          </div>
          
          <div style={{ padding: '20px', backgroundColor: '#F0F9FF', borderRadius: '16px', border: '1px solid #B9E6FE' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Activity size={18} color="#0284C7" />
              <strong style={{ fontSize: '14px', color: '#0369A1' }}>Última Atividade Detectada</strong>
            </div>
            <p style={{ fontSize: '13px', color: '#0EA5E9', margin: 0 }}>{selectedVehicle?.a}</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button style={styles.cancelModalBtn} onClick={() => setSelectedVehicle(null)}>
              Fechar
            </button>
            <button 
              style={styles.saveModalBtn} 
              onClick={() => {
                const plate = selectedVehicle.p;
                setSelectedVehicle(null);
                toast.success(`Redirecionando para Rastreamento Público de ${plate}...`);
                navigate(`/rastreamento-publico/${plate}`);
              }}
            >
              Rastreamento em Tempo Real
            </button>
          </div>
        </div>
      </LogtaModal>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px 0' },
  loading: { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF', fontWeight: '800' },
  errorContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  header: { marginBottom: '32px' },
  backBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' },
  titleGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '29px', fontWeight: '500', color: '#000000', margin: 0, letterSpacing: 0 },
  badgeRow: { display: 'flex', gap: '8px' },
  statusBadge: { padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  productBadge: { backgroundColor: 'var(--bg-overlay)', color: '#0061FF', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  actions: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  chatBtn: { backgroundColor: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  editBtn: { backgroundColor: '#2D5BFF', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 16px rgba(45, 91, 255, 0.25)' },
  deleteBtn: { backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2', padding: '12px 28px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' },
  singleColGrid: { display: 'flex', flexDirection: 'column', gap: '32px' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  card: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', position: 'relative' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  cardIconBox: { width: '40px', height: '40px', borderRadius: '24px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0, flex: 1 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  infoLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoText: { fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: 0 },
  avatarSmall: { width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#0061FF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  productStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  productItem: { padding: '20px', borderRadius: '24px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' },
  productMain: { display: 'flex', alignItems: 'center', gap: '16px' },
  prodIcon: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  prodName: { fontSize: '15px', fontWeight: '800', color: '#1E293B', margin: 0 },
  prodSub: { fontSize: '12px', color: '#94A3B8', margin: 0 },
  prodPrice: { marginLeft: 'auto', fontSize: '18px', fontWeight: '800', color: '#0F172A' },
  statusTag: { marginLeft: 'auto', fontSize: '10px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px', backgroundColor: '#E2E8F0', color: '#64748B' },
  usageRow: { marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' },
  usageBar: { flex: 1, height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' },
  usageFill: { height: '100%' },
  usageText: { fontSize: '11px', fontWeight: '700', color: '#64748B' },
  emptyText: { textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '14px', fontStyle: 'italic' },
  integrationItem: { padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' },
  progressContainer: { width: '100%' },
  progressLabel: { fontSize: '12px', fontWeight: '700', color: '#475569' },
  progressValue: { fontSize: '12px', fontWeight: '800', color: '#0061FF' },
  progressBar: { height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '12px' },
  timelineItem: { position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #F1F5F9' },
  timelinePoint: { position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0061FF', border: '2px solid white' },
  timelineContent: { display: 'flex', flexDirection: 'column' },
  timelineTitle: { fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: 0 },
  timelineText: { fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 },
  timelineDate: { fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: '700' },
  
  // TABS STYLES
  tabContainer: { display: 'flex', gap: '8px', backgroundColor: 'white', padding: '6px', borderRadius: '20px', marginBottom: '32px', overflowX: 'auto', width: 'fit-content', maxWidth: '100%', boxSizing: 'border-box' },
  tabButton: { border: 'none', backgroundColor: 'transparent', padding: '10px 20px', borderRadius: '16px', fontSize: '12px', fontWeight: '700', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  tabButtonActive: { backgroundColor: 'rgba(0, 97, 255, 0.08)', color: '#0061FF' },
  tabContentWrapper: { transition: 'all 0.3s' },

  // MODAL STYLES
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 },
  modalContent: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', width: '100%', maxWidth: '580px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '18px', hover: { backgroundColor: '#F1F5F9' } },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  formLabel: { fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' },
  formInput: { padding: '12px 18px', borderRadius: '14px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', color: '#0F172A', fontWeight: '500', transition: 'all 0.2s' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelModalBtn: { backgroundColor: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  saveModalBtn: { backgroundColor: '#0061FF', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' },

  // TABLE STYLES
  tableCard: { backgroundColor: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { textAlign: 'left', backgroundColor: '#F8FAFC' },
  th: { padding: '16px 24px', fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' },
  td: { padding: '16px 24px' }
};

export default CustomerDetail;
