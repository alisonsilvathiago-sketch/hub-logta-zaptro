import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, Activity, Clock, Search as SearchIcon, Home, Key, 
  Settings, Smartphone, Hash, CreditCard, Terminal, ExternalLink,
  ChevronRight, Zap, QrCode, Shield, CheckCircle2, AlertTriangle,
  LayoutGrid, Share2, Globe, Database, Smartphone as PhoneIcon
} from 'lucide-react';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { zaptroCardSurfaceStyle } from '../constants/zaptroCardSurface';
import { ZAPTRO_FIELD_BG, ZAPTRO_SECTION_BORDER } from '../constants/zaptroUi';
import { ZAPTRO_ROUTES } from '../constants/zaptroRoutes';

const ACCENT = '#25D366'; // WhatsApp Green

type TabId = 'overview' | 'instances' | 'numbers' | 'billing' | 'api' | 'logs' | 'settings';

const WhatsappHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { palette } = useZaptroTheme();
  const isDark = palette.mode === 'dark';
  
  const activeTab = (searchParams.get('tab') as TabId) || 'overview';

  const tabSections = [
    {
      title: 'WHATSAPP CLOUD',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'instances', label: 'Instâncias (Sessões)', icon: Smartphone },
        { id: 'numbers', label: 'Números Vinculados', icon: Hash },
        { id: 'billing', label: 'Consumo & Créditos', icon: CreditCard },
      ],
    },
    {
      title: 'DESENVOLVEDOR',
      items: [
        { id: 'api', label: 'Chaves de API', icon: Key },
        { id: 'logs', label: 'Logs de Mensagens', icon: Terminal },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  const setActiveTab = (tab: string) => {
    const n = new URLSearchParams(searchParams);
    if (tab === 'overview') n.delete('tab');
    else n.set('tab', tab);
    setSearchParams(n);
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    color: palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0 12px 8px',
    marginTop: 24,
  };

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    borderRadius: 14,
    border: 'none',
    background: active ? (isDark ? 'rgba(37, 211, 102, 0.1)' : '#F0FFF4') : 'transparent',
    color: active ? (isDark ? ACCENT : '#059669') : palette.text,
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    transition: 'all 0.2s ease',
  });

  const cardStyle: React.CSSProperties = {
    ...zaptroCardSurfaceStyle(isDark),
    padding: 24,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : ZAPTRO_SECTION_BORDER}`,
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Sessões Ativas</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>04</div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 4 }}>● Sistema Operacional</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Mensagens (Mês)</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>12.4k</div>
          <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginTop: 4 }}>↑ 12% vs mês anterior</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Créditos Disponíveis</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>R$ 450,00</div>
          <button style={{ 
            background: 'none', border: 'none', color: '#0061FF', padding: 0, 
            fontSize: 12, fontWeight: 800, marginTop: 4, cursor: 'pointer', textDecoration: 'underline' 
          }}>
            Recarregar agora
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Minhas Instâncias</h3>
            <button className="hub-premium-pill whatsapp" style={{ fontSize: 12 }}>
              + Nova Sessão
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { name: 'Suporte Comercial', phone: '+55 11 99988-7766', status: 'Conectado' },
              { name: 'Financeiro / Cobrança', phone: '+55 11 97766-5544', status: 'Conectado' },
              { name: 'Logística SAC', phone: '+55 11 94433-2211', status: 'Desconectado' },
            ].map((s, i) => (
              <div key={i} style={{ 
                padding: 16, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', 
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, background: s.status === 'Conectado' ? '#F0FFF4' : '#FFF1F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <PhoneIcon size={20} color={s.status === 'Conectado' ? ACCENT : '#F43F5E'} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: palette.textMuted }}>{s.phone}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: s.status === 'Conectado' ? '#10B981' : '#F43F5E', marginBottom: 4 }}>
                    ● {s.status.toUpperCase()}
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#949494', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Configurar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)', color: '#FFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Zap size={24} color={palette.lime} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>ZapTro Intelligence</h3>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            Seu WhatsApp agora está integrado ao <strong>IA Gateway</strong>. Automatize respostas e classifique leads automaticamente.
          </p>
          <div style={{ marginTop: 24, padding: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Créditos IA</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: palette.lime, marginTop: 4 }}>R$ 120,40</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>Sincronizado com Logta/Dock</div>
          </div>
          <button className="hub-premium-pill whatsapp" style={{ marginTop: 20, width: '100%' }}>
            Configurar Automação IA
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ZaptroLayout breadcrumb="Whatsapp Hub">
      <div style={{ display: 'flex', gap: 32, minHeight: 'calc(100vh - 120px)' }}>
        {/* Internal Sidebar */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}` }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: palette.text }}>Whatsapp Hub</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>CLOUD CLUSTER</div>
            </div>
          </div>

          <nav style={{ marginTop: 16 }}>
            {tabSections.map((sec) => (
              <div key={sec.title} style={{ marginBottom: 16 }}>
                <div style={sectionHeaderStyle}>{sec.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {sec.items.map((item) => (
                    <button
                      key={item.id}
                      style={navBtnStyle(activeTab === item.id)}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          
          <div style={{ marginTop: 'auto', padding: 12 }}>
             <div style={{ 
               padding: 16, borderRadius: 16, background: isDark ? 'rgba(37, 211, 102, 0.05)' : '#F0FFF4', 
               border: `1px solid ${isDark ? 'rgba(37, 211, 102, 0.1)' : '#DCFCE7'}`
             }}>
               <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Status da Rede</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                 <span style={{ fontSize: 12, fontWeight: 700, color: palette.text }}>Edge Gateway Online</span>
               </div>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>
                {activeTab === 'overview' ? 'Central de Operações WhatsApp' : 
                 activeTab === 'instances' ? 'Gerenciamento de Instâncias' :
                 activeTab === 'numbers' ? 'Números e Portabilidade' :
                 activeTab === 'billing' ? 'Consumo e Carteira' :
                 activeTab === 'api' ? 'Developer API Gateway' :
                 activeTab === 'logs' ? 'Logs de Tráfego' : 'Configurações do Hub'}
              </h1>
              <p style={{ margin: '8px 0 0', color: palette.textMuted, fontSize: 15, fontWeight: 500 }}>
                {activeTab === 'overview' ? 'Monitore instâncias, tráfego e créditos de mensageria em tempo real.' : 
                 'Gerencie recursos técnicos e financeiros da sua conta Cloud.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
               <button style={{ 
                 display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
                 border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`, 
                 background: palette.surface, color: palette.text, fontSize: 13, fontWeight: 700, cursor: 'pointer'
               }}>
                 <Globe size={16} /> Documentação
               </button>
            </div>
          </header>

          {activeTab === 'overview' ? renderOverview() : (
            <div style={{ 
              ...cardStyle, height: 400, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 
            }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Smartphone size={32} color={palette.textMuted} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Módulo "{activeTab.toUpperCase()}"</h3>
                <p style={{ margin: '8px 0 0', color: palette.textMuted, fontSize: 14, maxWidth: 300 }}>
                  Esta funcionalidade está sendo provisionada para sua conta no cluster Cloud.
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('overview')}
                className="hub-premium-pill dark"
                style={{ marginTop: 8 }}
              >
                Voltar para Visão Geral
              </button>
            </div>
          )}
        </div>
      </div>
    </ZaptroLayout>
  );
};

export default WhatsappHub;
