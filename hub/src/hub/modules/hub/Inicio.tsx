import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Send, Mic, Plus, ArrowRight, Bot, 
  TrendingUp, Truck, CreditCard, MessageCircle, RefreshCw,
  Compass, Globe, Image, Folder, MoreHorizontal
} from 'lucide-react';
import { dispatchToAiGateway, SYSTEM_PERSONALITIES, processMultimodalFile } from '../../../core/lib/hubAiOrchestrator';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  agentName?: string;
}

const HubInicio: React.FC = () => {
  const navigate = useNavigate();
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0, height: 0, width: '100%' }}>
      
      {/* CONVERSATIONAL CHAT CONTAINER */}
      <div style={{
        background: 'linear-gradient(180deg, #020617 0%, #0F172A 100%)',
        borderRadius: '32px',
        padding: '0',
        marginLeft: '30px',
        marginRight: '30px',
        marginTop: '20px',
        marginBottom: '20px',
        boxSizing: 'border-box',
        boxShadow: '0 25px 50px -12px rgba(0, 97, 255, 0.15)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        position: 'relative',
        overflow: 'visible',
        flex: 1,
        height: 0,
        minHeight: 0,
        justifyContent: messages.length === 0 ? 'center' : 'space-between'
      }}>
        {/* Sleek Starry Background Pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none' }} />

        {/* Top Header Title (shown when messages exist) */}
        {messages.length > 0 && (
          <div style={{ width: '100%', maxWidth: '720px', textAlign: 'center', paddingBottom: '16px', marginTop: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, fontWeight: 500 }}>
              Inteligência Central do Ecossistema Logta, Zaptro e LogDock
            </p>
          </div>
        )}

        {/* Centralized Welcome Title (shown when no messages exist) */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', zIndex: 1, textAlign: 'center', marginBottom: '28px', marginTop: 0, width: '100%', maxWidth: 'min(1100px, 100%)', boxSizing: 'border-box', flexShrink: 0, fontSize: '22px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0, 97, 255, 0.15)', borderRadius: '20px', color: '#0061FF', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <Bot size={13} /> huba inteligência central
            </div>
            <h2 style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: 'clamp(3rem, 10vw, 72px)', fontWeight: 950, boxSizing: 'border-box', lineHeight: 1.05, letterSpacing: '-0.03em', backgroundImage: 'linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(148, 163, 184) 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent', margin: '8px 0px 0px', maxWidth: 'min(95vw, 1100px)', width: '100%' }}>Pergunte à HUBA</h2>
            <p style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: '13px', color: '#94A3B8', margin: '14px 0 0 0', fontWeight: 500, lineHeight: '1.4', maxWidth: '580px' }}>
              A inteligência que unifica o ecossistema Logta, Zaptro e LogDock.
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
                  backgroundColor: msg.sender === 'user' ? '#0061FF' : 'rgba(255, 255, 255, 0.06)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#FFF',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
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
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', padding: '12px 18px', borderRadius: '18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
                <div style={{ width: '6px', height: '6px', background: '#0061FF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
              </div>
            )}
          </div>
        )}

        {/* Input Bar */}
        <div style={{
          width: '100%',
          maxWidth: '720px',
          background: isRecording ? 'transparent' : '#FFFFFF',
          borderRadius: '24px',
          padding: isRecording ? '0' : '16px 24px',
          boxShadow: isRecording ? 'none' : '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: isRecording ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1,
          position: 'relative',
          marginBottom: '0'
        }}>
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
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.3px' }}>No que você está trabalhando?</span>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                width: '100%', 
                background: '#22252A', 
                padding: '12px 24px', 
                borderRadius: '30px', 
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)'
              }}>
                <button 
                  onClick={() => {}}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}
                >
                  <Plus size={16} />
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
                  <div style={{ width: '100%', borderTop: '1px dashed rgba(255,255,255,0.15)', position: 'absolute' }} />
                  {/* Wave effect representation on right */}
                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: 'auto', marginRight: '24px', zIndex: 1 }}>
                    <div style={{ width: '3px', height: '8px', background: '#FFF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out' }} />
                    <div style={{ width: '3px', height: '14px', background: '#FFF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.1s' }} />
                    <div style={{ width: '3px', height: '22px', background: '#FFF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.2s' }} />
                    <div style={{ width: '3px', height: '12px', background: '#FFF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.3s' }} />
                    <div style={{ width: '3px', height: '6px', background: '#FFF', borderRadius: '2px', animation: 'voiceWave 0.6s infinite ease-in-out 0.4s' }} />
                  </div>
                </div>
                <button 
                  onClick={() => setIsRecording(false)}
                  style={{ border: 'none', background: 'transparent', color: '#FFF', fontSize: '20px', cursor: 'pointer', padding: '0 8px', opacity: 0.8 }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8', fontWeight: 600, background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: '8px' }}>
                Ditar <span style={{ opacity: 0.6, fontSize: '9px', fontWeight: 800 }}>^ ⇧ D</span>
              </div>
            </div>
          ) : (
            <>
              {selectedFile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', width: 'fit-content' }}>
                  📎 {selectedFile} 
                  <button onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 800, cursor: 'pointer', padding: '0 2px' }}>×</button>
                </div>
              )}
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputValue);
                  }
                }}
                placeholder={`Pergunte algo para a ${SYSTEM_PERSONALITIES[activeSystem]?.agentName || 'Huba'}...`}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#0F172A',
                  height: '42px',
                  fontFamily: 'inherit'
                }}
              />

              <input 
                type="file" 
                id="huba-file-upload" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file.name);
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setShowPlusMenu(prev => !prev)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                  >
                    <Plus size={15} />
                  </button>
                  <button 
                    onClick={() => setIsRecording(prev => !prev)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
                  >
                    <Mic size={15} />
                  </button>
                </div>
                
                <button 
                  onClick={() => handleSend(inputValue)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#0061FF',
                    color: '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0, 97, 255, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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
