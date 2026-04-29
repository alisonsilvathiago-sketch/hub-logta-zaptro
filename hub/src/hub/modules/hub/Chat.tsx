import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Hash, MessageSquare, AtSign, Paperclip, 
  Send, Video, FileText, BarChart2, MoreVertical, 
  Plus, Bell, Info, Smile, Image as ImageIcon,
  Check, CheckCheck, Clock, Shield, Users, Pin, ChevronRight, X,
  Search as SearchIcon, ArrowLeft, Archive, Trash2, VolumeX, Settings,
  CreditCard, DollarSign, Zap, LifeBuoy, Filter, AlertCircle, Headphones
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@core/lib/supabase';
import { googleCalendarApi } from '@core/lib/googleCalendarApi';
import { toastSuccess, toastError, toastInfo } from '@core/lib/toast';

const HubChat: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'operacao', name: 'Operação Logta', type: 'channel', department: 'operacao' });
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  
  // UI states for header actions and sidebars
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(true); // Default open for better overview
  const [activeView, setActiveView] = useState<'chats' | 'tickets'>('chats');
  
  // Mocked data with contextId for filtering
  const [messages, setMessages] = useState<any[]>([
    // Mensagens com contexto de departamento
    { id: 1, sender: 'Alison Thiago', contextId: 'operacao', text: 'Pessoal, a rota de hoje para São Paulo já foi confirmada?', time: new Date(Date.now() - 3600000), status: 'read', type: 'agent' },
    { id: 2, sender: 'Navigator AI', contextId: 'operacao', text: '🤖 Rota SP-01 otimizada: Economia de 12% em combustível detectada.', time: new Date(Date.now() - 3000000), status: 'read', type: 'system' },
    { id: 3, sender: 'CRM Lead Bot', contextId: 'crm', text: 'Novo lead vindo do Facebook Ads: "Transportes LTDA"', time: new Date(Date.now() - 7200000), status: 'read', type: 'system' },
    { id: 4, sender: 'Maria Souza', contextId: 'crm', text: 'Já estou entrando em contato com a Transportes LTDA.', time: new Date(Date.now() - 7000000), status: 'read', type: 'agent' },
    { id: 5, sender: 'Bank API', contextId: 'financeiro', text: 'Confirmação de recebimento: NF-2024-001 liquidada.', time: new Date(Date.now() - 10000000), status: 'read', type: 'system' },
    { id: 6, sender: 'Alison Thiago', contextId: 'financeiro', text: 'Favor conciliar o extrato do Bradesco de ontem.', time: new Date(Date.now() - 9500000), status: 'read', type: 'agent' },
    
    // Mensagens Diretas (DMs) - Alison
    { id: 10, sender: 'Alison Thiago', contextId: 'u1', text: 'Este é o meu canal privado de notas.', time: new Date(Date.now() - 500000), status: 'read', type: 'agent' },
    
    // Mensagens Diretas (DMs) - João
    { id: 20, sender: 'João Silva', contextId: 'u2', text: 'Preciso de ajuda com o meu acesso ao Zaptro.', time: new Date(Date.now() - 1000000), status: 'read', type: 'agent' },
    { id: 21, sender: 'Alison Thiago', contextId: 'u2', text: 'Olá João, vou resetar sua senha agora mesmo.', time: new Date(Date.now() - 800000), status: 'read', type: 'agent' },

    // Support Ticket Simulation
    { id: 41, sender: 'João Silva', contextId: 't-1023', text: 'Olá, preciso de ajuda com o faturamento da Transportadora XP.', time: new Date(Date.now() - 5000000), type: 'customer' },
    { id: 42, sender: 'System', contextId: 't-1023', text: '🤖 Olá João! Recebemos sua solicitação. O departamento FINANCEIRO foi notificado.', time: new Date(Date.now() - 4900000), type: 'system' }
  ]);

  const [users] = useState([
    { id: 'u1', name: 'Alison Thiago', status: 'online', email: 'alison@hub.com', team: 'Core', role: 'Atendente Master' },
    { id: 'u2', name: 'João Silva', status: 'online', email: 'joao@transpxp.com', team: 'Transportadora XP', role: 'Cliente Zaptro', segment: 'Logística', plan: 'Enterprise', since: '6 meses' },
    { id: 'u3', name: 'Maria Souza', status: 'offline', email: 'maria@hub.com', team: 'Design', role: 'Colaboradora' },
    { id: 'u4', name: 'Suporte Zaptro', status: 'online', email: 'suporte@zaptro.com', team: 'Ops', role: 'Atendente' }
  ]);

  const channels = [
    { id: 'operacao', name: 'Operação Logta', lastMsg: 'Status da frota atualizado', time: '14:30', unread: 2, dept: 'operacao' },
    { id: 'crm', name: 'Vendas / CRM', lastMsg: 'Novo lead qualificado', time: '12:15', unread: 0, dept: 'comercial' },
    { id: 'financeiro', name: 'Financeiro', lastMsg: 'Relatório mensal disponível', time: 'Ontem', unread: 0, dept: 'financeiro' }
  ];

  const tickets = [
    { id: 't-1023', name: 'Ticket #1023 - Financeiro', customer: 'João Silva', company: 'Transp. XP', status: 'open', priority: 'high', sla: '08:45:12', dept: 'financeiro' },
    { id: 't-1024', name: 'Ticket #1024 - Suporte', customer: 'Empresa ABC', company: 'ABC Ltda', status: 'pending', priority: 'medium', sla: '11:20:00', dept: 'suporte' }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages based on current selection
  const filteredMessages = messages.filter(m => m.contextId === selectedChannel.id);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages, selectedChannel]);

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
    setMessages([...messages, newMessage]);
    if (!customText) setMessage('');
    
    if (type === 'payment') {
      toastSuccess('Link de pagamento enviado com sucesso!');
      setIsPaymentModalOpen(false);
    }
  };

  const startChatWithUser = (user: any) => {
    setSelectedChannel({ id: user.id, name: user.name, type: 'dm', department: 'comercial' });
    setIsDrawerOpen(false);
  };

  const handleOpenDrive = async () => {
    setIsDriveModalOpen(true);
    setIsDocsLoading(true);
    try {
      const docs = await googleCalendarApi.getRecentDocs();
      setDriveFiles(docs || []);
    } catch (err) {
      toastError('Erro ao carregar Google Drive');
    } finally {
      setIsDocsLoading(false);
    }
  };

  const handleSelectDriveFile = (file: any) => {
    handleSendMessage('file', `Compartilhou: ${file.name}`, { url: file.webViewLink });
    setIsDriveModalOpen(false);
  };

  const selectedUserInfo = users.find(u => u.name === selectedChannel.name) || users[0];

  return (
    <div style={styles.container}>
      {/* SIDEBAR FIXED */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>HubChat</h2>
          <button style={styles.newChatBtn} onClick={() => setIsDrawerOpen(true)}>
            <Plus size={20} />
          </button>
        </div>

        <div style={styles.viewSwitcher}>
          <button 
            style={{...styles.switchBtn, ...(activeView === 'chats' ? styles.switchBtnActive : {})}}
            onClick={() => setActiveView('chats')}
          >
            <MessageSquare size={16} /> Conversas
          </button>
          <button 
            style={{...styles.switchBtn, ...(activeView === 'tickets' ? styles.switchBtnActive : {})}}
            onClick={() => setActiveView('tickets')}
          >
            <LifeBuoy size={16} /> Suporte
            <span style={styles.ticketBadge}>{tickets.length}</span>
          </button>
        </div>

        <div style={styles.searchBox}>
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <input 
            placeholder="Buscar..." 
            style={styles.searchInput} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.sidebarContent}>
          {activeView === 'chats' ? (
            <>
              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionLabel}>Canais Internos</span>
                </div>
                <div style={styles.channelList}>
                  {channels.map(ch => (
                    <div 
                      key={ch.id} 
                      style={{
                        ...styles.channelItem,
                        backgroundColor: selectedChannel.id === ch.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        opacity: selectedChannel.id === ch.id ? 1 : 0.7
                      }}
                      onClick={() => setSelectedChannel({ id: ch.id, name: ch.name, type: 'channel', department: ch.dept })}
                    >
                      <Hash size={18} color={selectedChannel.id === ch.id ? '#6366F1' : 'rgba(255,255,255,0.4)'} />
                      <div style={styles.channelInfo}>
                        <span style={styles.channelName}>{ch.name}</span>
                        <span style={styles.lastMsgText}>{ch.lastMsg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionLabel}>Mensagens Diretas</span>
                </div>
                <div style={styles.dmList}>
                  {users.slice(0, 4).map(user => (
                    <div 
                      key={user.id} 
                      style={{
                        ...styles.dmItem,
                        backgroundColor: selectedChannel.id === user.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                        opacity: selectedChannel.id === user.id ? 1 : 0.7
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
                <span style={styles.sectionLabel}>Tickets em Aberto</span>
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
                    <div style={styles.slaBox}>
                      <Clock size={10} /> {tk.sla}
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
              <div style={styles.avatarHeader}>
                {selectedChannel.type === 'channel' ? <Hash size={20} /> : selectedChannel.type === 'ticket' ? <LifeBuoy size={20} /> : selectedChannel.name[0]}
              </div>
            </div>
            <div>
              <h3 style={styles.headerTitle}>{selectedChannel.name}</h3>
              <span style={styles.headerSubtitle}>
                {selectedChannel.type === 'ticket' ? `SLA Ativo: ${tickets.find(t=>t.id===selectedChannel.id)?.sla}` : `Departamento: ${selectedChannel.department.toUpperCase()}`}
              </span>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={{...styles.headerIconBtn, color: isMembersOpen ? '#6366F1' : '#94A3B8'}} onClick={() => { setIsMembersOpen(!isMembersOpen); setIsInfoOpen(false); setIsPinnedOpen(false); }}><Users size={18} /></button>
            <button style={{...styles.headerIconBtn, color: isPinnedOpen ? '#6366F1' : '#94A3B8'}} onClick={() => { setIsPinnedOpen(!isPinnedOpen); setIsMembersOpen(false); setIsInfoOpen(false); }}><Pin size={18} /></button>
            <button style={styles.headerIconBtn} onClick={() => toastInfo(`Notificações configuradas.`)}><Bell size={18} /></button>
            <button style={{...styles.headerIconBtn, color: isInfoOpen ? '#6366F1' : '#94A3B8'}} onClick={() => { setIsInfoOpen(!isInfoOpen); setIsMembersOpen(false); setIsPinnedOpen(false); }}><Info size={18} /></button>
            <button style={styles.headerIconBtn} onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* MESSAGES LIST SCROLLABLE */}
        <div style={styles.messageContainer} ref={scrollRef}>
          <div style={styles.chatStartNotice}>
            <div style={styles.startAvatar}>{selectedChannel.name[0]}</div>
            <h4 style={styles.startTitle}>{selectedChannel.type === 'ticket' ? `Suporte: ${selectedChannel.name}` : `Conversa com ${selectedChannel.name}`}</h4>
            <p style={styles.startDesc}>
              {selectedChannel.type === 'ticket' 
                ? 'Histórico de atendimento unificado com Logta e Zaptro.' 
                : 'As mensagens aqui são exclusivas para a equipe interna do HUB.'}
            </p>
          </div>

          {filteredMessages.map((msg, i) => (
            <div key={msg.id} style={styles.messageWrapper}>
              <div style={{...styles.messageAvatar, backgroundColor: msg.type === 'system' ? '#F1F5F9' : '#F8FAFC'}}>
                {msg.type === 'system' ? '🤖' : msg.sender[0]}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageSender}>{msg.sender}</span>
                  <span style={styles.messageTime}>{format(msg.time, 'HH:mm')}</span>
                  {msg.type === 'agent' && <span style={styles.agentTag}>Atendente</span>}
                </div>
                
                {msg.type === 'file' ? (
                  <div style={styles.fileCard}>
                    <FileText size={24} color="#6366F1" />
                    <div>
                      <div style={styles.fileName}>{msg.text.split(': ')[1]}</div>
                      <div style={styles.fileLabel}>Google Drive • Visualizar</div>
                    </div>
                  </div>
                ) : msg.type === 'payment' ? (
                  <div style={styles.paymentCard}>
                    <div style={styles.paymentIcon}><DollarSign size={20} /></div>
                    <div style={styles.paymentBody}>
                      <div style={styles.paymentTitle}>Pagamento Gerado</div>
                      <div style={styles.paymentVal}>R$ {msg.metadata?.amount || '0,00'} • {msg.metadata?.method?.toUpperCase()}</div>
                      <button style={styles.payBtn}>Ver Detalhes</button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    ...styles.messageText,
                    color: msg.type === 'system' ? '#64748B' : '#334155',
                    fontStyle: msg.type === 'system' ? 'italic' : 'normal',
                    backgroundColor: msg.type === 'system' ? '#F8FAFC' : 'transparent',
                    padding: msg.type === 'system' ? '12px 16px' : '0',
                    borderRadius: '12px'
                  }}>{msg.text}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT FIXED AT BOTTOM */}
        <footer style={styles.chatFooter}>
          <div style={styles.inputWrapper}>
            <div style={styles.inputActions}>
              <button style={styles.actionBtn} onClick={() => setIsPaymentModalOpen(true)} title="Financeiro"><DollarSign size={20} /></button>
              <div style={styles.divider} />
              <button style={styles.actionBtn} onClick={() => handleSendMessage('meet', 'Gerou um link do Google Meet', { url: 'meet.google.com/abc' })}><Video size={20} /></button>
              <button style={styles.actionBtn} onClick={handleOpenDrive}><FileText size={20} /></button>
              <button style={styles.actionBtn}><ImageIcon size={20} /></button>
            </div>
            
            <input 
              style={styles.mainInput} 
              placeholder={`Escrever para ${selectedChannel.name}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            />
            
            <div style={styles.inputTools}>
              <button style={styles.toolBtn}><Smile size={20} /></button>
              <button style={styles.sendBtn} onClick={() => handleSendMessage()}><Send size={18} /></button>
            </div>
          </div>
        </footer>
      </div>

      {/* RIGHT SIDEBAR (CLIENT PROFILE / INFO) */}
      {isInfoOpen && (
        <aside style={styles.rightSidebar}>
          <div style={styles.rightSidebarHeader}>
            <h3 style={styles.rightSidebarTitle}>Perfil do Cliente</h3>
            <button style={styles.closeSidebarBtn} onClick={() => setIsInfoOpen(false)}><X size={18} /></button>
          </div>
          
          <div style={styles.rightSidebarContent}>
            <div style={styles.profileHero}>
              <div style={styles.heroAvatar}>{selectedUserInfo.name[0]}</div>
              <h4 style={styles.heroName}>{selectedUserInfo.name}</h4>
              <span style={styles.heroBadge}>{selectedUserInfo.role}</span>
              <div style={styles.heroStatus}><div style={{...styles.statusDotSmall, backgroundColor: '#10B981'}} /> Online Agora</div>
            </div>

            <div style={styles.infoGrid}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Empresa</span>
                <span style={styles.infoValue}>{selectedUserInfo.team}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Segmento</span>
                <span style={styles.infoValue}>{selectedUserInfo.segment || 'Core Team'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Plano SaaS</span>
                <span style={{...styles.infoValue, color: '#6366F1', fontWeight: '800'}}>{selectedUserInfo.plan || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Tempo de Casa</span>
                <span style={styles.infoValue}>{selectedUserInfo.since || 'Recente'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Última Compra</span>
                <span style={styles.infoValue}>15 de Abr, 2024</span>
              </div>
            </div>

            <div style={styles.actionSection}>
              <h5 style={styles.sectionSubTitle}>Ações Rápidas</h5>
              <div style={styles.quickActions}>
                <button style={styles.qBtn}><Zap size={14} /> Ativar Créditos</button>
                <button style={styles.qBtn}><LifeBuoy size={14} /> Novo Ticket</button>
                <button style={styles.qBtn}><DollarSign size={14} /> Ver Faturas</button>
              </div>
            </div>

            <div style={styles.historySection}>
              <h5 style={styles.sectionSubTitle}>Histórico de Tickets</h5>
              <div style={styles.historyList}>
                <div style={styles.historyItem}>
                  <div style={styles.historyTop}><span>#982 - Falha Login</span> <span style={styles.historyStatus}>Resolvido</span></div>
                  <span style={styles.historyDate}>Ontem • Atendente Maria</span>
                </div>
                <div style={styles.historyItem}>
                  <div style={styles.historyTop}><span>#975 - Créditos</span> <span style={styles.historyStatus}>Resolvido</span></div>
                  <span style={styles.historyDate}>Segunda • Atendente Alison</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Gerar Cobrança (Chat)</h3>
              <button style={styles.closeBtn} onClick={() => setIsPaymentModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Valor da Cobrança</label>
                <div style={styles.inputWithIcon}>
                  <span>R$</span>
                  <input placeholder="0,00" style={styles.inputInline} id="pay_amount" />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Método de Pagamento</label>
                <select style={styles.selectInline} id="pay_method">
                  <option value="pix">PIX (Imediato)</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="link">Link de Cartão</option>
                </select>
              </div>
              <button style={styles.submitPayBtn} onClick={() => {
                const amt = (document.getElementById('pay_amount') as HTMLInputElement).value;
                const meth = (document.getElementById('pay_method') as HTMLSelectElement).value;
                handleSendMessage('payment', `Gerou um link de pagamento de R$ ${amt}`, { amount: amt, method: meth });
              }}>
                Enviar Link no Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRIVE MODAL */}
      {isDriveModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Google Drive</h3>
              <button style={styles.closeBtn} onClick={() => setIsDriveModalOpen(false)}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              {isDocsLoading ? (
                <div style={styles.loadingBox}>Sincronizando...</div>
              ) : (
                <div style={styles.driveGrid}>
                  {driveFiles.map(file => (
                    <div key={file.id} style={styles.driveFileItem} onClick={() => handleSelectDriveFile(file)}>
                      <FileText size={24} color="#4285F4" />
                      <div style={styles.driveFileName}>{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: '100%', backgroundColor: '#F8FAFC', overflow: 'hidden', width: '100%', position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  
  // SIDEBAR
  sidebar: { width: '340px', backgroundColor: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sidebarTitle: { fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-1px' },
  newChatBtn: { width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' },
  
  viewSwitcher: { display: 'flex', gap: '4px', padding: '0 20px 20px' },
  switchBtn: { flex: 1, padding: '10px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  switchBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' },
  ticketBadge: { backgroundColor: '#EF4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '8px' },
  
  searchBox: { margin: '0 20px 20px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', fontSize: '14px', outline: 'none', width: '100%', color: 'white' },
  sidebarContent: { flex: 1, overflowY: 'auto', padding: '0 12px 40px' },
  section: { marginBottom: '32px' },
  sectionHeader: { padding: '0 12px', marginBottom: '12px' },
  sectionLabel: { fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px' },
  
  channelItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  channelInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  channelName: { fontSize: '15px', fontWeight: '800', color: 'white' },
  lastMsgText: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  
  dmItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '14px', cursor: 'pointer' },
  avatarMini: { width: '38px', height: '38px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  avatarWrapper: { position: 'relative' },
  statusDotInner: { width: '10px', height: '10px', borderRadius: '50%', position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid #0F172A' },
  dmInfo: { display: 'flex', flexDirection: 'column' },
  dmName: { fontSize: '15px', fontWeight: '800', color: 'white' },
  dmTeam: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },

  ticketItem: { padding: '16px', borderRadius: '16px', cursor: 'pointer', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ticketName: { fontSize: '14px', fontWeight: '800', color: 'white' },
  priorityDot: { width: '8px', height: '8px', borderRadius: '50%' },
  ticketBody: { display: 'flex', flexDirection: 'column', gap: '4px' },
  ticketCust: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  slaBox: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#EF4444', fontWeight: '800' },

  // CHAT AREA
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' },
  chatHeader: { padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
  avatarHeader: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#F1F5F9', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' },
  headerTitle: { fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: 0 },
  headerSubtitle: { fontSize: '12px', color: '#94A3B8', fontWeight: '700' },
  headerActions: { display: 'flex', gap: '4px' },
  headerIconBtn: { width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  messageContainer: { flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' },
  chatStartNotice: { padding: '40px 0', textAlign: 'center', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' },
  startAvatar: { width: '80px', height: '80px', borderRadius: '24px', backgroundColor: '#F8FAFC', color: '#6366F1', fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #F1F5F9' },
  startTitle: { fontSize: '20px', fontWeight: '900', marginBottom: '8px' },
  startDesc: { fontSize: '14px', color: '#94A3B8', maxWidth: '320px', margin: '0 auto' },
  
  messageWrapper: { display: 'flex', gap: '16px' },
  messageAvatar: { width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#6366F1', fontSize: '14px', flexShrink: 0 },
  messageContent: { flex: 1 },
  messageHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' },
  messageSender: { fontSize: '15px', fontWeight: '900', color: '#0F172A' },
  messageTime: { fontSize: '11px', color: '#CBD5E1', fontWeight: '700' },
  agentTag: { fontSize: '10px', backgroundColor: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: '100px', fontWeight: '800', textTransform: 'uppercase' },
  messageText: { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: 0 },

  paymentCard: { marginTop: '12px', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', color: 'white', display: 'flex', gap: '16px', maxWidth: '340px' },
  paymentIcon: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  paymentTitle: { fontSize: '13px', fontWeight: '700', opacity: 0.9 },
  paymentVal: { fontSize: '18px', fontWeight: '900', marginBottom: '12px' },
  payBtn: { padding: '8px 16px', borderRadius: '10px', border: 'none', backgroundColor: 'white', color: '#6366F1', fontWeight: '800', fontSize: '12px', cursor: 'pointer' },

  chatFooter: { padding: '0 32px 32px' },
  inputWrapper: { padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' },
  inputActions: { display: 'flex', gap: '8px' },
  mainInput: { flex: 1, border: 'none', backgroundColor: 'transparent', outline: 'none', fontSize: '15px', fontWeight: '600' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#6366F1', color: 'white', border: 'none', cursor: 'pointer' },

  // RIGHT SIDEBAR
  rightSidebar: { width: '360px', backgroundColor: 'white', borderLeft: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' },
  rightSidebarHeader: { padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  rightSidebarTitle: { fontSize: '16px', fontWeight: '900' },
  profileHero: { padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid #F1F5F9' },
  heroAvatar: { width: '72px', height: '72px', borderRadius: '24px', backgroundColor: '#6366F1', color: 'white', fontSize: '28px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  heroName: { fontSize: '18px', fontWeight: '900', margin: '0 0 4px' },
  heroBadge: { fontSize: '11px', color: '#6366F1', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#EEF2FF', padding: '4px 12px', borderRadius: '100px' },
  heroStatus: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: '700', marginTop: '12px' },
  
  infoGrid: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid #F1F5F9' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: '12px', color: '#94A3B8', fontWeight: '700' },
  infoValue: { fontSize: '13px', color: '#0F172A', fontWeight: '800' },

  actionSection: { padding: '24px' },
  sectionSubTitle: { fontSize: '12px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' },
  quickActions: { display: 'flex', flexDirection: 'column', gap: '8px' },
  qBtn: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #F1F5F9', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#334155' },

  historySection: { padding: '24px', flex: 1, overflowY: 'auto' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  historyItem: { padding: '12px', borderRadius: '12px', backgroundColor: '#F8FAFC' },
  historyTop: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '800', marginBottom: '4px' },
  historyStatus: { color: '#10B981' },
  historyDate: { fontSize: '11px', color: '#94A3B8' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: 'white', borderRadius: '28px', width: '400px', padding: '0', overflow: 'hidden' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' },
  modalBody: { padding: '24px' },
  formGroup: { marginBottom: '16px' },
  label: { fontSize: '12px', fontWeight: '800', color: '#94A3B8', display: 'block', marginBottom: '8px' },
  inputInline: { flex: 1, border: 'none', outline: 'none', fontSize: '24px', fontWeight: '900' },
  inputWithIcon: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: '900' },
  selectInline: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: '700' },
  submitPayBtn: { width: '100%', padding: '16px', borderRadius: '16px', backgroundColor: '#6366F1', color: 'white', border: 'none', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginTop: '12px' }
};

export default HubChat;
