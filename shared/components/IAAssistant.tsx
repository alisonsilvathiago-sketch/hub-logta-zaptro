import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Send, 
  User, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  MoreVertical,
  X,
  MessageSquare,
  Zap,
  Activity,
  Trash2,
  Maximize2,
  Terminal
} from 'lucide-react';
import { askHubAI } from '../lib/hubAI';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface IAAssistantProps {
  appContext: 'Logta' | 'Zaptro' | 'LogDock' | 'Hub';
  userName?: string;
  initialMessage?: string;
}

const IAAssistant: React.FC<IAAssistantProps> = ({ 
  appContext, 
  userName = 'Usuário',
  initialMessage 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: initialMessage || `Olá ${userName}! Eu sou o assistente inteligente unificado do ecossistema ${appContext}. Como posso te ajudar hoje?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Injeta o contexto do app para a IA
    const promptWithContext = `[Contexto: O usuário está usando o sistema ${appContext}. Se o sistema for Logta, responda sobre logística e transporte. Se for Zaptro, sobre mensagens e CRM. Se for LogDock, sobre gestão de pátio e agendamentos.]\n\nUsuário: ${input}`;

    try {
      const result = await askHubAI(promptWithContext);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.success ? result.response : (result.error || 'Desculpe, tive um problema ao me conectar com o Cérebro Central.'),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Ocorreu um erro crítico de conexão. Verifique se o Hub Master está online.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([messages[0]]);
  };

  return (
    <div style={styles.container}>
      {/* Header Premium */}
      <header style={styles.header}>
        <div style={styles.headerInfo}>
          <div style={styles.iconBox}>
            <Brain size={24} color="#FFF" />
            <div style={styles.pulse} />
          </div>
          <div>
            <h3 style={styles.title}>{appContext} Intelligence</h3>
            <div style={styles.statusRow}>
              <div style={styles.statusDot} />
              <span style={styles.statusText}>IA Ativa • Cérebro Central Hub</span>
            </div>
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={clearChat} title="Limpar conversa">
            <Trash2 size={18} />
          </button>
          <button style={styles.iconBtn}>
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div style={styles.chatArea} ref={scrollRef}>
        <div style={styles.welcomeBanner}>
          <Sparkles size={16} color="#0061FF" />
          <span>Equipado com Llama 3.2 via VPS Central</span>
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            style={{
              ...styles.messageWrapper,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              ...styles.avatar,
              backgroundColor: msg.role === 'user' ? '#1E293B' : 'rgba(0, 97, 255, 0.1)',
              color: msg.role === 'user' ? '#FFF' : '#0061FF'
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Brain size={16} />}
            </div>
            
            <div style={{
              ...styles.bubble,
              backgroundColor: msg.role === 'user' ? '#0061FF' : '#FFF',
              color: msg.role === 'user' ? '#FFF' : '#1E293B',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: msg.role === 'user' ? '0 4px 12px rgba(0, 97, 255, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
              border: msg.role === 'user' ? 'none' : '1px solid #F1F5F9'
            }}>
              <div style={styles.msgContent}>{msg.content}</div>
              <div style={{
                ...styles.time,
                color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : '#94A3B8',
                textAlign: msg.role === 'user' ? 'right' : 'left'
              }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={styles.messageWrapper}>
            <div style={{...styles.avatar, backgroundColor: 'rgba(0, 97, 255, 0.1)', color: '#0061FF'}}>
              <Brain size={16} />
            </div>
            <div style={styles.typingBubble}>
              <div style={styles.dot} />
              <div style={{...styles.dot, animationDelay: '0.2s'}} />
              <div style={{...styles.dot, animationDelay: '0.4s'}} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <footer style={styles.footer}>
        <div style={styles.inputWrapper}>
          <div style={styles.inputPrefix}>
            <Terminal size={18} color="#94A3B8" />
          </div>
          <input 
            style={styles.input}
            placeholder={`Pergunte algo sobre o ${appContext}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            style={{
              ...styles.sendBtn,
              backgroundColor: input.trim() ? '#0061FF' : '#F1F5F9',
              color: input.trim() ? '#FFF' : '#94A3B8',
              cursor: input.trim() ? 'pointer' : 'default'
            }}
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={styles.footerNote}>
          O Cérebro Central pode levar alguns segundos para processar dados complexos.
        </p>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#FFF',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '14px',
    backgroundColor: '#0061FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '14px',
    border: '2px solid #0061FF',
    animation: 'pulse 2s infinite',
  },
  title: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0061FF',
  },
  statusText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#949494',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  headerActions: {
    display: 'flex',
    gap: '4px',
  },
  iconBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#94A3B8',
    transition: 'all 0.2s',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    scrollBehavior: 'smooth',
  },
  welcomeBanner: {
    alignSelf: 'center',
    padding: '6px 14px',
    backgroundColor: '#FFF',
    borderRadius: '100px',
    border: '1px solid #E2E8F0',
    fontSize: '11px',
    fontWeight: '700',
    color: '#949494',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  messageWrapper: {
    display: 'flex',
    gap: '12px',
    maxWidth: '85%',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '4px',
  },
  bubble: {
    padding: '12px 16px',
    position: 'relative',
  },
  msgContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
  time: {
    fontSize: '9px',
    fontWeight: '700',
    marginTop: '6px',
  },
  typingBubble: {
    backgroundColor: '#FFF',
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 4px',
    display: 'flex',
    gap: '4px',
    border: '1px solid #F1F5F9',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#0061FF',
    opacity: 0.4,
    animation: 'typing 1.4s infinite ease-in-out',
  },
  footer: {
    padding: '24px',
    backgroundColor: '#FFF',
    borderTop: '1px solid #F1F5F9',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '6px',
    gap: '8px',
  },
  inputPrefix: {
    paddingLeft: '12px',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1E293B',
    padding: '10px 0',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  footerNote: {
    fontSize: '10px',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: '12px',
    fontWeight: '600',
  }
};

// Adiciona as animações globais via Style tag se necessário, ou injetado
export default IAAssistant;
