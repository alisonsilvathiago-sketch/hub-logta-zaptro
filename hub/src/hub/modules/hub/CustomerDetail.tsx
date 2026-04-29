import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, CreditCard, HardDrive, 
  ArrowLeft, Mail, Phone, MapPin, ExternalLink,
  ShieldCheck, Zap, History, ChevronRight,
  MoreVertical, Edit3, MessageSquare, Plus,
  Layout, Globe, Wallet, Target, Calendar, AlertCircle,
  TrendingUp, Package, Truck, DollarSign, Activity,
  BarChart3, Link2, Clock, Sparkles
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';

const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*, companies(*, plans(*))')
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      if (clientData?.company_id) {
        const { data: teamData } = await supabase
          .from('collaborators')
          .select('*')
          .eq('profile_id', clientData.companies.id);
        setTeam(teamData || []);

        const { data: backupData } = await supabase
          .from('backups')
          .select('*')
          .eq('client_id', clientData.company_id)
          .order('created_at', { ascending: false });
        setBackups(backupData || []);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setLoading(false);
    }
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
              backgroundColor: '#6366F1', 
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
                <span style={{...styles.statusBadge, backgroundColor: company?.status === 'active' ? '#ECFDF5' : '#FEF2F2', color: company?.status === 'active' ? '#10B981' : '#EF4444'}}>
                  {company?.status === 'active' ? '● Ativo' : '● Bloqueado'}
                </span>
                <span style={{...styles.productBadge, backgroundColor: '#EEF2FF', color: '#6366F1'}}>
                  <Zap size={12} fill="#6366F1" /> ZAPTRO CONECTADO
                </span>
              </div>
            </div>
          </div>
          <div style={styles.actions}>
            <button style={styles.secondaryBtn}><MessageSquare size={18} /> Chat</button>
            <button style={{...styles.secondaryBtn, border: '1px solid #E2E8F0'}}><BarChart3 size={18} /> Relatórios</button>
            <button style={styles.primaryBtn}><Edit3 size={18} /> Editar Cadastro</button>
          </div>
        </div>
      </header>

      {/* SUMMARY METRICS */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#EEF2FF'}}><DollarSign size={20} color="#6366F1" /></div>
          <div>
            <p style={styles.summaryLabel}>Receita Gerada</p>
            <h3 style={styles.summaryValue}>R$ 12.450,00</h3>
          </div>
          <div style={{...styles.trendTag, color: '#10B981'}}>+12% <TrendingUp size={12} /></div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#ECFDF5'}}><Package size={20} color="#10B981" /></div>
          <div>
            <p style={styles.summaryLabel}>Total de Pedidos</p>
            <h3 style={styles.summaryValue}>1.240</h3>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#FFF7ED'}}><Truck size={20} color="#F59E0B" /></div>
          <div>
            <p style={styles.summaryLabel}>Rotas Realizadas</p>
            <h3 style={styles.summaryValue}>856</h3>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={{...styles.summaryIcon, backgroundColor: '#F0F9FF'}}><Activity size={20} color="#0EA5E9" /></div>
          <div>
            <p style={styles.summaryLabel}>Status Financeiro</p>
            <h3 style={{...styles.summaryValue, color: '#10B981'}}>EM DIA</h3>
          </div>
        </div>
      </div>

      <div style={styles.contentGrid}>
        <div style={styles.leftCol}>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconBox}><Building2 size={20} color="#6366F1" /></div>
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
              <div style={styles.cardIconBox}><Sparkles size={20} color="#6366F1" /></div>
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
                  <div style={{...styles.dot, backgroundColor: '#10B981', marginRight: '8px'}} />
                  <span>Zapto API</span>
                  <ExternalLink size={14} style={{marginLeft: 'auto'}} />
               </div>
               <div style={styles.integrationItem}>
                  <div style={{...styles.dot, backgroundColor: '#10B981', marginRight: '8px'}} />
                  <span>Google Maps</span>
               </div>
               <div style={styles.integrationItem}>
                  <div style={{...styles.dot, backgroundColor: '#94A3B8', marginRight: '8px'}} />
                  <span>Bling ERP</span>
               </div>
               <div style={styles.integrationItem}>
                  <div style={{...styles.dot, backgroundColor: '#10B981', marginRight: '8px'}} />
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
                  <div style={styles.prodIcon}><Zap size={18} color="#6366F1" /></div>
                  <div>
                    <h4 style={styles.prodName}>{plan?.name || 'Plano Logta SaaS'}</h4>
                    <p style={styles.prodSub}>Próximo Vencimento: 12/06</p>
                  </div>
                  <div style={styles.prodPrice}>R$ {plan?.price || '0,00'}<span>/mês</span></div>
                </div>
              </div>

              <div style={{...styles.productItem, opacity: company?.backup_enabled ? 1 : 0.5}}>
                <div style={styles.productMain}>
                  <div style={styles.prodIcon}><HardDrive size={18} color="#10B981" /></div>
                  <div>
                    <h4 style={styles.prodName}>Zaptro Backup Cloud</h4>
                    <p style={styles.prodSub}>{company?.storage_limit_gb}GB Contratados</p>
                  </div>
                  <span style={styles.statusTag}>{company?.backup_enabled ? 'ATIVO' : 'DESATIVADO'}</span>
                </div>
                {company?.backup_enabled && (
                  <div style={styles.usageRow}>
                    <div style={styles.usageBar}><div style={{...styles.usageFill, width: '45%', backgroundColor: '#10B981'}} /></div>
                    <span style={styles.usageText}>2.2GB / {company?.storage_limit_gb}GB</span>
                  </div>
                )}
              </div>

              <div style={styles.productItem}>
                <div style={styles.productMain}>
                  <div style={styles.prodIcon}><CreditCard size={18} color="#F59E0B" /></div>
                  <div>
                    <h4 style={styles.prodName}>Créditos WhatsApp / IA</h4>
                    <p style={styles.prodSub}>Uso sob demanda</p>
                  </div>
                </div>
                <div style={{marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <div style={styles.progressContainer}>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                        <span style={styles.progressLabel}>WhatsApp</span>
                        <span style={styles.progressValue}>700 / 1.000</span>
                     </div>
                     <div style={styles.progressBar}><div style={{...styles.progressFill, width: '70%', backgroundColor: '#6366F1'}} /></div>
                  </div>
                  <div style={styles.progressContainer}>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '6px'}}>
                        <span style={styles.progressLabel}>Inteligência IA</span>
                        <span style={styles.progressValue}>150 / 500</span>
                     </div>
                     <div style={styles.progressBar}><div style={{...styles.progressFill, width: '30%', backgroundColor: '#F59E0B'}} /></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconBox}><Clock size={20} color="#6366F1" /></div>
              <h2 style={styles.cardTitle}>Time do Cliente ({team.length})</h2>
              <button style={styles.iconBtn}><Plus size={18} /></button>
            </div>
            <div style={styles.teamList}>
              {team.length > 0 ? team.map((member, i) => (
                <div key={i} style={styles.memberItem}>
                  <div style={{...styles.avatarSmall, backgroundColor: i % 2 === 0 ? '#6366F1' : '#10B981'}}>{(member.full_name || 'U')[0]}</div>
                  <div style={styles.memberInfo}>
                    <p style={styles.memberName}>{member.full_name}</p>
                    <p style={styles.memberRole}>{member.role.toUpperCase()}</p>
                  </div>
                  <div style={{...styles.dot, backgroundColor: member.is_active ? '#10B981' : '#94A3B8'}} />
                </div>
              )) : <p style={styles.emptyText}>Nenhum colaborador vinculado.</p>}
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconBox}><History size={20} color="#64748B" /></div>
              <h2 style={styles.cardTitle}>Últimos Backups</h2>
            </div>
            <div style={styles.historyList}>
              {backups.length > 0 ? backups.map((b, i) => (
                <div key={i} style={styles.historyItem}>
                  <div style={styles.historyLeft}>
                    <ShieldCheck size={16} color="#10B981" />
                    <div>
                      <p style={styles.historyName}>{b.tipo} - Completo</p>
                      <p style={styles.historyDate}>{new Date(b.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <span style={styles.historySize}>{b.tamanho}</span>
                </div>
              )) : <p style={styles.emptyText}>Sem histórico de backups.</p>}
            </div>
          </section>
          <section style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.cardIconBox}><Activity size={20} color="#6366F1" /></div>
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
               <div style={styles.timelineItem}>
                  <div style={{...styles.timelinePoint, backgroundColor: '#EF4444'}} />
                  <div style={styles.timelineContent}>
                     <p style={styles.timelineTitle}>Falha na Integração</p>
                     <p style={styles.timelineText}>Tentativa de conexão com Google Maps falhou (API Key Expired).</p>
                     <span style={styles.timelineDate}>25 Abr, 10:15</span>
                  </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  container: { padding: '40px 0' },
  loading: { height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', fontWeight: '800' },
  errorContainer: { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' },
  header: { marginBottom: '40px' },
  backBtn: { background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginBottom: '24px' },
  headerContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  titleGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  title: { fontSize: '36px', fontWeight: '800', color: '#0F172A', margin: 0, letterSpacing: '-1.5px' },
  badgeRow: { display: 'flex', gap: '8px' },
  statusBadge: { padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  productBadge: { backgroundColor: 'var(--bg-overlay)', color: '#6366F1', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '800' },
  actions: { display: 'flex', gap: '12px' },
  primaryBtn: { backgroundColor: '#6366F1', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: 'white', color: '#64748B', border: '1px solid #E2E8F0', padding: '12px 24px', borderRadius: '22px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  contentGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  rightCol: { display: 'flex', flexDirection: 'column', gap: '32px' },
  card: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', position: 'relative' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  cardIconBox: { width: '40px', height: '40px', borderRadius: '24px', backgroundColor: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0, flex: 1 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  infoItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  infoLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoText: { fontSize: '15px', fontWeight: '600', color: '#1E293B', margin: 0 },
  teamList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  memberItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '24px', backgroundColor: 'var(--bg-secondary)' },
  input: { padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', outline: 'none' },
  textarea: { padding: '12px', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', outline: 'none', minHeight: '100px', resize: 'none' },
  avatarSmall: { width: '32px', height: '32px', borderRadius: '10px', backgroundColor: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: 0 },
  memberRole: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', margin: 0 },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },
  productStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  productItem: { padding: '20px', borderRadius: '24px', backgroundColor: 'var(--bg-overlay)', border: '1px solid var(--border)' },
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
  creditStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' },
  creditBox: { padding: '12px', borderRadius: '24px', backgroundColor: 'white', border: '1px solid #E2E8F0' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  historyItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '24px', border: '1px solid #E2E8F0' },
  historyLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  historyName: { fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: 0 },
  historyDate: { fontSize: '11px', color: '#94A3B8', margin: 0 },
  historySize: { fontSize: '12px', fontWeight: '700', color: '#64748B' },
  emptyText: { textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '14px', fontStyle: 'italic' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6366F1' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  summaryCard: { backgroundColor: 'white', padding: '24px', borderRadius: '32px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' },
  summaryIcon: { width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: '12px', fontWeight: '700', color: '#94A3B8', margin: 0, textTransform: 'uppercase' },
  summaryValue: { fontSize: '20px', fontWeight: '800', color: '#0F172A', margin: '4px 0 0 0' },
  trendTag: { position: 'absolute', top: '24px', right: '24px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' },
  integrationItem: { padding: '12px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#475569' },
  progressContainer: { width: '100%' },
  progressLabel: { fontSize: '12px', fontWeight: '700', color: '#475569' },
  progressValue: { fontSize: '12px', fontWeight: '800', color: '#6366F1' },
  progressBar: { height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '4px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '24px', paddingLeft: '12px' },
  timelineItem: { position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #F1F5F9' },
  timelinePoint: { position: 'absolute', left: '-7px', top: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6366F1', border: '2px solid white' },
  timelineContent: { display: 'flex', flexDirection: 'column' },
  timelineTitle: { fontSize: '14px', fontWeight: '800', color: '#1E293B', margin: 0 },
  timelineText: { fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 },
  timelineDate: { fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: '700' }
};

export default CustomerDetail;
