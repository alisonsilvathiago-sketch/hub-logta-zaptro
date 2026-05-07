import React, { useState } from 'react';
import { 
  Sparkles, Send, Mic, Plus, CheckCircle, Database, Shield,
  Server, RefreshCw, Terminal, ArrowRight, Play, AlertCircle, Cpu, 
  Settings, TrendingUp, Truck, CreditCard, MessageSquare, MessageCircle, BarChart3, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  dispatchToAiGateway, 
  SYSTEM_PERSONALITIES, 
  SHARED_MEMORY_VAULT, 
  GATEWAY_TELEMETRY,
  AISystemRequest
} from '../../../core/lib/hubAiOrchestrator';

interface Message {
  sender: 'user' | 'huba';
  text: string;
  agentName?: string;
}

const HubInicio: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSystem, setActiveSystem] = useState<'crm' | 'logistica' | 'financeiro' | 'atendimento' | 'whatsapp' | 'master'>('master');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'huba', text: 'Olá Master! Sou a Huba, a inteligência central e orquestradora do Hub Master. Posso rotear suas mensagens e alimentar qualquer um dos nossos monorepos utilizando o mesmo motor central de IA da VPS Ollama (Llama 3.2). Escolha um agente para testar o Gateway!', agentName: 'Huba Inteligência Central' }
  ]);

  // Ollama Configuration State
  const [ollamaUrl, setOllamaUrl] = useState('/api/ai');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [ollamaStatus, setOllamaStatus] = useState<'testing' | 'online' | 'offline'>('online');

  // Shared Memory State Manager
  const [memoryVault, setMemoryVault] = useState<Record<string, string>>(SHARED_MEMORY_VAULT);
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryValue, setNewMemoryValue] = useState('');

  // Add Memory To Vault
  const handleAddMemory = () => {
    if (!newMemoryKey.trim() || !newMemoryValue.trim()) {
      toast.error('Chave e valor da memória compartilhada são obrigatórios.');
      return;
    }
    const formattedKey = newMemoryKey.trim().toLowerCase().replace(/\s+/g, '_');
    setMemoryVault(prev => {
      const updated = { ...prev, [formattedKey]: newMemoryValue.trim() };
      SHARED_MEMORY_VAULT[formattedKey] = newMemoryValue.trim(); // Update global
      return updated;
    });
    setNewMemoryKey('');
    setNewMemoryValue('');
    toast.success(`Memória compartilhada [${formattedKey}] injetada com sucesso para todos os sistemas!`);
  };

  // Test Connection
  const testConnection = async () => {
    setOllamaStatus('testing');
    try {
      const targetUrl = ollamaUrl.includes('108.174.151.98') ? `${ollamaUrl}/api/generate` : ollamaUrl;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ollamaModel, prompt: 'ping', stream: false })
      });
      if (response.ok) {
        setOllamaStatus('online');
        toast.success('Ollama conectado com sucesso via Gateway!');
      } else {
        setOllamaStatus('offline');
        toast.error('Ollama respondeu com status inválido.');
      }
    } catch (err) {
      setOllamaStatus('offline');
      toast.error('Erro de conexão ou CORS ao acessar o Gateway de IA.');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Call Centralized AI Gateway Rerouting
    const req: AISystemRequest = {
      systemId: activeSystem,
      prompt: text
    };

    const result = await dispatchToAiGateway(req, ollamaUrl, ollamaModel);

    setMessages(prev => [...prev, { 
      sender: 'huba', 
      text: result.response,
      agentName: result.agentName
    }]);
    
    if (result.success) {
      setOllamaStatus('online');
      toast.success(`Resposta processada e enriquecida via AI Gateway [${result.agentName}]`);
    } else {
      setOllamaStatus('offline');
      toast.warning('Ollama VPS inacessível. Usando contingência local do Gateway.');
    }
    setIsTyping(false);
  };

  const getSystemIcon = (id: string) => {
    switch (id) {
      case 'crm': return <TrendingUp size={16} />;
      case 'logistica': return <Truck size={16} />;
      case 'financeiro': return <CreditCard size={16} />;
      case 'atendimento': return <MessageSquare size={16} />;
      case 'whatsapp': return <MessageCircle size={16} />;
      default: return <Sparkles size={16} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>AI Gateway & Orquestrador</h1>
          <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Roteamento centralizado, prompts, contexto e memória compartilhada para todos os monorepos.</p>
        </div>
        <div style={{ background: '#FFF', padding: '10px 20px', borderRadius: '14px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#64748B' }}>
          <Cpu size={16} color="#0061FF" className="pulse-sparkle" /> Gateway Master Ativo
        </div>
      </div>

      {/* THREE ZONE ARCHITECTURE PREVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0061FF', fontWeight: 800 }}>1</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Roteador e Gateway</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Centraliza chamadas de todos os sistemas</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', fontWeight: 800 }}>2</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Personalidades e Contexto</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Gerencia comportamento de cada IA individual</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontWeight: 800 }}>3</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>Shared Memory Vault</div>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Dados compartilhados de forma cruzada</div>
          </div>
        </div>
      </div>

      {/* MAIN TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '32px' }}>
        
        {/* COLUMN 1: AI GATEWAY CARD & SANDBOX */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* CENTRAL GORGEOUS AI CHAT CARD */}
          <div style={{
            background: 'linear-gradient(180deg, #000000 0%, #00112c 40%, #0044aa 100%)',
            borderRadius: '28px',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 97, 255, 0.25)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Decorative Grid Overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)', backgroundSize: '24px 24px', opacity: 0.5, pointerEvents: 'none' }} />

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
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0061FF' }}>
                <Sparkles size={14} fill="#0061FF" /> AI GATEWAY MIDDLEWARE
              </div>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ color: '#94A3B8' }}>Ollame VPS Centralizer</span>
            </div>

            {/* Gateway Agent Selection */}
            <div style={{ width: '100%', maxWidth: '700px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '16px', scrollbarWidth: 'none' }}>
              {Object.values(SYSTEM_PERSONALITIES).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveSystem(p.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: activeSystem === p.id ? '2px solid #0061FF' : '1px solid rgba(255,255,255,0.1)',
                    background: activeSystem === p.id ? '#0061FF' : 'rgba(255, 255, 255, 0.04)',
                    color: '#FFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {getSystemIcon(p.id)} {p.name}
                </button>
              ))}
            </div>

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
                  {msg.agentName && <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 800, marginBottom: '4px', textTransform: 'uppercase' }}>{msg.agentName}</div>}
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
                placeholder={`Mande um prompt para o ${SYSTEM_PERSONALITIES[activeSystem]?.agentName || 'Gateway'}...`}
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
          </div>

          {/* OLLAMA VPS CONTROLLER PANEL */}
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
                  <p style={{ color: '#64748B', fontSize: '13px', margin: '2px 0 0' }}>Credenciais unificadas da VPS de IA central da transportadora.</p>
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
                  {ollamaStatus === 'online' ? 'VPS Conectada' : ollamaStatus === 'testing' ? 'Testando...' : 'VPS Offline'}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VPS Endpoint URL</label>
                <input 
                  type="text" 
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  style={{
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#1E293B', outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modelo Ativo</label>
                <input 
                  type="text" 
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  style={{
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: '#1E293B', outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
              <button 
                onClick={testConnection}
                style={{
                  padding: '12px 24px', borderRadius: '12px', backgroundColor: '#0061FF', color: '#FFF', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0, 97, 255, 0.15)'
                }}
              >
                <RefreshCw size={16} /> Testar Conexão
              </button>
            </div>
          </div>

        </div>

        {/* COLUMN 2: ACTIVE AGENTS & SHARED MEMORY VAULT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SHARED MEMORY VAULT CARD */}
          <div style={{
            background: '#FFFFFF',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Database size={20} color="#0061FF" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Shared Memory Vault</h3>
            </div>
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Dados compartilhados sincronizados de forma cruzada entre as IAs dos monorepos.</p>

            {/* Memory List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {Object.entries(memoryVault).map(([key, value]) => (
                <div key={key} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0061FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Injetor de Novas Memórias */}
            <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>Injetar Nova Informação Global</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Chave (Ex: total_vendas)" 
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', outline: 'none' }}
                />
                <input 
                  type="text" 
                  placeholder="Valor (Ex: R$ 150.000)" 
                  value={newMemoryValue}
                  onChange={(e) => setNewMemoryValue(e.target.value)}
                  style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <button 
                onClick={handleAddMemory}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#0061FF', color: '#FFF', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Plus size={14} /> Injetar na Memória da IA
              </button>
            </div>
          </div>

          {/* ACTIVE SYSTEMS TELEMETRY MONITOR */}
          <div style={{
            background: '#FFFFFF',
            padding: '32px',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <BarChart3 size={20} color="#0061FF" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Consumo e Telemetria</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.values(SYSTEM_PERSONALITIES).filter(p => p.id !== 'master').map((p) => {
                const calls = GATEWAY_TELEMETRY.callsBySystem[p.id as keyof typeof GATEWAY_TELEMETRY.callsBySystem] || 0;
                const percentage = Math.min(100, Math.floor((calls / GATEWAY_TELEMETRY.totalCalls) * 100) + 10);
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: p.color }}>{getSystemIcon(p.id)}</span>
                        {p.agentName}
                      </div>
                      <span>{calls} reqs</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${percentage}%`, height: '100%', background: p.color, borderRadius: '4px' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* DETAILED ACTIVE PERSONALITY SPECS */}
      <div style={{
        background: '#FFFFFF',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.02)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>Especificações de Agentes Ativos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {Object.values(SYSTEM_PERSONALITIES).map((p) => (
            <div 
              key={p.id} 
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: activeSystem === p.id ? `2px solid ${p.color}` : '1px solid #F1F5F9',
                background: activeSystem === p.id ? `${p.color}05` : '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${p.color}15`, color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getSystemIcon(p.id)}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{p.agentName}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Alias: {p.id.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.4', flex: 1 }}>{p.systemPrompt.slice(0, 110)}...</div>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {p.activeMemoryKeys.map(k => (
                  <span key={k} style={{ fontSize: '9px', fontWeight: 800, background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', color: '#64748B' }}>{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HubInicio;
