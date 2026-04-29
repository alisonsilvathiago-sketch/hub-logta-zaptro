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

const CompanyProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { impersonate } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
              <Building2 size={24} color="#6366F1" />
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
          <button style={styles.primaryBtn}><Edit3 size={18} /> Editar Cadastro</button>
        </div>
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
            <div style={styles.mainCol}>
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={styles.cardTitle}>Informações Principais</h3>
                  <button 
                    style={{...styles.primaryBtn, padding: '6px 12px', fontSize: '12px'}} 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Sincronizando...' : 'Salvar Alterações'}
                  </button>
                </div>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>Nome da Empresa</label>
                    <input 
                      style={styles.input} 
                      value={company.name} 
                      onChange={e => setCompany({...company, name: e.target.value})} 
                    />
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>E-mail Master</label>
                    <input 
                      style={styles.input} 
                      value={company.email} 
                      onChange={e => setCompany({...company, email: e.target.value})} 
                    />
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>WhatsApp / Contato</label>
                    <input 
                      style={styles.input} 
                      value={company.phone} 
                      onChange={e => setCompany({...company, phone: e.target.value})} 
                    />
                  </div>
                  <div style={styles.infoItem}>
                    <label style={styles.infoLabel}>CNPJ / Identificador</label>
                    <input 
                      style={styles.input} 
                      value={company.cnpj} 
                      onChange={e => setCompany({...company, cnpj: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div style={styles.statsRow}>
                <div style={styles.statCard}>
                  <Users size={20} color="#6366F1" />
                  <div><h4>{company.collaborators?.length || 0}</h4><p>Colaboradores</p></div>
                </div>
                <div style={styles.statCard}>
                  <Database size={20} color="#10B981" />
                  <div><h4>{company.clients_count || 0}</h4><p>Clientes Base</p></div>
                </div>
                <div style={styles.statCard}>
                  <Truck size={20} color="#F59E0B" />
                  <div><h4>{extraData.vehicles.length}</h4><p>Veículos Ativos</p></div>
                </div>
                <div style={styles.statCard}>
                  <CreditCard size={20} color="#8B5CF6" />
                  <div><h4>R$ {company.mrr || '0,00'}</h4><p>MRR Hub</p></div>
                </div>
              </div>

              <div style={styles.card}>
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
                      <MessageSquare size={16} color="#6366F1" />
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
                  style={{...styles.primaryBtn, width: '100%', marginTop: '16px', backgroundColor: '#6366F1'}} 
                  onClick={() => handleRubyAction('ADD_CREDITS')}
                >
                  <Plus size={18} /> Adicionar Créditos Rubi
                </button>
              </div>
            </div>

            <div style={styles.sideCol}>
              <div style={{...styles.card, backgroundColor: '#0F172A', color: 'white'}}>
                <h3 style={{...styles.cardTitle, color: 'white'}}>Status de Sincronização</h3>
                <div style={styles.syncList}>
                  <div style={styles.syncItem}>
                    <div style={{...styles.syncDot, backgroundColor: extraData.routes.length > 0 ? '#10B981' : '#64748B'}} /> 
                    <span>Logta Engine: {extraData.routes.length > 0 ? 'Operacional' : 'Ocioso'}</span>
                  </div>
                  <div style={styles.syncItem}>
                    <div style={{...styles.syncDot, backgroundColor: extraData.whatsapp.some((w:any) => w.status === 'open') ? '#10B981' : '#F43F5E'}} /> 
                    <span>Zapto API: {extraData.whatsapp.some((w:any) => w.status === 'open') ? 'Conectado' : 'Desconectado'}</span>
                  </div>
                  <div style={styles.syncItem}>
                    <div style={{...styles.syncDot, backgroundColor: '#10B981'}} /> 
                    <span>Sincronia Rubi: Ativa</span>
                  </div>
                </div>
              </div>
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
            <div style={{...styles.adminActionCard, borderLeft: '4px solid #6366F1'}}>
              <Zap color="#6366F1" size={24} />
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
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '24px 0' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontWeight: '800', color: '#6366F1', fontSize: '18px' },
  error: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#EF4444', fontWeight: '800', fontSize: '18px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  backBtn: { width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  avatar: { width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', overflow: 'hidden' },
  logoImg: { width: '100%', height: '100%', objectFit: 'cover' },
  companyName: { fontSize: '28px', fontWeight: '500', color: '#0F172A', margin: 0, letterSpacing: '0.4px', lineHeight: '1.2' },
  statusBadge: { padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.4px' },
  metaRow: { display: 'flex', gap: '16px', marginTop: '4px' },
  metaItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', fontWeight: '500' },
  
  headerActions: { display: 'flex', gap: '12px' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: 'none', backgroundColor: '#6366F1', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.3px' },
  impersonateBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '14px', border: 'none', backgroundColor: '#0F172A', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', letterSpacing: '0.3px' },
  
  tabNav: { display: 'flex', gap: '4px', borderBottom: '1px solid #E2E8F0', marginBottom: '32px' },
  tabBtn: { padding: '12px 20px', border: 'none', background: 'transparent', color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer', borderBottom: '2px solid transparent', letterSpacing: '0.2px' },
  activeTab: { color: '#6366F1', borderBottom: '2px solid #6366F1', fontWeight: '500' },
  
  contentArea: { },
  overviewGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
  
  card: { backgroundColor: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 20px 0', letterSpacing: '0.3px' },
  
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  input: { padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: '500', color: '#0F172A', outline: 'none' },
  
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' },
  
  syncList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  syncItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '600' },
  syncDot: { width: '8px', height: '8px', borderRadius: '50%' },
  
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 12px', fontSize: '14px' },
  roleTag: { padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F1F5F9', fontSize: '11px', fontWeight: '700' },
  
  addBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: 'none', backgroundColor: '#F1F5F9', color: '#6366F1', fontWeight: '700', cursor: 'pointer' },
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
  addOnItem: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', borderRadius: '8px', backgroundColor: '#F8FAF9' }
};

export default CompanyProfile;
