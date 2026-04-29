import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Hash, MessageSquare, AtSign, Paperclip, 
  Send, Video, FileText, BarChart2, MoreVertical, 
  Plus, Bell, Info, Smile, Image as ImageIcon,
  Check, CheckCheck, Clock, Shield, Users, Pin, ChevronRight, X,
  Search as SearchIcon, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { supabase } from '@core/lib/supabase';
import { googleCalendarApi } from '@core/lib/googleCalendarApi';
import { toastSuccess, toastError } from '@core/lib/toast';

const GoogleMeetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10,10,10,10-4.48,10-10S17.52,2,12,2z" fill="#00897B"/>
    <path d="M16.5 12l-4.5 3V9l4.5 3z" fill="white"/>
  </svg>
);

const HubChat: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'operacao', name: 'Operação Logta', type: 'channel' });
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  
  // Mocked data for the Slack-like experience
  const [messages, setMessages] = useState<any[]>([
    { id: 1, sender: 'Alison Thiago', avatar: null, text: 'Pessoal, a rota de hoje para São Paulo já foi confirmada?', time: new Date(Date.now() - 3600000), status: 'read' },
    { id: 2, sender: 'Navigator AI', avatar: null, text: '🤖 Rota SP-01 otimizada: Economia de 12% em combustível detectada. Enviando para motorista.', time: new Date(Date.now() - 3000000), status: 'read', type: 'system' },
    { id: 3, sender: 'Guardian AI', avatar: null, text: '⚠️ Alerta de Geofencing: Veículo ABC-1234 fora do perímetro em Osasco. Bloqueio operacional preventivo ativado.', time: new Date(Date.now() - 1500000), status: 'read', type: 'system' },
    { id: 4, sender: 'Suporte Zaptro', avatar: null, text: 'Acabei de subir o patch para o checkout.', time: new Date(Date.now() - 1200000), status: 'read' }
  ]);

  const [users] = useState([
    { id: 'u1', name: 'Alison Thiago', status: 'online', email: 'alison@hub.com', team: 'Core' },
    { id: 'u2', name: 'João Silva', status: 'away', email: 'joao@hub.com', team: 'Dev' },
    { id: 'u3', name: 'Maria Souza', status: 'offline', email: 'maria@hub.com', team: 'Design' },
    { id: 'u4', name: 'Suporte Zaptro', status: 'online', email: 'suporte@zaptro.com', team: 'Ops' },
    { id: 'u5', name: 'Navigator AI', status: 'online', email: 'navigator@hub.ai', team: 'Autonomous' },
    { id: 'u6', name: 'Guardian AI', status: 'online', email: 'guardian@hub.ai', team: 'Autonomous' }
  ]);

  const channels = [
    { id: 'operacao', name: 'Operação Logta', lastMsg: 'Status da frota atualizado', time: '14:30', unread: 2 },
    { id: 'crm', name: 'Vendas / CRM', lastMsg: 'Novo lead qualificado', time: '12:15', unread: 0 },
    { id: 'financeiro', name: 'Financeiro', lastMsg: 'Relatório mensal disponível', time: 'Ontem', unread: 0 },
    { id: 'infra', name: 'Infraestrutura', lastMsg: 'Cluster reiniciado com sucesso', time: 'Sex', unread: 0 }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedChannel]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newMessage = {
      id: Date.now(),
      sender: 'Você',
      text: message,
      time: new Date(),
      status: 'sent'
    };
    setMessages([...messages, newMessage]);
    setMessage('');
  };

  const startChatWithUser = (user: any) => {
    setSelectedChannel({ id: user.id, name: user.name, type: 'dm' });
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
    const fileMsg = {
      id: Date.now(),
      sender: 'Você',
      text: `Compartilhou um arquivo do Google Drive: ${file.name}`,
      time: new Date(),
      type: 'file',
      fileDetails: file
    };
    setMessages([...messages, fileMsg]);
    setIsDriveModalOpen(false);
    toastSuccess('Arquivo anexado com sucesso!');
  };

  const handleCreateMeet = async () => {
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 60000);
      
      const meet = await googleCalendarApi.createMeetMeeting({
        title: `Reunião HubChat: ${selectedChannel.name}`,
        startTime: now.toISOString(),
        endTime: end.toISOString()
      });

      const meetMsg = {
        id: Date.now(),
        sender: 'Google integration',
        text: 'Nova videoconferência gerada para o canal.',
        time: new Date(),
        type: 'meet',
        meetLink: meet.meetLink
      };
      setMessages([...messages, meetMsg]);
      toastSuccess('Link do Google Meet gerado e enviado!');
    } catch (err) {
      toastError('Erro ao gerar Meet');
    }
  };

  return (
    <div style={styles.container}>
      {/* SIDEBAR INTERNA DO CHAT */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Hub Chat</h2>
          <button style={styles.newChatBtn} onClick={() => setIsDrawerOpen(true)}><Plus size={18} /></button>
        </div>

        <div style={styles.searchBox}>
          <SearchIcon size={16} color="#94A3B8" />
          <input 
            style={styles.searchInput} 
            placeholder="Buscar colaborador..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={styles.sidebarContent}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
               <h4 style={styles.sectionLabel}>CANAIS</h4>
            </div>
            <div style={styles.channelList}>
              {channels.map(ch => (
                <div 
                  key={ch.id} 
                  style={{...styles.channelItem, backgroundColor: selectedChannel.id === ch.id ? '#EEF2FF' : 'transparent'}}
                  onClick={() => setSelectedChannel({ id: ch.id, name: ch.name, type: 'channel' })}
                >
                  <Hash size={16} color={selectedChannel.id === ch.id ? '#6366F1' : '#94A3B8'} />
                  <div style={styles.channelInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{...styles.channelName, color: selectedChannel.id === ch.id ? '#6366F1' : '#1E293B'}}>{ch.name}</span>
                      {ch.unread > 0 && <span style={styles.unreadBadge}>{ch.unread}</span>}
                    </div>
                    <span style={styles.lastMsgText}>{ch.lastMsg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h4 style={styles.sectionLabel}>MENSAGENS DIRETAS</h4>
            <div style={styles.dmList}>
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                <div 
                  key={user.id} 
                  style={{...styles.dmItem, backgroundColor: selectedChannel.id === user.id ? '#EEF2FF' : 'transparent'}}
                  onClick={() => setSelectedChannel({ id: user.id, name: user.name, type: 'dm' })}
                >
                  <div style={styles.avatarWrapper}>
                    <div style={styles.avatarMini}>{user.name[0]}</div>
                    <div style={{
                      ...styles.statusDotInner, 
                      backgroundColor: user.status === 'online' ? '#10B981' : user.status === 'away' ? '#F59E0B' : '#94A3B8'
                    }} />
                  </div>
                  <div style={styles.dmInfo}>
                    <span style={{...styles.dmName, color: selectedChannel.id === user.id ? '#6366F1' : '#334155'}}>{user.name}</span>
                    <span style={styles.dmTeam}>{user.team} • {user.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL DO CHAT */}
      <main style={styles.chatArea}>
        <header style={styles.chatHeader}>
          <div style={styles.headerInfo}>
            {selectedChannel.type === 'channel' ? (
               <Hash size={20} color="#6366F1" />
            ) : (
               <div style={styles.avatarWrapperHeader}>
                  <div style={styles.avatarHeader}>{selectedChannel.name[0]}</div>
                  <div style={{...styles.statusDotHeader, backgroundColor: '#10B981'}} />
               </div>
            )}
            <div>
              <h3 style={styles.headerTitle}>{selectedChannel.name}</h3>
              <span style={styles.headerSubtitle}>
                 {selectedChannel.type === 'channel' ? 'Logística e operações HUB' : 'Conversa Direta'}
              </span>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.headerIconBtn}><Users size={20} /></button>
            <button style={styles.headerIconBtn}><Pin size={20} /></button>
            <button style={styles.headerIconBtn}><Bell size={20} /></button>
            <button style={styles.headerIconBtn}><Info size={20} /></button>
            <button style={styles.headerIconBtn}><MoreVertical size={20} /></button>
          </div>
        </header>

        <div style={styles.messageContainer} ref={scrollRef}>
          <div style={styles.chatStartNotice}>
             <div style={styles.startAvatar}>{selectedChannel.name[0]}</div>
             <h4 style={styles.startTitle}>Início da conversa com {selectedChannel.name}</h4>
             <p style={styles.startDesc}>As mensagens enviadas aqui são exclusivas para a equipe interna do HUB.</p>
          </div>

          {messages.map((msg, i) => (
            <div key={msg.id} style={styles.messageWrapper}>
              <div style={styles.messageAvatar}>
                {msg.type === 'meet' || msg.type === 'system' ? <Shield size={16} color="#6366F1" /> : msg.sender[0]}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.messageSender}>{msg.sender}</span>
                  <span style={styles.messageTime}>{format(msg.time, 'HH:mm')}</span>
                </div>
                
                {msg.type === 'meet' ? (
                  <div style={styles.meetCard}>
                    <div style={styles.meetInfo}>
                      <GoogleMeetIcon />
                      <span style={styles.meetText}>{msg.text}</span>
                    </div>
                    <button 
                      onClick={() => window.open(msg.meetLink, '_blank')}
                      style={styles.meetJoinBtn}
                    >
                      Entrar na Reunião
                    </button>
                  </div>
                ) : msg.type === 'file' ? (
                  <div style={styles.fileCard} onClick={() => window.open(msg.fileDetails.webViewLink, '_blank')}>
                    <FileText size={18} color="#4285F4" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={styles.fileName}>{msg.fileDetails.name}</span>
                      <span style={styles.fileLabel}>Google Drive</span>
                    </div>
                    <ChevronRight size={16} color="#94A3B8" style={{ marginLeft: 'auto' }} />
                  </div>
                ) : (
                  <p style={styles.messageText}>{msg.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <footer style={styles.chatFooter}>
          <div style={styles.inputWrapper}>
            <div style={styles.inputActions}>
              <button style={styles.actionBtn}><Plus size={20} /></button>
              <div style={styles.divider} />
              <button onClick={handleCreateMeet} style={styles.actionBtn} title="Criar Google Meet"><Video size={20} color="#6366F1" /></button>
              <button onClick={handleOpenDrive} style={styles.actionBtn} title="Anexar do Google Drive"><FileText size={20} color="#4285F4" /></button>
              <button style={styles.actionBtn}><ImageIcon size={20} color="#34A853" /></button>
            </div>
            
            <input 
              style={styles.mainInput} 
              placeholder={`Mensagem para ${selectedChannel.type === 'channel' ? '#' : '@'}${selectedChannel.name}`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            />

            <div style={styles.inputTools}>
              <button style={styles.toolBtn}><Smile size={20} /></button>
              <button style={styles.toolBtn}><AtSign size={20} /></button>
              <button 
                onClick={handleSendMessage}
                style={{...styles.sendBtn, backgroundColor: message.trim() ? '#6366F1' : '#F1F5F9', color: message.trim() ? 'white' : '#94A3B8'}}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div style={styles.typingIndicator}>digitando...</div>
        </footer>
      </main>

      {/* DRAWER LATERAL (SISTEMA SLACK) */}
      {isDrawerOpen && (
        <>
          <div style={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)} />
          <div style={styles.drawer}>
            <div style={styles.drawerHeader}>
               <button style={styles.drawerCloseBtn} onClick={() => setIsDrawerOpen(false)}><ArrowLeft size={20} /></button>
               <h3 style={styles.drawerTitle}>Nova Conversa</h3>
            </div>
            <div style={styles.drawerSearch}>
               <div style={styles.drawerSearchBox}>
                  <SearchIcon size={16} color="#94A3B8" />
                  <input style={styles.drawerInput} placeholder="Buscar pessoa pelo nome ou email..." autoFocus />
               </div>
            </div>
            <div style={styles.drawerList}>
               <h4 style={styles.drawerSectionLabel}>COLABORADORES SUGERIDOS</h4>
               {users.map(user => (
                  <div key={user.id} style={styles.drawerUserItem} onClick={() => startChatWithUser(user)}>
                     <div style={styles.drawerAvatarWrapper}>
                        <div style={styles.drawerAvatar}>{user.name[0]}</div>
                        <div style={{
                          ...styles.drawerStatusDot, 
                          backgroundColor: user.status === 'online' ? '#10B981' : user.status === 'away' ? '#F59E0B' : '#94A3B8'
                        }} />
                     </div>
                     <div style={styles.drawerUserInfo}>
                        <div style={styles.drawerUserName}>{user.name}</div>
                        <div style={styles.drawerUserEmail}>{user.email} • {user.team}</div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </>
      )}

      {/* MODAL GOOGLE DRIVE */}
      {isDriveModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#4285F4" />
                <h3 style={styles.modalTitle}>Google Drive</h3>
              </div>
              <button onClick={() => setIsDriveModalOpen(false)} style={styles.closeBtn}><X size={20} /></button>
            </div>
            <div style={styles.modalBody}>
              {isDocsLoading ? (
                <div style={styles.loadingBox}>Carregando arquivos...</div>
              ) : driveFiles.length > 0 ? (
                <div style={styles.driveGrid}>
                  {driveFiles.map(file => (
                    <div key={file.id} style={styles.driveFileItem} onClick={() => handleSelectDriveFile(file)}>
                      <FileText size={24} color="#4285F4" />
                      <span style={styles.driveFileName}>{file.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyBox}>Nenhum arquivo encontrado no seu Google Drive.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', height: 'calc(100vh - 80px)', backgroundColor: '#F8FAFC', borderRadius: '0', overflow: 'hidden', margin: '0' },
  
  // SIDEBAR
  sidebar: { width: '320px', backgroundColor: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sidebarTitle: { fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-1px' },
  newChatBtn: { width: '36px', height: '36px', borderRadius: '12px', border: 'none', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  searchBox: { margin: '0 20px 20px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px' },
  searchInput: { border: 'none', backgroundColor: 'transparent', fontSize: '13px', outline: 'none', width: '100%', fontWeight: '600', color: 'white' },
  sidebarContent: { flex: 1, overflowY: 'auto', padding: '0 12px' },
  section: { marginBottom: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', marginBottom: '8px' },
  sectionLabel: { fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', textTransform: 'uppercase' },
  channelList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  channelItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  channelInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  channelName: { fontSize: '14px', fontWeight: '800' },
  lastMsgText: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' },
  unreadBadge: { backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '900', padding: '2px 8px', borderRadius: '10px' },
  
  dmList: { display: 'flex', flexDirection: 'column', gap: '2px' },
  dmItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' },
  avatarWrapper: { position: 'relative' },
  avatarMini: { width: '36px', height: '36px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900' },
  statusDotInner: { width: '10px', height: '10px', borderRadius: '50%', position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid #0F172A' },
  dmInfo: { display: 'flex', flexDirection: 'column' },
  dmName: { fontSize: '14px', fontWeight: '800' },
  dmTeam: { fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' },

  // CHAT AREA
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'white' },
  chatHeader: { padding: '16px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', zIndex: 10 },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarWrapperHeader: { position: 'relative' },
  avatarHeader: { width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900' },
  statusDotHeader: { width: '10px', height: '10px', borderRadius: '50%', position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid white' },
  headerTitle: { fontSize: '18px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  headerSubtitle: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },
  headerActions: { display: 'flex', gap: '8px' },
  headerIconBtn: { width: '40px', height: '40px', borderRadius: '12px', border: 'none', backgroundColor: 'transparent', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },

  messageContainer: { flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px', backgroundColor: '#FFF' },
  chatStartNotice: { padding: '40px', textAlign: 'center', borderBottom: '1px solid #F1F5F9', marginBottom: '20px' },
  startAvatar: { width: '80px', height: '80px', borderRadius: '30px', backgroundColor: '#F1F5F9', color: '#6366F1', fontSize: '32px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' },
  startTitle: { fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' },
  startDesc: { fontSize: '14px', color: '#94A3B8', fontWeight: '600', maxWidth: '300px', margin: '0 auto' },
  
  messageWrapper: { display: 'flex', gap: '16px' },
  messageAvatar: { width: '42px', height: '42px', borderRadius: '14px', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#6366F1', fontSize: '16px', border: '1px solid #F1F5F9' },
  messageContent: { flex: 1 },
  messageHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' },
  messageSender: { fontSize: '15px', fontWeight: '900', color: '#0F172A' },
  messageTime: { fontSize: '11px', color: '#CBD5E1', fontWeight: '700' },
  messageText: { fontSize: '15px', color: '#334155', lineHeight: '1.6', fontWeight: '500' },

  meetCard: { marginTop: '12px', padding: '20px', borderRadius: '20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '340px' },
  meetInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  meetText: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  meetJoinBtn: { padding: '12px', borderRadius: '14px', border: 'none', backgroundColor: '#00897B', color: 'white', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(0, 137, 123, 0.4)' },

  fileCard: { marginTop: '12px', padding: '16px', borderRadius: '20px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '340px', cursor: 'pointer', transition: 'all 0.2s' },
  fileName: { fontSize: '14px', fontWeight: '800', color: '#0F172A' },
  fileLabel: { fontSize: '11px', color: '#94A3B8', fontWeight: '700' },

  // FOOTER / INPUT
  chatFooter: { padding: '0 32px 32px', position: 'relative' },
  typingIndicator: { position: 'absolute', top: '-24px', left: '44px', fontSize: '11px', color: '#94A3B8', fontWeight: '700', fontStyle: 'italic' },
  inputWrapper: { padding: '10px', backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' },
  inputActions: { display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' },
  actionBtn: { width: '40px', height: '40px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#94A3B8' },
  divider: { width: '1px', height: '28px', backgroundColor: '#F1F5F9', margin: '0 4px' },
  mainInput: { flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontWeight: '600', color: '#0F172A', padding: '14px' },
  inputTools: { display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '8px' },
  toolBtn: { width: '40px', height: '40px', borderRadius: '14px', border: 'none', backgroundColor: 'transparent', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  sendBtn: { width: '44px', height: '44px', borderRadius: '16px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },

  // DRAWER STYLES
  drawerOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 },
  drawer: { position: 'fixed', top: 0, right: 0, height: '100vh', width: '400px', backgroundColor: 'white', zIndex: 1001, boxShadow: '-10px 0 50px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  drawerHeader: { padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px' },
  drawerCloseBtn: { border: 'none', backgroundColor: '#F1F5F9', color: '#0F172A', width: '40px', height: '40px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  drawerTitle: { fontSize: '20px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' },
  drawerSearch: { padding: '20px 24px' },
  drawerSearchBox: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#F8FAFC', padding: '14px 20px', borderRadius: '16px', border: '1px solid #E2E8F0' },
  drawerInput: { border: 'none', backgroundColor: 'transparent', fontSize: '14px', outline: 'none', width: '100%', fontWeight: '600', color: '#0F172A' },
  drawerList: { flex: 1, overflowY: 'auto', padding: '0 24px 40px' },
  drawerSectionLabel: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', letterSpacing: '1px', marginBottom: '16px' },
  drawerUserItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '8px', border: '1px solid transparent' },
  drawerAvatarWrapper: { position: 'relative' },
  drawerAvatar: { width: '48px', height: '48px', borderRadius: '16px', backgroundColor: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900' },
  drawerStatusDot: { width: '12px', height: '12px', borderRadius: '50%', position: 'absolute', bottom: '-2px', right: '-2px', border: '3px solid white' },
  drawerUserInfo: { flex: 1 },
  drawerUserName: { fontSize: '16px', fontWeight: '800', color: '#0F172A' },
  drawerUserEmail: { fontSize: '12px', color: '#94A3B8', fontWeight: '600' },

  // MODAL STYLES (GOOGLE DRIVE)
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: 'white', borderRadius: '28px', width: '100%', maxWidth: '540px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  modalHeader: { padding: '32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: '20px', fontWeight: '900', color: '#0F172A' },
  closeBtn: { border: 'none', backgroundColor: '#F1F5F9', color: '#94A3B8', cursor: 'pointer', padding: '8px', borderRadius: '10px' },
  modalBody: { padding: '32px', overflowY: 'auto', flex: 1 },
  loadingBox: { padding: '60px', textAlign: 'center', color: '#64748B', fontWeight: '800' },
  emptyBox: { padding: '60px', textAlign: 'center', color: '#94A3B8', fontSize: '15px', fontWeight: '600' },
  driveGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  driveFileItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '18px', backgroundColor: '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' },
  driveFileName: { fontSize: '15px', fontWeight: '800', color: '#0F172A' },
};

export default HubChat;
