import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu, Activity, Clock, UserPlus, FileText, 
  Search as SearchIcon, User, Home, Key, Database, 
  Terminal, Layers, Settings,
  Truck, MapPin, CheckCircle, TrendingUp, Building,
  CreditCard, ShoppingCart, Globe, Server, DollarSign, Plus, Shield, Wifi, Download, FileSpreadsheet,
  UserCheck, Zap, Calendar, CheckCircle2, UploadCloud, RefreshCcw,
  Pencil, Trash2, Lock, Eye, Copy, Mail, ShieldCheck, BarChart3, ChevronRight, Share2, BookOpen, X,
  ArrowLeft, ExternalLink, Brain, Sparkles, Bot, ShieldAlert
} from 'lucide-react';
import HubMetricCard, { HUB_METRIC_GRID_STYLE } from '@shared/components/HubMetricCard';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';
import { MasterProductProjectHeader } from '@hub/components/MasterProductProjectHeader';
import { toastSuccess } from '@core/lib/toast';

type TabId = 'overview' | 'models' | 'providers' | 'usage' | 'billing' | 'api' | 'logs' | 'settings';

const VALID_TABS: TabId[] = ['overview', 'models', 'providers', 'usage', 'billing', 'api', 'logs', 'settings'];

const ACCENT = '#8B5CF6'; // IA Violet

const IAGatewayAdmin: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const wl = useWhiteLabel().settings;
  const rawTab = searchParams.get('tab');
  const activeTab: TabId = VALID_TABS.includes(rawTab as TabId) ? (rawTab as TabId) : 'overview';

  /** URL sem ?tab= abre sempre a Visão Geral (página principal do IA Gateway). */
  useEffect(() => {
    if (rawTab && !VALID_TABS.includes(rawTab as TabId)) {
      const n = new URLSearchParams(searchParams);
      n.delete('tab');
      setSearchParams(n, { replace: true });
    }
  }, [rawTab, searchParams, setSearchParams]);

  const tabSections = [
    {
      title: 'IA Infrastructure',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'models', label: 'Modelos Ativos', icon: Bot },
        { id: 'providers', label: 'Provedores (LLM)', icon: Cpu },
        { id: 'usage', label: 'Uso por Tenant', icon: Building },
        { id: 'billing', label: 'Planos & Pagamentos', icon: CreditCard },
      ],
    },
    {
      title: 'Engineering',
      items: [
        { id: 'api', label: 'Endpoints & Keys', icon: Key },
        { id: 'logs', label: 'Monitoramento APM', icon: Terminal },
        { id: 'settings', label: 'Configurações IA', icon: Settings },
      ],
    },
  ];

  const setActiveTab = (tab: string) => {
    const n = new URLSearchParams(searchParams);
    if (tab === 'overview') n.delete('tab');
    else n.set('tab', tab);
    setSearchParams(n);
  };

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <HubSupabaseChart label="REQUESTS (24H)" value="842k" data={[700, 750, 800, 842, 820, 830, 842]} color={ACCENT} />
        <HubSupabaseChart label="TOKENS CONSUMIDOS" value="1.2B" data={[1, 1.1, 1.2, 1.25, 1.15, 1.2]} color={ACCENT} />
        <HubSupabaseChart label="LATÊNCIA MÉDIA" value="840ms" data={[900, 850, 840, 860, 845, 840]} color="#10B981" />
        <HubSupabaseChart label="CUSTO ESTIMADO" value="US$ 1,420" data={[1.2, 1.3, 1.4, 1.42, 1.38, 1.42]} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Consumo por Tenant (Logta / ZapTro / Dock)</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>TENANT / EMPRESA</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>PRODUTO</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>TOKENS</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 11, color: '#64748B' }}>CRÉDITOS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Transp. Falcão', prod: 'Logta', tokens: '450k', credits: 'R$ 120,00' },
                { name: 'Viação Cometa', prod: 'ZapTro', tokens: '1.2M', credits: 'R$ 310,00' },
                { name: 'LogDock Drive', prod: 'LogDock', tokens: '80k', credits: 'R$ 25,00' },
              ].map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 8px', fontWeight: 600 }}>{t.name}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: 6, 
                      fontSize: 10, 
                      fontWeight: 800,
                      background: t.prod === 'Logta' ? '#EFF6FF' : t.prod === 'ZapTro' ? '#FAF5FF' : '#F1F5F9',
                      color: t.prod === 'Logta' ? '#0061FF' : t.prod === 'ZapTro' ? '#7C3AED' : '#64748B'
                    }}>
                      {t.prod.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px' }}>{t.tokens}</td>
                  <td style={{ padding: '16px 8px', textAlign: 'right' }}>{t.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)', borderRadius: 24, padding: 24, border: '1px solid #D0E0FF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Sparkles size={24} color={ACCENT} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0369A1' }}>Consolidado Master</h3>
          </div>
          <p style={{ fontSize: 13, color: '#0369A1', lineHeight: 1.5 }}>
            Este gateway centraliza as chamadas de IA para <strong>Logta</strong>, <strong>ZapTro</strong> e <strong>LogDock</strong>. Os créditos são universais e podem ser usados em qualquer produto.
          </p>
          <div style={{ marginTop: 24, padding: 16, background: '#FFF', borderRadius: 16, border: '1px solid #D0E0FF' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Créditos Globais IA</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 45.200,00</div>
            <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>↑ 8% vs mês anterior</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModels = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { name: 'Llama 3.2 8B (Ollama VPS)', status: 'Ativo', latency: '450ms', cost: 'Hospedagem Fixa' },
          { name: 'Llama 3 8B (Ollama Local)', status: 'Standby', latency: '120ms', cost: 'Zero Custo' },
          { name: 'Mistral 7B (Ollama VPS)', status: 'Ativo', latency: '410ms', cost: 'Hospedagem Fixa' },
        ].map((m, i) => (
          <div key={i} style={{ background: '#FFF', borderRadius: 20, padding: 20, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={20} color={ACCENT} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '4px 8px', borderRadius: 6 }}>{m.status.toUpperCase()}</span>
            </div>
            <h4 style={{ margin: '16px 0 4px', fontSize: 15, fontWeight: 800 }}>{m.name}</h4>
            <div style={{ fontSize: 12, color: '#64748B' }}>Latência: {m.latency} · Custo: {m.cost}</div>
          </div>
        ))}
      </div>
      
      <div style={{ background: '#FFF', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Métricas de Roteamento (Fallback)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#64748B' }}>ESTRATÉGIA</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#64748B' }}>MODELO PRIMÁRIO</th>
              <th style={{ textAlign: 'left', padding: '12px', fontSize: 11, color: '#64748B' }}>FALLBACK</th>
              <th style={{ textAlign: 'right', padding: '12px', fontSize: 11, color: '#64748B' }}>SUCESSO %</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '16px 12px', fontWeight: 600 }}>Custo Zero (Self-Hosted)</td>
              <td style={{ padding: '16px 12px' }}>Llama 3.2 (Ollama VPS)</td>
              <td style={{ padding: '16px 12px' }}>Llama 3 (Ollama Local)</td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#10B981', fontWeight: 700 }}>99.8%</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 12px', fontWeight: 600 }}>Alta Demanda (Transbordo)</td>
              <td style={{ padding: '16px 12px' }}>Llama 3.2 (Ollama VPS)</td>
              <td style={{ padding: '16px 12px' }}>GPT-4o-mini (OpenAI)</td>
              <td style={{ padding: '16px 12px', textAlign: 'right', color: '#10B981', fontWeight: 700 }}>99.4%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
      {[
        { name: 'Ollama VPS (Master)', health: 'Saudável', spend: 'R$ 290 / Mês (Fix)', color: '#10B981' },
        { name: 'Ollama Local (Mac)', health: 'Saudável', spend: 'R$ 0 / Mês', color: '#10B981' },
        { name: 'OpenAI (Fallback)', health: 'Standby', spend: '$12 / $100', color: '#F59E0B' },
        { name: 'Anthropic (Fallback)', health: 'Inativo', spend: '$0 / $100', color: '#64748B' },
      ].map((p, i) => (
        <div key={i} style={{ background: '#FFF', borderRadius: 20, padding: 24, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>{p.name}</div>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: p.color }} />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 4 }}>STATUS DA API</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 16 }}>{p.health}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>GASTO MENSAL</div>
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: ACCENT, width: '40%' }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>{p.spend}</div>
        </div>
      ))}
    </div>
  );

  const renderUsage = () => (
    <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Gestão de Créditos por Tenant</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="hub-premium-pill success" 
            onClick={() => toastSuccess('Créditos liberados em lote para todos os projetos (Logta, ZapTro, LogDock)!')}
          >
            <Zap size={14} /> LIBERAR CRÉDITOS (REDE)
          </button>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input placeholder="Buscar empresa..." style={{ padding: '8px 12px 8px 32px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13 }} />
          </div>
        </div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#64748B' }}>EMPRESA / PRODUTO</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#64748B' }}>STATUS</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#64748B' }}>USO ACUMULADO</th>
            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: '#64748B' }}>SALDO IA</th>
            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, color: '#64748B' }}>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: 'Transportadora Falcão', prod: 'Logta', status: 'Ativo', usage: 'R$ 84,20', balance: 'R$ 120,00', color: '#10B981' },
            { name: 'Viação Cometa', prod: 'ZapTro', status: 'Ativo', usage: 'R$ 12,40', balance: 'R$ 310,00', color: '#10B981' },
            { name: 'Expresso Federal', prod: 'Logta', status: 'Bloqueado', usage: 'R$ 0,00', balance: 'R$ 0,00', color: '#EF4444' },
            { name: 'LogDock Drive', prod: 'LogDock', status: 'Ativo', usage: 'R$ 2,10', balance: 'R$ 25,00', color: '#10B981' },
          ].map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Produto: {r.prod}</div>
              </td>
              <td style={{ padding: '16px' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: r.color, background: `${r.color}15`, padding: '4px 8px', borderRadius: 6 }}>{r.status.toUpperCase()}</span>
              </td>
              <td style={{ padding: '16px', fontWeight: 600 }}>{r.usage}</td>
              <td style={{ padding: '16px', fontWeight: 900, color: '#0F172A' }}>{r.balance}</td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <button 
                  className="hub-premium-pill secondary" 
                  onClick={() => toastSuccess('Adicionando créditos para ' + r.name)}
                >
                  <Plus size={12} /> Créditos
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBilling = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0', marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <ShieldAlert size={24} color="#EF4444" />
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>AÇÕES DE SEGURANÇA</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <button 
            className="hub-premium-pill dark"
            onClick={() => toastSuccess('Email de recuperação enviado.')}
          >
            <Key size={14} /> RECUPERAR SENHA
          </button>
          <button 
            className="hub-premium-pill danger"
            onClick={() => toastSuccess('Sessão resetada com sucesso.')}
          >
            <RefreshCcw size={14} /> RESETAR SESSÃO
          </button>
          <button 
            className="hub-premium-pill zaptro"
            onClick={() => toastSuccess('Magic link enviado ao administrador.')}
          >
            <Zap size={14} /> ENVIAR MAGIC LINK
          </button>
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Planos de Créditos IA (Logta, ZapTro, LogDock)</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>Pacotes de tokens que serão cobrados e disponibilizados para os tenants do ecossistema.</p>
          </div>
          <button className="hub-premium-pill zaptro">
            <Plus size={16} /> NOVO PLANO IA
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { name: 'IA Starter', price: 'R$ 49,90', tokens: '100k Tokens', desc: 'Ideal para triagem básica do dia a dia.' },
            { name: 'IA Pro', price: 'R$ 149,90', tokens: '500k Tokens', desc: 'Atendimento humanizado e análises LogDock.' },
            { name: 'IA Enterprise', price: 'R$ 499,90', tokens: '2M Tokens', desc: 'Orquestração massiva avançada no Zaptro.' },
          ].map((p, i) => (
            <div key={i} style={{ border: '2px solid #F1F5F9', borderRadius: 16, padding: 24, position: 'relative' }}>
              <h4 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{p.name}</h4>
              <div style={{ margin: '12px 0', fontSize: 24, fontWeight: 900, color: ACCENT }}>{p.price}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', marginBottom: 8, background: '#DCFCE7', display: 'inline-block', padding: '4px 8px', borderRadius: 6 }}>{p.tokens}</div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{p.desc}</p>
              <button className="hub-premium-pill secondary" style={{ width: '100%', marginTop: 16 }}>
                VER LOGS DE EXECUÇÃO
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900 }}>Gateway de Pagamentos (Recarga IA)</h3>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: '#64748B' }}>Sistema de faturamento automático: cobra no cartão ou PIX quando o saldo do cliente acaba.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 20, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 16 }}>
          <div style={{ width: 48, height: 48, background: '#FFF', borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign color="#10B981" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              Stripe / Pagar.me Connect
              <span style={{ fontSize: 10, fontWeight: 800, color: '#10B981', background: '#DCFCE7', padding: '4px 8px', borderRadius: 6 }}>CONECTADO</span>
            </h4>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Processamento nativo de faturas de recarga de IA via Cartão de Crédito e PIX Dinâmico.</div>
          </div>
          <button className="hub-premium-pill secondary">
            GERENCIAR INTEGRAÇÃO
          </button>
        </div>
      </div>
    </div>
  );

  const renderApi = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Endpoints do Gateway</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748B' }}>URLs internas de orquestração para os produtos ZapTro, Logta e LogDock.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'MASTER_GATEWAY_URL', url: 'https://ia-api.zaptro.com.br/v1/master' },
            { label: 'TENANT_ROUTER_URL', url: 'https://ia-api.zaptro.com.br/v1/router/:tenant_id' },
            { label: 'APM_INGRESS_URL', url: 'https://ia-api.zaptro.com.br/v1/apm' },
          ].map((e, i) => (
            <div key={i} style={{ padding: 20, background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 8 }}>{e.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: 13, color: ACCENT, fontWeight: 700 }}>{e.url}</code>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }} onClick={() => toastSuccess('Copiado!')}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#0F172A', borderRadius: 24, padding: 32, color: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <ShieldCheck size={24} color={ACCENT} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Master API Keys</h3>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94A3B8' }}>Chaves globais com permissão de audit e billing total.</p>
        <div style={{ padding: 16, background: '#1E293B', borderRadius: 12, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
          <code style={{ color: '#E2E8F0' }}>ia_master_live_************************************</code>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><Eye size={16} /></button>
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <HubMetricCard label="THROUGHPUT" value="1.2k req/s" icon={Activity} accent={ACCENT} />
        <HubMetricCard label="ERROR RATE" value="0.04%" icon={ShieldAlert} accent="#EF4444" />
        <HubMetricCard label="CACHE HIT" value="68%" icon={Database} accent="#10B981" />
      </div>

      <div style={{ background: '#111827', borderRadius: 24, padding: 24, border: '1px solid #374151' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFF' }}>Monitoramento APM em Tempo Real</h3>
          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 800, background: '#10B98122', padding: '4px 8px', borderRadius: 6 }}>● LIVE TRACKING</span>
        </div>
        <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, paddingBottom: 20 }}>
          {[40, 60, 45, 80, 70, 90, 85, 95, 100, 90, 80, 85, 90, 95, 100, 90, 85, 80, 85, 90, 95, 100, 90, 85].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: ACCENT, borderRadius: 2, opacity: 0.8 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {[
            { t: '12:44:01', msg: 'GPT-4o routing success for tenant Logta_001', st: 'OK' },
            { t: '12:44:03', msg: 'Claude 3.5 fallback triggered for ZapTro_942 (OpenAI Overloaded)', st: 'WARN' },
            { t: '12:44:05', msg: 'Billing update: 420 tokens deducted from LogDock_Drive', st: 'SYS' },
          ].map((l, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, color: '#94A3B8', borderBottom: '1px solid #1F2937', padding: '8px 0' }}>
              <span style={{ color: ACCENT }}>[{l.t}]</span> <span style={{ color: '#E2E8F0' }}>{l.st}:</span> {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={{ background: '#FFF', borderRadius: 24, padding: 32, border: '1px solid #E2E8F0' }}>
      <h3 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 800 }}>Configurações Globais IA</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8 }}>ESTRATÉGIA DE ROTEAMENTO PADRÃO</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <option>100% Custo Zero (Ollama VPS Primário)</option>
              <option>Redundância Local (Ollama VPS → Ollama Mac)</option>
              <option>Transbordo Cloud (Ollama VPS → OpenAI)</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8 }}>MODELO DE IA (OLLAMA)</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <option>llama3.2</option>
              <option>llama3</option>
              <option>mistral</option>
            </select>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8 }}>MARKUP DE TOKENS (REVENA %)</label>
            <input type="number" defaultValue="20" style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1px solid #E2E8F0' }} />
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748B' }}>Margem adicionada ao custo real do provedor para o tenant.</p>
          </div>
          <div>
             <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
               <input type="checkbox" defaultChecked style={{ width: 18, height: 18, accentColor: ACCENT }} />
               <span style={{ fontSize: 14, fontWeight: 700 }}>Bloqueio automático por saldo negativo</span>
             </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="hub-premium-pill zaptro" style={{ padding: '12px 32px' }} onClick={() => toastSuccess('Configurações salvas!')}>SALVAR CONFIGURAÇÕES</button>
      </div>
    </div>
  );

  return (
    <div style={HUB_MASTER_PRODUCT_SHELL.container}>
      <div style={HUB_MASTER_PRODUCT_SHELL.secondarySidebar}>
        <div style={{ ...HUB_MASTER_PRODUCT_SHELL.sidebarHeader, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} color={ACCENT} />
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A' }}>IA Gateway</span>
            </div>
            <button
              type="button"
              onClick={() => toastSuccess('Novo modelo IA adicionado.')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '100px',
                border: 'none',
                background: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: 0,
                boxShadow: `0 4px 12px ${ACCENT}4D`
              }}
              title="Adicionar Modelo IA"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
        <div style={HUB_MASTER_PRODUCT_SHELL.sidebarNav}>
          {tabSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'none', letterSpacing: '0.03em', padding: '4px 10px 6px' }}>
                {sec.title}
              </div>
              {sec.items.map((item) => (
                <button
                  key={item.id}
                  style={{
                    ...HUB_MASTER_PRODUCT_SHELL.sidebarBtn,
                    backgroundColor: activeTab === item.id ? '#F5F3FF' : 'transparent',
                    color: activeTab === item.id ? '#0F172A' : '#475569',
                  }}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon size={14} style={{ color: activeTab === item.id ? ACCENT : '#64748B' }} />
                  <span style={{ fontWeight: activeTab === item.id ? 700 : 400, fontSize: '12px' }}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={HUB_MASTER_PRODUCT_SHELL.contentArea}>
        <div style={{ 
          ...HUB_MASTER_PRODUCT_SHELL.content, 
          gap: 24 
        }}>
          {activeTab === 'overview' && (
            <>
              <MasterProductProjectHeader
                title="Gateway de Inteligência Artificial"
                subtitle="Central de orquestração de LLMs, roteamento e billing de tokens"
                domainUrl="ia.logta.com.br"
                domainLabel="ia.logta.com.br"
                accentColor={ACCENT}
                avatarName="IA"
                actions={
                  <button 
                    onClick={() => toastSuccess('Relatório consolidado gerado!')}
                    className="hub-premium-pill zaptro"
                  >
                    <Download size={16} /> EXPORTAR MÉTRICAS
                  </button>
                }
              />
              {renderOverview()}
            </>
          )}
          {activeTab === 'models' && renderModels()}
          {activeTab === 'providers' && renderProviders()}
          {activeTab === 'usage' && renderUsage()}
          {activeTab === 'billing' && renderBilling()}
          {activeTab === 'api' && renderApi()}
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default IAGatewayAdmin;
