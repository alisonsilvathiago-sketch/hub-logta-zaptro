import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HubOperationalDashboard } from './HubOperationalDashboard';
import { 
  Sparkles, Send, Mic, Plus, ArrowRight, Bot, 
  TrendingUp, Truck, CreditCard, MessageCircle, RefreshCw,
  Compass, Globe, Image, Folder, MoreHorizontal
} from 'lucide-react';
import { dispatchToAiGateway, SYSTEM_PERSONALITIES, processMultimodalFile } from '../../../core/lib/hubAiOrchestrator';
import { 
  HUB_PAGE_TITLE, 
  HUB_PAGE_SUBTITLE, 
  HUB_DESCRIPTION_TEXT 
} from '@hub/styles/hubPageTypography';
import HubMasterAvatar from '@hub/components/HubMasterAvatar';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  agentName?: string;
}

const HubInicio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#operacional') {
      requestAnimationFrame(() => {
        document.getElementById('hub-operacional')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash]);
  const [activeSystem, setActiveSystem] = useState<'master' | 'crm' | 'logistica' | 'financeiro'>('master');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  // Send Prompt to Gateway Orquestrador
  const handleSend = async (prompt: string) => {
    let finalPrompt = prompt.trim();
    
    // Check if we are sending an audio or file attachment
    if (isRecording) {
      finalPrompt = "gravacao_operacional.wav";
      setIsRecording(false);
    } else if (selectedFile) {
      finalPrompt = selectedFile;
    }

    if (!finalPrompt) return;

    setMessages(prev => [...prev, { 
      sender: 'user', 
      text: selectedFile ? `[Arquivo Anexo: ${selectedFile}]` : (finalPrompt.endsWith('.wav') ? `[Áudio Operacional: 12s]` : finalPrompt) 
    }]);

    setInputValue('');
    setIsTyping(true);

    try {
      if (selectedFile || finalPrompt.endsWith('.wav')) {
        const fileObj = {
          name: selectedFile || finalPrompt,
          size: 1024 * 340, // 340kb
          type: selectedFile?.endsWith('.png') ? 'image/png' : (finalPrompt.endsWith('.wav') ? 'audio/wav' : 'application/pdf')
        };
        
        const response = await processMultimodalFile(fileObj);
        
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `${response.responseText}\n\n📍 Entidades Detectadas: ${response.parseResult.detectedEntities?.join(', ') || ''}\n🔗 Abrir tela sugerida: ${response.parseResult.suggestedRoute}`,
          agentName: response.agentName
        }]);
        
        setSelectedFile(null);
      } else {
        const response = await dispatchToAiGateway({
          systemId: activeSystem,
          prompt: finalPrompt
        });

        setMessages(prev => [...prev, {
          sender: 'bot',
          text: response.response,
          agentName: response.agentName
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Erro ao processar requisição no Gateway.',
        agentName: 'HUBA AI Error'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getSystemIcon = (id: string) => {
    switch (id) {
      case 'crm': return <TrendingUp size={16} />;
      case 'logistica': return <Truck size={16} />;
      case 'financeiro': return <CreditCard size={16} />;
      default: return <Sparkles size={16} />;
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 'calc(100vh - 56px)' }}>
      
      {/* CONVERSATIONAL CHAT CONTAINER */}
      <div
        className={`hub-inicio-hero${messages.length === 0 ? ' hub-inicio-hero--welcome' : ''}`}
        style={{
          borderRadius: '24px',
          padding: '11px 8px 11px',
          margin: '0 0 20px',
          marginLeft: 0,
          marginRight: 0,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: messages.length === 0 ? 'center' : 'flex-start',
          gap: 11,
          position: 'relative',
          overflow: 'hidden',
          flex: messages.length === 0 ? '0 0 auto' : '1 1 auto',
          height: messages.length === 0 ? 508 : undefined,
          minHeight: messages.length === 0 ? 508 : 'min(280px, 38vh)',
          maxHeight: messages.length === 0 ? 508 : 'min(70vh, 720px)',
          backgroundColor: messages.length === 0 ? 'var(--hub-card)' : undefined,
          border: messages.length === 0 ? '1px solid var(--hub-border)' : '1px solid rgba(255, 255, 255, 0.1)',
          color: messages.length === 0 ? 'var(--hub-text-main)' : '#F8FAFC',
        }}
      >
        {messages.length > 0 && (
          <>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/fundo-chat-ai.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                pointerEvents: 'none',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(2, 6, 23, 0.55) 0%, rgba(15, 23, 42, 0.35) 40%, rgba(2, 6, 23, 0.6) 100%)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {/* Top Header Title (shown when messages exist) */}
        {messages.length > 0 && (
          <div style={{ width: '100%', maxWidth: '720px', textAlign: 'center', paddingBottom: '16px', marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ ...HUB_DESCRIPTION_TEXT, color: '#94A3B8' }}>
              Inteligência Central do Logta no Hub Master
            </p>
          </div>
        )}

        {/* Centralized Welcome Title (shown when no messages exist) */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, textAlign: 'center', marginBottom: 12, marginTop: 0, width: '100%', maxWidth: 697, boxSizing: 'border-box', flexShrink: 0 }}>
            <HubMasterAvatar
              size={56}
              borderRadius={16}
              style={{ marginBottom: 4, boxShadow: '0 4px 14px rgba(0, 97, 255, 0.15)' }}
            />
            <div className="hub-inicio-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Bot size={13} /> huba inteligência central
            </div>
            <h1
              style={{
                ...HUB_PAGE_TITLE,
                color: 'var(--hub-text-main)',
                fontSize: '42px',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              Como posso ajudar hoje?
            </h1>
            <p style={{ ...HUB_DESCRIPTION_TEXT, color: 'var(--hub-text-muted)', maxWidth: '580px' }}>
              A inteligência que apoia operações, frota e ERP Logta no painel Master.
            </p>
          </div>
        )}

        {/* Conversation Feed */}
        {messages.length > 0 && (
          <div style={{
            width: '100%',
            maxWidth: '720px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px 0',
            scrollbarWidth: 'none',
            zIndex: 1,
            marginBottom: '20px'
          }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '14px 20px',
                  borderRadius: msg.sender === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                  backgroundColor: msg.sender === 'user' ? '#0061FF' : 'rgba(255, 255, 255, 0.08)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#FFF',
                  boxShadow: msg.sender === 'user' ? '0 8px 24px rgba(0, 97, 255, 0.35)' : 'none'
                }}
              >
                {msg.agentName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <Bot size={11} color="#0061FF" /> {msg.agentName}
                  </div>
                )}
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 18px', borderRadius: '18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div
          className="hub-inicio-input-bar"
          style={{
            width: '100%',
            maxWidth: 697,
            marginLeft: 'auto',
            marginRight: 'auto',
            background: isRecording ? 'transparent' : 'var(--hub-input-bg)',
            borderRadius: '20px',
            padding: isRecording ? 0 : '10px 14px',
            boxShadow: 'none',
            display: 'flex',
            flexDirection: messages.length === 0 && !selectedFile ? 'row' : 'column',
            gap: 0,
            alignItems: 'center',
            justifyContent: 'flex-start',
            border: isRecording ? 'none' : '1px solid var(--hub-input-border)',
            zIndex: 1,
            position: 'relative',
            marginBottom: 0,
            boxSizing: 'border-box',
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          {/* Plus popover menu matching second mockup */}
          {showPlusMenu && (
            <div style={{
              position: 'absolute',
              bottom: '90px',
              left: '0px',
              width: '260px',
              background: '#22252A',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              zIndex: 10
            }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setShowPlusMenu(false);
                  document.getElementById('huba-file-upload')?.click();
                }}
              >
                <Plus size={15} color="#94A3B8" />
                <span>Adicionar fotos e arquivos</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setShowPlusMenu(false);
                  setInputValue('Criar imagem de: ');
                }}
              >
                <Image size={15} color="#94A3B8" />
                <span>Criar imagem</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setShowPlusMenu(false);
                  setInputValue('[Pense Bem]: ');
                }}
              >
                <Sparkles size={15} color="#94A3B8" />
                <span>Pense bem</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setShowPlusMenu(false);
                  setInputValue('Pesquisa aprofundada sobre: ');
                }}
              >
                <Compass size={15} color="#94A3B8" />
                <span>Pesquisa aprofundada</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  setShowPlusMenu(false);
                  setInputValue('Buscar na web sobre: ');
                }}
              >
                <Globe size={15} color="#94A3B8" />
                <span>Busca na web</span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s', justifyContent: 'space-between' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MoreHorizontal size={15} color="#94A3B8" />
                  <span>Mais</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>▶</span>
              </div>
              <div 
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#FFF', transition: 'background 0.2s', justifyContent: 'space-between' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Folder size={15} color="#94A3B8" />
                  <span>Projetos</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>▶</span>
              </div>
            </div>
          )}

          {isRecording ? (
            /* Dictation voice widget state matching third mockup */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#F8FAFC', letterSpacing: '-0.3px' }}>No que você está trabalhando?</span>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                width: '100%', 
                background: 'var(--hub-card)', 
                padding: '12px 24px', 
                borderRadius: '30px', 
                border: '1px solid var(--hub-border)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
              }}>
                <button 
                  onClick={() => {}}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}
                >
                  <Plus size={16} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
                  <div style={{ width: '100%', borderTop: '1px dashed #CBD5E1', position: 'absolute' }} />
                  {/* Wave effect representation on right */}
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: 'auto', marginRight: '24px', zIndex: 1 }}>
                    <div style={{ width: '3px', height: '8px', background: '#0061FF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out' }} />
                    <div style={{ width: '3px', height: '14px', background: '#0061FF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.1s' }} />
                    <div style={{ width: '3px', height: '22px', background: '#0061FF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.2s' }} />
                    <div style={{ width: '3px', height: '12px', background: '#0061FF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.3s' }} />
                    <div style={{ width: '3px', height: '6px', background: '#0061FF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.4s' }} />
                  </div>
                </div>
                <button 
                  onClick={() => setIsRecording(false)}
                  style={{ border: 'none', background: 'transparent', color: '#64748B', fontSize: '20px', cursor: 'pointer', padding: '0 8px', opacity: 0.9 }}
                >
                  ×
                </button>
                <button 
                  onClick={() => {
                    setIsRecording(false);
                    handleSend("gravação_operacional.wav");
                  }}
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: '#0061FF', 
                    border: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer',
                    color: '#FFF',
                    boxShadow: '0 4px 10px rgba(0, 97, 255, 0.3)'
                  }}
                >
                  ✓
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                Ditar <span style={{ opacity: 0.85, fontSize: '9px', fontWeight: 800 }}>^ ⇧ D</span>
              </div>
            </div>
          ) : (
            <>
              {selectedFile && (
                <div className="hub-inicio-file-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, width: 'fit-content' }}>
                  📎 {selectedFile} 
                  <button onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 800, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0, flex: 1 }}>
                <button
                  type="button"
                  onClick={() => setShowPlusMenu((prev) => !prev)}
                  className="hub-inicio-icon-btn"
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Plus size={15} />
                </button>

                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(inputValue);
                    }
                  }}
                  rows={1}
                  placeholder={`Pergunte algo para a ${SYSTEM_PERSONALITIES[activeSystem]?.agentName || 'Huba'}...`}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--hub-text-main)',
                    minHeight: 0,
                    height: 'auto',
                    lineHeight: 1.4,
                    padding: '6px 0',
                    fontFamily: 'inherit',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setIsRecording((prev) => !prev)}
                  className="hub-inicio-icon-btn"
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Mic size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleSend(inputValue)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#0061FF',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0, 97, 255, 0.3)',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Send size={15} />
                </button>
              </div>

              <input
                type="file"
                id="huba-file-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file.name);
                }}
              />
            </>
          )}
        </div>
      </div>

      <section
        id="hub-operacional"
        style={{
          flexShrink: 0,
          padding: '32px 26px 48px',
          backgroundColor: 'var(--hub-bg)',
          borderTop: '1px solid var(--hub-border)',
        }}
      >
        <HubOperationalDashboard variant="home" />
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @keyframes voiceWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.2); }
        }
      `}} />

    </div>
  );
};

export default HubInicio;
