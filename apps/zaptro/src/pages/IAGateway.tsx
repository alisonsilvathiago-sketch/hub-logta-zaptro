import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain, Sparkles, Activity, CreditCard, Terminal, 
  Settings, Cpu, BarChart3, Database, Key, 
  ArrowUpRight, Zap, Shield, HelpCircle, TrendingUp,
  MessageSquare, Layers, Search
} from 'lucide-react';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { zaptroCardSurfaceStyle } from '../constants/zaptroCardSurface';
import { ZAPTRO_FIELD_BG, ZAPTRO_SECTION_BORDER } from '../constants/zaptroUi';

const IA_ACCENT = '#0061FF';

type TabId = 'overview' | 'usage' | 'billing' | 'api' | 'settings';

const IAGateway: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { palette } = useZaptroTheme();
  const isDark = palette.mode === 'dark';
  const activeTab = (searchParams.get('tab') as TabId) || 'overview';

  const setActiveTab = (tab: string) => {
    const n = new URLSearchParams(searchParams);
    if (tab === 'overview') n.delete('tab');
    else n.set('tab', tab);
    setSearchParams(n);
  };

  const cardStyle: React.CSSProperties = {
    ...zaptroCardSurfaceStyle(isDark),
    padding: 24,
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : ZAPTRO_SECTION_BORDER}`,
  };

  const navBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 12,
    border: active ? `1.5px solid ${IA_ACCENT}` : '1.5px solid transparent',
    background: active ? (isDark ? 'rgba(0, 97, 255, 0.1)' : '#F0F7FF') : 'transparent',
    color: active ? IA_ACCENT : palette.textMuted,
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Tokens Consumidos (Mês)</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>1.4M</div>
          <div style={{ fontSize: 12, color: IA_ACCENT, fontWeight: 700, marginTop: 4 }}>≈ R$ 82,40</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Créditos Disponíveis</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>R$ 45.200,00</div>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>● Carteira Global Master</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>Média de Latência</div>
          <div style={{ fontSize: 32, fontWeight: 900 }}>450ms</div>
          <div style={{ fontSize: 12, color: '#10B981', fontWeight: 700, marginTop: 4 }}>Sistema Estável</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={cardStyle}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Uso Recente de Modelos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { model: 'GPT-4o (Chat/CRM)', tokens: '850k', cost: 'R$ 42,50', status: 'Ativo' },
              { model: 'Claude 3.5 (Análise)', tokens: '420k', cost: 'R$ 31,10', status: 'Ativo' },
              { model: 'DALL-E 3 (Imagens)', tokens: '12 imgs', cost: 'R$ 8,80', status: 'Ativo' },
            ].map((m, i) => (
              <div key={i} style={{ 
                padding: 16, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', 
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Sparkles size={20} color={IA_ACCENT} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.model}</div>
                    <div style={{ fontSize: 12, color: palette.textMuted }}>{m.tokens} tokens consumidos</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.cost}</div>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 800 }}>{m.status.toUpperCase()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0061FF 0%, #0046B8 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Brain size={24} color={palette.lime} />
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Universal Credits</h3>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            Seus créditos de IA são compartilhados entre <strong>ZapTro</strong>, <strong>Logta</strong> e <strong>LogDock</strong>. Compre uma vez e use em todo o ecossistema.
          </p>
          <div style={{ marginTop: 32, padding: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Saldo Atual</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: palette.lime, marginTop: 4 }}>R$ 45.200,00</div>
          </div>
          <button className="hub-premium-pill primary" style={{ marginTop: 24, width: '100%' }}>
            Comprar Créditos IA
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <ZaptroLayout breadcrumb="IA Gateway">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: IA_ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={18} color="white" />
              </div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>IA Gateway Dashboard</h1>
            </div>
            <p style={{ margin: 0, color: palette.textMuted, fontSize: 15, fontWeight: 500 }}>
              Gerencie orquestração de modelos, consumo de tokens e faturamento centralizado.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9', padding: 6, borderRadius: 16 }}>
            <button style={navBtnStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>Visão Geral</button>
            <button style={navBtnStyle(activeTab === 'usage')} onClick={() => setActiveTab('usage')}>Consumo Detalhado</button>
            <button style={navBtnStyle(activeTab === 'billing')} onClick={() => setActiveTab('billing')}>Financeiro</button>
            <button style={navBtnStyle(activeTab === 'api')} onClick={() => setActiveTab('api')}>API / Keys</button>
          </div>
        </header>

        {activeTab === 'overview' ? renderOverview() : (
          <div style={{ 
            ...cardStyle, height: 400, display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 
          }}>
            <Cpu size={48} color={palette.textMuted} />
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Módulo IA "{activeTab.toUpperCase()}"</h3>
              <p style={{ margin: '8px 0 0', color: palette.textMuted, fontSize: 14 }}>
                Sincronizando dados com o cluster Master...
              </p>
            </div>
          </div>
        )}
      </div>
    </ZaptroLayout>
  );
};

export default IAGateway;
