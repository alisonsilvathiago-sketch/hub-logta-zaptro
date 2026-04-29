import React, { useState, useEffect } from 'react';
import { 
  Headphones, Search, Filter, MessageSquare, 
  Clock, AlertCircle, CheckCircle2, User, 
  Building2, Send, ChevronRight, MoreVertical,
  Paperclip, Info, ExternalLink, Activity,
  Users as UsersIcon, TrendingUp, Package, Hash,
  MoreHorizontal, Phone, Mail, X, Shield, Zap, RefreshCw, Lock, ArrowUpRight
} from 'lucide-react';
import { supabase } from '@core/lib/supabase';
import { useAuth } from '@core/context/AuthContext';
import { toastSuccess, toastError, toastLoading, toastDismiss } from '@core/lib/toast';
import Pagination from '@shared/components/Pagination';

import { useSearchParams } from 'react-router-dom';

const MasterReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'support';
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  return (
    <div style={{ minHeight: '100vh' }} className="animate-fade-in">
      <div style={styles.tabHeader}>
        <div style={styles.tabSwitch}>
          {[
            { id: 'support', label: 'Suporte Master', icon: Headphones },
            { id: 'analytics', label: 'Analytics Global', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tabBtn,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} color={activeTab === tab.id ? 'white' : 'var(--text-secondary)'} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'support' && <SupportTicketsContent />}
      {activeTab === 'analytics' && (
        <div style={styles.analyticsContainer} className="animate-slide-up">
           <div style={styles.metricsRow}>
              <div style={styles.miniStat}>
                 <p style={styles.statLabel}>Revenue Growth</p>
                 <h3 style={styles.statValue}>+24.8%</h3>
                 <div style={styles.statTrend}><TrendingUp size={12} /> vs last month</div>
              </div>
              <div style={styles.miniStat}>
                 <p style={styles.statLabel}>Active Tenants</p>
                 <h3 style={styles.statValue}>142</h3>
                 <div style={styles.statTrend}>+5 new today</div>
              </div>
              <div style={styles.miniStat}>
                 <p style={styles.statLabel}>Avg. Latency</p>
                 <h3 style={{...styles.statValue, color: '#10b981'}}>18ms</h3>
                 <div style={styles.statTrend}><Zap size={12} /> Optimization: HIGH</div>
              </div>
              <div style={styles.miniStat}>
                 <p style={styles.statLabel}>SLA Compliance</p>
                 <h3 style={styles.statValue}>99.9%</h3>
                 <div style={styles.statTrend}><Shield size={12} /> 0 outages</div>
              </div>
           </div>

           <div style={styles.analyticsGrid}>
              <div style={styles.chartMain}>
                 <div style={styles.chartHeader}>
                    <h4 style={styles.chartTitle}>Ecosystem Traffic Volume</h4>
                    <div style={styles.chartLegend}>
                       <div style={{...styles.dot, backgroundColor: '#6366F1'}} /> API Calls
                    </div>
                 </div>
                 <div style={styles.chartPlaceholder}>
                    <Activity size={32} color="#f1f5f9" />
                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>Real-time traffic visualization engine active</p>
                 </div>
              </div>
              <div style={styles.topTenants}>
                 <h4 style={styles.chartTitle}>Top Performers</h4>
                 <div style={styles.tenantList}>
                    {[1,2,3].map(i => (
                       <div key={i} style={styles.tenantItem}>
                          <div style={styles.tenantIcon}><Building2 size={14} /></div>
                          <div style={{ flex: 1 }}>
                             <div style={styles.tenantName}>Tenant {i} Enterprise</div>
                             <div style={styles.tenantMeta}>$4,250.00 / mo</div>
                          </div>
                          <ArrowUpRight size={14} color="#10b981" />
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const SupportTicketsContent: React.FC = () => {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState({ open: 0, slaPerc: 85 });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTickets();
    
    // Setup Presence with proper cleanup
    const channel = supabase.channel('online-support-hub');
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => onlineIds.add(p.user_id));
        });
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile) {
          await channel.track({ user_id: profile.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select(`
          *,
          companies:tenant_id(name, logo_url, origin, status, plan, document),
          profiles(full_name, avatar_url, id)
        `, { count: 'exact' });

      if (itemsPerPage !== 'all') {
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;
        query = query.range(from, to);
      }

      if (activeFilter !== 'ALL') {
        query = query.eq('status', activeFilter.toLowerCase());
      }

      const { data, error, count } = await query.order('updated_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
      setTotalCount(count || 0);
      setStats(prev => ({ ...prev, open: data?.filter(t => t.status === 'open').length || 0 }));
      
      if (data && data.length > 0 && !selectedTicket) {
        setSelectedTicket(data[0]);
      }
    } catch (err: any) {
      toastError('Erro de Sincronização: Falha ao carregar chamados master.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentPage, itemsPerPage, activeFilter]);

  const handleItemsPerPageChange = (val: number | 'all') => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCustomerDetailedData = async (tenantId: string) => {
    if (!tenantId) return;
    try {
      const { data: comp } = await supabase.from('companies').select('*').eq('id', tenantId).single();
      const { data: payments } = await supabase.from('master_payments').select('amount').eq('company_id', tenantId).eq('status', 'PAGO');
      const faturamento = (payments || []).reduce((acc, p) => acc + (p.amount || 0), 0);
      const { count: colaboradores } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', tenantId);
      const { count: vendas } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('company_id', tenantId);
      const { count: atendimentos } = await supabase.from('whatsapp_conversations').select('*', { count: 'exact', head: true }).eq('company_id', tenantId);

      setCustomerData({
        ...comp,
        faturamento,
        colaboradores,
        vendas: vendas || 0,
        atendimentos: atendimentos || 0,
        active_users: colaboradores || 0
      });
    } catch (err) {
      console.error('Error fetching customer detailed data', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !profile) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const { data: msgData, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: profile.id,
          content: messageText,
          is_me: true
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, msgData]);

      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
        
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'progress' } : t));
      }

      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      toastError('Erro ao enviar mensagem para o cliente.');
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    const tid = toastLoading('Finalizando chamado e notificando cliente...');
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status: 'resolved', updated_at: new Date().toISOString(), resolved_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);

      if (error) throw error;
      toastSuccess('Chamado master resolvido com sucesso!');
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status: 'resolved' } : t));
      setSelectedTicket({ ...selectedTicket, status: 'resolved' });
    } catch (err: any) {
      toastError('Erro de Protocolo: Falha ao finalizar o atendimento.');
    } finally {
      toastDismiss(tid);
    }
  };

  const scrollToBottom = () => {
    const chatBody = document.getElementById('chat-body-master');
    if (chatBody) {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Suporte Master & Governança</h1>
          <p style={styles.subtitle}>Atendimento estratégico prioritário para administradores Logta/Zaptro.</p>
        </div>
        <div style={styles.stats}>
           <div style={styles.miniStat}>
              <strong style={styles.miniStatValue}>{stats.open}</strong>
              <span style={styles.miniStatLabel}>Tickets Abertos</span>
           </div>
           <div style={styles.miniStatDivider} />
           <div style={styles.miniStat}>
              <strong style={styles.miniStatValue}>{stats.slaPerc}%</strong>
              <span style={styles.miniStatLabel}>SLA Atendido</span>
           </div>
        </div>
      </header>

      <div style={styles.mainGrid}>
         <div style={styles.ticketListSection}>
            <div style={styles.listHeader}>
                <div style={styles.searchBox}>
                   <Search size={16} color="#94a3b8" />
                   <input type="text" placeholder="Filtrar por nome da empresa..." style={styles.searchInput} />
                </div>
               <button style={styles.iconBtn} onClick={fetchTickets} title="Recarregar"><RefreshCw size={16} /></button>
            </div>

            <div style={styles.filterTabs}>
               {['ALL', 'OPEN', 'PROGRESS', 'RESOLVED'].map(f => (
                 <button 
                  key={f} 
                  style={{...styles.filterTab, ...(activeFilter === f ? styles.filterTabActive : {})}}
                  onClick={() => setActiveFilter(f)}
                 >
                   {f === 'ALL' ? 'Todos' : f === 'OPEN' ? 'Novos' : f === 'PROGRESS' ? 'Curso' : 'Fechados'}
                 </button>
               ))}
            </div>
            
            <div style={styles.ticketsContainer}>
               {loading ? (
                 <div style={styles.emptyMsg}>Sincronizando fila de atendimento...</div>
               ) : tickets.length === 0 ? (
                 <div style={styles.emptyMsg}>Nenhum ticket encontrado.</div>
               ) : tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    style={{
                      ...styles.ticketItem,
                      ...(selectedTicket?.id === ticket.id ? styles.ticketItemActive : {})
                    }}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                     <div style={styles.ticketTop}>
                        <div style={styles.companyInfo}>
                           <Building2 size={10} /> {ticket.companies?.name || '---'}
                        </div>
                        <span style={styles.dateText}>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                     <h3 style={styles.ticketSubject}>{ticket.subject || 'Dúvida Técnica Master'}</h3>
                     <div style={styles.ticketFooter}>
                        <div style={styles.clientBadge}>
                           <div style={{...styles.onlineDot, backgroundColor: onlineUsers.has(ticket.profiles?.id) ? '#10b981' : '#cbd5e1'}} />
                           <span style={{fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500'}}>{ticket.profiles?.full_name?.split(' ')[0] || '---'}</span>
                        </div>
                        <div style={{...styles.statusIndicator, color: ticket.status === 'open' ? '#ef4444' : ticket.status === 'progress' ? 'var(--primary)' : '#10b981'}}>
                           {ticket.status?.toUpperCase()}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                <Pagination 
                  currentPage={currentPage}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
            </div>
         </div>

         <div style={styles.chatSection}>
            {selectedTicket ? (
               <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <div style={styles.chatHeader}>
                     <div style={{display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer'}} onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                        <div style={styles.chatAvatarWrapper}>
                           <div style={styles.chatAvatar}>{selectedTicket.companies?.name?.[0]}</div>
                           <div style={{...styles.presenceIndicator, backgroundColor: onlineUsers.has(selectedTicket.profiles?.id) ? '#10b981' : '#cbd5e1'}} />
                        </div>
                        <div>
                           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                              <h2 style={styles.chatTitle}>{selectedTicket.companies?.name}</h2>
                              <div style={styles.statusBadgeMaster}>{selectedTicket.companies?.origin?.toUpperCase()}</div>
                           </div>
                           <p style={styles.chatSub}>
                              {onlineUsers.has(selectedTicket.profiles?.id) ? 'Disponível na plataforma' : 'Offline no momento'}
                           </p>
                        </div>
                     </div>
                     <div style={styles.chatActions}>
                        <button style={styles.infoBtn} onClick={() => setIsDetailsOpen(!isDetailsOpen)} title="Informações do Cliente"><Info size={20} /></button>
                        <button style={styles.resolveBtn} onClick={handleResolveTicket}><CheckCircle2 size={18} /> Finalizar</button>
                     </div>
                  </div>

                  <div style={styles.chatBody} id="chat-body-master">
                     <div style={styles.systemMsg}>
                        <Lock size={12} /> Acesso master autenticado via protocolo Logta-Shield.
                     </div>
                     
                     {messages.map((msg, idx) => (
                       <div key={msg.id || idx} style={{
                         ...styles.messageGroup, 
                         alignSelf: msg.is_me ? 'flex-end' : 'flex-start'
                       }}>
                          <div style={{
                            ...styles.messageBubble,
                            ...(msg.is_me ? styles.masterBubble : styles.clientBubble)
                          }}>
                             {msg.content}
                             <div style={styles.msgTime}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.is_me && <CheckCircle2 size={10} style={{marginLeft: '4px'}} />}
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div style={styles.chatInputArea}>
                     <div style={styles.inputToolbar}>
                        <button style={styles.toolBtn} title="Anexar Arquivo"><Paperclip size={18} /></button>
                        <button style={styles.toolBtn} title="Comandos Rápidos"><Zap size={18} /></button>
                     </div>
                     <form style={styles.inputWrapper} onSubmit={handleSendMessage}>
                        <input 
                          type="text" 
                          placeholder="Digite sua resposta master..." 
                          style={styles.mainInput} 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" style={styles.sendBtn} disabled={!newMessage.trim()}><Send size={18} /></button>
                     </form>
                  </div>

                  {isDetailsOpen && (
                    <div style={styles.detailsSidebar}>
                       <div style={styles.detailsHeader}>
                          <h3 style={{margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--primary)', letterSpacing: '0.4px'}}>PERFIL DO CLIENTE</h3>
                          <button style={styles.closeBtn} onClick={() => setIsDetailsOpen(false)}><X size={20} /></button>
                       </div>
                       
                       <div style={styles.detailsContent}>
                          <div style={styles.clientProfileBox}>
                             <div style={styles.bigAvatar}>{selectedTicket.companies?.name?.[0]}</div>
                             <h4 style={{margin: '16px 0 4px', fontSize: '18px', fontWeight: '500', color: 'var(--text-main)', letterSpacing: '0.2px'}}>{selectedTicket?.companies?.name || 'Hub Client'}</h4>
                             <span style={styles.statusLabelActive}>{selectedTicket?.companies?.status?.toUpperCase() || 'ATIVO'}</span>
                          </div>

                          <div style={styles.insightGrid}>
                             <div style={styles.insightCard}>
                                <TrendingUp size={16} color="#10b981" />
                                <div style={styles.insightLabel}>RECEITA LTV</div>
                                <div style={styles.insightValue}>R$ {customerData?.faturamento?.toLocaleString('pt-BR') || '0,00'}</div>
                             </div>
                             <div style={styles.insightCard}>
                                <UsersIcon size={16} color="var(--primary)" />
                                <div style={styles.insightLabel}>STAFF</div>
                                <div style={styles.insightValue}>{customerData?.colaboradores || 0}</div>
                             </div>
                             <div style={styles.insightCard}>
                                <Package size={16} color="#f59e0b" />
                                <div style={styles.insightLabel}>PEDIDOS</div>
                                <div style={styles.insightValue}>{customerData?.vendas || 0}</div>
                             </div>
                             <div style={styles.insightCard}>
                                <MessageSquare size={16} color="#0ea5e9" />
                                <div style={styles.insightLabel}>CHATS</div>
                                <div style={styles.insightValue}>{customerData?.atendimentos || 0}</div>
                             </div>
                          </div>

                          <div style={styles.detailsSection}>
                             <h5 style={styles.sectionTitle}>CONFIGURAÇÕES MASTER</h5>
                             <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Ecossistema</span>
                                <span style={styles.detailVal}>{customerData?.origin?.toUpperCase() || 'MASTER'}</span>
                             </div>
                             <div style={styles.detailRow}>
                                <span style={styles.detailLabel}>Licença</span>
                                <span style={styles.detailVal}>{customerData?.plan?.toUpperCase() || 'HUB'}</span>
                             </div>
                          </div>

                          <button style={styles.viewFullBtn}>
                             GESTAO CORPORATIVA <ExternalLink size={14} />
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            ) : (
               <div style={styles.emptyChat}>
                  <div style={styles.emptyIconBox}>
                     <Headphones size={48} color="var(--primary)" />
                  </div>
                  <h3 style={{color: 'var(--text-main)', margin: '24px 0 8px', fontWeight: '500', fontSize: '20px'}}>Central de Atendimento Master</h3>
                  <p style={{maxWidth: '320px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6'}}>Selecione uma conversa ao lado para prestar suporte estratégico nível 2 aos seus administradores.</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const styles: Record<string, any> = {
  tabHeader: { padding: '40px 40px 0', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'white' },
  bread: { fontSize: '11px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '1px', textTransform: 'uppercase' },
  tabSwitch: { display: 'flex', backgroundColor: 'var(--bg-secondary)', padding: '6px', borderRadius: '20px', gap: '6px', marginBottom: '-1px', width: 'fit-content' },
  tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', border: 'none', borderRadius: '16px', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', transition: 'all 0.2s' },
  tabActive: { backgroundColor: 'var(--accent)', color: 'white', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' },

  container: { padding: '40px', backgroundColor: 'transparent' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  title: { fontSize: '32px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500', marginTop: '6px' },
  stats: { display: 'flex', alignItems: 'center', gap: '32px', backgroundColor: 'white', padding: '20px 32px', borderRadius: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid var(--border)' },
  miniStat: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  miniStatValue: { fontSize: '24px', color: 'var(--secondary)', fontWeight: '800' },
  miniStatLabel: { fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '4px' },
  miniStatDivider: { width: '1px', height: '40px', backgroundColor: 'var(--border)' },
  
  mainGrid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', height: 'calc(100vh - 320px)' },
  
  ticketListSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  listHeader: { padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', backgroundColor: 'var(--bg-secondary)' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'white', padding: '12px 18px', borderRadius: '20px', border: '1px solid var(--border)' },
  searchInput: { border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '14px', width: '100%', fontWeight: '600', color: 'var(--secondary)' },
  iconBtn: { padding: '12px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '16px', cursor: 'pointer', color: 'var(--accent)', transition: 'all 0.2s' },
  
  filterTabs: { display: 'flex', gap: '8px', padding: '16px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)' },
  filterTab: { padding: '10px 18px', borderRadius: '14px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s' },
  filterTabActive: { backgroundColor: 'var(--secondary)', color: 'white', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' },

  ticketsContainer: { flex: 1, overflowY: 'auto' },
  ticketItem: { padding: '24px', borderBottom: '1px solid var(--bg-secondary)', cursor: 'pointer', transition: 'all 0.2s', borderLeft: '4px solid transparent' },
  ticketItemActive: { backgroundColor: 'var(--bg-active)', borderLeftColor: 'var(--accent)' },
  ticketTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  companyInfo: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: 'var(--accent)', textTransform: 'uppercase' },
  dateText: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' },
  ticketSubject: { fontSize: '15px', fontWeight: '700', color: 'var(--secondary)', marginBottom: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  ticketFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  clientBadge: { display: 'flex', alignItems: 'center', gap: '8px' },
  onlineDot: { width: '8px', height: '8px', borderRadius: '50%' },
  statusIndicator: { fontSize: '10px', fontWeight: '800', letterSpacing: '0.6px' },

  chatSection: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  chatHeader: { padding: '24px 40px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' },
  chatAvatarWrapper: { position: 'relative' },
  chatAvatar: { width: '56px', height: '56px', borderRadius: '18px', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '24px' },
  presenceIndicator: { position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%', border: '3px solid white' },
  chatTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--secondary)', margin: 0, letterSpacing: '-0.5px' },
  chatSub: { fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0', fontWeight: '500' },
  statusBadgeMaster: { fontSize: '10px', fontWeight: '800', color: 'white', backgroundColor: 'var(--secondary)', padding: '4px 10px', borderRadius: '8px', textTransform: 'uppercase' },
  chatActions: { display: 'flex', gap: '16px' },
  infoBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'white', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  resolveBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' },

  chatBody: { flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-secondary)' },
  systemMsg: { alignSelf: 'center', fontSize: '11px', color: 'var(--accent)', backgroundColor: 'var(--bg-active)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontWeight: '700' },
  messageGroup: { maxWidth: '75%', display: 'flex', flexDirection: 'column' },
  messageBubble: { padding: '16px 24px', fontSize: '15px', lineHeight: '1.6', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  clientBubble: { backgroundColor: 'white', color: 'var(--secondary)', borderRadius: '0 24px 24px 24px', border: '1px solid var(--border)', fontWeight: '500' },
  masterBubble: { backgroundColor: 'var(--secondary)', color: 'white', borderRadius: '24px 24px 0 24px', fontWeight: '500' },
  msgTime: { fontSize: '10px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', opacity: 0.7, fontWeight: '700' },

  chatInputArea: { padding: '24px 40px', borderTop: '1px solid var(--border)', backgroundColor: 'white' },
  inputToolbar: { display: 'flex', gap: '20px', marginBottom: '16px' },
  toolBtn: { border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' },
  inputWrapper: { display: 'flex', gap: '16px', backgroundColor: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '20px', alignItems: 'center' },
  mainInput: { flex: 1, border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '600', color: 'var(--secondary)' },
  sendBtn: { width: '48px', height: '48px', borderRadius: '16px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' },

  detailsSidebar: { position: 'absolute', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: 'white', borderLeft: '1px solid var(--border)', zIndex: 10, display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)' },
  detailsHeader: { padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)' },
  detailsContent: { flex: 1, overflowY: 'auto', padding: '32px' },
  clientProfileBox: { textAlign: 'center', marginBottom: '40px' },
  bigAvatar: { width: '96px', height: '96px', borderRadius: '32px', backgroundColor: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '700', margin: '0 auto' },
  statusLabelActive: { fontSize: '10px', fontWeight: '800', color: '#16A34A', backgroundColor: '#F0FDF4', padding: '6px 16px', borderRadius: '12px', textTransform: 'uppercase' },

  insightGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' },
  insightCard: { padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  insightLabel: { fontSize: '10px', fontWeight: '800', color: 'var(--text-secondary)', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.8px' },
  insightValue: { fontSize: '18px', fontWeight: '800', color: 'var(--secondary)', marginTop: '4px' },

  detailsSection: { backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '24px', marginBottom: '32px', border: '1px solid var(--border)' },
  sectionTitle: { fontSize: '11px', fontWeight: '800', color: 'var(--text-secondary)', margin: '0 0 16px', textTransform: 'uppercase' },
  detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
  detailLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' },
  detailVal: { fontSize: '13px', color: 'var(--secondary)', fontWeight: '700' },

  viewFullBtn: { width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: 'var(--secondary)', color: 'white', border: 'none', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' },
  closeBtn: { border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' },

  emptyChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' },
  emptyIconBox: { width: '120px', height: '120px', borderRadius: '40px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid var(--border)' },
  emptyMsg: { padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '15px', fontWeight: '600' },

  analyticsContainer: { padding: '40px' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' },
  chartMain: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  chartPlaceholder: { height: '350px', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  topTenants: { backgroundColor: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
  tenantItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border)', transition: 'all 0.2s' },
};

export default MasterReports;
