import React, { useState, useEffect } from 'react';
import { 
  Cpu, Server, Shield, Database, BarChart3, Settings2, 
  RefreshCw, Plus, Key, Terminal, Lock, HelpCircle, 
  Sliders, Layers, Radio, AlertCircle, CheckCircle
} from 'lucide-react';
import { SYSTEM_PERSONALITIES, SHARED_MEMORY_VAULT, GATEWAY_TELEMETRY, runDiagnostics } from '../../../core/lib/hubAiOrchestrator';

type UserRole = 'MASTER_ADMIN' | 'ADMIN' | 'USER';

const IaGatewayCenter: React.FC = () => {
  // 🔐 RBAC State (Simulation for the user's role control)
  const [currentRole, setCurrentRole] = useState<UserRole>('MASTER_ADMIN');
  const [isAuthorized, setIsAuthorized] = useState(true);

  // 🏥 Infrastructure Node Statuses
  const [nodeDiagnostics, setNodeDiagnostics] = useState({
    vps: 'online',
    local: 'online',
    timestamp: new Date().toLocaleTimeString()
  });
  const [isPinging, setIsPinging] = useState(false);

  // 🗄️ Shared Memory Vault
  const [memoryVault, setMemoryVault] = useState<Record<string, string>>(SHARED_MEMORY_VAULT);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // 🔌 Active Provider Selection
  const [activeProvider, setActiveProvider] = useState<'Ollama-VPS' | 'Ollama-Local' | 'OpenAI' | 'Claude'>('Ollama-VPS');

  // ⚙️ Gateway Parameter States
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [rateLimit, setRateLimit] = useState(60);

  // Synchronize authorization on role change
  useEffect(() => {
    setIsAuthorized(currentRole === 'MASTER_ADMIN');
  }, [currentRole]);

  // Ping Nodes
  const handlePing = async () => {
    setIsPinging(true);
    try {
      const results = await runDiagnostics();
      setNodeDiagnostics({
        vps: results.vps,
        local: results.local,
        timestamp: results.timestamp
      });
    } catch {
      setNodeDiagnostics(prev => ({ ...prev, timestamp: new Date().toLocaleTimeString() }));
    } finally {
      setIsPinging(false);
    }
  };

  // Add Shared Memory
  const handleAddMemory = () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const formattedKey = newKey.trim().toLowerCase().replace(/\s+/g, '_');
    SHARED_MEMORY_VAULT[formattedKey] = newValue;
    setMemoryVault({ ...SHARED_MEMORY_VAULT });
    setNewKey('');
    setNewValue('');
  };

  // Remove Shared Memory Key
  const handleRemoveMemory = (key: string) => {
    delete SHARED_MEMORY_VAULT[key];
    setMemoryVault({ ...SHARED_MEMORY_VAULT });
  };

  // RBAC Access Blocked Screen
  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '40px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0', alignItems: 'center', textAlign: 'center', minHeight: '400px', justifyContent: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', marginBottom: '16px' }}>
          <Lock size={40} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', margin: 0 }}>Acesso Restrito - AI Gateway</h2>
        <p style={{ color: '#64748B', maxWidth: '460px', fontSize: '15px', marginTop: '8px', lineHeight: '1.5' }}>
          Apenas usuários com credencial <strong>MASTER_ADMIN</strong> possuem autorização para alterar parâmetros de infraestrutura, roteamento inteligente e chaves de segurança da IA.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Simular nível de acesso:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700, fontSize: '13px', outline: 'none' }}
          >
            <option value="MASTER_ADMIN">MASTER_ADMIN (Acesso Total)</option>
            <option value="ADMIN">ADMIN (Bloqueado)</option>
            <option value="USER">USER (Bloqueado)</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>AI Gateway Center</h1>
            <span style={{ background: '#EFF6FF', color: '#0061FF', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase' }}>MASTER ONLY</span>
          </div>
          <p style={{ color: '#64748B', fontSize: '16px', marginTop: '4px' }}>Gerenciamento avançado de servidores, providers de IA, controle de multiagentes e chaves de criptografia.</p>
        </div>
        
        {/* Role Simulator Quick Widget */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#FFFFFF', padding: '8px 16px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Simular Permissão:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setCurrentRole(e.target.value as UserRole)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', fontWeight: 700, fontSize: '12px', color: '#0F172A', outline: 'none' }}
          >
            <option value="MASTER_ADMIN">MASTER_ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* SECTION 1: INFRAESTRUTURA IA */}
        <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Server size={20} color="#0061FF" />
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Infraestrutura IA</h3>
            </div>
            <button 
              onClick={handlePing} 
              disabled={isPinging}
              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#0061FF', fontWeight: 700, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={12} className={isPinging ? 'spin' : ''} /> {isPinging ? 'Pingando...' : 'Diagnóstico'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* VPS Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: nodeDiagnostics.vps === 'online' ? '#10B981' : '#EF4444' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Ollama VPS (HostGator)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: nodeDiagnostics.vps === 'online' ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>{nodeDiagnostics.vps.toUpperCase()}</span>
            </div>
            {/* Localhost Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: nodeDiagnostics.local === 'online' ? '#10B981' : '#EF4444' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Localhost Ollama (Mac)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: nodeDiagnostics.local === 'online' ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>{nodeDiagnostics.local.toUpperCase()}</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Última verificação de nós:</span>
            <strong>{nodeDiagnostics.timestamp}</strong>
          </div>
        </div>

        {/* SECTION 2: PROVIDERS */}
        <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Radio size={20} color="#0061FF" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Providers de Conexão</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(['Ollama-VPS', 'Ollama-Local', 'OpenAI', 'Claude'] as const).map(p => (
              <button
                key={p}
                onClick={() => setActiveProvider(p)}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: activeProvider === p ? '2px solid #0061FF' : '1px solid #E2E8F0',
                  background: activeProvider === p ? '#EFF6FF' : '#FFF',
                  color: activeProvider === p ? '#0061FF' : '#64748B',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <Cpu size={14} /> {p}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>OpenAI e Claude estão preparados para conexões API híbridas no futuro.</p>
        </div>

        {/* SECTION 3: MODELOS */}
        <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Sliders size={20} color="#0061FF" />
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Modelos & Parâmetros</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: '#475569' }}>Temperatura: {temperature}</span>
                <span style={{ color: '#0061FF' }}>Precisão</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700 }}>
                <span style={{ color: '#475569' }}>Max Tokens: {maxTokens}</span>
                <span style={{ color: '#0061FF' }}>Tamanho</span>
              </div>
              <input type="range" min="512" max="4096" step="256" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value))} style={{ width: '100%' }} />
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* SECTION 4: MEMÓRIA COMPARTILHADA (SHARED VAULT EDITOR) */}
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Database size={20} color="#0061FF" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Memória Compartilhada (Shared Memory Vault)</h3>
          </div>
          <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>Editor ao vivo de metadados sincronizados cruzadamente entre os monorepos em tempo real.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {Object.entries(memoryVault).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#0061FF', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B', marginTop: '2px' }}>{value}</div>
                </div>
                <button 
                  onClick={() => handleRemoveMemory(key)}
                  style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
            <input 
              type="text" 
              placeholder="Chave (Ex: total_vendas)" 
              value={newKey} 
              onChange={(e) => setNewKey(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', outline: 'none' }}
            />
            <input 
              type="text" 
              placeholder="Valor" 
              value={newValue} 
              onChange={(e) => setNewValue(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '12px', outline: 'none' }}
            />
            <button 
              onClick={handleAddMemory}
              style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#0061FF', color: '#FFF', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> Injetar
            </button>
          </div>
        </div>

        {/* SECTION 5: TELEMETRIA E CONSUMO */}
        <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <BarChart3 size={20} color="#0061FF" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Consumo & Telemetria</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.values(SYSTEM_PERSONALITIES).filter(p => p.id !== 'master').map((p) => {
              const calls = GATEWAY_TELEMETRY.callsBySystem[p.id] || 0;
              const percentage = Math.min(100, Math.floor((calls / (GATEWAY_TELEMETRY.totalCalls || 1)) * 100) + 10);
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
                    <span>{p.agentName}</span>
                    <span style={{ color: '#64748B' }}>{calls} chamadas</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: p.color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total de requisições:</span>
            <strong>{GATEWAY_TELEMETRY.totalCalls}</strong>
          </div>
        </div>

      </div>

      {/* SECTION 6: GATEWAY PARAMETERS & TUNNELS */}
      <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Layers size={20} color="#0061FF" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Parâmetros do Gateway de IA</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>CORS Proxy Tunnel</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>Habilitado (/api/ai)</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Cache de Contingência</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>Ativo (Redundância Local)</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Timeout Mínimo</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>12,000ms</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Rate Limit Máximo</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>{rateLimit} reqs / min</div>
          </div>
        </div>
      </div>

      {/* SECTION 7: MULTIAGENT SPECIFICATIONS */}
      <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Cpu size={20} color="#0061FF" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Especificações dos Multiagentes</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {Object.values(SYSTEM_PERSONALITIES).map(p => (
            <div key={p.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: p.color }}>●</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{p.agentName}</span>
              </div>
              <p style={{ fontSize: '11px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>{p.systemPrompt.slice(0, 95)}...</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: SEGURANÇA & API KEYS */}
      <div style={{ background: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Shield size={20} color="#0061FF" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Segurança e API Keys</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={14} color="#64748B" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Criptografia de Canal AES-256</span>
            </div>
            <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 800 }}>ATIVO</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={14} color="#64748B" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>Token de Assinatura do Monorepo</span>
            </div>
            <span style={{ fontFamily: 'monospace', color: '#64748B', fontSize: '12px' }}>sb_publishable_hub_prod_...</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default IaGatewayCenter;
