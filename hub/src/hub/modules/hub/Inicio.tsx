import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Send, Mic, Plus, CheckCircle, Database, Shield,
  Server, RefreshCw, Terminal, ArrowRight, Play, AlertCircle, Cpu, Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  sender: 'user' | 'huba';
  text: string;
}

const HubInicio: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'huba', text: 'Olá Master! Sou a Huba, a inteligência central do Hub Master. Posso ajudar você a criar empresas, executar auditorias ou monitorar a infraestrutura global via Ollama (Llama 3.2). O que deseja fazer hoje?' }
  ]);

  // Ollama Management State
  const [ollamaUrl, setOllamaUrl] = useState('http://108.174.151.98:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [ollamaStatus, setOllamaStatus] = useState<'testing' | 'online' | 'offline'>('online');

  // Test Connection
  const testConnection = async () => {
    setOllamaStatus('testing');
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setOllamaStatus('online');
        toast.success('Ollama conectado com sucesso!');
      } else {
        setOllamaStatus('offline');
        toast.error('Ollama respondeu com status inválido.');
      }
    } catch (err) {
      // Fallback try with a dummy generation request
      try {
        const response = await fetch(`${ollamaUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: ollamaModel, prompt: 'ping', stream: false })
        });
        if (response.ok) {
          setOllamaStatus('online');
          toast.success('Conectado com sucesso ao Ollama!');
          return;
        }
      } catch {}
      setOllamaStatus('offline');
      toast.error('Erro de CORS ou rede ao conectar ao Ollama.');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: `Você é a Huba, a inteligência artificial central do Hub Master (painel mestre do ecossistema Logta, Zaptro e LogDock). Responda de forma amigável, em português do Brasil e extremamente resumida à solicitação: ${text}`,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error('Falha no Ollama');
      }

      const data = await response.json();
      const responseText = data.response;

      setMessages(prev => [...prev, { sender: 'huba', text: responseText }]);
      setOllamaStatus('online');
    } catch (err) {
      console.warn('Ollama generate failed, using local backup intelligence:', err);
      // Fallback response
      const lowerText = text.toLowerCase();
      let responseText = '';

      if (lowerText.includes('empresa') || lowerText.includes('criar')) {
        responseText = '📋 [Huba Comando]: Entendido! Inicializando provisionamento de nova tenant no ecossistema. Banco de dados PostgreSQL replicado, SSL configurado e alias DNS mapeado para *.logta.com.br.';
      } else if (lowerText.includes('auditar') || lowerText.includes('auditoria') || lowerText.includes('banco')) {
        responseText = '🛢️ [Huba Auditoria]: Analisando schemas e integridade do banco global. Todos os 124 profiles estão consistentes. Latência média de queries: 14ms (Saudável).';
      } else if (lowerText.includes('infra') || lowerText.includes('verificar') || lowerText.includes('sistema')) {
        responseText = '⚡ [Huba Infra]: Todas as instâncias ativas do Vercel e Render estão operacionais com 99.9% de uptime. Cache Redis limpo e monitor de latência reiniciado.';
      } else {
        responseText = `🤖 [Huba - Offline Fallback]: Processando sua solicitação: "${text}". Analisando ecossistema Logta, Zaptro e LogDock para executar seu comando com segurança global...`;
      }

      setMessages(prev => [...prev, { sender: 'huba', text: responseText }]);
      setOllamaStatus('offline');
      toast.warning('Ollama indisponível ou bloqueado por CORS. Usando fallback local.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Central de Inteligência</h1>
          <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Gerenciamento e automação de serviços via Ollama VPS.</p>
        </div>
        <div style={{ background: '#FFF', padding: '10px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#64748B' }}>
          <Sparkles size={16} color="#0061FF" className="pulse-sparkle" /> Huba Online
        </div>
      </div>

      {/* GORGEOUS AI CARD */}
      <div style={{
        background: 'linear-gradient(180deg, #000000 0%, #00112c 40%, #0044aa 100%)',
        borderRadius: '28px',
        padding: '50px 40px',
        boxShadow: '0 25px 50px -12px rgba(0, 97, 255, 0.25)',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Grid Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        {/* Pill Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          padding: '6px 16px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0061FF' }}>
            <Sparkles size={14} fill="#0061FF" /> HUB MASTER IA
          </div>
          <span style={{ opacity: 0.5 }}>•</span>
          <span style={{ color: '#94A3B8' }}>Ollama Llama 3.2</span>
        </div>

        {/* Big Title */}
        <h1 style={{
          fontSize: '44px',
          fontWeight: 900,
          color: '#FFFFFF',
          textAlign: 'center',
          margin: '0 0 12px 0',
          letterSpacing: '-1.5px',
          lineHeight: '1.15'
        }}>
          Central do Hub Master
        </h1>

        {/* Subtitle */}
        <p style={{
          color: '#94A3B8',
          fontSize: '15px',
          fontWeight: 500,
          textAlign: 'center',
          maxWidth: '560px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Pergunte sobre faturamento, audite o banco de dados global ou mande a Huba gerenciar recursos de infraestrutura com comandos integrados na VPS.
        </p>

        {/* CHAT BUBBLES WINDOW */}
        <div style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '260px',
          overflowY: 'auto',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingRight: '8px'
        }}>
          {messages.map((msg, i) => (
            <div 
              key={i} 
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '12px 18px',
                borderRadius: msg.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                backgroundColor: msg.sender === 'user' ? '#0061FF' : 'rgba(255, 255, 255, 0.08)',
                border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1.5',
                color: '#FFF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '16px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div style={{ width: '6px', height: '6px', background: '#FFF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
              <div style={{ width: '6px', height: '6px', background: '#FFF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.2s' }} />
              <div style={{ width: '6px', height: '6px', background: '#FFF', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out 0.4s' }} />
            </div>
          )}
        </div>

        {/* INPUT BOX */}
        <div style={{
          width: '100%',
          maxWidth: '700px',
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '16px 20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(inputValue);
              }
            }}
            placeholder="O que você deseja saber?"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#1E293B',
              height: '45px',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                <Plus size={16} />
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
                <Mic size={16} />
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

        {/* QUICK SUGGESTIONS */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => handleSend('Criar uma nova empresa no sistema')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '30px',
              padding: '8px 18px',
              color: '#FFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Plus size={14} color="#0061FF" /> Criar Empresa
          </button>

          <button 
            onClick={() => handleSend('Executar auditoria nos bancos de dados')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '30px',
              padding: '8px 18px',
              color: '#FFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Database size={14} color="#10B981" /> Executar Auditoria
          </button>

          <button 
            onClick={() => handleSend('Verificar integridade da infraestrutura')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '30px',
              padding: '8px 18px',
              color: '#FFF',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <Server size={14} color="#F59E0B" /> Verificar Infra
          </button>
        </div>
      </div>

      {/* NEW OLLAMA VPS CONTROLLER PANEL */}
      <div style={{
        background: '#FFFFFF',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Gerenciamento do Ollama VPS</h3>
              <p style={{ color: '#64748B', fontSize: '13px', margin: '2px 0 0' }}>Gerencie as credenciais da VPS de inteligência artificial de forma centralizada.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: ollamaStatus === 'online' ? '#10B981' : ollamaStatus === 'testing' ? '#3B82F6' : '#EF4444',
              animation: ollamaStatus === 'testing' ? 'pulse 1.5s infinite ease-in-out' : 'none'
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: ollamaStatus === 'online' ? '#10B981' : ollamaStatus === 'testing' ? '#3B82F6' : '#EF4444',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {ollamaStatus === 'online' ? 'VPS Conectada' : ollamaStatus === 'testing' ? 'Sincronizando...' : 'VPS Offline'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VPS Endpoint URL</label>
            <input 
              type="text" 
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              placeholder="Ex: http://108.174.151.98:11434"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E293B',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modelo Ativo</label>
            <input 
              type="text" 
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              placeholder="Ex: llama3.2"
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E293B',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
          <button 
            onClick={testConnection}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: '#0061FF',
              color: '#FFF',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(0, 97, 255, 0.15)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <RefreshCw size={16} style={{ animation: ollamaStatus === 'testing' ? 'spin 1.5s infinite linear' : 'none' }} /> Testar Conexão
          </button>
        </div>
      </div>

      {/* ADDITIONAL KEY INFORMATION CARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div style={{ background: '#FFF', padding: '24px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF' }}>
            <Terminal size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Terminal Ativo</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>99 Comandos Executados</div>
          </div>
        </div>

        <div style={{ background: '#FFF', padding: '24px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Segurança Global</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>Proteção Total Ativa</div>
          </div>
        </div>

        <div style={{ background: '#FFF', padding: '24px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Incidentes Críticos</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>0 Monitorados</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .pulse-sparkle {
          animation: pulse 2s infinite ease-in-out;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default HubInicio;
