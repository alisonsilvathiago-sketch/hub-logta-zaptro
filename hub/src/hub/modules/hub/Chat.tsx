import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Hash, MessageSquare, AtSign, Paperclip, 
  Send, Video, FileText, BarChart2, MoreVertical, 
  Plus, Bell, Info, Smile, Image as ImageIcon,
  Check, CheckCheck, Clock, Shield, Users, Pin, ChevronRight, X,
  Search as SearchIcon, ArrowLeft, Archive, Trash2, VolumeX, Settings,
  CreditCard, DollarSign, Zap, LifeBuoy, Filter, AlertCircle, Headphones,
  Brain, PieChart, Activity, TrendingUp, UserCheck, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@core/lib/supabase';
import { googleCalendarApi } from '@core/lib/googleCalendarApi';
import { toastSuccess, toastError, toastInfo } from '@core/lib/toast';
import Button from '@shared/components/Button';

const HubChat: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'assistant', name: 'Hub Assistant', type: 'ai', department: 'intelligence' });
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  
  const handleOpenDrive = () => {
    setIsDriveModalOpen(true);
    toastInfo('Sincronizando com Google Drive...');
  };
  
  // UI states
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(true);
  const [activeView, setActiveView] = useState<'chats' | 'tickets' | 'ai'>('ai');
  const [isTyping, setIsTyping] = useState(false);
  
  // State for tickets (Support)
  const [tickets, setTickets] = useState([
    { id: 't-1023', name: 'Ticket #1023 - Financeiro', customer: 'João Silva', company: 'Transp. XP', status: 'open', priority: 'high', sla: '08:45:12', dept: 'financeiro', created_at: new Date(Date.now() - 86400000) },
    { id: 't-1024', name: 'Ticket #1024 - Suporte', customer: 'Empresa ABC', company: 'ABC Ltda', status: 'pending', priority: 'medium', sla: '11:20:00', dept: 'suporte', created_at: new Date(Date.now() - 43200000) }
  ]);

  // Messages with robust types
  const [messages, setMessages] = useState<any[]>([
    { id: 'ai-init', sender: 'Hub Assistant', contextId: 'assistant', text: 'Olá! Sou o assistente inteligente do Hub. Como posso te ajudar hoje? Tente perguntar sobre "relatórios", "usuários ativos" ou "erros no sistema".', time: new Date(), status: 'read', type: 'system' },
    
    // Initial Operation Messages
    { id: 1, sender: 'Alison Thiago', contextId: 'operacao', text: 'Pessoal, a rota de hoje para São Paulo já foi confirmada?', time: new Date(Date.now() - 3600000), status: 'read', type: 'agent' },
    { id: 2, sender: 'Navigator AI', contextId: 'operacao', text: '🤖 Rota SP-01 otimizada: Economia de 12% em combustível detectada.', time: new Date(Date.now() - 3000000), status: 'read', type: 'system' },
    
    // Support Ticket Simulation
    { id: 41, sender: 'João Silva', contextId: 't-1023', text: 'Olá, preciso de ajuda com o faturamento da Transportadora XP.', time: new Date(Date.now() - 5000000), type: 'customer' },
    { id: 42, sender: 'Hub Support', contextId: 't-1023', text: '🤖 Olá João! Recebemos sua solicitação. O departamento FINANCEIRO foi notificado.', time: new Date(Date.now() - 4900000), type: 'system' }
  ]);

  const [users] = useState([
    { id: 'u1', name: 'Alison Thiago', status: 'online', email: 'alison@hub.com', team: 'Core', role: 'Atendente Master' },
    { id: 'u2', name: 'João Silva', status: 'online', email: 'joao@transpxp.com', team: 'Transportadora XP', role: 'Cliente Zaptro', segment: 'Logística', plan: 'Enterprise', since: '6 meses' },
    { id: 'u3', name: 'Maria Souza', status: 'offline', email: 'maria@hub.com', team: 'Design', role: 'Colaboradora' },
    { id: 'u4', name: 'Suporte Zaptro', status: 'online', email: 'suporte@zaptro.com', team: 'Ops', role: 'Atendente' }
  ]);

  const channels = [
    { id: 'assistant', name: 'Hub Assistant', lastMsg: 'Sua IA de suporte e dados', time: 'Agora', unread: 0, dept: 'ai', icon: <Brain size={18} /> },
    { id: 'operacao', name: 'Operação Logta', lastMsg: 'Status da frota atualizado', time: '14:30', unread: 2, dept: 'operacao', icon: <Hash size={18} /> },
    { id: 'crm', name: 'Vendas / CRM', lastMsg: 'Novo lead qualificado', time: '12:15', unread: 0, dept: 'comercial', icon: <TrendingUp size={18} /> },
    { id: 'financeiro', name: 'Financeiro', lastMsg: 'Relatório mensal disponível', time: 'Ontem', unread: 0, dept: 'financeiro', icon: <DollarSign size={18} /> }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const filteredMessages = messages.filter(m => m.contextId === selectedChannel.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages, selectedChannel, isTyping]);

  const simulateAIResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let aiResponse: any = {
        id: Date.now() + 1,
        sender: 'Hub Assistant',
        contextId: 'assistant',
        time: new Date(),
        status: 'sent',
        type: 'system'
      };

      const input = userText.toLowerCase();

      if (input.includes('relatório') || input.includes('analytics') || input.includes('vendas')) {
        aiResponse.text = 'Gerando relatório consolidado de vendas e performance...';
        aiResponse.report = {
          title: 'Resumo Operacional - Abril 2024',
          metrics: [
            { label: 'Receita Total', value: 'R$ 1.240.000', trend: '+12%', color: '#10B981' },
            { label: 'Novos Clientes', value: '42', trend: '+5%', color: '#6366F1' },
            { label: 'Conversão', value: '18.4%', trend: '-2%', color: '#F59E0B' }
          ],
          chartData: [65, 78, 90, 85, 95, 110, 120]
        };
      } else if (input.includes('usuário') || input.includes('ativos')) {
        aiResponse.text = 'Atualmente temos 142 usuários ativos no ecossistema (Logta + Zaptro).';
        aiResponse.metadata = { type: 'users_online', count: 142 };
      } else if (input.includes('erro') || input.includes('problema') || input.includes('crítico')) {
        aiResponse.text = 'Detectei 3 alertas de sistema pendentes de revisão na Infraestrutura.';
        aiResponse.metadata = { type: 'system_errors', errors: ['API Timeout (Zaptro)', 'Redis High Memory', 'Latência DB > 200ms'] };
      } else if (input.includes('suporte') || input.includes('ajuda')) {
        aiResponse.text = 'Você pode gerenciar todos os chamados na aba de "Suporte" ao lado. Deseja que eu abra um novo ticket para você?';
      } else {
        aiResponse.text = 'Entendi seu ponto. Estou processando os dados do sistema para te dar uma resposta precisa sobre isso.';
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendMessage = (type: string = 'text', customText?: string, metadata?: any) => {
    const textToSend = customText || message;
    if (!textToSend.trim() && type === 'text') return;
    
    const newMessage = {
      id: Date.now(),
      sender: 'Alison Thiago',
      text: textToSend,
      time: new Date(),
      status: 'sent',
      contextId: selectedChannel.id,
      type: type === 'text' ? 'agent' : type,
      metadata: metadata || {}
    };
    
    setMessages(prev => [...prev, newMessage]);
    if (!customText) setMessage('');

    // If talking to Assistant, trigger AI
    if (selectedChannel.id === 'assistant' && type === 'text') {
      simulateAIResponse(textToSend);
    }
  };

  const handleSelectChannel = (ch: any) => {
    setSelectedChannel(ch);
    if (ch.id === 'assistant') setActiveView('ai');
    else if (ch.type === 'ticket') setActiveView('tickets');
    else setActiveView('chats');
  };

  const selectedUserInfo = users.find(u => u.name === selectedChannel.name) || users[0];

  return (
    <div style={styles.container}>
      {/* SIDEBAR FIXED */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>HubChat</h2>
          <div style={styles.aiBadge}>MASTER IA</div>
        </div>

        <div style={styles.viewSwitcher}>
          <button 
            style={{...styles.switchBtn, ...(activeView === 'ai' ? styles.switchBtnActive : {})}}
            onClick={() => handleSelectChannel(channels[0])}
          >
            <Brain size={16} /> Inteligência
          </button>
          <button 
            style={{...styles.switchBtn, ...(activeView === 'chats' ? styles.switchBtnActive : {})}}
            onClick={() => setActiveView('chats')}
          >
            <MessageSquare size={16} /> Equipe
          </button>
          <button 
            style={{...styles.switchBtn, ...(activeView === 'tickets' ? styles.switchBtnActive : {})}}
            onClick={() => setActiveView('tickets')}
          >
            <LifeBuoy size={16} /> Suporte
            <span style={styles.ticketBadge}>{tickets.length}</span>
          </button>
        </div>

        <div style={styles.sidebarContent}>
          {activeView === 'ai' || activeView === 'chats' ? (
            <>
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionLabel}>Canais & Inteligência</span>
                </div>
                <div style={styles.channelList}>
                  {channels.map(ch => (
                    <div 
                      key={ch.id} 
                      style={{
                        ...styles.channelItem,
                        backgroundColor: selectedChannel.id === ch.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                        borderLeft: selectedChannel.id === ch.id ? '3px solid #6366F1' : '3px solid transparent'
                      }}
                      onClick={() => handleSelectChannel(ch)}
                    >
                      <div style={{...styles.channelIconBox, color: selectedChannel.id === ch.id ? '#6366F1' : 'rgba(255,255,255,0.4)'}}>
                        {ch.icon}
                      </div>
                      <div style={styles.channelInfo}>
                        <span style={styles.channelName}>{ch.name}</span>
                        <span style={styles.lastMsgText}>{ch.lastMsg}</span>
                      </div>
                      {ch.unread > 0 && <div style={styles.unreadDot} />}
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionLabel}>Conversas Diretas</span>
                </div>
                <div style={styles.dmList}>
                  {users.map(user => (
                    <div 
                      key={user.id} 
                      style={{
                        ...styles.dmItem,
                        backgroundColor: selectedChannel.id === user.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                      }}
                      onClick={() => setSelectedChannel({ id: user.id, name: user.name, type: 'dm', department: 'comercial' })}
                    >
                      <div style={styles.avatarWrapper}>
                        <div style={styles.avatarMini}>{user.name[0]}</div>
                        <div style={{...styles.statusDotInner, backgroundColor: user.status === 'online' ? '#10B981' : '#94A3B8'}} />
                      </div>
                      <div style={styles.dmInfo}>
                        <span style={styles.dmName}>{user.name}</span>
                        <span style={styles.dmTeam}>{user.team}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={styles.ticketList}>
              <div style={styles.sectionHeader}>
                <span style={styles.sectionLabel}>Suporte Operacional</span>
                <button style={styles.newTicketBtn}><Plus size={14} /> Novo</button>
              </div>
              {tickets.map(tk => (
                <div 
                  key={tk.id} 
                  style={{
                    ...styles.ticketItem,
                    backgroundColor: selectedChannel.id === tk.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.05)',
                    borderLeft: `4px solid ${tk.priority === 'high' ? '#EF4444' : '#6366F1'}`
                  }}
                  onClick={() => setSelectedChannel({ id: tk.id, name: tk.name, type: 'ticket', department: tk.dept })}
                >
                  <div style={styles.ticketHeader}>
                    <span style={styles.ticketName}>{tk.name}</span>
                    <span style={{...styles.priorityDot, backgroundColor: tk.priority === 'high' ? '#EF4444' : '#6366F1'}} />
                  </div>
                  <div style={styles.ticketBody}>
                    <span style={styles.ticketCust}>{tk.company} • {tk.customer}</span>
                    <div style={styles.ticketMeta}>
                      <div style={styles.slaBox}>
                        <Clock size={10} /> {tk.sla}
                      </div>
                      <div style={styles.statusTagSidebar}>{(tk.status || '').toUpperCase()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* CHAT AREA FIXED */}
      <div style={styles.chatArea}>
        <header style={styles.chatHeader}>
          <div style={styles.headerInfo}>
            <div style={styles.avatarWrapperHeader}>
              <div style={{...styles.avatarHeader, backgroundColor: selectedChannel.id === 'assistant' ? 'var(--bg-active)' : '#F1F5F9'}}>
                {selectedChannel.id === 'assistant' ? <Brain size={24} color="var(--accent)" /> : selectedChannel.type === 'ticket' ? <LifeBuoy size={20} /> : <Hash size={20} />}
              </div>
            </div>
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <h3 style={styles.headerTitle}>{selectedChannel.name}</h3>
                {selectedChannel.id === 'assistant' && <div style={styles.aiStatusBadge}>OFFICIAL AI</div>}
              </div>
              <span style={styles.headerSubtitle}>
                {selectedChannel.type === 'ai' ? 'Analista de Dados & Assistente Virtual' : selectedChannel.type === 'ticket' ? `Ticket Ativo • SLA ${tickets.find(t=>t.id===selectedChannel.id)?.sla}` : `Hub / ${(selectedChannel.department || '').toUpperCase()}`}
              </span>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.headerIconBtn}><Search size={18} /></button>
            <button style={styles.headerIconBtn}><Pin size={18} /></button>
            <button style={{...styles.headerIconBtn, color: isInfoOpen ? '#6366F1' : '#94A3B8'}} onClick={() => setIsInfoOpen(!isInfoOpen)}><Info size={18} /></button>
            <button style={styles.headerIconBtn}><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* MESSAGES LIST SCROLLABLE */}
        <div style={styles.messageContainer} ref={scrollRef}>
          {selectedChannel.id === 'assistant' && (
            <div style={styles.aiWelcomeBox}>
              <div style={styles.aiIconLarge}><Brain size={48} /></div>
              <h2 style={styles.aiWelcomeTitle}>Hub Intelligence Center</h2>
              <p style={styles.aiWelcomeDesc}>Posso gerar relatórios, analisar erros e gerenciar tickets em tempo real. Como posso ajudar?</p>
              <div style={styles.aiShortcuts}>
                <Button variant="secondary" size="sm" icon={<BarChart2 size={16} />} label="Relatórios" onClick={() => handleSendMessage('text', 'Me mostra os relatórios do sistema')} />
                <Button variant="secondary" size="sm" icon={<Users size={16} />} label="Usuários" onClick={() => handleSendMessage('text', 'Quantos usuários ativos hoje?')} />
                <Button variant="secondary" size="sm" icon={<AlertCircle size={16} />} label="Erros" onClick={() => handleSendMessage('text', 'Quais erros estão acontecendo?')} />
              </div>
            </div>
          )}

          {filteredMessages.map((msg, i) => (
            <div key={msg.id} style={styles.messageWrapper}>
              <div style={{...styles.messageAvatar, backgroundColor: msg.sender === 'Hub Assistant' ? 'rgba(99, 102, 241, 0.1)' : '#F8FAFC'}}>
                {msg.sender === 'Hub Assistant' ? <Brain size={18} color="#6366F1" /> : msg.sender[0]}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageSender}>{msg.sender}</span>
                  <span style={styles.messageTime}>{format(msg.time, 'HH:mm')}</span>
                </div>
                
                <div style={styles.messageText}>{msg.text}</div>

                {msg.report && (
                  <div style={styles.reportCard}>
                    <div style={styles.reportHeader}>
                      <BarChart2 size={18} />
                      <span>{msg.report.title}</span>
                    </div>
                    <div style={styles.metricsGrid}>
                      {msg.report.metrics.map((m: any) => (
                        <div key={m.label} style={styles.metricItem}>
                          <span style={styles.metricLabel}>{m.label}</span>
                          <div style={styles.metricValRow}>
                            <span style={{...styles.metricValue, color: m.color}}>{m.value}</span>
                            <span style={styles.metricTrend}>{m.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={styles.chartPlaceholder}>
                       <div style={{display: 'flex', alignItems: 'flex-end', gap: '8px', height: '60px'}}>
                          {msg.report.chartData.map((v: number, idx: number) => (
                            <div key={idx} style={{flex: 1, height: `${(v/120)*100}%`, backgroundColor: '#6366F1', borderRadius: '4px', opacity: 0.2 + (idx * 0.1)}} />
                          ))}
                       </div>
                    </div>
                    <Button 
                      variant="outline" 
                      fullWidth 
                      label="Ver Detalhes Analíticos" 
                      onClick={() => toastInfo('Abrindo visualização completa de dados...')} 
                    />
                  </div>
                )}

                {msg.metadata?.type === 'system_errors' && (
                  <div style={styles.errorAlertBox}>
                    {msg.metadata.errors.map((err: string) => (
                      <div key={err} style={styles.errorLine}>
                        <ShieldAlert size={14} color="#EF4444" />
                        <span>{err}</span>
                      </div>
                    ))}
                    <Button 
                      variant="danger" 
                      size="sm" 
                      label="Tentar Auto-Correção" 
                      onClick={() => toastInfo('Iniciando protocolos de correção...')} 
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div style={styles.typingIndicator}>
               <Brain size={16} className="animate-pulse" />
               <span>Hub Assistant está analisando os dados...</span>
             </div>
          )}
        </div>

        {/* INPUT FIXED AT BOTTOM */}
        <footer style={styles.chatFooter}>
          <div style={styles.inputWrapper}>
            <div style={styles.inputActions}>
              <button style={styles.actionBtn} title="Insights de Dados"><Activity size={20} /></button>
              <button style={styles.actionBtn} onClick={() => setIsPaymentModalOpen(true)} title="Gerar Cobrança"><DollarSign size={20} /></button>
              <button style={styles.actionBtn} onClick={handleOpenDrive} title="Anexar do Drive"><FileText size={20} /></button>
            </div>
            
            <input 
              style={styles.mainInput} 
              placeholder={selectedChannel.id === 'assistant' ? "Pergunte ao Hub Assistant..." : `Escrever para ${selectedChannel.name}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            />
            
            <div style={styles.inputTools}>
              <Button 
                variant="primary" 
                size="sm" 
                icon={<Send size={18} />} 
                label="" 
                onClick={() => handleSendMessage()} 
                style={{ padding: '10px' }}
              />
            </div>
          </div>
        </footer>
      </div>

      {/* RIGHT SIDEBAR (DYNAMIC CONTEXT) */}
      {isInfoOpen && (
        <aside style={styles.rightSidebar}>
          <div style={styles.rightSidebarHeader}>
            <h3 style={styles.rightSidebarTitle}>Contexto Operacional</h3>
            <button style={styles.closeSidebarBtn} onClick={() => setIsInfoOpen(false)}><X size={18} /></button>
          </div>
          
          <div style={styles.rightSidebarContent}>
             {selectedChannel.type === 'ticket' ? (
                <div style={styles.ticketContext}>
                   <div style={styles.contextHeader}>
                      <div style={styles.contextIcon}><LifeBuoy size={24} /></div>
                      <div>
                        <h4 style={styles.contextTitle}>{selectedChannel.name}</h4>
                        <div style={styles.statusBadgeLarge}>STATUS: {(tickets.find(t=>t.id===selectedChannel.id)?.status || '').toUpperCase()}</div>
                      </div>
                   </div>
                   <div style={styles.infoGrid}>
                      <div style={styles.infoRow}><span style={styles.infoLabel}>Prioridade</span><span style={{color: '#EF4444', fontWeight: '900'}}>ALTA</span></div>
                      <div style={styles.infoRow}><span style={styles.infoLabel}>SLA</span><span>01:14:45 restante</span></div>
                      <div style={styles.infoRow}><span style={styles.infoLabel}>Atendente</span><span>Alison Thiago</span></div>
                   </div>
                   <div style={styles.actionSection}>
                      <Button variant="primary" fullWidth icon={<Check size={16} />} label="Resolver Ticket" onClick={() => toastSuccess('Ticket resolvido com sucesso!')} />
                      <Button variant="outline" fullWidth icon={<Users size={16} />} label="Transferir" style={{ marginTop: '8px' }} />
                   </div>
                </div>
             ) : selectedChannel.id === 'assistant' ? (
                <div style={styles.aiContext}>
                   <div style={styles.aiStatusHeader}>
                      <div style={styles.pulseDot} />
                      <span>INTELIGÊNCIA ATIVA</span>
                   </div>
                   <p style={styles.aiContextDesc}>O Hub Assistant monitora constantemente Logta e Zaptro em busca de anomalias.</p>
                   <div style={styles.aiStatsGrid}>
                      <div style={styles.aiStat}>
                         <span style={styles.statVal}>99.8%</span>
                         <span style={styles.statLab}>Precisão IA</span>
                      </div>
                      <div style={styles.aiStat}>
                         <span style={styles.statVal}>24ms</span>
                         <span style={styles.statLab}>Latência</span>
                      </div>
                   </div>
                   <div style={styles.historySection}>
                      <h5 style={styles.sectionSubTitle}>Últimas Análises</h5>
                      <div style={styles.miniLog}>● Relatório de Vendas mensal gerado</div>
                      <div style={styles.miniLog}>● Backup de segurança validado</div>
                      <div style={styles.miniLog}>● 12 leads processados no CRM</div>
                   </div>
                </div>
             ) : (
                <div style={styles.profileHero}>
                  <div style={styles.heroAvatar}>{selectedUserInfo.name[0]}</div>
                  <h4 style={styles.heroName}>{selectedUserInfo.name}</h4>
                  <span style={styles.heroBadge}>{selectedUserInfo.role}</span>
                  <div style={styles.heroStatus}><div style={{...styles.statusDotSmall, backgroundColor: '#10B981'}} /> Online Agora</div>
                  
                  <div style={styles.infoGrid}>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Empresa</span><span style={styles.infoValue}>{selectedUserInfo.team}</span></div>
                    <div style={styles.infoRow}><span style={styles.infoLabel}>Plano</span><span style={{color: '#6366F1'}}>{selectedUserInfo.plan || 'Enterprise'}</span></div>
                  </div>
                </div>
             )}
          </div>
        </aside>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Gerar Cobrança Instantânea</h3>
              <button style={styles.closeBtn} onClick={() => setIsPaymentModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Valor (R$)</label>
                <input placeholder="0,00" style={styles.modalInput} id="pay_amount" />
              </div>
              <Button 
                variant="primary" 
                fullWidth 
                label="Enviar Link no Chat" 
                onClick={() => {
                  const amt = (document.getElementById('pay_amount') as HTMLInputElement).value;
                  handleSendMessage('payment', `Gerou um link de pagamento de R$ ${amt}`, { amount: amt, method: 'pix' });
                  setIsPaymentModalOpen(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: '100%', backgroundColor: '#F1F5F9', overflow: 'hidden', width: '100%', position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  
  // SIDEBAR
  sidebar: { width: '300px', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sidebarTitle: { fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-1px', margin: 0 },
  aiBadge: { fontSize: '10px', fontWeight: '900', backgroundColor: '#6366F1', color: 'white', padding: '2px 8px', borderRadius: '4px' },
  
  viewSwitcher: { display: 'flex', gap: '4px', padding: '0 16px 20px', flexDirection: 'column' },
  switchBtn: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.2s' },
  switchBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' },
  ticketBadge: { marginLeft: 'auto', backgroundColor: '#EF4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' },
  
  sidebarContent: { flex: 1, overflowY: 'auto', padding: '0 8px 40px' },
  section: { marginBottom: '24px' },
  sectionHeader: { padding: '0 12px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' },
  
  channelList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  channelItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' },
  channelIconBox: { width: '24px', display: 'flex', justifyContent: 'center' },
  channelInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  channelName: { fontSize: '14px', fontWeight: '700', color: 'white' },
  lastMsgText: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  unreadDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366F1' },
  
  dmList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  dmItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer' },
  avatarMini: { width: '32px', height: '32px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' },
  avatarWrapper: { position: 'relative' },
  statusDotInner: { width: '8px', height: '8px', borderRadius: '50%', position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid #0F172A' },
  dmInfo: { display: 'flex', flexDirection: 'column' },
  dmName: { fontSize: '14px', fontWeight: '700', color: 'white' },
  dmTeam: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' },

  ticketItem: { padding: '14px', borderRadius: '12px', cursor: 'pointer', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '6px' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ticketName: { fontSize: '13px', fontWeight: '800', color: 'white' },
  priorityDot: { width: '6px', height: '6px', borderRadius: '50%' },
  ticketBody: { display: 'flex', flexDirection: 'column', gap: '4px' },
  ticketCust: { fontSize: '11px', color: 'rgba(255,255,255,0.5)' },
  ticketMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
  slaBox: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#EF4444', fontWeight: '800' },
  statusTagSidebar: { fontSize: '9px', fontWeight: '900', color: 'white', opacity: 0.6 },
  newTicketBtn: { backgroundColor: 'transparent', border: 'none', color: '#6366F1', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },

  // CHAT AREA
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white', margin: '12px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  chatHeader: { padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarHeader: { width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  headerTitle: { fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 },
  headerSubtitle: { fontSize: '12px', color: '#94A3B8', fontWeight: '700' },
  headerActions: { display: 'flex', gap: '4px' },
  headerIconBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' },
  aiStatusBadge: { fontSize: '9px', fontWeight: '900', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1', padding: '2px 6px', borderRadius: '4px' },

  messageContainer: { flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  aiWelcomeBox: { textAlign: 'center', padding: '40px 20px', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' },
  aiIconLarge: { width: '80px', height: '80px', borderRadius: '24px', backgroundColor: 'rgba(99, 102, 241, 0.05)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  aiWelcomeTitle: { fontSize: '24px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' },
  aiWelcomeDesc: { fontSize: '14px', color: '#64748B', maxWidth: '400px', margin: '0 auto 24px' },
  aiShortcuts: { display: 'flex', justifyContent: 'center', gap: '12px' },
  shortcutBtn: { padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', fontSize: '13px', fontWeight: '800', color: '#334155', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '8px' },
  
  messageWrapper: { display: 'flex', gap: '16px' },
  messageAvatar: { width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#6366F1', fontSize: '13px', flexShrink: 0 },
  messageContent: { flex: 1 },
  messageHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  messageSender: { fontSize: '14px', fontWeight: '900', color: '#0F172A' },
  messageTime: { fontSize: '10px', color: '#CBD5E1', fontWeight: '700' },
  messageText: { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 },

  reportCard: { marginTop: '16px', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', maxWidth: '500px' },
  reportHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '800', color: '#0F172A', marginBottom: '16px' },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' },
  metricItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
  metricLabel: { fontSize: '10px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  metricValRow: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  metricValue: { fontSize: '16px', fontWeight: '900' },
  metricTrend: { fontSize: '9px', fontWeight: '700', opacity: 0.7 },
  chartPlaceholder: { marginBottom: '16px' },
  fullReportBtn: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#6366F1', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },

  errorAlertBox: { marginTop: '12px', padding: '16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' },
  errorLine: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#991B1B' },
  fixBtn: { padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', fontSize: '11px', fontWeight: '800', cursor: 'pointer', alignSelf: 'flex-start' },

  typingIndicator: { display: 'flex', alignItems: 'center', gap: '10px', color: '#6366F1', fontSize: '12px', fontWeight: '700' },

  chatFooter: { padding: '0 24px 24px' },
  inputWrapper: { padding: '8px 12px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' },
  inputActions: { display: 'flex', gap: '4px' },
  actionBtn: { width: '36px', height: '36px', borderRadius: '10px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94A3B8' },
  mainInput: { flex: 1, border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '600', color: '#0F172A' },
  sendBtn: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#6366F1', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // RIGHT SIDEBAR
  rightSidebar: { width: '320px', backgroundColor: 'white', borderLeft: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' },
  rightSidebarHeader: { padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rightSidebarTitle: { fontSize: '15px', fontWeight: '900', margin: 0 },
  rightSidebarContent: { flex: 1, overflowY: 'auto' },
  
  ticketContext: { padding: '24px' },
  contextHeader: { display: 'flex', gap: '16px', marginBottom: '24px' },
  contextIcon: { width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#F1F5F9', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  contextTitle: { fontSize: '16px', fontWeight: '900', margin: '0 0 4px' },
  statusBadgeLarge: { fontSize: '10px', fontWeight: '900', color: '#6366F1', letterSpacing: '0.5px' },
  
  primaryActionBtn: { width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: '#6366F1', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' },
  secondaryActionBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: 'white', color: '#64748B', fontWeight: '800', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },

  aiContext: { padding: '24px' },
  aiStatusHeader: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: '900', color: '#10B981', marginBottom: '16px' },
  pulseDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' },
  aiContextDesc: { fontSize: '13px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' },
  aiStatsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' },
  aiStat: { padding: '16px', borderRadius: '12px', backgroundColor: '#F8FAFC', textAlign: 'center' },
  statVal: { display: 'block', fontSize: '18px', fontWeight: '900', color: '#0F172A' },
  statLab: { fontSize: '10px', fontWeight: '800', color: '#94A3B8' },
  miniLog: { fontSize: '12px', color: '#64748B', marginBottom: '8px' },

  profileHero: { padding: '32px 24px', textAlign: 'center' },
  heroAvatar: { width: '64px', height: '64px', borderRadius: '20px', backgroundColor: '#6366F1', color: 'white', fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  heroName: { fontSize: '16px', fontWeight: '900', margin: '0 0 4px' },
  heroBadge: { fontSize: '10px', color: '#6366F1', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#EEF2FF', padding: '3px 10px', borderRadius: '100px' },
  heroStatus: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: '700', marginTop: '12px' },
  
  infoGrid: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '11px', color: '#94A3B8', fontWeight: '700' },
  infoValue: { fontSize: '12px', color: '#0F172A', fontWeight: '800' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: 'white', borderRadius: '24px', width: '360px', padding: '24px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
  modalTitle: { fontSize: '18px', fontWeight: '900' },
  modalInput: { width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '24px', fontWeight: '900', outline: 'none' },
  formGroup: { marginBottom: '20px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', marginBottom: '8px', display: 'block' },
  submitPayBtn: { width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: '#6366F1', color: 'white', border: 'none', fontWeight: '900', fontSize: '15px', cursor: 'pointer' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' },
  closeSidebarBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }
};

export default HubChat;


