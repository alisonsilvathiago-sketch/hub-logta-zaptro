import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ZaptroClientProfile from './ZaptroClientProfile';
import {
  Zap,
  Home,
  Building,
  CreditCard,
  PackageSearch,
  CheckCircle,
  UserCheck,
  Truck,
  MapPin,
  Server,
  DollarSign,
  Settings,
  MessageCircle,
  TrendingUp,
  ShoppingCart,
  Users,
  Plus,
  ExternalLink,
  Route,
  BarChart3,
  Clock,
  FileText,
  Database,
  Search as SearchIcon,
  FileSpreadsheet,
  RefreshCcw,
  Pencil,
  Copy,
  Share2,
  Download,
  Lock,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Send,
  Globe2,
  Key,
  Shield,
  UploadCloud,
  UserPlus,
  QrCode,
  Ban,
  Coins,
  Webhook,
  Mail,
} from 'lucide-react';
import HubMetricCard from '@shared/components/HubMetricCard';
import HubSupabaseChart from '@shared/components/HubSupabaseChart';
import HubEntityAvatar from '@shared/components/HubEntityAvatar';
import LogtaModal from '@shared/components/Modal';
import { useWhiteLabel } from '@core/context/WhiteLabelContext';
import { HUB_PAGE_TITLE } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_PRODUCT_SHELL } from '@hub/styles/hubMasterProductShell';
import { MasterProductProjectHeader } from '@hub/components/MasterProductProjectHeader';
import { supabase } from '@core/lib/supabase';
import { resolveCompanyLogo } from '@hub/lib/logtaEntityMedia';
import { toastSuccess } from '@core/lib/toast';
import {
  ZAPTRO_MASTER_ROUTES,
  getZaptroAppOrigin,
  getZaptroOriginHost,
  openZaptroApp,
  zaptroAppDeepLink,
  zaptroMasterDriverPath,
  zaptroMasterVehiclePath,
} from '@hub/lib/zaptroMasterDeepLinks';
import { hubPillTabStripStyles } from '@shared/styles/hubPillTabStripStyles';
import HubMasterLiveMap, { type HubMasterLiveMapMarker } from '@hub/components/HubMasterLiveMap';

function resolveDeepHref(path: string): string {
  if (path.startsWith('/master')) {
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path}`;
  }
  return zaptroAppDeepLink(path);
}

function openDeepLink(path: string): void {
  window.open(resolveDeepHref(path), '_blank', 'noopener,noreferrer');
}

const shell = HUB_MASTER_PRODUCT_SHELL;
const ACCENT = '#7C3AED';

/** Quick KPI strip: sempre 4 colunas no desktop (mesmo contrato Logta Admin). */
const ZAPTRO_KPIS_GRID_4: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 20,
  marginBottom: 32,
};
/** Tom visual seção Rotas + CRM (diferencia de operações logísticas puras). */
const ROUTE_CRM_ACCENT = '#059669';

const MAP_BUBBLE_LAYOUT = [
  { top: '25%', left: '12%', delay: '0s', plan: 'Start', color: '#FAF5FF', text: '#7C3AED', border: '#DDD6FE' },
  { top: '15%', left: '62%', delay: '1.5s', plan: 'Ent', color: '#F5F3FF', text: '#5B21B6', border: '#C4B5FD' },
  { top: '55%', left: '38%', delay: '0.7s', plan: 'Pro', color: '#FEFCE8', text: '#A16207', border: '#FEF08A' },
  { top: '62%', left: '72%', delay: '2.2s', plan: 'Pro', color: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
] as const;

/** Painel de abas: mesmo respiro horizontal do Logta Admin (vars --hub-master-page-* no shell.content). */
const ZS: Record<string, React.CSSProperties> = {
  tabContent: { display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 0, paddingBottom: 0 },
  tabPanel: {
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0,
  },
  scroll500: { maxHeight: 500, overflowY: 'auto' as const },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: '16px 27px 15px',
    border: '1px solid #E2E8F0',
    boxShadow: 'none',
  },
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
  tr: { borderBottom: '1px solid #F1F5F9' },
  td: { padding: '16px 20px', verticalAlign: 'middle' as const, fontSize: 13, textAlign: 'left' as const },
  tdCheckbox: { padding: '16px 20px', verticalAlign: 'middle' as const, fontSize: 13, textAlign: 'center' as const },
  clientName: { fontSize: 14, fontWeight: 600, color: '#0F172A' },
  badge: { padding: '4px 8px', backgroundColor: '#F1F5F9', color: '#475569', borderRadius: 4, fontSize: 11, fontWeight: 700 },
  stat: { fontSize: 13, fontWeight: 500, color: '#64748B' },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
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
  readonlyInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 6,
    border: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#64748B',
    fontSize: 13,
    outline: 'none',
    fontWeight: 500,
    boxSizing: 'border-box' as const,
  },
};

type TabId =
  | 'overview'
  | 'routes'
  | 'operations'
  | 'drivers'
  | 'fleet'
  | 'tracking'
  | 'clients'
  | 'billing'
  | 'commercial'
  | 'whatsapp'
  | 'sales'
  | 'infrastructure'
  | 'finance'
  | 'settings';

type TabItem = { id: TabId; label: string; icon: React.ElementType };
type TabSection = { title: string; items: TabItem[] };

type ClientRow = {
  id: string;
  name: string;
  plan: string;
  volume: number;
  channels: number;
  logoUrl?: string | null;
};

type BillingSubRow = {
  id: string;
  client: string;
  val: string;
  date: string;
  status: string;
  color: string;
  checkoutUrl: string;
  receiptPublicPath: string;
  blocked: boolean;
};

function formatVolume(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}k interações`;
  }
  return `${n.toLocaleString('pt-BR')} interações`;
}

function formatVolShort(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = k >= 10 ? Math.round(k).toString() : k.toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return String(n);
}

function QuickOpenChip({ path }: { path: string }) {
  const label = path.length > 28 ? `${path.slice(0, 26)}…` : path;
  const hub = path.startsWith('/master');
  return (
    <button
      type="button"
      onClick={() => openDeepLink(path)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${hub ? '#CBD5E144' : `${ACCENT}44`}`,
        background: hub ? '#F8FAFC' : `${ACCENT}12`,
        color: hub ? '#0F172A' : '#5B21B6',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {hub ? 'Abrir Hub' : 'Abrir Zaptro'}
      <ExternalLink size={13} />
      <span style={{ fontWeight: 500, opacity: 0.85 }}>{label}</span>
    </button>
  );
}

function SectionLead({ title, path }: { title: string; path: string }) {
  const hub = path.startsWith('/master');
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 24, marginBottom: 16 }}>
      <div>

        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748B', maxWidth: 720 }}>
          Destino em{' '}
          {hub ? (
            <span style={{ fontWeight: 700, color: '#0F172A' }}>Hub Master</span>
          ) : (
            <span style={{ fontWeight: 700, color: ACCENT }}>Zaptro</span>
          )}
          :{' '}
          <a href={resolveDeepHref(path)} target="_blank" rel="noopener noreferrer" style={{ color: hub ? '#0F172A' : ACCENT, fontWeight: 700 }}>
            {path}
          </a>
          .
        </p>
      </div>
      <QuickOpenChip path={path} />
    </div>
  );
}

const TOP_ICONS = [Building, Truck, Zap, Building, TrendingUp] as const;

const PAGE_SIZE = 5;

const EMPRESAS_MOCK = ['Transportadora Falcão', 'Expresso Federal', 'Rápido Trans', 'TransNorte Cargo', 'Alfa Transportes'];

/** IDs demo alinhados a empresas do Master — navegação espelho /master/zaptro/:id */
const ZAPTRO_DEMO_TENANT_IDS = ['1', 'demo-11', 'demo-12', 'demo-13'] as const;

function paginateSlice<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { slice: items.slice(start, start + pageSize), totalPages, safePage, total };
}

/** Mapa padrão do Hub (Leaflet + Google Maps) — mesmo componente de Logística e demais telas. */
function ZaptroMapFrame({
  path,
  height = 420,
  markers,
}: {
  path: string;
  height?: number;
  markers?: HubMasterLiveMapMarker[];
}) {
  return (
    <div style={{ position: 'relative' }}>
      <HubMasterLiveMap height={height} markers={markers} liveBadge={`Live · ${path}`} />
      <button
        type="button"
        onClick={() => openZaptroApp(path)}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 600,
          fontSize: 11,
          fontWeight: 700,
          background: '#FFF',
          padding: '6px 12px',
          borderRadius: 8,
          border: `1px solid ${ACCENT}44`,
          color: ACCENT,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
        }}
      >
        Abrir no Zaptro
      </button>
    </div>
  );
}

function GlobalConsolidatedBanner() {
  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        background: 'linear-gradient(90deg, #F5F3FF 0%, #FFFFFF 100%)',
        border: `1px solid ${ACCENT}33`,
        fontSize: 12,
        fontWeight: 700,
        color: '#4C1D95',
        marginBottom: 12,
      }}
    >
      Resultados globais · consolidação de todas as empresas no ecossistema Zaptro
    </div>
  );
}

function TablePaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 16, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
        {total === 0 ? 'Sem registros' : `Mostrando ${from}–${to} de ${total}`}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="hub-premium-pill secondary"
          style={{
            opacity: page <= 1 ? 0.45 : 1,
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', minWidth: 72, textAlign: 'center' }}>
          Pág. {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="hub-premium-pill secondary"
          style={{
            opacity: page >= totalPages ? 0.45 : 1,
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Próxima <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

const MOCK_CRM_DEALS = Array.from({ length: 17 }, (_, i) => ({
  id: `DL-${8200 + i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  etapa: ['Qualificação', 'Proposta', 'Negociação', 'Fechamento'][i % 4],
  valor: `R$ ${(12 + (i % 8) * 3).toLocaleString('pt-BR')},000`,
  owner: ['Ana CRM', 'Bruno Comercial', 'Carla Inside'][i % 3],
}));

const MOCK_WHATSAPP = Array.from({ length: 16 }, (_, i) => ({
  id: `WA-${i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  numero: `+55 11 9${1000 + (i % 9000)}-${2000 + i}`,
  msgs24h: 120 + i * 14,
  tma: `${1 + (i % 3)}m ${10 + (i % 49)}s`,
  status: i % 5 === 0 ? 'Instável' : 'Operacional',
  statusColor: i % 5 === 0 ? '#F59E0B' : '#16A34A',
}));

const MOCK_ORCAMENTOS = Array.from({ length: 15 }, (_, i) => ({
  id: `ORC-${3400 + i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  valor: `R$ ${8 + (i % 12)},${(i * 7) % 100}00`,
  status: ['Rascunho', 'Enviado', 'Aceito', 'Expirado'][i % 4],
  statusColor: ['#64748B', ACCENT, '#16A34A', '#94A3B8'][i % 4],
  venc: `${10 + (i % 18)}/05/2026`,
}));

const MOCK_ROTAS = Array.from({ length: 22 }, (_, i) => ({
  id: `RT-${9020 + i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  origem: ['São Paulo, SP', 'Curitiba, PR', 'Belo Horizonte, MG'][i % 3],
  destino: ['Rio de Janeiro, RJ', 'Porto Alegre, RS', 'Salvador, BA'][i % 3],
  carga: ['Eletrônicos', 'Automotivo', 'Alimentos', 'Química'][i % 4],
  status: ['Em Trânsito', 'Concluída', 'Agendada'][i % 3],
  statusColor: [ACCENT, '#312E81', '#F59E0B'][i % 3],
}));

const MOCK_OPERACOES = Array.from({ length: 14 }, (_, i) => ({
  id: `OP-${500 + i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  tipo: ['Coleta', 'Entrega', 'Transferência'][i % 3],
  prioridade: ['P1', 'P2', 'P3'][i % 3],
  sla: i % 4 === 0 ? 'Atraso' : 'No prazo',
  slaColor: i % 4 === 0 ? '#EF4444' : '#16A34A',
}));

const MOCK_MOTORISTAS = Array.from({ length: 18 }, (_, i) => ({
  id: `MOT-${i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  nome: ['Ricardo Silva', 'Ana Oliveira', 'Carlos Souza', 'Pedro Mendes'][i % 4],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  cnh: i % 3 === 0 ? 'Vencendo' : 'OK',
  cnhColor: i % 3 === 0 ? '#F59E0B' : '#16A34A',
  status: ['Em rota', 'Disponível', 'Pausa'][i % 3],
}));

const MOCK_FROTA = Array.from({ length: 16 }, (_, i) => ({
  id: `FLT-${i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  placa: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 3) % 26))}${1000 + i}-${String.fromCharCode(65 + (i % 26))}`,
  modelo: ['Scania R450', 'Volvo FH', 'Mercedes Actros'][i % 3],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  telemetria: i % 6 === 0 ? 'Alerta' : 'OK',
  telColor: i % 6 === 0 ? '#F59E0B' : '#16A34A',
}));

const MOCK_MAP_VEICULOS = Array.from({ length: 20 }, (_, i) => ({
  id: `VIV-${i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  placa: `MAP-${1000 + i}`,
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  ultimoPing: `${(i % 9) + 1} min`,
  ignicao: i % 7 === 0 ? 'Off' : 'On',
}));

const ZAPTRO_LIVE_MAP_MARKERS: HubMasterLiveMapMarker[] = MOCK_MAP_VEICULOS.slice(0, 8).map((v, i) => {
  const angle = (i / 8) * Math.PI * 2;
  const radius = 0.018 + (i % 3) * 0.008;
  return {
    id: v.id,
    lat: -23.55052 + Math.sin(angle) * radius,
    lng: -46.633308 + Math.cos(angle) * radius,
    label: v.placa,
    subtitle: v.empresa,
    variant: v.ignicao === 'Off' ? 'alert' : 'truck',
  };
});

const MOCK_INFRA_ROWS = Array.from({ length: 11 }, (_, i) => ({
  id: `INF-${i}`,
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  servico: ['API Core', 'Webhooks', 'Mail queue', 'Edge cache'][i % 4],
  latencia: `${38 + (i % 20)}ms`,
  status: i % 9 === 0 ? 'Degradado' : 'OK',
  statusColor: i % 9 === 0 ? '#F59E0B' : '#16A34A',
}));

const MOCK_FINANCE_ROWS = Array.from({ length: 13 }, (_, i) => ({
  id: `FIN-${500 + i}`,
  companyId: ZAPTRO_DEMO_TENANT_IDS[i % ZAPTRO_DEMO_TENANT_IDS.length],
  empresa: EMPRESAS_MOCK[i % EMPRESAS_MOCK.length],
  tipo: ['Assinatura', 'Excedente', 'Add-on IA'][i % 3],
  valor: `R$ ${(2 + (i % 6)) * 1200},00`,
  venc: `${5 + (i % 22)}/06/2026`,
  status: ['Pago', 'Aberto', 'Atraso'][i % 3],
  statusColor: ['#16A34A', ACCENT, '#DC2626'][i % 3],
}));

const TAB_CHARTS: Partial<
  Record<TabId, Array<{ label: string; value: string; data: number[]; color?: string }>>
> = {
  routes: [
    { label: 'ROTAS NO SISTEMA', value: '284', data: [30, 45, 40, 60, 55, 70, 65, 80, 90, 284], color: ROUTE_CRM_ACCENT },
    { label: 'EM EXECUÇÃO', value: '42', data: [10, 15, 18, 22, 28, 32, 36, 38, 40, 42], color: '#047857' },
    { label: 'CONCLUÍDAS (7D)', value: '1.092', data: [400, 500, 600, 700, 800, 900, 950, 1000, 1050, 1092], color: ACCENT },
    { label: 'ALERTAS ROTA (24H)', value: '12', data: [2, 4, 3, 5, 8, 10, 9, 11, 12, 12], color: '#0F766E' },
  ],
  operations: [
    { label: 'DEMANDAS ABERTAS', value: '37', data: [10, 15, 20, 25, 30, 32, 35, 36, 37, 37], color: ACCENT },
    { label: 'SLA DENTRO', value: '94%', data: [80, 82, 85, 88, 90, 91, 92, 93, 94, 94] },
    { label: 'MOTORISTAS EM CAMPO', value: '31', data: [12, 15, 18, 20, 22, 25, 28, 30, 31, 31] },
    { label: 'INCIDENTES', value: '3', data: [5, 4, 4, 3, 3, 4, 3, 3, 3, 3] },
  ],
  drivers: [
    { label: 'ATIVOS', value: '128', data: [80, 90, 95, 100, 110, 115, 120, 125, 128, 128], color: ACCENT },
    { label: 'EM ROTA', value: '31', data: [10, 12, 15, 18, 22, 25, 28, 30, 31, 31] },
    { label: 'DOC. PENDENTE', value: '12', data: [20, 18, 16, 15, 14, 13, 12, 12, 12, 12] },
    { label: 'BLOQUEADOS', value: '4', data: [2, 2, 3, 3, 4, 4, 4, 4, 4, 4] },
  ],
  fleet: [
    { label: 'ATIVOS RASTREADOS', value: '96', data: [60, 65, 70, 75, 80, 85, 90, 92, 95, 96], color: ACCENT },
    { label: 'MANUTENÇÃO', value: '7', data: [10, 9, 8, 8, 7, 7, 7, 7, 7, 7] },
    { label: 'DISPONÍVEIS', value: '54', data: [40, 42, 45, 48, 50, 52, 53, 54, 54, 54] },
    { label: 'TELEMETRIA OK', value: '91%', data: [70, 75, 80, 82, 85, 88, 90, 91, 91, 91] },
  ],
  tracking: [
    { label: 'VEÍCULOS NO MAPA', value: '41', data: [20, 25, 30, 32, 35, 38, 40, 41, 41, 41], color: ACCENT },
    { label: 'ATUALIZAÇÃO', value: '< 2 min', data: [5, 4, 3, 3, 2, 2, 2, 2, 2, 2] },
    { label: 'ROTAS AO VIVO', value: '18', data: [8, 10, 12, 14, 15, 16, 17, 18, 18, 18] },
    { label: 'ALERTAS GPS', value: '2', data: [0, 1, 1, 2, 2, 2, 2, 2, 2, 2] },
  ],
  commercial: [
    { label: 'DEALS (TODAS EMPRESAS)', value: '58', data: [20, 30, 35, 40, 45, 48, 52, 55, 57, 58], color: ACCENT },
    { label: 'LEADS NO TOPO', value: '124', data: [40, 55, 70, 80, 90, 95, 100, 110, 118, 124], color: '#9333EA' },
    { label: 'REUNIÕES AGENDADAS', value: '36', data: [8, 12, 16, 20, 24, 28, 30, 32, 34, 36], color: '#7C3AED' },
    { label: 'PIPELINE CRM', value: 'R$ 1,1M', data: [200, 300, 400, 500, 600, 700, 800, 950, 1000, 1100], color: '#5B21B6' },
  ],
  whatsapp: [
    { label: 'CONVERSAS ATIVAS (GLOBAL)', value: '612', data: [100, 200, 280, 350, 400, 450, 500, 550, 600, 612], color: '#25D366' },
    { label: 'MENSAGENS ENVIADAS (24H)', value: '28.4k', data: [8, 12, 15, 18, 20, 22, 24, 26, 27, 28.4], color: ACCENT },
    { label: 'MENSAGENS RECEBIDAS (24H)', value: '31.2k', data: [10, 14, 17, 19, 22, 24, 26, 28, 30, 31.2], color: '#9333EA' },
    { label: 'TEMPLATES / DISPAROS', value: '1.890', data: [200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 1890], color: '#5B21B6' },
  ],
  sales: [
    { label: 'ORÇAMENTOS ABERTOS (TODAS)', value: '33', data: [10, 15, 18, 22, 25, 28, 30, 31, 32, 33], color: ACCENT },
    { label: 'FECHAMENTO (7D)', value: '22%', data: [10, 12, 14, 16, 18, 19, 20, 21, 22, 22] },
    { label: 'VALOR MÉDIO', value: 'R$ 18k', data: [8, 10, 11, 12, 14, 15, 16, 17, 17.5, 18] },
    { label: 'PIPELINE ORÇAMENTOS', value: 'R$ 640k', data: [50, 120, 200, 280, 350, 400, 480, 520, 600, 640] },
  ],
  infrastructure: [
    { label: 'API ZAPTRO', value: 'OK', data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], color: ACCENT },
    { label: 'LATÊNCIA MÉD.', value: '42ms', data: [80, 70, 60, 55, 50, 48, 45, 44, 43, 42] },
    { label: 'UPTIME', value: '99.9%', data: [99, 99.2, 99.3, 99.5, 99.6, 99.7, 99.8, 99.85, 99.9, 99.9] },
    { label: 'FILAS', value: '0 erros', data: [2, 1, 1, 0, 0, 0, 0, 0, 0, 0] },
  ],
  finance: [
    { label: 'FATURAS ABERTAS', value: '14', data: [20, 18, 17, 16, 15, 15, 14, 14, 14, 14], color: ACCENT },
    { label: 'EM ATRASO', value: 'R$ 9,2k', data: [12, 11, 10.5, 10, 9.8, 9.5, 9.3, 9.2, 9.2, 9.2] },
    { label: 'RECEBIDO (MÊS)', value: 'R$ 58k', data: [30, 35, 40, 42, 45, 48, 50, 54, 56, 58] },
    { label: 'CONCILIAÇÃO', value: '98%', data: [88, 90, 92, 93, 95, 96, 97, 97.5, 98, 98] },
  ],
  settings: [
    { label: 'TENANTS CONFIG.', value: `${49}`, data: [30, 35, 38, 40, 42, 44, 46, 47, 48, 49], color: ACCENT },
    { label: 'WEBHOOKS', value: '12', data: [4, 5, 6, 7, 8, 9, 10, 11, 12, 12] },
    { label: 'TOKENS ATIVOS', value: '28', data: [10, 14, 18, 20, 22, 24, 25, 26, 27, 28] },
    { label: 'AUDITORIA', value: 'OK', data: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  ],
};

const titles: Record<TabId, string> = {
  overview: 'Visão Geral',
  routes: 'Rotas do CRM',
  operations: 'Operações de campo',
  drivers: 'Motoristas',
  fleet: 'Frota',
  tracking: 'Mapa operacional',
  clients: 'Empresas (tenants)',
  billing: 'Planos & cobrança',
  commercial: 'CRM / Comercial',
  whatsapp: 'WhatsApp & inbox',
  sales: 'Vendas & orçamentos',
  infrastructure: 'Infraestrutura do ecossistema',
  finance: 'Faturamento no Zaptro',
  settings: 'Configurações do produto',
};

const tabPaths: Record<TabId, string> = {
  overview: ZAPTRO_MASTER_ROUTES.DASHBOARD,
  routes: ZAPTRO_MASTER_ROUTES.ROUTES,
  operations: ZAPTRO_MASTER_ROUTES.LOGISTICS,
  drivers: ZAPTRO_MASTER_ROUTES.DRIVERS,
  fleet: ZAPTRO_MASTER_ROUTES.FLEET,
  tracking: ZAPTRO_MASTER_ROUTES.OPENSTREETMAP,
  clients: ZAPTRO_MASTER_ROUTES.CLIENTS,
  billing: ZAPTRO_MASTER_ROUTES.BILLING,
  commercial: ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM,
  whatsapp: ZAPTRO_MASTER_ROUTES.CHAT,
  sales: ZAPTRO_MASTER_ROUTES.SALES,
  infrastructure: '/master/infrastructure/saude',
  finance: ZAPTRO_MASTER_ROUTES.BILLING,
  settings: ZAPTRO_MASTER_ROUTES.SETTINGS_ALIAS,
};

const tabQuickKpis: Partial<Record<TabId, Array<{ label: string; value: string; icon: React.ElementType }>>> = {
  routes: [
    { label: 'Rotas criadas', value: '284', icon: Route },
    { label: 'Em execução', value: '42', icon: PackageSearch },
    { label: 'Concluídas (7d)', value: '1.092', icon: CheckCircle },
    { label: 'Incidentes rota', value: '5', icon: Server },
  ],
  operations: [
    { label: 'Demandas abertas', value: '37', icon: PackageSearch },
    { label: 'SLA dentro', value: '94%', icon: CheckCircle },
    { label: 'Incidentes', value: '3', icon: Server },
    { label: 'Ocupação frota', value: '78%', icon: Truck },
  ],
  drivers: [
    { label: 'Ativos', value: '128', icon: UserCheck },
    { label: 'Em rota', value: '31', icon: Truck },
    { label: 'Documentação', value: '12 pendentes', icon: FileText },
    { label: 'Turnos cobertos', value: '94%', icon: Clock },
  ],
  fleet: [
    { label: 'Ativos rastreados', value: '96', icon: Truck },
    { label: 'Manutenção', value: '7', icon: Server },
    { label: 'Disponíveis', value: '54', icon: CheckCircle },
    { label: 'Checklist semanal', value: '88%', icon: BarChart3 },
  ],
  tracking: [
    { label: 'Veículos no mapa', value: '41', icon: MapPin },
    { label: 'Última atualização', value: '< 2 min', icon: Clock },
    { label: 'Rotas ativas', value: '128', icon: Route },
    { label: 'Alertas geofence', value: '3', icon: Server },
  ],
  clients: [
    { label: 'Empresas ativas', value: '72', icon: Building },
    { label: 'Onboarding em curso', value: '9', icon: TrendingUp },
    { label: 'Bloqueios', value: '1', icon: Server },
    { label: 'Inadimplência leve', value: 'R$ 2,1k', icon: DollarSign },
  ],
  billing: [
    { label: 'MRR consolidado', value: 'R$ 86k', icon: DollarSign },
    { label: 'Renovações este mês', value: '18', icon: CreditCard },
    { label: 'PIX / boleto', value: '64%', icon: BarChart3 },
    { label: 'Churn (est.)', value: '2%', icon: TrendingUp },
  ],
  commercial: [
    { label: 'Deals (todas empresas)', value: '58', icon: TrendingUp },
    { label: 'Leads no topo', value: '124', icon: Users },
    { label: 'Pipeline CRM', value: 'R$ 1,1M', icon: DollarSign },
    { label: 'Win rate (trim.)', value: '34%', icon: BarChart3 },
  ],
  whatsapp: [
    { label: 'Conversas ativas (global)', value: '612', icon: MessageCircle },
    { label: 'Mensagens enviadas (24h)', value: '28.4k', icon: Send },
    { label: 'Mensagens recebidas (24h)', value: '31.2k', icon: Globe2 },
    { label: '1ª resposta (SLA)', value: '< 45 s', icon: Clock },
  ],
  infrastructure: [
    { label: 'API Zaptro', value: 'OK', icon: Server },
    { label: 'Mail API', value: 'Ver Hub', icon: Mail },
    { label: 'Supabase', value: 'Compartilhado', icon: Database },
    { label: 'Filas / jobs', value: 'OK', icon: RefreshCcw },
  ],
  finance: [
    { label: 'Faturas em aberto', value: '14', icon: CreditCard },
    { label: 'Em atraso', value: 'R$ 9,2k', icon: DollarSign },
    { label: 'Recebido (mês)', value: 'R$ 58k', icon: CheckCircle },
    { label: 'Ticket médio', value: 'R$ 4,1k', icon: BarChart3 },
  ],
  settings: [
    { label: 'Branding', value: 'Tenant', icon: Settings },
    { label: 'Integrações', value: 'Hub', icon: Server },
    { label: 'Conta', value: 'Perfil', icon: Users },
    { label: 'API keys', value: '6 ativas', icon: Key },
  ],
};

function EcosystemBubbleMap({
  companies,
  onBubbleClick,
}: {
  companies: ClientRow[];
  onBubbleClick: (c: ClientRow, volLabel: string) => void;
}) {
  const top = useMemo(() => [...companies].sort((a, b) => b.volume - a.volume).slice(0, 4), [companies]);
  return (
    <div
      style={{
        border: '1px solid #E5E7EB',
        borderRadius: 24,
        backgroundImage: 'radial-gradient(#E2E8F0 1px, transparent 1px)',
        backgroundSize: '18px 18px',
        backgroundColor: '#FDFDFD',
        height: 369,
        minHeight: 369,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        padding: '0 20px 18px',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes zaptroBubbleFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 14,
          marginBottom: 10,
          zIndex: 5,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.35,
            flex: '1 1 200px',
            minWidth: 0,
          }}
        >
          Empresas ativas no ecossistema Zaptro
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: ACCENT,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ACCENT }} /> Dados em tempo real
        </span>
      </div>
      <div
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          marginTop: 4,
          minHeight: 220,
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-start',
        }}
      >
        {top.map((cl, bubbleIdx) => {
          const layout = MAP_BUBBLE_LAYOUT[bubbleIdx] || MAP_BUBBLE_LAYOUT[0];
          const vol = formatVolShort(cl.volume);
          return (
            <div
              key={cl.id}
              role="button"
              tabIndex={0}
              onClick={() => onBubbleClick(cl, `${vol} multicanal`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBubbleClick(cl, `${vol} multicanal`);
                }
              }}
              style={{
                position: 'absolute',
                top: layout.top,
                left: layout.left,
                animation: `zaptroBubbleFloat 4s ease-in-out ${layout.delay} infinite`,
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ position: 'relative' }}>
                  <HubEntityAvatar
                    kind="company"
                    src={resolveCompanyLogo({ id: cl.id, logoUrl: cl.logoUrl, name: cl.name })}
                    name={cl.name}
                    size={48}
                    accent={ACCENT}
                    style={{
                      borderRadius: '50%',
                      boxShadow: '0 8px 18px -5px rgba(0, 0, 0, 0.06)',
                      border: `1.5px solid ${layout.border}`,
                    }}
                  />
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      bottom: -3,
                      right: -3,
                      background: ACCENT,
                      border: '2px solid #FFF',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      boxShadow: `0 0 6px ${ACCENT}88`,
                    }}
                  />
                </div>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1E293B' }}>{cl.name.split(/\s+/)[0]}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textAlign: 'center', marginTop: 1 }}>{vol}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ZaptroAdmin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings, updateSettings } = useWhiteLabel();
  const wl = settings.zaptro;

  const [zaptroSettingsTab, setZaptroSettingsTab] = useState<'general' | 'auth' | 'security' | 'permissions' | 'audit'>('general');
  const [waTenantId, setWaTenantId] = useState<string>(ZAPTRO_DEMO_TENANT_IDS[0]);
  const [waCreditsAdd, setWaCreditsAdd] = useState('');
  const [waPhone, setWaPhone] = useState('+55 11 99999-0000');

  const tabSections: TabSection[] = [
    {
      title: 'Projeto',
      items: [
        { id: 'overview', label: 'Visão Geral', icon: Home },
        { id: 'clients', label: 'Empresas', icon: Building },
        { id: 'billing', label: 'Planos & Assinaturas', icon: CreditCard },
      ],
    },
    {
      title: 'Operação',
      items: [
        { id: 'commercial', label: 'CRM / Comercial', icon: TrendingUp },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
        { id: 'sales', label: 'Vendas & orçamentos', icon: ShoppingCart },
        { id: 'routes', label: 'Rotas CRM', icon: Route },
        { id: 'operations', label: 'Operações', icon: PackageSearch },
        { id: 'drivers', label: 'Motoristas', icon: UserCheck },
        { id: 'fleet', label: 'Frota', icon: Truck },
        { id: 'tracking', label: 'Mapa ao vivo', icon: MapPin },
      ],
    },
    {
      title: 'Infraestrutura',
      items: [{ id: 'infrastructure', label: 'Infraestrutura', icon: Server }],
    },
    {
      title: 'Financeiro',
      items: [{ id: 'finance', label: 'Faturamento & créditos', icon: DollarSign }],
    },
    {
      title: 'Gerenciamento',
      items: [{ id: 'settings', label: 'Configurações', icon: Settings }],
    },
  ];

  const allValidTabs = tabSections.flatMap((sec) => sec.items.map((i) => i.id));
  const rawTab = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = rawTab && allValidTabs.includes(rawTab) ? rawTab : 'overview';

  const listPageRaw = Number.parseInt(searchParams.get('page') || '1', 10);
  const listPage = Number.isFinite(listPageRaw) && listPageRaw >= 1 ? listPageRaw : 1;

  const setListPage = (p: number) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        const next = Math.max(1, Math.floor(p));
        if (next <= 1) n.delete('page');
        else n.set('page', String(next));
        return n;
      },
      { replace: true },
    );
  };

  const setActiveTab = (tab: TabId) => {
    if (id) {
      // Se estivermos em um perfil, precisamos navegar de volta para a raiz do Zaptro
      // mas preservando os outros parâmetros (como token)
      const n = new URLSearchParams(searchParams);
      n.delete('page');
      if (tab === 'overview') n.delete('tab');
      else n.set('tab', tab);
      
      navigate({
        pathname: '/master/zaptro',
        search: n.toString()
      }, { replace: true });
    } else {
      setSearchParams(
        (prev) => {
          const n = new URLSearchParams(prev);
          n.delete('page');
          if (tab === 'overview') n.delete('tab');
          else n.set('tab', tab);
          return n;
        },
        { replace: true },
      );
    }
  };

  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [billingSearch, setBillingSearch] = useState('');
  const [clusterOpen, setClusterOpen] = useState(false);
  const [clusterClient, setClusterClient] = useState<(ClientRow & { vol?: string }) | null>(null);
  const [infraAddOpen, setInfraAddOpen] = useState(false);
  const [infraAddName, setInfraAddName] = useState('');
  const [infraAddKind, setInfraAddKind] = useState('webhook');

  const [billingSubRows, setBillingSubRows] = useState<BillingSubRow[]>([
    {
      id: '1',
      client: 'Transportadora Falcão',
      val: 'R$ 4.200,00',
      date: '15/05/2026',
      status: 'Pago',
      color: ACCENT,
      checkoutUrl: 'https://sandbox.asaas.com/c/zaptro_falcao_demo',
      receiptPublicPath: '/master/zaptro?receipt=inv-falcao-z',
      blocked: false,
    },
    {
      id: 'demo-11',
      client: 'Expresso Federal',
      val: 'R$ 8.200,00',
      date: '18/05/2026',
      status: 'Pendente',
      color: '#F59E0B',
      checkoutUrl: 'https://sandbox.asaas.com/c/zaptro_expresso_demo',
      receiptPublicPath: '/master/zaptro?receipt=inv-expresso-z',
      blocked: false,
    },
    {
      id: 'demo-12',
      client: 'Rápido Trans',
      val: 'R$ 2.100,00',
      date: '10/05/2026',
      status: 'Pago',
      color: ACCENT,
      checkoutUrl: 'https://sandbox.asaas.com/c/zaptro_rapido_demo',
      receiptPublicPath: '/master/zaptro?receipt=inv-rapido-z',
      blocked: false,
    },
  ]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('companies').select('*');

      const defaultMocks: ClientRow[] = [
        { id: '1', name: 'Transportadora Falcão', plan: 'Zaptro Pro', volume: 4200, channels: 112, logoUrl: resolveCompanyLogo({ id: '1' }) },
        { id: 'demo-11', name: 'Expresso Federal', plan: 'Zaptro Enterprise', volume: 3100, channels: 98, logoUrl: resolveCompanyLogo({ id: 'demo-11' }) },
        { id: 'demo-12', name: 'Rápido Trans', plan: 'Zaptro Pro', volume: 2100, channels: 76, logoUrl: resolveCompanyLogo({ id: 'demo-12' }) },
        { id: 'demo-13', name: 'TransNorte Cargo', plan: 'Zaptro Start', volume: 980, channels: 41, logoUrl: resolveCompanyLogo({ id: 'demo-13' }) },
      ];

      if (data?.length) {
        const filtered = data
          .filter(
            (c: Record<string, unknown>) =>
              c.origin === 'zaptro' ||
              String(c.plan ?? '')
                .toUpperCase()
                .includes('ZAPTRO'),
          )
          .map((c: Record<string, unknown>) => {
            const vol = Math.floor(Math.random() * 2000) + 400;
            return {
              id: String(c.id),
              name: String(c.name || 'Empresa'),
              plan: String(c.plan || 'Zaptro Pro'),
              volume: vol,
              channels: Math.max(12, Math.floor(vol / 40)),
              logoUrl: resolveCompanyLogo({ id: c.id, logo_url: c.logo_url, name: c.name }, { includeMock: false }),
            };
          });

        setClients(filtered.length ? filtered : defaultMocks);
      } else {
        setClients(defaultMocks);
      }
    }
    load();
  }, []);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        if (!prev.get('page')) return prev;
        const n = new URLSearchParams(prev);
        n.delete('page');
        return n;
      },
      { replace: true },
    );
  }, [clientSearch, billingSearch, setSearchParams]);

  const topByVolume = useMemo(
    () => [...clients].sort((a, b) => b.volume - a.volume).slice(0, 5),
    [clients],
  );

  const filteredClients = useMemo(
    () =>
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.plan.toLowerCase().includes(clientSearch.toLowerCase()),
      ),
    [clients, clientSearch],
  );

  const clientsPaged = useMemo(() => paginateSlice(filteredClients, listPage, PAGE_SIZE), [filteredClients, listPage]);

  const filteredBillingRows = useMemo(
    () =>
      billingSubRows.filter(
        (f) =>
          f.client.toLowerCase().includes(billingSearch.toLowerCase()) ||
          f.status.toLowerCase().includes(billingSearch.toLowerCase()),
      ),
    [billingSubRows, billingSearch],
  );
  const billingPaged = useMemo(() => paginateSlice(filteredBillingRows, listPage, PAGE_SIZE), [filteredBillingRows, listPage]);

  const segmentPaging = useMemo(
    () =>
      ({
        commercial: paginateSlice(MOCK_CRM_DEALS, listPage, PAGE_SIZE),
        whatsapp: paginateSlice(MOCK_WHATSAPP, listPage, PAGE_SIZE),
        sales: paginateSlice(MOCK_ORCAMENTOS, listPage, PAGE_SIZE),
        routes: paginateSlice(MOCK_ROTAS, listPage, PAGE_SIZE),
        operations: paginateSlice(MOCK_OPERACOES, listPage, PAGE_SIZE),
        drivers: paginateSlice(MOCK_MOTORISTAS, listPage, PAGE_SIZE),
        fleet: paginateSlice(MOCK_FROTA, listPage, PAGE_SIZE),
        tracking: paginateSlice(MOCK_MAP_VEICULOS, listPage, PAGE_SIZE),
        infrastructure: paginateSlice(MOCK_INFRA_ROWS, listPage, PAGE_SIZE),
        finance: paginateSlice(MOCK_FINANCE_ROWS, listPage, PAGE_SIZE),
      }),
    [listPage],
  );

  const primaryBtn = { ...ZS.actionBtn, background: ACCENT, color: '#FFF', borderColor: ACCENT };

  const renderChartRow = (tab: TabId) => {
    const charts = TAB_CHARTS[tab];
    if (!charts) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 20 }}>
        {charts.map((c) => (
          <HubSupabaseChart key={c.label} label={c.label} value={c.value} data={c.data} color={c.color ?? ACCENT} />
        ))}
      </div>
    );
  };

  const tabBody = activeTab !== 'overview' ? (
    <>
      <style>{`
        .zaptro-admin-table th, .zaptro-admin-table td { text-align: left !important; }
      `}</style>
      <div style={{ ...ZS.tabContent, paddingTop: 0, paddingBottom: 0 }}>
        <SectionLead title={titles[activeTab]} path={tabPaths[activeTab]} />

        {activeTab !== 'settings' && renderChartRow(activeTab)}

        {activeTab !== 'settings' && (tabQuickKpis[activeTab] ?? []).length > 0 ? (
          <div style={ZAPTRO_KPIS_GRID_4}>
            {(tabQuickKpis[activeTab] ?? []).map((k) => (
              <HubMetricCard key={k.label} label={k.label} value={k.value} icon={k.icon} accent={ACCENT} />
            ))}
          </div>
        ) : null}

        {activeTab === 'clients' && (
          <>
            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={ZS.searchBox}>
                    <SearchIcon size={14} color="#94A3B8" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      style={ZS.searchInput}
                    />
                  </div>
                  <select
                    style={{
                      ...ZS.searchBox,
                      appearance: 'none',
                      paddingRight: 32,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#475569',
                    }}
                    aria-label="Plano"
                    defaultValue="all"
                  >
                    <option value="all">All plans</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="button" className="hub-premium-pill secondary" onClick={() => toastSuccess('Exportando Excel…')}>
                    <FileSpreadsheet size={14} color="#0046C7" /> Excel
                  </button>
                  <button type="button" className="hub-premium-pill secondary" onClick={() => toastSuccess('Exportando PDF…')}>
                    <FileText size={14} color="#DC2626" /> PDF
                  </button>
                  <button type="button" className="hub-premium-pill secondary" onClick={() => toastSuccess('Sincronizando…')}>
                    <RefreshCcw size={14} /> Refresh
                  </button>
                  <button type="button" className="hub-premium-pill primary" onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CLIENTS)}>
                    <Plus size={14} /> Add company
                  </button>
                </div>
              </div>
              <table style={ZS.table} className="zaptro-admin-table">
                <thead>
                  <tr>
                    <th style={{ ...ZS.th, width: 40, textAlign: 'center' }}>
                      <input type="checkbox" style={{ accentColor: ACCENT }} aria-label="Selecionar todos" />
                    </th>
                    <th style={ZS.th}>EMPRESA</th>
                    <th style={ZS.th}>PLANO ZAPTRO</th>
                    <th style={ZS.th}>VOLUME MULTICANAL</th>
                    <th style={ZS.th}>CANAIS ATIVOS</th>
                    <th style={ZS.th}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsPaged.slice.map((c) => (
                    <tr
                      key={c.id}
                      style={{ ...ZS.tr, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${c.id}${activeTab === 'clients' ? '' : `/m/${activeTab === 'billing' || activeTab === 'finance' ? 'faturamento' : activeTab === 'commercial' ? 'leads' : activeTab === 'whatsapp' ? 'whatsapp' : 'motoristas'}`}${activeTab === 'overview' ? '' : `?tab=${activeTab}`}`)}
                    >
                      <td style={ZS.tdCheckbox} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" style={{ accentColor: ACCENT }} aria-label={`Sel. ${c.name}`} />
                      </td>
                      <td style={ZS.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <HubEntityAvatar
                            kind="company"
                            src={resolveCompanyLogo({ id: c.id, logoUrl: c.logoUrl, name: c.name })}
                            name={c.name}
                            size={28}
                            accent={ACCENT}
                            style={{ borderRadius: 8 }}
                          />
                          <span style={{ ...ZS.clientName, color: ACCENT }}>{c.name}</span>
                        </div>
                      </td>
                      <td style={ZS.td}>
                        <span style={ZS.badge}>{c.plan}</span>
                      </td>
                      <td style={ZS.td}>
                        <span style={ZS.stat}>{c.volume.toLocaleString('pt-BR')}</span>
                      </td>
                      <td style={ZS.td}>
                        <span style={ZS.stat}>{c.channels}</span>
                      </td>
                      <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                        <button type="button" style={ZS.actionBtn} onClick={() => navigate(`/master/zaptro/${c.id}${activeTab === 'clients' ? '' : `/m/${activeTab === 'billing' || activeTab === 'finance' ? 'faturamento' : activeTab === 'commercial' ? 'leads' : activeTab === 'whatsapp' ? 'whatsapp' : 'motoristas'}`}${activeTab === 'overview' ? '' : `?tab=${activeTab}`}`)}>
                          <Settings size={14} />
                        </button>{' '}
                        <button type="button" style={ZS.actionBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CLIENTS)}>
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePaginationFooter
                page={clientsPaged.safePage}
                totalPages={clientsPaged.totalPages}
                total={clientsPaged.total}
                pageSize={PAGE_SIZE}
                onPageChange={setListPage}
              />
            </div>
          </>
        )}

        {activeTab === 'billing' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { plan: 'Zaptro Enterprise', count: 14, color: '#8B5CF6' },
                { plan: 'Zaptro Pro', count: 28, color: ACCENT },
                { plan: 'Zaptro Start', count: 7, color: '#3B82F6' },
              ].map((item) => (
                <div key={item.plan} style={{ ...ZS.card, padding: '18px 20px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B' }}>{item.plan}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>{item.count}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: item.color, marginTop: 6 }}>empresas ativas</div>
                </div>
              ))}
            </div>
            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <div style={ZS.searchBox}>
                  <SearchIcon size={14} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Buscar cliente ou status..."
                    value={billingSearch}
                    onChange={(e) => setBillingSearch(e.target.value)}
                    style={ZS.searchInput}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={ZS.actionBtn} onClick={() => toastSuccess('Exportando Excel…')}>
                    <FileSpreadsheet size={14} color="#0046C7" /> Excel
                  </button>
                  <button type="button" style={ZS.actionBtn} onClick={() => toastSuccess('Exportando PDF…')}>
                    <FileText size={14} color="#DC2626" /> PDF
                  </button>
                  <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.BILLING)}>
                    <Plus size={14} /> Novo plano
                  </button>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748B' }}>
                Cobrança espelha o app Zaptro em <strong style={{ color: ACCENT }}>/faturamento</strong>. Use os links para checkout e comprovantes.
              </p>
              <table style={ZS.table} className="zaptro-admin-table">
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
                  {billingPaged.slice.map((f) => (
                      <tr
                        key={f.id}
                        style={{ ...ZS.tr, cursor: 'pointer', opacity: f.blocked ? 0.55 : 1 }}
                        onClick={() => navigate(`/master/zaptro/${f.id}/m/faturamento?tab=billing`)}
                      >
                        <td style={ZS.td}>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>
                            {f.client}
                            {f.blocked ? ' · bloqueado' : ''}
                          </span>
                        </td>
                        <td style={ZS.td}>
                          <span style={{ fontWeight: 700, color: '#0F172A' }}>{f.val}</span>
                        </td>
                        <td style={ZS.td}>
                          <span style={ZS.stat}>{f.date}</span>
                        </td>
                        <td style={ZS.td}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.status}</span>
                        </td>
                        <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            style={ZS.actionBtn}
                            onClick={() => {
                              navigator.clipboard.writeText(f.checkoutUrl);
                              toastSuccess('Link de checkout copiado');
                            }}
                          >
                            <Copy size={14} /> Link
                          </button>
                        </td>
                        <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            style={ZS.actionBtn}
                            onClick={() => {
                              const url = `${window.location.origin}${f.receiptPublicPath}`;
                              navigator.clipboard.writeText(url);
                              toastSuccess('URL pública copiada');
                            }}
                          >
                            <Share2 size={14} /> Público
                          </button>
                          {f.status === 'Pago' && (
                            <button
                              type="button"
                              style={{ ...ZS.actionBtn, marginLeft: 6 }}
                              onClick={() => toastSuccess('Baixando PDF…')}
                            >
                              <Download size={14} /> PDF
                            </button>
                          )}
                        </td>
                        <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            style={ZS.actionBtn}
                            onClick={() => {
                              setBillingSubRows((rows) =>
                                rows.map((r) => (r.id === f.id ? { ...r, blocked: !r.blocked } : r)),
                              );
                              toastSuccess(f.blocked ? 'Desbloqueado.' : 'Bloqueado na UI.');
                            }}
                          >
                            <Lock size={14} />
                          </button>
                          <button
                            type="button"
                            style={{ ...ZS.actionBtn, color: '#B91C1C' }}
                            onClick={() => {
                              if (!window.confirm(`Excluir cobrança de ${f.client}?`)) return;
                              setBillingSubRows((rows) => rows.filter((r) => r.id !== f.id));
                              toastSuccess('Removido.');
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <TablePaginationFooter
                page={billingPaged.safePage}
                totalPages={billingPaged.totalPages}
                total={billingPaged.total}
                pageSize={PAGE_SIZE}
                onPageChange={setListPage}
              />
            </div>
          </>
        )}

        {['commercial', 'whatsapp', 'sales', 'routes', 'tracking'].includes(activeTab) && <GlobalConsolidatedBanner />}

        {activeTab === 'commercial' && (
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={{ ...ZS.actionBtn, borderColor: ACCENT, color: ACCENT, background: `${ACCENT}08` }}
                  onClick={() => {
                    toastSuccess('Assistente de novo pipeline CRM (Master). Em produção, abre wizard no Zaptro.');
                    openZaptroApp(`${ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM}?novo=1`);
                  }}
                >
                  <UserPlus size={14} /> Adicionar CRM
                </button>
                <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.COMMERCIAL_CRM)}>
                  <ExternalLink size={14} /> Abrir CRM
                </button>
              </div>
            </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>DEAL</th>
                  <th style={ZS.th}>ETAPA</th>
                  <th style={ZS.th}>VALOR</th>
                  <th style={ZS.th}>OWNER</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.commercial.slice.map((r) => (
                  <tr
                    key={r.id}
                    style={{ ...ZS.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=crm`)}
                  >
                    <td style={ZS.td}>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.empresa}</span>
                    </td>
                    <td style={ZS.td}>{r.id}</td>
                    <td style={ZS.td}>{r.etapa}</td>
                    <td style={ZS.td}>{r.valor}</td>
                    <td style={ZS.td}>{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.commercial.safePage}
              totalPages={segmentPaging.commercial.totalPages}
              total={segmentPaging.commercial.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <>
            <div
              style={{
                ...ZS.card,
                marginBottom: 16,
                border: `1px solid ${ACCENT}33`,
                background: 'linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 55%)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4C1D95', marginBottom: 20 }}>Suporte global — WhatsApp (evolução)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>TENANT / EMPRESA</label>
                  <select
                    value={waTenantId}
                    onChange={(e) => setWaTenantId(e.target.value)}
                    style={{ ...ZS.readonlyInput, cursor: 'pointer' }}
                  >
                    {ZAPTRO_DEMO_TENANT_IDS.map((tid, idx) => (
                      <option key={tid} value={tid}>
                        {tid} · {EMPRESAS_MOCK[idx % EMPRESAS_MOCK.length]}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>CRÉDITOS (SALDO GLOBAL MOCK)</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>128.400</span>
                    <span style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}>disponíveis</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>ADICIONAR CRÉDITOS</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={waCreditsAdd}
                      onChange={(e) => setWaCreditsAdd(e.target.value)}
                      style={ZS.readonlyInput}
                    />
                    <button
                      type="button"
                      style={primaryBtn}
                      onClick={() => {
                        toastSuccess(`Créditos registrados (mock) para tenant ${waTenantId}: ${waCreditsAdd || '0'}`);
                        setWaCreditsAdd('');
                      }}
                    >
                      <Coins size={14} /> Aplicar
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div style={{ ...ZS.card, padding: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>NÚMERO / CANAL</div>
                  <input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} style={{ ...ZS.readonlyInput, marginBottom: 10 }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button type="button" style={ZS.actionBtn} onClick={() => toastSuccess('Número salvo (mock). Sincroniza com Evolution/Zaptro.')}>
                      Salvar número
                    </button>
                    <button
                      type="button"
                      style={{ ...ZS.actionBtn, color: '#B91C1C', borderColor: '#FECACA' }}
                      onClick={() => toastSuccess('Canal bloqueado na UI Master (mock).')}
                    >
                      <Ban size={14} /> Bloquear
                    </button>
                  </div>
                </div>
                <div style={{ ...ZS.card, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8 }}>QR CODE — PAREAMENTO</div>
                  <div
                    style={{
                      height: 120,
                      margin: '0 auto 10px',
                      maxWidth: 120,
                      border: '2px dashed #CBD5E1',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#F8FAFC',
                    }}
                  >
                    <QrCode size={48} color="#94A3B8" />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button type="button" style={primaryBtn} onClick={() => toastSuccess('Gerando QR Master...')}>
                      Gerar QR
                    </button>
                    <button type="button" style={ZS.actionBtn} onClick={() => toastSuccess('Pareamento cancelado.')}>
                      Cancelar QR
                    </button>
                  </div>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#94A3B8' }}>
                Produção: integra Evolution API / Meta — ações auditadas e refletem no app do cliente após confirmação.
              </p>
            </div>

            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 720 }}>
                  Inbox e desempenho <strong style={{ color: '#25D366' }}>WhatsApp</strong> agregados por tenant — números conectados, volume 24h e saúde.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={{ ...ZS.actionBtn, borderColor: '#25D366', color: '#15803D', background: '#DCFCE7' }}
                    onClick={() => {
                      toastSuccess('Créditos de conversas alocados (mock).');
                    }}
                  >
                    <Coins size={14} /> Créditos globais
                  </button>
                  <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.CHAT)}>
                    <Plus size={14} /> Abrir WhatsApp
                  </button>
                </div>
              </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>NÚMERO / CANAL</th>
                  <th style={ZS.th}>MSGS (24H)</th>
                  <th style={ZS.th}>TMA RESP.</th>
                  <th style={ZS.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.whatsapp.slice.map((r) => (
                  <tr
                    key={r.id}
                    style={{ ...ZS.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/master/zaptro/${r.companyId}/m/whatsapp`)}
                  >
                    <td style={ZS.td}>{r.empresa}</td>
                    <td style={ZS.td}>{r.numero}</td>
                    <td style={ZS.td}>{r.msgs24h.toLocaleString('pt-BR')}</td>
                    <td style={ZS.td}>{r.tma}</td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.whatsapp.safePage}
              totalPages={segmentPaging.whatsapp.totalPages}
              total={segmentPaging.whatsapp.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
          </>
        )}

        {activeTab === 'sales' && (
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 720 }}>
                Orçamentos, propostas e follow-ups em <strong style={{ color: ACCENT }}>/vendas</strong> — visão consolidada de todas as empresas. Clique na linha para o perfil com contexto de vendas.
              </p>
              <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.SALES)}>
                <Plus size={14} /> Abrir vendas
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { l: 'Pipeline orçamentos', v: 'R$ 640k', s: 'Global' },
                { l: 'Taxa fechamento (7d)', v: '22%', s: 'Meta 25%' },
                { l: 'Follow-ups abertos', v: '41', s: 'Agenda comercial' },
              ].map((x) => (
                <div key={x.l} style={{ border: `1px solid ${ACCENT}22`, borderRadius: 10, padding: '14px 16px', background: '#FAF5FF' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{x.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{x.v}</div>
                  <div style={{ fontSize: 11, color: ACCENT, marginTop: 4, fontWeight: 600 }}>{x.s}</div>
                </div>
              ))}
            </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>ORÇAMENTO</th>
                  <th style={ZS.th}>VALOR</th>
                  <th style={ZS.th}>STATUS</th>
                  <th style={ZS.th}>VENCIMENTO</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.sales.slice.map((r) => (
                  <tr
                    key={r.id}
                    style={{ ...ZS.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=vendas`)}
                  >
                    <td style={ZS.td}>{r.empresa}</td>
                    <td style={ZS.td}>{r.id}</td>
                    <td style={ZS.td}>{r.valor}</td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                    </td>
                    <td style={ZS.td}>{r.venc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.sales.safePage}
              totalPages={segmentPaging.sales.totalPages}
              total={segmentPaging.sales.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
        )}

        {activeTab === 'routes' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748B' }}>
                Lista consolidada por tenant; mapa ao vivo via <strong style={{ color: ROUTE_CRM_ACCENT }}>/mapa</strong>. CRM em <strong>/rotas</strong> e <strong>/comercial</strong>.
              </p>
              <ZaptroMapFrame path={ZAPTRO_MASTER_ROUTES.OPENSTREETMAP} height={400} markers={ZAPTRO_LIVE_MAP_MARKERS} />
            </div>
            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button type="button" style={{ ...primaryBtn, background: ROUTE_CRM_ACCENT, borderColor: ROUTE_CRM_ACCENT }} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.ROUTES)}>
                  <Plus size={14} /> Abrir rotas CRM
                </button>
              </div>
              <table style={ZS.table} className="zaptro-admin-table">
                <thead>
                  <tr>
                    <th style={ZS.th}>EMPRESA</th>
                    <th style={ZS.th}>ROTA</th>
                    <th style={ZS.th}>ORIGEM</th>
                    <th style={ZS.th}>DESTINO</th>
                    <th style={ZS.th}>CARGA</th>
                    <th style={ZS.th}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentPaging.routes.slice.map((r) => (
                    <tr
                      key={r.id}
                      style={{ ...ZS.tr, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=rotas`)}
                    >
                      <td style={ZS.td}>{r.empresa}</td>
                      <td style={ZS.td}>{r.id}</td>
                      <td style={ZS.td}>{r.origem}</td>
                      <td style={ZS.td}>{r.destino}</td>
                      <td style={ZS.td}>{r.carga}</td>
                      <td style={ZS.td}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePaginationFooter
                page={segmentPaging.routes.safePage}
                totalPages={segmentPaging.routes.totalPages}
                total={segmentPaging.routes.total}
                pageSize={PAGE_SIZE}
                onPageChange={setListPage}
              />
            </div>
          </>
        )}

        {activeTab === 'operations' && (
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 820 }}>
                Operações de campo no Zaptro: coletas, entregas e transferências de <strong>todas</strong> as empresas com plano ativo. SLA e incidentes consolidados; clique na linha para o perfil operacional do tenant.
              </p>
              <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.LOGISTICS)}>
                <Plus size={14} /> Abrir operações
              </button>
            </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>ID</th>
                  <th style={ZS.th}>TIPO</th>
                  <th style={ZS.th}>PRIORIDADE</th>
                  <th style={ZS.th}>SLA</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.operations.slice.map((r) => (
                  <tr
                    key={r.id}
                    style={{ ...ZS.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=operacoes`)}
                  >
                    <td style={ZS.td}>{r.empresa}</td>
                    <td style={ZS.td}>{r.id}</td>
                    <td style={ZS.td}>{r.tipo}</td>
                    <td style={ZS.td}>{r.prioridade}</td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.slaColor }}>{r.sla}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.operations.safePage}
              totalPages={segmentPaging.operations.totalPages}
              total={segmentPaging.operations.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
        )}

        {activeTab === 'drivers' && (
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 860 }}>
                Lista global de motoristas (mock). Espelho do <strong>/motoristas</strong> no app; linha abre o perfil da empresa. Use o botão à direita para ficha do colaborador no Zaptro.
              </p>
              <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.DRIVERS)}>
                <Plus size={14} /> Abrir motoristas
              </button>
            </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>NOME</th>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>CNH / DOC</th>
                  <th style={ZS.th}>STATUS</th>
                  <th style={ZS.th}>ZAPTRO</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.drivers.slice.map((r) => (
                  <tr key={r.id} style={ZS.tr}>
                    <td
                      style={{ ...ZS.td, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=motoristas`)}
                    >
                      {r.nome}
                    </td>
                    <td
                      style={{ ...ZS.td, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=motoristas`)}
                    >
                      {r.empresa}
                    </td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.cnhColor }}>{r.cnh}</span>
                    </td>
                    <td style={ZS.td}>{r.status}</td>
                    <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                      <button type="button" style={ZS.actionBtn} onClick={() => openZaptroApp(zaptroMasterDriverPath(r.id))}>
                        <ExternalLink size={14} /> Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.drivers.safePage}
              totalPages={segmentPaging.drivers.totalPages}
              total={segmentPaging.drivers.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
        )}

        {activeTab === 'fleet' && (
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 860 }}>
                Frota consolidada — todos veículos rastreados dos tenants. Clique na empresa para créditos e telemetria no perfil; &quot;Veículo&quot; abre a ficha no Zaptro.
              </p>
              <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.FLEET)}>
                <Plus size={14} /> Abrir frota
              </button>
            </div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>PLACA</th>
                  <th style={ZS.th}>MODELO</th>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>TELEMETRIA</th>
                  <th style={ZS.th}>ZAPTRO</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.fleet.slice.map((r) => (
                  <tr key={r.id} style={ZS.tr}>
                    <td style={{ ...ZS.td, cursor: 'pointer' }} onClick={() => openZaptroApp(zaptroMasterVehiclePath(r.id))}>
                      <span style={{ fontWeight: 700, color: ACCENT }}>{r.placa}</span>
                    </td>
                    <td style={ZS.td}>{r.modelo}</td>
                    <td
                      style={{ ...ZS.td, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=frota`)}
                    >
                      {r.empresa}
                    </td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.telColor }}>{r.telemetria}</span>
                    </td>
                    <td style={ZS.td} onClick={(e) => e.stopPropagation()}>
                      <button type="button" style={ZS.actionBtn} onClick={() => openZaptroApp(zaptroMasterVehiclePath(r.id))}>
                        <ExternalLink size={14} /> Veículo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.fleet.safePage}
              totalPages={segmentPaging.fleet.totalPages}
              total={segmentPaging.fleet.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
        )}

        {activeTab === 'tracking' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
                Mapa ao vivo com <strong>todas</strong> as operações e veículos reportados pelos tenants Zaptro (mesma origem que <code>/mapa</code> no produto). Lista abaixo: unidades em movimento — clique na empresa para o perfil.
              </p>
              <ZaptroMapFrame path={ZAPTRO_MASTER_ROUTES.OPENSTREETMAP} height={480} markers={ZAPTRO_LIVE_MAP_MARKERS} />
            </div>
            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.OPENSTREETMAP)}>
                  <Plus size={14} /> Abrir em nova aba
                </button>
              </div>
              <table style={ZS.table} className="zaptro-admin-table">
                <thead>
                  <tr>
                    <th style={ZS.th}>PLACA / ID</th>
                    <th style={ZS.th}>EMPRESA</th>
                    <th style={ZS.th}>ÚLTIMO PING</th>
                    <th style={ZS.th}>IGNIÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {segmentPaging.tracking.slice.map((r) => (
                    <tr
                      key={r.id}
                      style={{ ...ZS.tr, cursor: 'pointer' }}
                      onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=mapa`)}
                    >
                      <td style={ZS.td}>{r.placa}</td>
                      <td style={ZS.td}>{r.empresa}</td>
                      <td style={ZS.td}>{r.ultimoPing}</td>
                      <td style={ZS.td}>{r.ignicao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePaginationFooter
                page={segmentPaging.tracking.safePage}
                totalPages={segmentPaging.tracking.totalPages}
                total={segmentPaging.tracking.total}
                pageSize={PAGE_SIZE}
                onPageChange={setListPage}
              />
            </div>
          </>
        )}

        {activeTab === 'infrastructure' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#64748B', maxWidth: 920 }}>
                Tudo que sustenta o produto: APIs, filas, e-mail transacional, edge e webhooks. Novas integrações criadas aqui aparecem para o cliente no app quando publicadas.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {[
                  {
                    t: 'API Core',
                    d: 'REST + auth Supabase',
                    icon: Server,
                    st: 'OK',
                  },
                  { t: 'Webhooks', d: 'HMAC · retries', icon: Webhook, st: 'OK' },
                  { t: 'Mail API', d: 'apps/zaptro/server', icon: Mail, st: 'OK' },
                  { t: 'Edge cache', d: 'CDN estático Hub', icon: Globe2, st: 'OK' },
                ].map((x) => (
                  <div
                    key={x.t}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: 12,
                      padding: 14,
                      background: '#FAFAFA',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <x.icon size={18} color={ACCENT} />
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0F172A' }}>{x.t}</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{x.d}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A' }}>{x.st}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" style={primaryBtn} onClick={() => setInfraAddOpen(true)}>
                  <Plus size={14} /> Adicionar integração
                </button>
                <button type="button" style={ZS.actionBtn} onClick={() => navigate('/master/settings')}>
                  <ExternalLink size={14} /> Hub infraestrutura
                </button>
              </div>
            </div>
            <div style={{ ...ZS.card, ...ZS.scroll500 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 12 }}>Saúde por tenant (detalhe)</div>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>SERVIÇO</th>
                  <th style={ZS.th}>LATÊNCIA</th>
                  <th style={ZS.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.infrastructure.slice.map((r) => (
                  <tr key={r.id} style={ZS.tr}>
                    <td style={ZS.td}>{r.empresa}</td>
                    <td style={ZS.td}>{r.servico}</td>
                    <td style={ZS.td}>{r.latencia}</td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.infrastructure.safePage}
              totalPages={segmentPaging.infrastructure.totalPages}
              total={segmentPaging.infrastructure.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
          </>
        )}

        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {[
                { k: 'Créditos Master (Zaptro)', v: 'R$ 24k', d: 'Pool para descontos / cortesias' },
                { k: 'Créditos repassados (mês)', v: 'R$ 6,4k', d: 'Aplicados nos tenants' },
                { k: 'Inadimplência alertada', v: '3', d: 'Cobrança suave via app' },
              ].map((x) => (
                <div key={x.k} style={{ ...ZS.card, padding: '16px 18px', borderColor: `${ACCENT}44`, background: '#FAF5FF' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{x.k}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{x.v}</div>
                  <div style={{ fontSize: 11, color: ACCENT, marginTop: 6 }}>{x.d}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                style={{ ...ZS.actionBtn, borderColor: ACCENT, color: ACCENT }}
                onClick={() => toastSuccess('Fluxo de créditos: use o console Logta para pagamentos somente Logta; no Zaptro o pool é espelhado aqui (mock).')}
              >
                <Coins size={14} /> Como no Logta — só créditos Logta
              </button>
              <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.BILLING)}>
                <Plus size={14} /> Abrir faturamento
              </button>
            </div>
          <div style={{ ...ZS.card, ...ZS.scroll500 }}>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748B' }}>
              Faturamento consolidado por tenant — clique na empresa para créditos e boletos no perfil.
            </p>
            <table style={ZS.table} className="zaptro-admin-table">
              <thead>
                <tr>
                  <th style={ZS.th}>EMPRESA</th>
                  <th style={ZS.th}>TIPO</th>
                  <th style={ZS.th}>VALOR</th>
                  <th style={ZS.th}>VENCIMENTO</th>
                  <th style={ZS.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {segmentPaging.finance.slice.map((r) => (
                  <tr
                    key={r.id}
                    style={{ ...ZS.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/master/zaptro/${r.companyId}?focus=faturamento`)}
                  >
                    <td style={ZS.td}>{r.empresa}</td>
                    <td style={ZS.td}>{r.tipo}</td>
                    <td style={ZS.td}>{r.valor}</td>
                    <td style={ZS.td}>{r.venc}</td>
                    <td style={ZS.td}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: r.statusColor }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TablePaginationFooter
              page={segmentPaging.finance.safePage}
              totalPages={segmentPaging.finance.totalPages}
              total={segmentPaging.finance.total}
              pageSize={PAGE_SIZE}
              onPageChange={setListPage}
            />
          </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={hubPillTabStripStyles.container}>
              {(
                [
                  { id: 'general' as const, label: 'Geral / White Label', icon: Settings },
                  { id: 'auth' as const, label: 'Autenticação', icon: Key },
                  { id: 'security' as const, label: 'Segurança & RLS', icon: Shield },
                  { id: 'permissions' as const, label: 'Permissões', icon: Lock },
                  { id: 'audit' as const, label: 'Auditoria & Logs', icon: FileText },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setZaptroSettingsTab(t.id)}
                  style={{
                    ...hubPillTabStripStyles.button,
                    ...(zaptroSettingsTab === t.id ? hubPillTabStripStyles.buttonActive : {}),
                  }}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>

            {zaptroSettingsTab === 'general' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 32 }}>
                <div style={ZS.card}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Identidade Visual (White-label)</h3>
                  <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Personalize a aparência do Zaptro para os seus clientes. Alterações salvam no Hub e refletem no produto.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>NOME DA PLATAFORMA</label>
                      <input
                        type="text"
                        value={wl.name}
                        onChange={(e) => updateSettings('zaptro', { name: e.target.value })}
                        style={ZS.readonlyInput}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>SLOGAN / SUBTÍTULO</label>
                      <input
                        type="text"
                        value={wl.slogan}
                        onChange={(e) => updateSettings('zaptro', { slogan: e.target.value })}
                        style={ZS.readonlyInput}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>COR PRIMÁRIA</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="color"
                            value={wl.primaryColor}
                            onChange={(e) => updateSettings('zaptro', { primaryColor: e.target.value })}
                            style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={wl.primaryColor}
                            onChange={(e) => updateSettings('zaptro', { primaryColor: e.target.value })}
                            style={{ ...ZS.readonlyInput, flex: 1 }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>COR SECUNDÁRIA</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="color"
                            value={wl.secondaryColor}
                            onChange={(e) => updateSettings('zaptro', { secondaryColor: e.target.value })}
                            style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            value={wl.secondaryColor}
                            onChange={(e) => updateSettings('zaptro', { secondaryColor: e.target.value })}
                            style={{ ...ZS.readonlyInput, flex: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>LOGOTIPO (PNG/SVG)</label>
                      <div style={{ border: '2px dashed #E2E8F0', padding: 24, borderRadius: 16, textAlign: 'center', backgroundColor: '#F8FAFC', cursor: 'pointer' }}>
                        <UploadCloud size={24} color="#94A3B8" />
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 8, fontWeight: 600 }}>Click to upload or drag and drop</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toastSuccess('White-label Zaptro aplicado — clientes veem na próxima sessão.')}
                      style={{ ...primaryBtn, padding: '12px', justifyContent: 'center', width: '100%', maxWidth: 320 }}
                    >
                      Save changes
                    </button>
                  </div>
                </div>
                <div style={ZS.card}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Domínios & Customização</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>Domínio Master</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{getZaptroOriginHost()}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, background: `${ACCENT}15`, padding: '4px 8px', borderRadius: 4 }}>ACTIVE</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>Email Transacional</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>notifications@zaptro.com.br</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, background: `${ACCENT}15`, padding: '4px 8px', borderRadius: 4 }}>VERIFIED</span>
                    </div>
                  </div>
                  <button type="button" style={{ ...ZS.actionBtn, marginTop: 16 }} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.SETTINGS_ALIAS)}>
                    <ExternalLink size={14} /> Abrir no Zaptro
                  </button>
                </div>
              </div>
            )}

            {zaptroSettingsTab === 'security' && (
              <div style={ZS.card}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Segurança de Dados & RLS</h3>
                <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Isolamento por tenant no Supabase compartilhado.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Database size={20} color={ACCENT} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#0F172A' }}>Row Level Security (RLS)</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>Políticas ativas por company_id.</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '4px 10px', borderRadius: 6 }}>PROTEGIDO</span>
                  </div>
                </div>
              </div>
            )}

            {zaptroSettingsTab === 'auth' && (
              <div style={ZS.card}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Políticas de Autenticação</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 16,
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#0F172A' }}>2FA obrigatório (Master)</div>
                    <button type="button" style={ZS.actionBtn}>
                      Required
                    </button>
                  </div>
                </div>
              </div>
            )}

            {zaptroSettingsTab === 'permissions' && (
              <div style={ZS.card}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>RBAC — Zaptro</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                  {[
                    { role: 'Master Admin', access: 'Total', users: 2, color: '#EF4444' },
                    { role: 'Suporte Zaptro', access: 'Leitura + ações limitadas', users: 6, color: '#3B82F6' },
                    { role: 'Cliente', access: 'Só próprio tenant', users: 49, color: ACCENT },
                  ].map((r) => (
                    <div key={r.role} style={{ ...ZS.card, padding: 24, backgroundColor: '#F8FAFC' }}>
                      <div style={{ fontWeight: 900, color: r.color, fontSize: 16 }}>{r.role}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 8, fontWeight: 600 }}>{r.access}</div>
                      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>{r.users} USUÁRIOS</span>
                        <button type="button" style={ZS.actionBtn}>
                          Configurar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {zaptroSettingsTab === 'audit' && (
              <div style={ZS.card}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Auditoria & Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
                  {[
                    { ev: 'Troca de White-label', usr: 'master@hub.io', time: 'Há 12 min' },
                    { ev: 'Créditos WhatsApp', usr: 'suporte@zaptro.io', time: 'Hoje 10:02' },
                    { ev: 'Novo tenant CRM', usr: 'system', time: 'Ontem' },
                  ].map((l, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        border: '1px solid #E2E8F0',
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800 }}>{l.ev}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{l.usr}</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{l.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #EDE9FE',
            background: 'linear-gradient(180deg,#FAF5FF 0%,#FFFFFF 100%)',
            fontSize: 13,
            color: '#475569',
            lineHeight: 1.5,
            marginTop: 8,
          }}
        >
          <strong style={{ color: '#4C1D95' }}>Integração ao vivo:</strong> métricas e listas ficam no Master; edição pesada em{' '}
          <button
            type="button"
            onClick={() => openZaptroApp(tabPaths[activeTab])}
            style={{
              border: 'none',
              background: 'none',
              color: ACCENT,
              fontWeight: 800,
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            {getZaptroOriginHost()}
          </button>{' '}
          — mesmo contrato visual do{' '}
          <code style={{ fontSize: 12 }}>Logta Admin</code>.
        </div>
        </div>
    </>
  ) : null;

  return (
    <div style={shell.container}>
      <div style={shell.secondarySidebar}>
        <div style={{ ...shell.sidebarHeader, flexDirection: 'column', alignItems: 'stretch', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color={ACCENT} />
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.025em', color: '#0F172A' }}>Zaptro Admin</span>
            </div>
            <button
              type="button"
              onClick={() => toastSuccess('Novo cliente Zaptro adicionado.')}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '100px',
                border: 'none',
                background: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
                padding: 0,
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
              }}
              title="Adicionar Cliente Zaptro"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
        <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
        <div style={shell.sidebarNav}>
          {tabSections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#64748B',
                  textTransform: 'none',
                  letterSpacing: '0.03em',
                  padding: '4px 10px 6px',
                }}
              >
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {sec.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    style={{
                      ...shell.sidebarBtn,
                      backgroundColor: activeTab === item.id ? '#F5F3FF' : 'transparent',
                      color: activeTab === item.id ? '#1F2937' : '#475569',
                    }}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon
                      size={14}
                      style={{
                        opacity: activeTab === item.id ? 1 : 0.7,
                        flexShrink: 0,
                        color: activeTab === item.id ? ACCENT : '#64748B',
                      }}
                    />
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
          <ZaptroClientProfile isEmbedded={true} />
        ) : (
          <div
            style={{
              ...shell.content,
              gap: 13,
              marginTop: 0,
              marginBottom: 0,
              padding: `0 var(--hub-master-page-pad-x) 0 var(--hub-master-page-pad-x)`,
            }}
          >
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <MasterProductProjectHeader
                title={wl.name}
                subtitle={wl.slogan}
                domainUrl={zaptroAppDeepLink(ZAPTRO_MASTER_ROUTES.DASHBOARD)}
                domainLabel={`${getZaptroOriginHost()}/inicio`}
                accentColor={ACCENT}
                logoUrl={wl.logo}
                avatarName={wl.name}
                toastOnCopy="URL base do Zaptro copiada"
                actions={
                  <button 
                    onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.DASHBOARD)}
                    style={{ 
                      ...shell.actionBtn, 
                      background: '#25D366', 
                      color: 'white', 
                      border: 'none', 
                      padding: '10px 28px', 
                      borderRadius: '100px',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                      fontSize: '13px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    <ExternalLink size={16} /> ABRIR NO ZAPTRO
                  </button>
                }
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <HubSupabaseChart
                  label="TENANTS ZAPTRO"
                  value={`${clients.length || '—'}`}
                  data={[8, 10, 12, 15, 18, 28, 32, Math.max(clients.length, 8), Math.max(clients.length, 10)]}
                  color={ACCENT}
                />
                <HubSupabaseChart
                  label="SESSÕES WHATSAPP (HOJE)"
                  value="4.902"
                  data={[120, 340, 220, 400, 450, 310, 500, 480, 520, 490]}
                  color="#9333EA"
                />
                <HubSupabaseChart label="CONVERSÃO CRM" value="18.4%" data={[12, 14, 13, 15, 17, 16, 18, 17.5, 18.1, 18.4]} color="#7C3AED" />
                <HubSupabaseChart label="MRR (EST.)" value="R$ 86k" data={[38, 45, 50, 55, 60, 65, 70, 75, 80, 86]} color="#5B21B6" />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, min(482px, 100%))',
                  columnGap: 0,
                  marginBottom: 24,
                  alignItems: 'stretch',
                }}
              >
                <div style={{ minWidth: 0, paddingRight: 24 }}>
                  <EcosystemBubbleMap
                    companies={clients}
                    onBubbleClick={(c, vol) => {
                      setClusterClient({ ...c, vol });
                      setClusterOpen(true);
                    }}
                  />
                </div>
                <div
                  style={{
                    borderLeft: '1px solid #E2E8F0',
                    padding: '8px 0 24px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    minHeight: 320,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Acesso ao sistema
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                    Abra o Zaptro em tempo real para operar WhatsApp, CRM e frota. Origem configurável:{' '}
                    <code style={{ fontSize: 12 }}>{getZaptroAppOrigin()}</code>
                  </p>
                  <button type="button" style={primaryBtn} onClick={() => openZaptroApp(ZAPTRO_MASTER_ROUTES.DASHBOARD)}>
                    Abrir painel Zaptro <ChevronRight size={16} style={{ marginLeft: 4 }} />
                  </button>
                  <div style={{ ...ZS.card, marginTop: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Última sincronização</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 6 }}>{'< 2 min'}</div>
                    <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginTop: 8 }}>● Streams ativos</div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '12px',
                  }}
                >
                  Top empresas (volume multicanal)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '20px' }}>
                  {topByVolume.map((company, i) => {
                    const Icon = TOP_ICONS[i % TOP_ICONS.length];
                    return (
                      <div
                        key={company.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/master/zaptro/${company.id}${activeTab === 'overview' ? '' : `?tab=${activeTab}`}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/master/zaptro/${company.id}${activeTab === 'overview' ? '' : `?tab=${activeTab}`}`);
                          }
                        }}
                        style={{ cursor: 'pointer', minWidth: 0 }}
                      >
                        <HubMetricCard
                          label={company.name}
                          value={formatVolume(company.volume)}
                          icon={Icon}
                          accent={ACCENT}
                          topRight={
                            <span style={{ fontWeight: 800, fontSize: 13, color: ACCENT }}>
                              {company.plan.replace(/^Zaptro\s*/i, '')}
                            </span>
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={ZAPTRO_KPIS_GRID_4}>
                <HubMetricCard
                  label="Início produto"
                  value="Painel rápido"
                  icon={BarChart3}
                  accent={ACCENT}
                  footer={<QuickOpenChip path={ZAPTRO_MASTER_ROUTES.DASHBOARD} />}
                />
                <HubMetricCard
                  label="Resultados"
                  value="Widgets"
                  icon={TrendingUp}
                  accent={ACCENT}
                  footer={<QuickOpenChip path={ZAPTRO_MASTER_ROUTES.RESULTADOS} />}
                />
                <HubMetricCard
                  label="Equipe"
                  value="Colaboradores"
                  icon={Users}
                  accent={ACCENT}
                  footer={<QuickOpenChip path={ZAPTRO_MASTER_ROUTES.TEAM} />}
                />
                <HubMetricCard
                  label="Histórico"
                  value="Auditoria leve"
                  icon={Clock}
                  accent={ACCENT}
                  footer={<QuickOpenChip path={ZAPTRO_MASTER_ROUTES.HISTORY} />}
                />
              </div>
            </div>
          )}

          {tabBody}

          <LogtaModal isOpen={clusterOpen} onClose={() => setClusterOpen(false)} size="md" title="Tenant no ecossistema Zaptro">
            {clusterClient && (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <HubEntityAvatar
                    kind="company"
                    src={resolveCompanyLogo({ id: clusterClient.id, logoUrl: clusterClient.logoUrl, name: clusterClient.name })}
                    name={clusterClient.name}
                    size={48}
                    accent={ACCENT}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{clusterClient.name}</h3>
                    <span
                      style={{
                        display: 'inline-flex',
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        backgroundColor: '#F5F3FF',
                        color: ACCENT,
                        borderRadius: 6,
                      }}
                    >
                      ATIVO · MULTICANAL
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 16,
                    backgroundColor: '#FAFAFC',
                    padding: 16,
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Plano</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 4 }}>{clusterClient.plan}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Volume</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT, marginTop: 4 }}>{clusterClient.vol}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" style={ZS.actionBtn} onClick={() => setClusterOpen(false)}>
                    Fechar
                  </button>
                  <button
                    type="button"
                    style={primaryBtn}
                    onClick={() => {
                      setClusterOpen(false);
                      navigate(`/master/zaptro/${clusterClient.id}${activeTab === 'overview' ? '' : `?tab=${activeTab}`}`);
                    }}
                  >
                    Perfil no Master <ChevronRight size={16} style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </div>
            )}
          </LogtaModal>

          <LogtaModal
            isOpen={infraAddOpen}
            onClose={() => setInfraAddOpen(false)}
            size="md"
            title="Adicionar integração"
            subtitle="Registro espelho no Master. No mock, apenas confirme o cadastro para simular publish ao ecossistema."
            padding="0px"
          >
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="zaptro-infra-name" style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
                  Nome público / label
                </label>
                <input
                  id="zaptro-infra-name"
                  type="text"
                  value={infraAddName}
                  onChange={(e) => setInfraAddName(e.target.value)}
                  placeholder="ex.: Webhook cliente premium"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="zaptro-infra-kind" style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
                  Tipo
                </label>
                <select
                  id="zaptro-infra-kind"
                  value={infraAddKind}
                  onChange={(e) => setInfraAddKind(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    fontSize: 13,
                    background: '#FFF',
                  }}
                >
                  <option value="webhook">Webhook HMAC</option>
                  <option value="api">API REST parceira</option>
                  <option value="queue">Fila / worker</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" style={ZS.actionBtn} onClick={() => setInfraAddOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  style={primaryBtn}
                  onClick={() => {
                    toastSuccess(
                      infraAddName.trim()
                        ? `Integração "${infraAddName.trim()}" criada (mock) — aparecerá após revisão Hub.`
                        : 'Nova integração cadastrada (mock) — cliente será notificado no Zaptro após publish.',
                    );
                    setInfraAddName('');
                    setInfraAddOpen(false);
                  }}
                >
                  Registrar
                </button>
              </div>
            </div>
          </LogtaModal>
        </div>
        )}
      </div>
    </div>
  );
};

export default ZaptroAdmin;
