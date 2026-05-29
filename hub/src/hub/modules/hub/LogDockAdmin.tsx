import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import LogDockClientProfile from './LogDockClientProfile';
import {
  Cpu,
  Home,
  Database,
  Cloud,
  Server,
  Activity,
  Shield,
  Zap,
  Globe,
  Settings,
  HardDrive,
  RefreshCcw,
  Terminal,
  Layers,
  Webhook,
  Activity as ActivityIcon,
  Search as SearchIcon,
  Plus,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  FileText,
  Clock,
  ShieldCheck,
  Key,
  BarChart3,
  Network,
  Binary,
  MessageSquare,
  FileSpreadsheet,
  TrendingUp,
  Box,
  Lock,
  Eye,
  Trash2,
  Copy,
  AlertCircle,
  Wifi,
  Building,
  CreditCard,
  DollarSign,
  UserCheck,
  Users,
  Pencil,
  Download,
  X,
  ArrowLeft,
  Receipt,
  Calendar,
  Hash,
  CheckCircle2,
  Link2,
  Truck,
} from 'lucide-react';
import HubMetricCard from '@shared/components/HubMetricCard';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import { HUB_PAGE_TITLE } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';
import { MasterProductProjectHeader } from '@hub/components/MasterProductProjectHeader';
import { toastSuccess } from '@core/lib/toast';

const shell = HUB_MASTER_PRODUCT_SHELL;
const LOGDOCK_BLUE = '#0061FF';
const ACCENT = '#0061FF';

/** Banner unificado para mostrar status global do ecossistema no LogDock */
const GlobalConsolidatedBanner: React.FC = () => {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #F0F9FF 0%, #FFFFFF 100%)',
      border: '1px solid #D0E0FF',
      borderRadius: 16,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
          <ShieldCheck size={20} color={LOGDOCK_BLUE} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Infraestrutura Protegida</div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Todos os 14 clusters operando com 99.98% de uptime.</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>LOGTA OK</div>
        <div style={{ fontSize: 10, fontWeight: 900, padding: '4px 8px', borderRadius: 6, background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>ZAPTRO OK</div>
      </div>
    </div>
  );
};

/** Cabeçalho de seção padrão para o LogDock */
const SectionLead: React.FC<{ title: string; path: string }> = ({ title, path }) => {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Globe size={12} color="#64748B" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>{path}</span>
        </div>
      </div>
    </div>
  );
};

type TabId =
  | 'overview'
  | 'tenants'
  | 'clients'
  | 'billing'
  | 'apis'
  | 'database'
  | 'drive'
  | 'backups'
  | 'cdn'
  | 'workers'
  | 'whatsapp'
  | 'webhooks'
  | 'logs'
  | 'monitoring'
  | 'fleet'
  | 'security'
  | 'performance'
  | 'settings';

type TabItem = { id: TabId; label: string; icon: React.ElementType };
type TabItemSection = { title: string; items: TabItem[] };

function QuickOpenChip({ path, label: customLabel }: { path: string; label?: string }) {
  const displayLabel = customLabel || (path.length > 28 ? `${path.slice(0, 26)}…` : path);
  return (
    <button
      type="button"
      onClick={() => window.open(path, '_blank')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 20px',
        borderRadius: '100px',
        border: '1px solid #CBD5E144',
        background: '#F8FAFC',
        color: '#0F172A',
        fontSize: 11,
        fontWeight: '900',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      Abrir LogDock
      <ExternalLink size={13} />
      <span style={{ fontWeight: 600, opacity: 0.85, marginLeft: 4 }}>{displayLabel}</span>
    </button>
  );
}

const ZS: Record<string, React.CSSProperties> = {
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 0, paddingBottom: 0 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: '16px 27px 15px',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
  },
  scroll500: { maxHeight: 500, overflowY: 'auto' as const },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    height: 36,
  },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 13, fontWeight: 400, width: 220, color: '#0F172A' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    textAlign: 'left' as const,
    padding: '12px 20px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  td: { padding: '16px 20px', verticalAlign: 'middle' as const, fontSize: 13, textAlign: 'left' as const },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 20px',
    borderRadius: '100px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    color: '#475569',
    fontSize: 11,
    fontWeight: '900',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
};

const LogDockAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const wl = useWhiteLabel().settings;

  const tabSections: TabItemSection[] = [
    {
      title: 'Projeto',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'tenants', label: 'Empresas (Tenants)', icon: Building },
        { id: 'clients', label: 'Clientes (Pessoas)', icon: Users },
        { id: 'billing', label: 'Planos & Billing', icon: CreditCard },
      ],
    },
    {
      title: 'Storage & Drive',
      items: [
        { id: 'drive', label: 'Arquivos & Buckets', icon: HardDrive },
        { id: 'backups', label: 'Backups & Snapshots', icon: RefreshCcw },
        { id: 'cdn', label: 'Distribuição CDN', icon: Globe },
      ],
    },
    {
      title: 'Automações & IA',
      items: [
        { id: 'whatsapp', label: 'WhatsApp (ZapTro Core)', icon: MessageSquare },
        { id: 'webhooks', label: 'Webhooks & Events', icon: Layers },
      ],
    },
    {
      title: 'Monitoramento',
      items: [
        { id: 'logs', label: 'Logs em Tempo Real', icon: Terminal },
        { id: 'performance', label: 'Performance (APM)', icon: ActivityIcon },
        { id: 'monitoring', label: 'Status dos Serviços', icon: ShieldCheck },
        { id: 'fleet', label: 'Infraestrutura Fleet', icon: Truck },
      ],
    },
    {
      title: 'Gerenciamento',
      items: [
        { id: 'security', label: 'Segurança & Keys', icon: Shield },
        { id: 'settings', label: 'Configurações', icon: Settings },
      ],
    },
  ];

  const allValidTabs = tabSections.flatMap((sec) => sec.items.map((i) => i.id));
  const rawTab = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = rawTab && allValidTabs.includes(rawTab) ? rawTab : 'overview';
  const focus = searchParams.get('focus');

  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [isPlusMenuModalOpen, setIsPlusMenuModalOpen] = useState(false);
  const [selectedPlanItem, setSelectedPlanItem] = useState<string | null>('logta');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const setActiveTab = (tab: TabId) => {
    if (id) {
      navigate({
        pathname: '/master/logdock',
        search: `?tab=${tab}&${searchParams.toString().replace(/tab=[^&]*&?/, '')}`
      });
      return;
    }

    const n = new URLSearchParams(searchParams);
    n.delete('focus');
    if (tab === 'overview') n.delete('tab');
    else n.set('tab', tab);
    setSearchParams(n, { replace: true });
  };

  const renderChartRow = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
      <HubSupabaseChart label="REQUISIÇÕES (24H)" value="1.2M" data={[80, 90, 100, 120, 110, 130, 120, 140, 150, 160]} color={LOGDOCK_BLUE} />
      <HubSupabaseChart label="LATÊNCIA MÉDIA" value="42ms" data={[45, 42, 40, 38, 41, 40, 42, 39, 41, 42]} color={LOGDOCK_BLUE} />
      <HubSupabaseChart label="STORAGE UTILIZADO" value="840GB" data={[800, 810, 815, 820, 825, 830, 835, 840, 840, 840]} color={LOGDOCK_BLUE} />
      <HubSupabaseChart label="UPTIME (30D)" value="99.98%" data={[99, 99.5, 99.8, 99.9, 100, 100, 99.9, 100, 100, 99.98]} color="#10B981" />
    </div>
  );

  const titles: Record<TabId, string> = {
    overview: 'Visão Geral',
    tenants: 'Empresas (Tenants)',
    clients: 'Clientes (Pessoas)',
    billing: 'Planos & Billing',
    apis: 'APIs & Gateway',
    database: 'Banco de Dados',
    drive: 'Arquivos & Buckets',
    backups: 'Backups & Snapshots',
    cdn: 'Distribuição CDN',
    workers: 'Workers & Filas',
    whatsapp: 'WhatsApp (ZapTro Core)',
    webhooks: 'Webhooks & Events',
    logs: 'Logs em Tempo Real',
    performance: 'Performance (APM)',
    monitoring: 'Status dos Serviços',
    fleet: 'Infraestrutura Fleet',
    security: 'Segurança & Keys',
    settings: 'Configurações',
  };

  const focusContent = focus === 'whatsapp' ? (
    <div style={{ margin: '40px 0', padding: 16, borderRadius: 12, border: `2px solid ${LOGDOCK_BLUE}`, background: 'linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%)' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Atalho Master · whatsapp</div>
      <p style={{ margin: '8px 0 12px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Configuração de Gateway & Mensageria</p>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>Abre a área de monitoramento de instâncias WhatsApp no LogDock; controle de sessões e tráfego IA.</p>
      <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: '100px', background: LOGDOCK_BLUE, border: 'none', color: '#FFF', fontWeight: 900, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' }}>
        <ExternalLink size={16} /> Abrir no LogDock (infra whatsapp)
      </button>
    </div>
  ) : null;

  const renderTenantsList = () => (
    <div style={ZS.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Clientes que contrataram o sistema</h3>
        <div style={ZS.searchBox}>
          <SearchIcon size={14} color="#94A3B8" />
          <input type="text" placeholder="Buscar por empresa..." style={ZS.searchInput} />
        </div>
      </div>
      <table style={ZS.table}>
        <thead>
          <tr>
            <th style={ZS.th}>Empresa</th>
            <th style={ZS.th}>Plano</th>
            <th style={ZS.th}>Consumo</th>
            <th style={ZS.th}>Status</th>
            <th style={ZS.th}>Última Atividade</th>
            <th style={ZS.th}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {[
            { name: 'Transportadora Falcão', id: 'tenant-1', plan: 'Enterprise', status: 'Ativo', apps: ['logta', 'zaptro'], usage: '82%', last: 'Há 12 min' },
            { name: 'Indústrias Matarazzo', id: 'tenant-2', plan: 'Pro', status: 'Ativo', apps: ['logta'], usage: '45%', last: 'Há 1h' },
            { name: 'Viação Cometa', id: 'tenant-3', plan: 'Start', status: 'Atrasado', apps: [], usage: '12%', last: 'Ontem' },
          ].map((t, i) => (
            <tr key={i} style={{ ...ZS.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logdock/${t.id}`)}>
              <td style={ZS.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <HubEntityAvatar name={t.name} size={32} />
                  <div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{t.id}</div>
                  </div>
                </div>
              </td>
              <td style={ZS.td}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.plan === 'Enterprise' ? '#0369A1' : '#64748B' }}>{t.plan}</span>
              </td>
              <td style={ZS.td}>
                <div style={{ width: 80, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: t.usage, height: '100%', background: LOGDOCK_BLUE }} />
                </div>
                <div style={{ fontSize: 11, marginTop: 4 }}>{t.usage} storage</div>
              </td>
              <td style={ZS.td}><span style={{ color: '#10B981', fontWeight: 800, fontSize: 11 }}>ATIVO</span></td>
              <td style={ZS.td}>{t.last}</td>
              <td style={ZS.td}>
                <button style={ZS.actionBtn}>Monitorar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'tenants') {
       return renderTenantsList();
    }

    if (activeTab === 'clients') {
      return (
        <div style={ZS.tabContent}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h3 style={{ ...ZS.cardTitleInline, marginBottom: 4 }}>Clientes Individuais</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Gestão de pessoas físicas que utilizam os serviços LogDock.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
               <div style={ZS.searchBox}>
                  <SearchIcon size={14} color="#94A3B8" />
                  <input type="text" placeholder="Buscar por nome ou CPF..." style={ZS.searchInput} />
               </div>
               <button style={{ ...ZS.actionBtn, background: ACCENT, color: '#FFF', borderColor: ACCENT }}>
                  <Plus size={14} /> Novo Cliente
               </button>
            </div>
          </div>

          <div style={ZS.card}>
            <table style={ZS.table}>
              <thead>
                <tr>
                  <th style={ZS.th}>Nome / Identificação</th>
                  <th style={ZS.th}>Documento</th>
                  <th style={ZS.th}>Consumo Acumulado</th>
                  <th style={ZS.th}>Última Compra</th>
                  <th style={ZS.th}>Status</th>
                  <th style={ZS.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ricardo Santos', email: 'ricardo@email.com', doc: '455.***.***-21', usage: 'R$ 1.240,00', last: 'Hoje, 10:20', status: 'Ativo' },
                  { name: 'Juliana Oliveira', email: 'juliana.o@tech.io', doc: '382.***.***-44', usage: 'R$ 890,50', last: 'Ontem, 18:45', status: 'Ativo' },
                  { name: 'Marcos Ferreira', email: 'marcos.dev@gmail.com', doc: '112.***.***-99', usage: 'R$ 4.560,00', last: '12 Out 2023', status: 'Atrasado' },
                  { name: 'Ana Paula Costa', email: 'ana.costa@empresa.com.br', doc: '098.***.***-10', usage: 'R$ 150,00', last: '10 Out 2023', status: 'Ativo' },
                ].map((c, i) => (
                  <tr key={i} style={{ ...ZS.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logta?tab=clients&clientId=1&context=logdock`)}>
                    <td style={ZS.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                           {c.name.charAt(0)}
                        </div>
                        <div>
                           <div style={{ fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                           <div style={{ fontSize: 11, color: '#64748B' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={ZS.td}>{c.doc}</td>
                    <td style={ZS.td}><span style={{ fontWeight: 700, color: '#0F172A' }}>{c.usage}</span></td>
                    <td style={ZS.td}><span style={{ fontSize: 12, color: '#64748B' }}>{c.last}</span></td>
                    <td style={ZS.td}>
                       <span style={{ fontSize: 11, fontWeight: 700, color: c.status === 'Ativo' ? '#10B981' : '#EF4444', background: c.status === 'Ativo' ? '#ECFDF5' : '#FEF2F2', padding: '4px 8px', borderRadius: 4 }}>
                          {c.status.toUpperCase()}
                       </span>
                    </td>
                    <td style={ZS.td}>
                       <div style={{ display: 'flex', gap: 6 }}>
                          <button style={ZS.actionBtn} title="Editar"><Pencil size={14} /></button>
                          <button style={ZS.actionBtn} title="Financeiro"><DollarSign size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'apis' || activeTab === 'security') {
       return (
          <div style={ZS.card}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                   <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Chaves de API & Autenticação</h3>
                   <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Gerencie chaves LD_ para acesso externo aos recursos.</p>
                </div>
                <button style={{ ...ZS.actionBtn, background: '#0F172A', color: '#FFF' }} onClick={() => toastSuccess('Nova chave gerada!')}>
                   <Plus size={14} /> Gerar Nova Chave
                </button>
             </div>
             <table style={ZS.table}>
                <thead>
                   <tr>
                      <th style={ZS.th}>Nome da Chave</th>
                      <th style={ZS.th}>Token</th>
                      <th style={ZS.th}>Empresa Vinculada</th>
                      <th style={ZS.th}>Status</th>
                      <th style={ZS.th}>Ações</th>
                   </tr>
                </thead>
                <tbody>
                   {[1, 2, 3].map(i => (
                      <tr key={i} style={ZS.tr}>
                         <td style={ZS.td}><div style={{ fontWeight: 600 }}>Produção - Cluster {i}</div></td>
                         <td style={ZS.td}><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>ld_8pds2hh...</code></td>
                         <td style={ZS.td}><span style={{ fontSize: 12 }}>Empresa {i}</span></td>
                         <td style={ZS.td}><span style={{ padding: '4px 8px', background: '#DCFCE7', color: '#166534', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>ATIVA</span></td>
                         <td style={ZS.td}>
                            <div style={{ display: 'flex', gap: 8 }}>
                               <button style={ZS.actionBtn}><Copy size={12} /></button>
                               <button style={{ ...ZS.actionBtn, color: '#EF4444' }}><Trash2 size={12} /></button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       );
    }

    if (activeTab === 'billing') {
      if (selectedInvoiceId) {
        return (
          <div style={ZS.tabContent}>
            <header style={{ padding: '20px 0 0', marginTop: 10, marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={() => setSelectedInvoiceId(null)} style={{ width: 44, height: 44, borderRadius: 14, border: '2px solid #E2E8F0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
                  <ArrowLeft size={20} />
                </button>
                <img alt="" src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=128&h=128&fit=crop&q=80" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Receipt size={22} color="#64748B" style={{ flexShrink: 0 }} />
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.5px' }}>Fatura #FAT-1049</h2>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#0061FF', background: 'rgba(0, 97, 255, 0.08)', padding: '4px 10px', borderRadius: 6 }}>● Pago</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', fontWeight: 600 }}>Detalhamento financeiro e cobrança SaaS</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button type="button" style={{ ...ZS.actionBtn, padding: '10px 16px', color: '#0061FF', borderColor: '#0061FF' }}><ExternalLink size={16} /> Enviar por E-mail</button>
                <button type="button" style={{ ...ZS.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF', padding: '10px 16px', boxShadow: '0 4px 12px rgba(0, 97, 255, 0.25)' }}><Download size={16} /> Baixar PDF</button>
              </div>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 40 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, border: '1px dashed #CBD5E1', background: '#F8FAFC', fontSize: 12, color: '#475569' }}>
                <Link2 size={20} color="#0061FF" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 220 }}><strong>Link público do comprovante:</strong> <code style={{ wordBreak: 'break-all' }}>http://localhost:5175/master/logta?receipt=1</code></div>
                <button style={{ ...ZS.actionBtn, fontWeight: 800 }}>Copiar link</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ background: '#FFF', borderRadius: 24, padding: 24, borderWidth: '1px 1px 1px 6px', borderStyle: 'solid', borderColor: '#E2E8F0 #E2E8F0 #E2E8F0 #0061FF' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Valor Total</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>R$ 4.500,00</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Vencimento</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', marginTop: 12 }}><Calendar size={16} style={{ marginRight: 6, color: '#64748B' }} /> 15/05/2026</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Forma de Pagamento</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', display: 'flex', alignItems: 'center', marginTop: 14 }}><CreditCard size={16} style={{ marginRight: 6, color: '#64748B' }} /> Boleto Bancário • Itaú</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ ...ZS.card, borderRadius: 24, padding: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Detalhamento da Cobrança</h3>
                    <table style={{ ...ZS.table, marginTop: 20 }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                          <th style={{ ...ZS.th, background: 'none', paddingLeft: 0 }}>Descrição do Item</th>
                          <th style={{ ...ZS.th, background: 'none', textAlign: 'center' }}>Qtd</th>
                          <th style={{ ...ZS.th, background: 'none', textAlign: 'right' }}>Vlr. Unitário</th>
                          <th style={{ ...ZS.th, background: 'none', textAlign: 'right', paddingRight: 0 }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { item: 'Assinatura Mensal - Pro', qty: '1 un', unit: 'R$ 4.500,00', total: 'R$ 4.500,00' },
                          { item: 'Créditos Extras Telemetria Satélite', qty: '250 un', unit: 'R$ 0,15', total: 'R$ 37,50' },
                          { item: 'Volume Excedente API Geocoding', qty: '1.200 req', unit: 'R$ 0,02', total: 'R$ 24,00' },
                        ].map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '16px 0', fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{row.item}</td>
                            <td style={{ padding: '16px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{row.qty}</td>
                            <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#64748B' }}>{row.unit}</td>
                            <td style={{ padding: '16px 0', textAlign: 'right', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{row.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                      <div style={{ textAlign: 'right', width: 200 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, fontSize: 13, color: '#64748B', fontWeight: 600 }}><span>Subtotal</span><span>R$ 4.500,00</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, fontSize: 13, color: '#0061FF', fontWeight: 700 }}><span>Descontos</span><span>R$ 0,00</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid #0F172A', fontSize: 18, fontWeight: 900, color: '#0F172A' }}><span>Total Geral</span><span>R$ 4.500,00</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div style={{ ...ZS.card, borderRadius: 24, padding: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Dados do Tomador</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Building size={16} color="#94A3B8" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Transportadora Falcão</div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>CNPJ: 45.201.889/0001-92</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Hash size={16} color="#94A3B8" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Identificador Monorepo</div>
                          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748B', marginTop: 2 }}>1</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: 24, padding: 24, border: '1px solid #E2E8F0' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Linha do Tempo da Fatura</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                      {[
                        { label: 'Cobrança Registrada no Gateway • 01/05' },
                        { label: 'Notificação por E-mail Enfileirada • 01/05' },
                        { label: 'Pagamento Confirmado • 15/05/2026' },
                      ].map((evt, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12 }}>
                          <CheckCircle2 size={14} color="#0061FF" />
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{evt.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...ZS.card, borderRadius: 24, padding: '16px 0 15px 24px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Histórico de pagamentos</h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#64748B', paddingRight: 24 }}>Clique para alterar a fatura exibida. Total: 4.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12, paddingRight: 16 }}>
                      <input placeholder="Pesquisar..." type="search" style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, outline: 'none', background: '#F8FAFC' }} />
                    </div>
                    <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                       {[
                         { name: 'Transportadora Falcão', val: 'R$ 4.500,00', status: 'Pago', active: true },
                         { name: 'Expresso Federal', val: 'R$ 8.200,00', status: 'Pendente' },
                         { name: 'Rápido Trans', val: 'R$ 2.100,00', status: 'Pago' },
                         { name: 'Alfa Transportes', val: 'R$ 500,00', status: 'Pago' },
                       ].map((h, i) => (
                         <button key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 12, border: h.active ? '2px solid #0061FF' : '1px solid #E2E8F0', background: h.active ? '#EFF6FF' : '#FFF', cursor: 'pointer' }}>
                           <span style={{ fontWeight: 600, color: '#0F172A' }}>{h.name}</span>
                           <span style={{ fontWeight: 800, color: '#475569', marginLeft: 'auto', marginRight: 12 }}>{h.val}</span>
                           <span style={{ fontSize: 11, fontWeight: 700, color: h.status === 'Pago' ? '#0061FF' : '#F59E0B' }}>{h.status}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div style={ZS.tabContent}>
          <div style={{ background: '#FFF', borderRadius: 8, padding: '16px 27px 15px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={ZS.searchBox}>
                  <SearchIcon size={14} color="#94A3B8" />
                  <input placeholder="Buscar cliente ou status..." type="text" style={ZS.searchInput} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={ZS.actionBtn}><FileSpreadsheet size={14} color="#0046C7" /> Excel</button>
                <button type="button" style={ZS.actionBtn}><FileText size={14} color="#DC2626" /> PDF</button>
                <button 
                  type="button" 
                  onClick={() => setIsNewPlanModalOpen(true)}
                  style={{ ...ZS.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF' }}
                >
                  <Plus size={14} /> Novo Plano
                </button>
              </div>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#64748B' }}>
              Checkout: copie o link e envie ao cliente. Após confirmação de pagamento no gateway, o comprovante pode ser baixado e um e-mail automático será disparado quando a integração transacional estiver ativa no projeto.
            </p>
            <table style={ZS.table}>
              <thead>
                <tr>
                  <th style={ZS.th}>Cliente</th>
                  <th style={ZS.th}>Valor</th>
                  <th style={ZS.th}>Vencimento</th>
                  <th style={ZS.th}>Status</th>
                  <th style={ZS.th}>Checkout</th>
                  <th style={ZS.th}>Comprovante</th>
                  <th style={ZS.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'FAT-1049', name: 'Transportadora Falcão', val: 'R$ 4.500,00', date: '15/05/2026', status: 'Pago', color: '#0061FF' },
                  { id: 'FAT-1050', name: 'Expresso Federal', val: 'R$ 8.200,00', date: '18/05/2026', status: 'Pendente', color: '#F59E0B' },
                  { id: 'FAT-1051', name: 'Rápido Trans', val: 'R$ 2.100,00', date: '10/05/2026', status: 'Pago', color: '#0061FF' },
                ].map((b, i) => (
                  <tr key={i} style={{ ...ZS.tr, cursor: 'pointer' }} onClick={() => setSelectedInvoiceId(b.id)}>
                    <td style={ZS.td}><span style={{ fontWeight: 600, color: '#1E293B' }}>{b.name}</span></td>
                    <td style={ZS.td}><span style={{ fontWeight: 700, color: '#0F172A' }}>{b.val}</span></td>
                    <td style={ZS.td}><span style={{ fontSize: 13, fontWeight: 500, color: '#64748B' }}>{b.date}</span></td>
                    <td style={ZS.td}><span style={{ fontSize: 11, fontWeight: 800, color: b.color }}>{b.status}</span></td>
                    <td style={ZS.td} onClick={(e) => e.stopPropagation()}><button style={ZS.actionBtn}><Copy size={14} /> Link</button></td>
                    <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={ZS.actionBtn}><ExternalLink size={14} /> Público</button>
                        <button style={ZS.actionBtn}><Download size={14} /> PDF</button>
                      </div>
                    </td>
                    <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                       <div style={{ display: 'flex', gap: 6 }}>
                          <button style={ZS.actionBtn}><Lock size={14} /></button>
                          <button style={{ ...ZS.actionBtn, color: '#B91C1C' }}><Trash2 size={14} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'drive' || activeTab === 'backups') {
       return (
          <div style={ZS.card}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                   <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Buckets & Armazenamento Cloud</h3>
                   <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Volume total monitorado: 2.8 TB entre 14 clusters.</p>
                </div>
                <div style={ZS.searchBox}>
                   <SearchIcon size={14} color="#94A3B8" />
                   <input type="text" placeholder="Filtrar buckets..." style={ZS.searchInput} />
                </div>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                   { name: 'media-production', size: '840GB', region: 'us-east-1' },
                   { name: 'backups-daily', size: '1.2TB', region: 'sa-east-1' },
                   { name: 'cdn-cache', size: '120GB', region: 'global' },
                ].map((b, i) => (
                   <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                         <HardDrive size={18} color={LOGDOCK_BLUE} />
                         <span style={{ fontWeight: 700 }}>{b.name}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
                         <span>Tamanho: <strong>{b.size}</strong></span>
                         <span>Região: {b.region}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       );
    }

    if (activeTab === 'monitoring' || activeTab === 'performance') {
       return (
          <div style={ZS.card}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Status dos Serviços Regionais</h3>
                <span style={{ fontSize: 12, color: '#10B981', fontWeight: 800 }}>● Todos Sistemas Operacionais</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                   { name: 'South America (São Paulo)', status: 'Online', latency: '12ms', load: '32%' },
                   { name: 'US East (North Virginia)', status: 'Online', latency: '84ms', load: '45%' },
                   { name: 'Europe (Frankfurt)', status: 'Online', latency: '142ms', load: '28%' },
                ].map((r, i) => (
                   <div key={i} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #F1F5F9', background: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                         <Wifi size={16} color={LOGDOCK_BLUE} />
                         <span style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 24, fontSize: 12, fontWeight: 700 }}>
                         <span style={{ color: '#10B981' }}>{r.status}</span>
                         <span style={{ color: '#64748B' }}>{r.latency}</span>
                         <span style={{ color: LOGDOCK_BLUE }}>{r.load} load</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       );
    }

    if (activeTab === 'settings') {
       return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
             {/* APIs & Gateway Config */}
             <div style={ZS.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                   <Webhook size={20} color={LOGDOCK_BLUE} />
                   <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Configuração de APIs & Gateway</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                   <div style={{ padding: 16, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Endereço do Gateway</div>
                      <code style={{ fontSize: 12, color: LOGDOCK_BLUE }}>https://api.logdock.io/v1</code>
                   </div>
                   <div style={{ padding: 16, borderRadius: 10, border: '1px solid #F1F5F9' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Timeout Global</div>
                      <span style={{ fontSize: 13 }}>30s</span>
                   </div>
                </div>
             </div>

             {/* Database Config */}
             <div style={ZS.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                   <Database size={20} color={LOGDOCK_BLUE} />
                   <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Banco de Dados (Master)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                      <span style={{ fontSize: 13, color: '#64748B' }}>Pool de Conexões</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>100 Max</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
                      <span style={{ fontSize: 13, color: '#64748B' }}>Modo de Réplica</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Alta Disponibilidade (Read/Write)</span>
                   </div>
                </div>
             </div>

             {/* Workers & Queues Config */}
             <div style={ZS.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                   <Binary size={20} color={LOGDOCK_BLUE} />
                   <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Workers & Filas</h3>
                </div>
                <div style={{ padding: 16, borderRadius: 10, background: '#F0F9FF', border: '1px solid #E0F2FE' }}>
                   <div style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>Cluster de Processamento</div>
                   <p style={{ margin: '4px 0 0', fontSize: 12, color: '#0369A1' }}>BullMQ + Redis operando em sa-east-1.</p>
                </div>
             </div>
          </div>
       );
    }

    return (
      <div style={ZS.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gerenciamento de {activeTab}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={ZS.searchBox}>
              <SearchIcon size={14} color="#94A3B8" />
              <input type="text" placeholder="Filtrar recursos..." style={ZS.searchInput} />
            </div>
            <button type="button" style={ZS.actionBtn}>
              <FileSpreadsheet size={14} /> Exportar
            </button>
          </div>
        </div>
        <table style={ZS.table}>
          <thead>
            <tr>
              <th style={ZS.th}>Recurso / Serviço</th>
              <th style={ZS.th}>Status</th>
              <th style={ZS.th}>Consumo / Carga</th>
              <th style={ZS.th}>Última Alteração</th>
              <th style={ZS.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} style={{ ...ZS.tr, cursor: 'pointer' }} onClick={() => navigate(`/master/logdock/tenant-${i}`)}>
                <td style={ZS.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Server size={14} color="#64748B" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>node-infra-0{i}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>cluster-master · company-{i}</div>
                    </div>
                  </div>
                </td>
                <td style={ZS.td}>
                  <span style={{ padding: '4px 8px', background: '#DCFCE7', color: '#166534', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>OPERACIONAL</span>
                </td>
                <td style={ZS.td}>
                  <div style={{ width: 100, height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${20 + i * 12}%`, height: '100%', background: LOGDOCK_BLUE }} />
                  </div>
                  <div style={{ fontSize: 11, marginTop: 4 }}>{20 + i * 12}% de carga</div>
                </td>
                <td style={ZS.td}>Há {i}h atrás</td>
                <td style={ZS.td}>
                  <button type="button" style={ZS.actionBtn}>Console</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const isBillingDetail = activeTab === 'billing' && selectedInvoiceId;

  const tabBody = activeTab !== 'overview' ? (
    <div style={{ ...ZS.tabContent }}>
      {!isBillingDetail && <SectionLead title={titles[activeTab]} path={`https://logdock.io/infra/${activeTab}`} />}
      
      {focusContent}
      
      {!isBillingDetail && renderChartRow()}
      
      {renderTabContent()}
    </div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <MasterProductProjectHeader
        title="LogDock Infrastructure"
        subtitle="Central inteligente de controle e monitoramento"
        domainUrl="https://logdock.io"
        domainLabel="logdock.io"
        accentColor={ACCENT}
        logoUrl="https://images.unsplash.com/photo-1558494949-ef010cbdcc51?w=256&h=256&fit=crop&q=80"
        avatarName="LD"
        toastOnCopy="Copiado: logdock.io"
        actions={
          <button 
            onClick={() => window.open('http://localhost:5176', '_blank')}
            style={{ ...ZS.actionBtn, background: LOGDOCK_BLUE, color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12 }}
          >
            <ExternalLink size={16} /> ACESSAR LOGDOCK APP
          </button>
        }
      />
      {renderChartRow()}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, min(482px, 100%))', columnGap: 0, marginBottom: 24, alignItems: 'stretch' }}>
        <div style={{ minWidth: 0, paddingRight: 24 }}>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 24, padding: 24, background: '#FFF', height: 369, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
             <div style={{ cursor: 'pointer' }} onClick={() => setActiveTab('monitoring')}>
               <Activity size={48} color={LOGDOCK_BLUE} style={{ opacity: 0.5, marginBottom: 16 }} />
               <p style={{ fontWeight: 700, margin: 0 }}>Mapa de Carga Global</p>
               <p style={{ fontSize: 13, color: '#64748B' }}>Visualização de tráfego em tempo real entre clusters.</p>
               <span style={{ fontSize: 11, color: LOGDOCK_BLUE, fontWeight: 800 }}>CLIQUE PARA MONITORAR</span>
             </div>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #E2E8F0', padding: '8px 0 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 320 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Console LogDock</div>
          <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>Administre toda a infraestrutura, backend, storage e serviços do ecossistema.</p>
          <button type="button" style={{ ...ZS.actionBtn, background: ACCENT, color: '#FFF', borderColor: ACCENT }} onClick={() => window.open('https://logdock.io', '_blank')}>
            Abrir painel LogDock <ChevronRight size={16} style={{ marginLeft: 4 }} />
          </button>
          <div style={{ ...ZS.card, marginTop: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Latência do Gateway</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{'< 12ms'}</div>
            <div style={{ fontSize: 12, color: LOGDOCK_BLUE, fontWeight: 700, marginTop: 8 }}>● Todos clusters operacionais</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
           <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Clientes Ativos (Tenants)</div>
           <button onClick={() => setActiveTab('tenants')} style={{ background: 'none', border: 'none', color: LOGDOCK_BLUE, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Ver todos no LogDock</button>
        </div>
        <div style={ZS.card}>
           <table style={ZS.table}>
              <thead>
                 <tr>
                    <th style={ZS.th}>Empresa</th>
                    <th style={ZS.th}>Plano LogDock</th>
                    <th style={ZS.th}>Uso de Storage</th>
                    <th style={ZS.th}>Status</th>
                    <th style={ZS.th}>Ações</th>
                 </tr>
              </thead>
              <tbody>
                 {[
                    { id: 'tenant-1', name: 'Logistics Global', plan: 'Enterprise', storage: '420 GB' },
                    { id: 'tenant-2', name: 'Alimentos Express', plan: 'Drive Only', storage: '12 GB' },
                    { id: 'tenant-3', name: 'Tech Transport', plan: 'Enterprise', storage: '84 GB' },
                 ].map((t) => (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/master/logdock/${t.id}`)}>
                       <td style={ZS.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                             <HubEntityAvatar kind="company" name={t.name} size={28} accent={LOGDOCK_BLUE} />
                             <span style={{ fontWeight: 600 }}>{t.name}</span>
                          </div>
                       </td>
                       <td style={ZS.td}>
                          <span style={{ fontSize: 12, color: '#64748B' }}>{t.plan}</span>
                       </td>
                       <td style={ZS.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                             <div style={{ width: 60, height: 4, background: '#E2E8F0', borderRadius: 2 }}>
                                <div style={{ width: '40%', height: '100%', background: LOGDOCK_BLUE }} />
                             </div>
                             <span style={{ fontSize: 11 }}>{t.storage}</span>
                          </div>
                       </td>
                       <td style={ZS.td}><span style={{ color: '#10B981', fontWeight: 800, fontSize: 11 }}>ATIVO</span></td>
                       <td style={ZS.td}>
                          <button style={ZS.actionBtn}>Monitorar</button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Principais Serviços (Consumo)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 20 }}>
          {[
            { id: 'drive', label: 'Drive & Storage', icon: HardDrive, value: '840GB' },
            { id: 'apis', label: 'API Gateway', icon: Webhook, value: '1.2M' },
            { id: 'workers', label: 'Worker Queue', icon: Binary, value: '0' },
            { id: 'database', label: 'Database I/O', icon: Database, value: '12%' },
            { id: 'monitoring', label: 'IA Processing', icon: Zap, value: 'Low' },
          ].map((s, i) => (
            <div key={i} onClick={() => setActiveTab(s.id as TabId)} style={{ padding: 16, borderRadius: 12, border: '1px solid #E5E7EB', background: '#FFF', cursor: 'pointer', transition: 'transform 0.2s' }}>
               <s.icon size={20} color={LOGDOCK_BLUE} style={{ marginBottom: 10 }} />
               <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
               <div style={{ fontSize: 11, color: '#64748B' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={shell.container}>
      <div style={shell.secondarySidebar}>
        <div style={{ ...shell.sidebarHeader, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color={ACCENT} />
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A' }}>LogDock Admin</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPlusMenuModalOpen(true)}
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
              title="Novo Item LogDock"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
        <div style={shell.sidebarNav}>
          {tabSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', textTransform: 'none', letterSpacing: '0.03em', padding: '4px 10px 6px' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    style={{
                      ...shell.sidebarBtn,
                      backgroundColor: activeTab === item.id ? '#F0F9FF' : 'transparent',
                      color: activeTab === item.id ? '#0F172A' : '#475569',
                    }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon size={14} style={{ opacity: activeTab === item.id ? 1 : 0.7, color: activeTab === item.id ? LOGDOCK_BLUE : '#64748B' }} />
                    <span style={{ fontWeight: activeTab === item.id ? 500 : 400, fontSize: '12px' }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={shell.contentArea}>
        {id ? (
          <LogDockClientProfile clientId={id} companySnapshot={{ name: `Empresa ${id}`, plan: 'Enterprise Infra' }} isEmbedded={true} />
        ) : (
          <div
            style={{
              ...shell.content,
              gap: 13,
            }}
          >
             {!(activeTab === 'billing' && selectedInvoiceId) && <GlobalConsolidatedBanner />}
             {tabBody}
          </div>
        )}
      </div>
      {/* MODAL NOVO PLANO */}
      {isNewPlanModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 32, width: '100%', maxWidth: 720, boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', border: '1px solid #E2E8F0', animation: 'modalSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ background: '#FFF', padding: 32, borderBottom: '1px solid #E2E8F0', position: 'relative', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EFF6FF', color: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 16px rgba(0, 97, 255, 0.1)' }}>
                <Zap size={24} color="#0061FF" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>Novo plano (checkout público)</h2>
                <p style={{ color: '#64748B', fontSize: 11, margin: '4px 0 0', fontWeight: 500, letterSpacing: '0.2px' }}>Defina pacote, valor e forma de pagamento para checkout automático.</p>
              </div>
              <button onClick={() => setIsNewPlanModalOpen(false)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: 'auto', height: 36, padding: '0 12px', borderRadius: 12, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <kbd style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 4px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Esc</kbd>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div style={{ padding: 32, overflowY: 'auto', flex: 1, background: '#FFF' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Itens inclusos</div>
                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>Selecione o que entra neste plano comercial.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { id: 'logta', title: 'Assinatura Logta', desc: 'Licenciamento SaaS Principal', icon: Building },
                      { id: 'ia', title: 'Créditos IA', desc: 'Rotas otimizadas via LLM', icon: Activity },
                      { id: 'backup', title: 'Backup Cloud', desc: 'Cópia fria de notas fiscais', icon: ShieldCheck },
                    ].map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedPlanItem(item.id)}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, border: selectedPlanItem === item.id ? '2px solid #0061FF' : '2px solid #F1F5F9', background: '#FFF', cursor: 'pointer', transition: '0.25s' 
                        }}
                      >
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <item.icon size={18} color={selectedPlanItem === item.id ? '#0061FF' : '#94A3B8'} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{item.title}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 1 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Valor e Pagamento</div>
                    <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px' }}>Preço e recorrência para cobrança.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>VALOR MENSAL (R$)</label>
                      <input placeholder="0.00" type="number" style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #E2E8F0', fontSize: 16, fontWeight: 700, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>MÉTODO DE PAGAMENTO</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'PIX', icon: Zap, active: true },
                        { label: 'Boleto', icon: BarChart3 },
                        { label: 'Cartão', icon: CreditCard },
                        { label: 'Link Direct', icon: Copy },
                      ].map(m => (
                        <button key={m.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px 8px', borderRadius: 10, border: m.active ? '1px solid #0061FF' : '1px solid #E2E8F0', background: m.active ? '#F0F7FF' : '#FFF', color: m.active ? '#0061FF' : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          <m.icon size={14} /> {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>CUPOM (OPCIONAL)</label>
                      <input placeholder="Ex: LOGTA10" type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #E2E8F0', fontSize: 13, fontWeight: 700, outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 12, border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B', display: 'flex', gap: 8 }}>
                    <Zap size={16} color="#0061FF" style={{ flexShrink: 0 }} />
                    <span>Ao gerar este plano público, um link de assinatura reuni-rá com a base de cobranças master automaticamente.</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px 32px', background: 'rgba(230, 230, 230, 0.1)', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0, borderTop: '1px solid #F5F5F5' }}>
              <button onClick={() => setIsNewPlanModalOpen(false)} style={{ ...ZS.actionBtn, padding: '10px 20px' }}>Cancelar</button>
              <button 
                onClick={() => { toastSuccess('Link de checkout gerado com sucesso!'); setIsNewPlanModalOpen(false); }}
                style={{ ...ZS.actionBtn, background: '#0061FF', color: '#FFF', borderColor: '#0061FF', padding: '10px 20px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span>GERAR LINK DO PLANO</span>
                  <div style={{ display: 'flex', gap: 2, opacity: 0.8 }}>
                    <kbd style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 16, height: 16, padding: '0 4px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', color: '#FFF', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>⌘</kbd>
                    <kbd style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 16, height: 16, padding: '0 4px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', color: '#FFF', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>↵</kbd>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AÇÕES RÁPIDAS LOGDOCK */}
      {isPlusMenuModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 32, width: '100%', maxWidth: 640, boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '92vh', border: '1px solid #E2E8F0', animation: 'modalSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ background: '#FFF', padding: 32, borderBottom: '1px solid #E2E8F0', position: 'relative', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#EFF6FF', color: '#0061FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 16px rgba(0, 97, 255, 0.1)' }}>
                <Plus size={24} color="#0061FF" strokeWidth={3} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', margin: 0, letterSpacing: '-0.4px' }}>Ações Rápidas LogDock</h2>
                <p style={{ color: '#64748B', fontSize: 11, margin: '4px 0 0', fontWeight: 500, letterSpacing: '0.2px' }}>Infraestrutura e Armazenamento Inteligente unificados</p>
              </div>
              <button onClick={() => setIsPlusMenuModalOpen(false)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: 'auto', height: 36, padding: '0 12px', borderRadius: 12, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <kbd style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, padding: '0 4px', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 6, boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Esc</kbd>
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div style={{ padding: 32, overflowY: 'auto', flex: 1, background: '#FFF' }}>
              <div style={{ background: 'linear-gradient(90deg, #F0F9FF 0%, #FFFFFF 100%)', border: '1px solid #D0E0FF', borderRadius: 16, padding: '16px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <ShieldCheck size={18} color="#0061FF" />
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>LogDock Premium & Ecosystem</div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                  A LogDock opera tanto como <strong>Venda Direta</strong> (armazenamento corporativo dedicado) quanto como <strong>Venda Integrada</strong> (todos os clientes Zaptro e Logta possuem acesso nativo e automático ao ecossistema).
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { title: 'Novo Upload', desc: 'Enviar arquivo ou mídia para a nuvem segura', action: 'Upload de arquivo iniciado com sucesso!', icon: HardDrive },
                  { title: 'Nova Pasta', desc: 'Estruturar novo diretório no storage corporativo', action: 'Nova pasta criada com sucesso!', icon: Layers },
                  { title: 'Novo Backup', desc: 'Criar snapshot imediato do banco ou arquivos', action: 'Agendamento de backup concluído!', icon: RefreshCcw },
                  { title: 'Novo Usuário', desc: 'Cadastrar nova empresa ou pessoa para acesso direto', action: 'Novo usuário configurado!', icon: Users },
                  { title: 'Nova Integração', desc: 'Vincular e conceder acesso a clientes do Logta ou Zaptro', action: 'Nova integração de ecossistema ativa!', icon: Zap },
                ].map((actionItem, idx) => (
                  <div 
                    key={idx}
                    onClick={() => {
                      toastSuccess(actionItem.action);
                      setIsPlusMenuModalOpen(false);
                    }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 16, border: '2px solid #F1F5F9', background: '#FFF', cursor: 'pointer', transition: 'all 0.2s' 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0061FF';
                      e.currentTarget.style.backgroundColor = '#F0F9FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#F1F5F9';
                      e.currentTarget.style.backgroundColor = '#FFF';
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <actionItem.icon size={18} color="#0061FF" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>{actionItem.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginTop: 1 }}>{actionItem.desc}</div>
                    </div>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '24px 32px 32px', background: 'rgba(230, 230, 230, 0.1)', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0, borderTop: '1px solid #F5F5F5' }}>
              <button onClick={() => setIsPlusMenuModalOpen(false)} style={{ ...ZS.actionBtn, padding: '10px 20px' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default LogDockAdmin;
