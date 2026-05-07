import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Send, Mic, Plus, ArrowRight, Bot, 
  TrendingUp, Truck, CreditCard, MessageCircle, RefreshCw
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
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Alison,\nidentifiquei que o ecossistema está operando com 99.99% de estabilidade global. Há 124 empresas ativas em produção.\n\nDeseja realizar uma auditoria de faturamento?\nAbrir financeiro:\n#/master/billing',
      agentName: 'HUBA Inteligência Central'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER WITH ADMINISTRATIVE REDIRECT */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>HUBA Inteligência Central</h1>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} className="pulse-sparkle" />
          </div>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px', margin: 0 }}>Copiloto conversacional oficial e cérebro central de todo o ecossistema SaaS.</p>
        </div>
        
        <button 
          onClick={() => navigate('/master/settings?tab=ia-gateway')}
          style={{
            padding: '12px 24px',
            borderRadius: '14px',
            border: 'none',
            background: 'linear-gradient(135deg, #0061FF 0%, #0044FF 100%)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 8px 20px rgba(0, 97, 255, 0.25)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          AI Gateway Center <ArrowRight size={14} />
        </button>
      </div>

      {/* CONVERSATIONAL CHAT CONTAINER */}
      <div style={{
        background: 'linear-gradient(180deg, #020617 0%, #0F172A 100%)',
        borderRadius: '32px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 97, 255, 0.15)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '480px',
        justifyContent: 'space-between'
      }}>
        {/* Sleek Starry Background Pattern */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none' }} />

        {/* Top Floating Agent Picker */}
        <div style={{ width: '100%', maxWidth: '720px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', zIndex: 1, scrollbarWidth: 'none' }}>
          {Object.values(SYSTEM_PERSONALITIES).filter(p => ['master', 'crm', 'logistica', 'financeiro'].includes(p.id)).map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveSystem(p.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '24px',
                border: activeSystem === p.id ? '2px solid #0061FF' : '1px solid rgba(255,255,255,0.08)',
                background: activeSystem === p.id ? '#0061FF' : 'rgba(255, 255, 255, 0.04)',
                color: '#FFF',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {getSystemIcon(p.id)} {p.name}
            </button>
          ))}
        </div>

        {/* Conversation Feed */}
        <div style={{
          width: '100%',
          maxWidth: '720px',
          height: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px 0',
          scrollbarWidth: 'none',
          zIndex: 1
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

        {/* Input Bar */}
        <div style={{
          width: '100%',
          maxWidth: '720px',
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: '16px 24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1
        }}>
          {selectedFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#0F172A', width: 'fit-content' }}>
              📎 {selectedFile} 
              <button onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'transparent', color: '#EF4444', fontWeight: 800, cursor: 'pointer', padding: '0 2px' }}>×</button>
            </div>
          )}
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FEF2F2', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#EF4444', width: 'fit-content' }}>
              🎤 Gravando áudio com Whisper... 
              <button onClick={() => setIsRecording(false)} style={{ border: 'none', background: 'transparent', color: '#64748B', fontWeight: 800, cursor: 'pointer', padding: '0 2px' }}>Parar</button>
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
                onClick={() => document.getElementById('huba-file-upload')?.click()}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <Plus size={15} />
              </button>
              <button 
                onClick={() => setIsRecording(prev => !prev)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: isRecording ? '#FEF2F2' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isRecording ? '#EF4444' : '#64748B' }}
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
        </div>
      </div>

    </div>
  );
};

export default HubInicio;
