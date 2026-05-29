import React, { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  List,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { isZaptroBrandingEntitledByPlan } from '../utils/zaptroBrandingEntitlement';
import { ZAPTRO_ROUTES } from '../constants/zaptroRoutes';
import { ZAPTRO_APP_ROUTES, zaptroAppOrLegacy } from '../app/zaptroAppRoutes';
import {
  QUOTE_STATUS_LABEL,
  quoteStatusBadgeStyle,
  quoteMonetaryValue,
  quoteProductLabel,
  readAllQuotesFlattened,
  readQuotesMap,
  quotePublicPath,
  seedDemoQuotesIfEmpty,
  writeQuotesMap,
  type FreightQuote,
  type FreightQuoteWithLead,
  type QuoteStatus,
} from '../constants/zaptroQuotes';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { resolveSessionAvatarUrl } from '../utils/zaptroAvatar';
import { readZaptroServiceScope, zaptroEffectiveCalcMode } from '../utils/zaptroServiceScope';
import ZaptroKpiMetricCard from '../components/Zaptro/ZaptroKpiMetricCard';
import { ZaptroNumericCalculator } from '../components/Zaptro/ZaptroNumericCalculator';
import { zaptroCardSurfaceStyle } from '../constants/zaptroCardSurface';
import { useDebouncedValue } from '../utils/useDebouncedValue';
import { useZaptroPaginatedList } from '../hooks/useZaptroPaginatedList';
import ZaptroListPagination from '../components/Zaptro/ZaptroListPagination';

const QUOTES_VISTA_KEY = 'zaptro_quotes_vista';

const QUOTE_KANBAN_COLUMNS: QuoteStatus[] = ['pendente', 'enviado', 'visualizado', 'aprovado', 'recusado'];

/** Janela secundária (pré-visualização da página pública do orçamento). */
const QUOTE_PUBLIC_POPUP_FEATURES =
  'popup=yes,width=1080,height=800,left=72,top=48,scrollbars=yes,resizable=yes';

function openQuotePublicPopup(url: string): Window | null {
  const w = window.open(url, '_blank', QUOTE_PUBLIC_POPUP_FEATURES);
  if (w) {
    try {
      w.opener = null;
      w.focus();
    } catch {
      /* ignore */
    }
  }
  return w;
}

function quotePublicLinkClick(e: React.MouseEvent<HTMLAnchorElement>, url: string) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  const w = openQuotePublicPopup(url);
  if (!w) {
    notifyZaptro(
      'warning',
      'Pop-up bloqueado',
      'Permita pop-ups para este site ou abra o link pelo menu do rato (novo separador).',
    );
  }
}

/** Orçamentos criados na página «Orçamentos» (calculadora) sem lead do Kanban — agrupados para persistência local. */
const STANDALONE_QUOTES_LEAD_ID = 'zaptro-orcamentos-rapidos';

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function formatScheduleLabel(value: string): string {
  if (!value.trim()) return '';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

const CALC_FIELD_LABEL: CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'rgba(168, 168, 168, 1)',
  lineHeight: 1.35,
};

const CALC_SECTION_TITLE: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'rgba(168, 168, 168, 1)',
  textTransform: 'uppercase',
};

function kanbanStorageKey(crmStorageId: string) {
  return `zaptro_crm_kanban_v3_${crmStorageId}`;
}

type LeadKanbanMeta = {
  clientName: string;
  phone?: string;
  origin?: string;
  destination?: string;
  clientLogoUrl?: string | null;
  assigneeAvatarUrl?: string | null;
};

function readLeadMetaMap(crmStorageId: string): Record<string, LeadKanbanMeta> {
  try {
    const raw = localStorage.getItem(kanbanStorageKey(crmStorageId));
    if (!raw) return {};
    const leads = JSON.parse(raw) as Array<{
      id: string;
      clientName?: string;
      phone?: string;
      origin?: string;
      destination?: string;
      clientLogoUrl?: string | null;
      assigneeAvatarUrl?: string | null;
    }>;
    const m: Record<string, LeadKanbanMeta> = {};
    for (const l of leads) {
      if (!l?.id) continue;
      m[l.id] = {
        clientName: (l.clientName || '').trim() || '—',
        phone: (l.phone || '').trim() || undefined,
        origin: (l.origin || '').trim() || undefined,
        destination: (l.destination || '').trim() || undefined,
        clientLogoUrl: l.clientLogoUrl ?? null,
        assigneeAvatarUrl: l.assigneeAvatarUrl ?? null,
      };
    }
    return m;
  } catch {
    return {};
  }
}

function clientAvatarUrl(leadId: string, explicit?: string | null): string {
  const u = explicit?.trim();
  if (u) return u;
  return `https://picsum.photos/seed/${encodeURIComponent(`zaptro-quote-client-${leadId}`)}/64/64`;
}

function internalAvatarUrl(quoteId: string, assigneeUrl?: string | null, sessionUrl?: string | null, issuerLogo?: string | null): string {
  const a = assigneeUrl?.trim();
  if (a) return a;
  const s = sessionUrl?.trim();
  if (s) return s;
  const i = issuerLogo?.trim();
  if (i) return i;
  return `https://picsum.photos/seed/${encodeURIComponent(`zaptro-quote-int-${quoteId}`)}/64/64`;
}

export const ZaptroQuotesListContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const { company } = useTenant();
  const { palette } = useZaptroTheme();
  const crmStorageId = profile?.company_id || 'local-demo';
  const leadFilter = searchParams.get('leadId');
  const openCalcFromUrl = searchParams.get('calc') === '1';
  const embedOverlay = searchParams.get('embed') === '1';
  const editQuoteIdParam = searchParams.get('quoteId');
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo?.trim() ||
    (leadFilter ? ZAPTRO_APP_ROUTES.leadProfile(leadFilter) : ZAPTRO_APP_ROUTES.QUOTES);
  const sessionAvatarSrc = useMemo(() => resolveSessionAvatarUrl(profile), [profile]);

  const [rows, setRows] = useState<FreightQuoteWithLead[]>([]);
  const [selectedQuoteDetail, setSelectedQuoteDetail] = useState<FreightQuoteWithLead | null>(null);
  const [leadMetaMap, setLeadMetaMap] = useState<Record<string, LeadKanbanMeta>>({});
  const [quotesUiMode, setQuotesUiMode] = useState<'kanban' | 'listas'>(() => {
    try {
      const v = sessionStorage.getItem(QUOTES_VISTA_KEY);
      return v === 'kanban' || v === 'listas' ? v : 'listas';
    } catch {
      return 'listas';
    }
  });

  const load = useCallback(() => {
    seedDemoQuotesIfEmpty(crmStorageId);
    setRows(readAllQuotesFlattened(crmStorageId));
    setLeadMetaMap(readLeadMetaMap(crmStorageId));
  }, [crmStorageId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      sessionStorage.setItem(QUOTES_VISTA_KEY, quotesUiMode);
    } catch {
      /* ignore */
    }
  }, [quotesUiMode]);

  useEffect(() => {
    const onUpd = () => load();
    window.addEventListener('zaptro-quotes-updated', onUpd);
    return () => window.removeEventListener('zaptro-quotes-updated', onUpd);
  }, [load]);

  const [quoteSearchText, setQuoteSearchText] = useState('');
  const [quoteSearchContact, setQuoteSearchContact] = useState('');
  const debouncedSearchText = useDebouncedValue(quoteSearchText, 280);
  const debouncedSearchContact = useDebouncedValue(quoteSearchContact, 280);

  const filtered = useMemo(() => {
    let list = leadFilter ? rows.filter((r) => r.leadId === leadFilter) : rows;
    const q1 = debouncedSearchText.trim().toLowerCase();
    if (q1) {
      list = list.filter((r) => {
        const client = (leadMetaMap[r.leadId]?.clientName || r.clientNameSnapshot || '').toLowerCase();
        const blob = `${r.id} ${r.token} ${client} ${quoteProductLabel(r)} ${r.origin || ''} ${r.destination || ''} ${r.notes || ''}`.toLowerCase();
        return blob.includes(q1);
      });
    }
    const q2 = debouncedSearchContact.trim().toLowerCase();
    if (q2) {
      list = list.filter((r) => {
        const notes = (r.notes || '').toLowerCase();
        const client = (leadMetaMap[r.leadId]?.clientName || r.clientNameSnapshot || '').toLowerCase();
        return notes.includes(q2) || client.includes(q2);
      });
    }
    return list;
  }, [rows, leadFilter, debouncedSearchText, debouncedSearchContact, leadMetaMap]);

  const tableListPag = useZaptroPaginatedList(
    filtered,
    10,
    `${quotesUiMode}-${leadFilter ?? ''}-${debouncedSearchText}-${debouncedSearchContact}`,
  );

  const quotesByStatus = useMemo(() => {
    const empty = (): Record<QuoteStatus, FreightQuoteWithLead[]> => ({
      pendente: [],
      enviado: [],
      visualizado: [],
      aprovado: [],
      recusado: [],
    });
    const m = empty();
    for (const q of filtered) {
      m[q.status].push(q);
    }
    return m;
  }, [filtered]);

  const stats = useMemo(() => {
    let totalVal = 0;
    let pipelineVal = 0;
    let approvedSum = 0;
    let approvedN = 0;
    for (const q of filtered) {
      const v = quoteMonetaryValue(q);
      totalVal += v;
      if (q.status !== 'recusado') pipelineVal += v;
      if (q.status === 'aprovado') {
        approvedSum += v;
        approvedN += 1;
      }
    }
    return {
      n: filtered.length,
      totalVal,
      pipelineVal,
      approvedSum,
      approvedN,
    };
  }, [filtered]);

  const [numericCalcOpen, setNumericCalcOpen] = useState(false);
  const [freightModalOpen, setFreightModalOpen] = useState(false);
  const [calcMode, setCalcMode] = useState<'freight' | 'storage'>('freight');
  const [calcKm, setCalcKm] = useState('420');
  const [calcWeight, setCalcWeight] = useState('14');
  const [calcRate, setCalcRate] = useState('2.75');
  const [calcBase, setCalcBase] = useState('420');
  const [calcExtras, setCalcExtras] = useState('0');
  const [storageExtras, setStorageExtras] = useState('0');
  const [storageM2, setStorageM2] = useState('120');
  const [storageDays, setStorageDays] = useState('30');
  const [storageRate, setStorageRate] = useState('0.85');
  const [custName, setCustName] = useState('');
  const [custDoc, setCustDoc] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [calcDescription, setCalcDescription] = useState('');
  const [calcOriginLocal, setCalcOriginLocal] = useState('');
  const [calcDestLocal, setCalcDestLocal] = useState('');
  const [calcPickupAt, setCalcPickupAt] = useState('');
  const [calcDeliveryAt, setCalcDeliveryAt] = useState('');
  const [calcArrivalAt, setCalcArrivalAt] = useState('');
  const [lastSavedQuoteUrl, setLastSavedQuoteUrl] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const applyLeadMetaToFreightForm = useCallback((meta: LeadKanbanMeta | undefined) => {
    if (!meta) return;
    if (meta.clientName) setCustName(meta.clientName);
    if (meta.phone) setCustPhone(meta.phone);
    if (meta.origin) setCalcOriginLocal(meta.origin);
    if (meta.destination) setCalcDestLocal(meta.destination);
  }, []);

  const applyQuoteToFreightForm = useCallback((q: FreightQuote) => {
    setCustName(q.clientNameSnapshot);
    setCalcDescription(q.productService || '');
    setCalcOriginLocal((q.origin || '').split(' · ')[0]?.trim() || q.origin || '');
    setCalcDestLocal((q.destination || '').split(' · ')[0]?.trim() || q.destination || '');
    const val = quoteMonetaryValue(q);
    setCalcBase(String(val));
    setCalcExtras('0');
    setCalcKm('0');
    setCalcWeight('0');
    setCalcRate('0');
    setCustDoc('');
    setCustPhone('');
    setLastSavedQuoteUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}${quotePublicPath(q.token)}`);
  }, []);

  const serviceScope = useMemo(() => readZaptroServiceScope(company), [company]);

  const closeFreightModal = useCallback(() => {
    setFreightModalOpen(false);
    setEditingQuoteId(null);
    if (embedOverlay) {
      navigate(returnTo, { replace: true });
    }
  }, [embedOverlay, navigate, returnTo]);

  useEffect(() => {
    if (!freightModalOpen || !leadFilter) return;
    applyLeadMetaToFreightForm(leadMetaMap[leadFilter]);
  }, [freightModalOpen, leadFilter, leadMetaMap, applyLeadMetaToFreightForm]);

  useEffect(() => {
    if (!openCalcFromUrl || !leadFilter) return;
    if (serviceScope === 'freight_only') setCalcMode('freight');
    if (serviceScope === 'storage_only') setCalcMode('storage');
    if (editQuoteIdParam) {
      const map = readQuotesMap(crmStorageId);
      const q = (map[leadFilter] || []).find((x) => x.id === editQuoteIdParam);
      if (q) {
        setEditingQuoteId(q.id);
        applyQuoteToFreightForm(q);
        setFreightModalOpen(true);
        return;
      }
      setEditingQuoteId(null);
    } else {
      setLastSavedQuoteUrl(null);
      setEditingQuoteId(null);
      applyLeadMetaToFreightForm(leadMetaMap[leadFilter]);
    }
    setFreightModalOpen(true);
  }, [
    openCalcFromUrl,
    leadFilter,
    leadMetaMap,
    serviceScope,
    applyLeadMetaToFreightForm,
    editQuoteIdParam,
    crmStorageId,
    applyQuoteToFreightForm,
  ]);
  const activeCalcMode = useMemo(
    () => zaptroEffectiveCalcMode(serviceScope, calcMode),
    [serviceScope, calcMode],
  );

  const suggestedFreight = useMemo(() => {
    const km = Math.max(0, parseFloat(String(calcKm).replace(',', '.')) || 0);
    const wt = Math.max(0, parseFloat(String(calcWeight).replace(',', '.')) || 0);
    const r = Math.max(0, parseFloat(String(calcRate).replace(',', '.')) || 0);
    const b = Math.max(0, parseFloat(String(calcBase).replace(',', '.')) || 0);
    const ex = Math.max(0, parseFloat(String(calcExtras).replace(',', '.')) || 0);
    const factor = 1 + Math.min(wt, 45) * 0.065;
    const raw = b + km * r * factor + ex;
    return Math.max(0, Math.round(raw));
  }, [calcKm, calcWeight, calcRate, calcBase, calcExtras]);

  const suggestedStorage = useMemo(() => {
    const m2 = Math.max(0, parseFloat(String(storageM2).replace(',', '.')) || 0);
    const days = Math.max(0, parseFloat(String(storageDays).replace(',', '.')) || 0);
    const rate = Math.max(0, parseFloat(String(storageRate).replace(',', '.')) || 0);
    const ex = Math.max(0, parseFloat(String(storageExtras).replace(',', '.')) || 0);
    return Math.max(0, Math.round(m2 * days * rate + ex));
  }, [storageM2, storageDays, storageRate, storageExtras]);

  const saveQuickQuote = useCallback(() => {
    const name = custName.trim();
    if (!name) {
      notifyZaptro('info', 'Cliente', 'Indica pelo menos o nome do cliente para guardar o orçamento.');
      return;
    }
    const mode = zaptroEffectiveCalcMode(readZaptroServiceScope(company), calcMode);
    const val = mode === 'freight' ? suggestedFreight : suggestedStorage;
    if (!val) {
      notifyZaptro('info', 'Valor', 'Ajusta os campos da calculadora para obter um valor antes de guardar.');
      return;
    }
    const branded = isZaptroBrandingEntitledByPlan(company);
    const primaryHex =
      branded && company?.primary_color && /^#[0-9A-Fa-f]{3,8}$/.test(company.primary_color.trim())
        ? company.primary_color.trim()
        : undefined;
    const now = new Date().toISOString();
    const targetLeadId = leadFilter || STANDALONE_QUOTES_LEAD_ID;
    const map = { ...readQuotesMap(crmStorageId) };
    const arr = [...(map[targetLeadId] || [])];

    if (editingQuoteId) {
      const idx = arr.findIndex((x) => x.id === editingQuoteId);
      if (idx >= 0) {
        const prev = arr[idx];
        const isFreight = mode === 'freight';
        const originFreight = [calcOriginLocal.trim(), calcKm.trim() ? `≈ ${calcKm} km` : '']
          .filter(Boolean)
          .join(' · ');
        const destFreight = [calcDestLocal.trim(), calcWeight.trim() ? `≈ ${calcWeight} t` : '']
          .filter(Boolean)
          .join(' · ');
        const updated: FreightQuote = {
          ...prev,
          clientNameSnapshot: name,
          origin: isFreight ? originFreight || prev.origin : `${storageM2} m²`,
          destination: isFreight ? destFreight || prev.destination : `${storageDays} dias`,
          productService: calcDescription.trim() || prev.productService,
          quoteValue: val,
          freightValue: val,
          deliveryDeadline: isFreight
            ? formatScheduleLabel(calcDeliveryAt) || formatScheduleLabel(calcArrivalAt) || prev.deliveryDeadline
            : `Até ${storageDays} dias`,
          notes: [
            calcDescription.trim() ? `Descrição: ${calcDescription.trim()}` : '',
            `Cliente: ${name}`,
            `Telefone: ${custPhone.trim() || '—'}`,
            `Actualizado em Orçamentos.`,
          ]
            .filter(Boolean)
            .join('\n'),
          updatedAt: now,
          history: [
            ...prev.history,
            {
              at: now,
              action: 'Orçamento actualizado',
              detail: `Por ${profile?.full_name || 'Equipa'}`,
            },
          ],
        };
        arr[idx] = updated;
        map[targetLeadId] = arr;
        writeQuotesMap(crmStorageId, map);
        setLastSavedQuoteUrl(`${window.location.origin}${quotePublicPath(updated.token)}`);
        setEditingQuoteId(null);
        try {
          window.dispatchEvent(new Event('zaptro-quotes-updated'));
        } catch {
          /* ignore */
        }
        load();
        closeFreightModal();
        notifyZaptro('success', 'Orçamento', 'Alterações guardadas. O link público mantém-se o mesmo.');
        return;
      }
    }

    const id = `qt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const token = `zt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    const isFreight = mode === 'freight';
    const originFreight = [calcOriginLocal.trim(), calcKm.trim() ? `≈ ${calcKm} km` : '']
      .filter(Boolean)
      .join(' · ');
    const destFreight = [calcDestLocal.trim(), calcWeight.trim() ? `≈ ${calcWeight} t` : '']
      .filter(Boolean)
      .join(' · ');
    const scheduleLines = [
      calcPickupAt.trim() ? `Saída / coleta: ${formatScheduleLabel(calcPickupAt)}` : '',
      calcDeliveryAt.trim() ? `Entrega prevista: ${formatScheduleLabel(calcDeliveryAt)}` : '',
      calcArrivalAt.trim() ? `Chegada: ${formatScheduleLabel(calcArrivalAt)}` : '',
    ].filter(Boolean);
    const notesParts = [
      calcDescription.trim() ? `Descrição: ${calcDescription.trim()}` : '',
      `Cliente: ${name}`,
      `Documento: ${custDoc.trim() || '—'}`,
      `Telefone: ${custPhone.trim() || '—'}`,
      ...scheduleLines,
      `Tipo: ${isFreight ? 'Frete' : 'Armazenagem'} · gerado em Orçamentos.`,
    ].filter(Boolean);
    const q: FreightQuote = {
      id,
      leadId: leadFilter || STANDALONE_QUOTES_LEAD_ID,
      token,
      clientNameSnapshot: name,
      origin: isFreight ? originFreight || '—' : `${storageM2} m²`,
      destination: isFreight ? destFreight || '—' : `${storageDays} dias`,
      productService: isFreight
        ? calcDescription.trim() || 'Frete rodoviário (calculadora)'
        : calcDescription.trim() || 'Armazenagem (calculadora)',
      quantity: isFreight ? `Taxa km R$ ${calcRate}` : `R$ ${storageRate}/m²·dia`,
      quoteValue: val,
      freightValue: val,
      deliveryDeadline: isFreight
        ? formatScheduleLabel(calcDeliveryAt) ||
          formatScheduleLabel(calcArrivalAt) ||
          'A combinar'
        : `Até ${storageDays} dias`,
      notes: notesParts.join('\n'),
      status: 'pendente',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          at: now,
          action: 'Orçamento criado (calculadora)',
          detail: `Por ${profile?.full_name || 'Equipa'} — link público disponível`,
        },
      ],
      issuerCompanyName: company?.name?.trim() || 'Transportadora',
      issuerLogoUrl: company?.logo_url?.trim() || null,
      issuerPdfBranded: branded,
      issuerPrimaryColor: primaryHex,
    };
    arr.unshift(q);
    map[targetLeadId] = arr;
    writeQuotesMap(crmStorageId, map);
    const publicUrl = `${window.location.origin}${quotePublicPath(token)}`;
    setLastSavedQuoteUrl(publicUrl);
    try {
      window.dispatchEvent(new Event('zaptro-quotes-updated'));
    } catch {
      /* ignore */
    }
    load();
    notifyZaptro('success', 'Orçamento guardado', 'O cliente pode abrir o link público para aprovar ou recusar.');
  }, [
    calcMode,
    company,
    suggestedFreight,
    suggestedStorage,
    custName,
    custPhone,
    custDoc,
    crmStorageId,
    profile?.full_name,
    load,
    calcKm,
    calcWeight,
    calcRate,
    calcDescription,
    calcOriginLocal,
    calcDestLocal,
    calcPickupAt,
    calcDeliveryAt,
    calcArrivalAt,
    leadFilter,
    storageM2,
    storageDays,
    storageRate,
    storageExtras,
    editingQuoteId,
    closeFreightModal,
  ]);

  const border = palette.sidebarBorder;
  const isDark = palette.mode === 'dark';
  const cellBg = isDark ? 'rgba(255,255,255,0.03)' : '#fff';
  const LIME = palette.lime;

  const showCalcModeTabs = serviceScope === 'freight_and_storage';
  const calcModalTitle = editingQuoteId
    ? 'Editar orçamento'
    : serviceScope === 'freight_only'
      ? 'Calcular frete'
      : serviceScope === 'storage_only'
        ? 'Calcular armazenagem'
        : 'Calcular frete e armazenagem';
  const calcModalSubtitle =
    serviceScope === 'freight_only'
      ? 'Preencha cliente, rota e horários; a calculadora estima o valor e gera o link público para aprovação.'
      : serviceScope === 'storage_only'
        ? 'Preencha cliente e descrição; a calculadora estima armazenagem e gera o link público.'
        : 'Cliente, locais e horários no topo; depois calcule frete ou armazenagem e guarde o link público.';
  const quoteEntryButtonLabel = 'Novo orçamento';
  const calcEntryButtonLabel = 'Calculadora';

  return (
    <>
    {!embedOverlay ? (
    <div className="zaptro-quotes-page">
      <div className="zaptro-quotes-page__head">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <button
            type="button"
            onClick={() =>
              navigate(
                zaptroAppOrLegacy(
                  location.pathname,
                  ZAPTRO_APP_ROUTES.CRM,
                  ZAPTRO_ROUTES.COMMERCIAL_CRM,
                ),
              )
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 14,
              border: `1px solid ${border}`,
              background: palette.searchBg,
              color: palette.text,
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={18} /> CRM
          </button>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                color: '#000',
              }}
            >
              Orçamentos
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              setLastSavedQuoteUrl(null);
              if (serviceScope === 'freight_only') setCalcMode('freight');
              if (serviceScope === 'storage_only') setCalcMode('storage');
              setFreightModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)',
              color: LIME,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
            title={quoteEntryButtonLabel}
          >
            <CircleDollarSign size={22} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => setNumericCalcOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: `1px solid ${border}`,
              background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
              color: palette.text,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: isDark ? '0 10px 26px rgba(0,0,0,0.35)' : '0 10px 26px rgba(15,23,42,0.10)',
              flexShrink: 0,
            }}
            title={calcEntryButtonLabel}
            aria-label={calcEntryButtonLabel}
          >
            <Calculator size={22} strokeWidth={2.2} />
          </button>
          {leadFilter ? (
            <button
              type="button"
              onClick={() =>
                navigate(
                  zaptroAppOrLegacy(
                    location.pathname,
                    ZAPTRO_APP_ROUTES.QUOTES,
                    ZAPTRO_ROUTES.COMMERCIAL_QUOTES,
                  ),
                )
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: 'transparent',
                color: palette.textMuted,
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Limpar filtro do lead
            </button>
          ) : null}
        </div>
      </div>

      <div className="zaptro-quotes-kpi-grid" style={{ width: '100%', marginBottom: 28, boxSizing: 'border-box' }}>
        {(
          [
            { k: 'ORÇAMENTOS', v: String(stats.n), sub: 'Linhas na vista actual', accent: true, icon: List },
            { k: 'VALOR TOTAL', v: formatBrl(stats.totalVal), sub: 'Soma de todos os estados', accent: false, icon: CircleDollarSign },
            { k: 'PIPELINE (≠ RECUSADO)', v: formatBrl(stats.pipelineVal), sub: 'Valor ainda relevante', accent: false, icon: ArrowRightLeft },
            { k: 'APROVADOS', v: `${stats.approvedN} · ${formatBrl(stats.approvedSum)}`, sub: 'Fechados pelo cliente', accent: false, icon: CheckCircle2 },
          ] as const
        ).map((x) => (
          <ZaptroKpiMetricCard
            key={x.k}
            icon={x.icon}
            title={x.k}
            value={x.v}
            subtitle={x.sub}
            accentBorder={x.accent}
            titleCaps
          />
        ))}
      </div>

      <style>{`
        .zaptro-quotes-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1100px) {
          .zaptro-quotes-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 560px) {
          .zaptro-quotes-kpi-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
      </div>

      <div className="zaptro-quotes-page__inner">
      <div
        className="zaptro-quotes-toolbar-card"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: 18,
          border: `1px solid ${border}`,
          backgroundColor: cellBg,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'stretch',
            gap: 14,
            width: '100%',
          }}
        >
          <label
            style={{
              flex: '1 1 260px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: palette.textMuted,
            }}
          >
            Pesquisar orçamentos
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <Search size={18} color={palette.textMuted} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                className="zaptro-quotes-filter-input zaptro-quotes-filter-input--search"
                value={quoteSearchText}
                onChange={(e) => setQuoteSearchText(e.target.value)}
                placeholder="Cliente, ID, token, rota, serviço…"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: 16,
                  border: `1px solid ${border}`,
                  background: palette.searchBg,
                  color: palette.text,
                  fontWeight: 600,
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              />
            </span>
          </label>
          <label
            style={{
              flex: '1 1 220px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: palette.textMuted,
            }}
          >
            Telefone / notas
            <input
              className="zaptro-quotes-filter-input"
              value={quoteSearchContact}
              onChange={(e) => setQuoteSearchContact(e.target.value)}
              placeholder="Filtrar por telefone ou texto nas notas"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '0 14px',
                borderRadius: 16,
                border: `1px solid ${border}`,
                background: palette.searchBg,
                color: palette.text,
                fontWeight: 600,
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </label>
          <div
            style={{
              flex: '1 1 200px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setQuotesUiMode('kanban')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: quotesUiMode === 'kanban' ? '1px solid #000' : `1px solid ${border}`,
                  backgroundColor: quotesUiMode === 'kanban' ? '#000' : isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                  color: quotesUiMode === 'kanban' ? LIME : palette.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Sparkles size={14} /> Kanban
              </button>
              <button
                type="button"
                title="Vista em tabela com todas as colunas"
                onClick={() => setQuotesUiMode('listas')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: quotesUiMode === 'listas' ? `1px solid ${LIME}` : `1px solid ${border}`,
                  backgroundColor: quotesUiMode === 'listas' ? 'rgba(217,255,0,0.14)' : isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                  color: palette.text,
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <List size={14} /> Listas
              </button>
            </div>
            <button
              type="button"
              onClick={() => load()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 14,
                border: `1px solid ${border}`,
                background: palette.searchBg,
                color: palette.text,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <RefreshCw size={16} /> Atualizar
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 20,
            border: `1px dashed ${border}`,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
            color: palette.textMuted,
            fontWeight: 700,
            fontSize: 16,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            boxSizing: 'border-box',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, width: '100%', maxWidth: 640, textAlign: 'left' }}>
            <FileSpreadsheet size={40} color={palette.lime} style={{ flexShrink: 0, opacity: 0.9, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.2, color: palette.text }}>
                Nenhum orçamento encontrado{leadFilter ? ' para este lead' : ''}.
              </p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.55, color: palette.textMuted }}>
                Cria orçamentos a partir de um lead no <strong style={{ color: palette.text }}>CRM (Kanban)</strong>. Quando existir
                linha na tabela, usa «Página do cliente» para o link que o contacto abre no telemóvel — é aí que responde ao orçamento,
                não nesta página (vista interna).
              </p>
            </div>
          </div>
        </div>
      ) : quotesUiMode === 'kanban' ? (
        <div style={{ overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))',
              columnGap: 14,
              rowGap: 11,
              minWidth: 960,
              paddingTop: 4,
              paddingBottom: 8,
              alignItems: 'stretch',
            }}
          >
            {QUOTE_KANBAN_COLUMNS.map((status) => {
              const list = quotesByStatus[status];
              return (
                <div key={status} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 10 }}>
                  <div
                    style={{
                      padding: '12px 12px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f4',
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: isDark ? '#fafafa' : '#000000',
                    }}
                  >
                    {QUOTE_STATUS_LABEL[status]} · {list.length}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 40 }}>
                    {list.map((q) => {
                      const meta = leadMetaMap[q.leadId];
                      const client = meta?.clientName || q.clientNameSnapshot || '—';
                      const clientPic = clientAvatarUrl(q.leadId, meta?.clientLogoUrl);
                      const internalPic = internalAvatarUrl(
                        q.id,
                        meta?.assigneeAvatarUrl,
                        sessionAvatarSrc,
                        q.issuerLogoUrl
                      );
                      const publicUrl = `${window.location.origin}${quotePublicPath(q.token)}`;
                      const prodLine = quoteProductLabel(q);
                      const avatarBox: React.CSSProperties = {
                        width: 28,
                        height: 28,
                        borderRadius: 9,
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: `1px solid ${border}`,
                        backgroundColor: isDark ? '#0a0a0a' : '#f4f4f4',
                        display: 'block',
                      };
                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 16,
                            border: `1px solid ${border}`,
                            backgroundColor: cellBg,
                            boxSizing: 'border-box',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                flexShrink: 0,
                                width: 28,
                              }}
                              aria-hidden
                            >
                              <img
                                src={clientPic}
                                alt=""
                                title="Cliente"
                                loading="lazy"
                                decoding="async"
                                style={{ ...avatarBox, position: 'relative', zIndex: 2 }}
                              />
                              <img
                                src={internalPic}
                                alt=""
                                title="Responsável / equipa (Kanban ou sessão)"
                                loading="lazy"
                                decoding="async"
                                style={{ ...avatarBox, marginTop: -9, position: 'relative', zIndex: 1 }}
                              />
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: palette.text, lineHeight: 1.3, minWidth: 0 }}>
                              {client}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: palette.textMuted, marginBottom: 8 }}>
                            {formatBrl(quoteMonetaryValue(q))} · {prodLine.length > 42 ? `${prodLine.slice(0, 40)}…` : prodLine}
                          </div>
                          <a
                            href={publicUrl}
                            rel="noopener noreferrer"
                            title="Abre a página do cliente numa janela pop-up"
                            onClick={(e) => quotePublicLinkClick(e, publicUrl)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontWeight: 700,
                              fontSize: 11,
                              color: palette.text,
                              cursor: 'pointer',
                            }}
                          >
                            Abrir página pública <ExternalLink size={12} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
        <div style={{ overflowX: 'auto', borderRadius: 18, border: `1px solid ${border}`, backgroundColor: cellBg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 720 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}`, textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cliente</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Valor total</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Serviço / Detalhe</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Criado em</th>
                <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: palette.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {tableListPag.pageItems.map((q) => {
                const meta = leadMetaMap[q.leadId];
                const client = meta?.clientName || q.clientNameSnapshot || '—';
                const clientPic = clientAvatarUrl(q.leadId, meta?.clientLogoUrl);
                const internalPic = internalAvatarUrl(
                  q.id,
                  meta?.assigneeAvatarUrl,
                  sessionAvatarSrc,
                  q.issuerLogoUrl
                );
                const publicUrl = `${window.location.origin}${quotePublicPath(q.token)}`;
                const avatarBox: React.CSSProperties = {
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: `1px solid ${border}`,
                  backgroundColor: isDark ? '#0a0a0a' : '#f4f4f4',
                  display: 'block',
                };
                return (
                  <tr key={q.id} style={{ borderBottom: `1px solid ${border}`, cursor: 'pointer' }} onClick={() => setSelectedQuoteDetail(q)}>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: palette.text, verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexShrink: 0,
                            gap: -12, // Overlap side-by-side
                          }}
                          aria-hidden
                        >
                          <img
                            src={clientPic}
                            alt=""
                            title="Cliente"
                            loading="lazy"
                            decoding="async"
                            style={{ ...avatarBox, position: 'relative', zIndex: 2 }}
                          />
                          <img
                            src={internalPic}
                            alt=""
                            title="Responsável / equipa"
                            loading="lazy"
                            decoding="async"
                            style={{ ...avatarBox, marginLeft: -12, position: 'relative', zIndex: 1, border: `2px solid ${isDark ? '#000' : '#fff'}` }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div>{client}</div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: palette.textMuted, marginTop: 2 }}>Lead: {q.leadId}</div>
                        </div>
                      </div>
                    </td>
                     <td style={{ padding: '12px 14px', fontWeight: 700, color: palette.text }}>{formatBrl(quoteMonetaryValue(q))}</td>
                    <td style={{ padding: '12px 14px', verticalAlign: 'middle' }}>
                      <span role="status" style={quoteStatusBadgeStyle(q.status, isDark, LIME)}>
                        {QUOTE_STATUS_LABEL[q.status]}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: 12, color: palette.text, maxWidth: 220 }}>
                      {quoteProductLabel(q)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 500, fontSize: 12, color: palette.textMuted, whiteSpace: 'nowrap' }}>
                      {new Date(q.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        type="button"
                        title="Abrir página pública"
                        aria-label="Abrir página pública"
                        onClick={(e) => {
                          e.stopPropagation();
                          quotePublicLinkClick(e as unknown as React.MouseEvent, publicUrl);
                        }}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 14,
                          border: `1px solid ${border}`,
                          backgroundColor: 'rgba(217, 255, 0, 0.18)',
                          color: '#0f172a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={18} strokeWidth={2.2} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ZaptroListPagination
          currentPage={tableListPag.currentPage}
          totalPages={tableListPag.totalPages}
          totalItems={tableListPag.totalItems}
          itemsPerPage={tableListPag.itemsPerPage}
          onPageChange={tableListPag.setCurrentPage}
          onItemsPerPageChange={tableListPag.setItemsPerPage}
        />
        </>
      )}
      </div>
    </div>
    ) : null}

      {freightModalOpen ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: embedOverlay ? 10000 : 6000,
            backgroundColor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={closeFreightModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="zaptro-freight-calc-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 1180,
              maxHeight: '90vh',
              overflow: 'hidden',
              borderRadius: 22,
              padding: 0,
              backgroundColor: isDark ? 'rgba(17,17,17,0.98)' : '#fff',
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.55)' : '0 24px 64px rgba(15,23,42,0.14)',
              color: palette.text,
              boxSizing: 'border-box',
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginTop: 0,
                marginBottom: 0,
                minHeight: 58,
                height: 58,
                padding: '0 18px',
                borderBottom: `1px solid ${border}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h2
                  id="zaptro-freight-calc-title"
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.2,
                    color: isDark ? palette.text : '#000000',
                  }}
                >
                  {calcModalTitle}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 500, color: 'rgba(168, 168, 168, 1)', lineHeight: 1.45 }}>
                  {calcModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={closeFreightModal}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
              >
                <X size={22} color={palette.textMuted} />
              </button>
            </div>

            <div className="zaptro-quote-modal-landscape">
              <div className="zaptro-quote-modal-landscape__left">
                <div style={{ marginBottom: 16, padding: '16px 18px', borderBottom: `1px solid ${border}` }}>
                  <p style={CALC_SECTION_TITLE}>Dados do cliente</p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 10,
                    }}
                  >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                  <span style={CALC_FIELD_LABEL}>Nome completo *</span>
                  <input
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    placeholder="Ex.: João Ferreira — Central Logística"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: palette.searchBg,
                      color: palette.text,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={CALC_FIELD_LABEL}>Documento (CPF / CNPJ)</span>
                  <input
                    value={custDoc}
                    onChange={(e) => setCustDoc(e.target.value)}
                    placeholder="000.000.000-00 ou CNPJ"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: palette.searchBg,
                      color: palette.text,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={CALC_FIELD_LABEL}>Telefone / WhatsApp</span>
                  <input
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="5511999999999"
                    inputMode="tel"
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: `1px solid ${border}`,
                      background: palette.searchBg,
                      color: palette.text,
                      fontWeight: 600,
                      fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              </div>
                </div>
              </div>

              <div className="zaptro-quote-modal-landscape__left">
                {activeCalcMode === 'freight' ? (
                  <div style={{ padding: '0 18px 16px' }}>
                    <p style={CALC_SECTION_TITLE}>Descrição e rota</p>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                      <span style={CALC_FIELD_LABEL}>Descrição da operação</span>
                      <textarea
                        value={calcDescription}
                        onChange={(e) => setCalcDescription(e.target.value)}
                        placeholder="Ex.: Coleta de 3 volumes, carga frágil, necessita ajudante na descarga"
                        rows={2}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: `1px solid ${border}`,
                          background: palette.searchBg,
                          color: palette.text,
                          fontWeight: 600,
                          fontSize: 13,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: 56,
                        }}
                      />
                    </label>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={CALC_FIELD_LABEL}>Local de saída</span>
                    <input
                      value={calcOriginLocal}
                      onChange={(e) => setCalcOriginLocal(e.target.value)}
                      placeholder="Ex.: Av. Paulista, 1200 — São Paulo"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: palette.searchBg,
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={CALC_FIELD_LABEL}>Local de entrega</span>
                    <input
                      value={calcDestLocal}
                      onChange={(e) => setCalcDestLocal(e.target.value)}
                      placeholder="Ex.: Guarulhos — CD cliente"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: palette.searchBg,
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 10,
                  }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={CALC_FIELD_LABEL}>Horário de saída / coleta</span>
                    <input
                      type="datetime-local"
                      value={calcPickupAt}
                      onChange={(e) => setCalcPickupAt(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: palette.searchBg,
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={CALC_FIELD_LABEL}>Horário previsto de entrega</span>
                    <input
                      type="datetime-local"
                      value={calcDeliveryAt}
                      onChange={(e) => setCalcDeliveryAt(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: palette.searchBg,
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={CALC_FIELD_LABEL}>Chegada na entrega</span>
                    <input
                      type="datetime-local"
                      value={calcArrivalAt}
                      onChange={(e) => setCalcArrivalAt(e.target.value)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: palette.searchBg,
                        color: palette.text,
                        fontWeight: 600,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                </div>
                  </div>
                ) : (
                  <div style={{ padding: '0 18px 16px' }}>
                    <p style={CALC_SECTION_TITLE}>Descrição</p>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={CALC_FIELD_LABEL}>Descrição da armazenagem</span>
                      <textarea
                        value={calcDescription}
                        onChange={(e) => setCalcDescription(e.target.value)}
                        placeholder="Ex.: Paletes em área refrigerada, acesso diário"
                        rows={2}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 12,
                          border: `1px solid ${border}`,
                          background: palette.searchBg,
                          color: palette.text,
                          fontWeight: 600,
                          fontSize: 13,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </label>
                  </div>
                )}

                {showCalcModeTabs ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 12, padding: '0 18px' }}>
                <button
                  type="button"
                  onClick={() => setCalcMode('freight')}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: calcMode === 'freight' ? '1px solid #000' : `1px solid ${border}`,
                    backgroundColor: calcMode === 'freight' ? '#000' : 'transparent',
                    color: calcMode === 'freight' ? LIME : palette.textMuted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Truck size={18} /> Frete
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('storage')}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: calcMode === 'storage' ? '1px solid #000' : `1px solid ${border}`,
                    backgroundColor: calcMode === 'storage' ? '#000' : 'transparent',
                    color: calcMode === 'storage' ? LIME : palette.textMuted,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Warehouse size={18} /> Armazenagem
                </button>
              </div>
            ) : null}

              </div>

              <div className="zaptro-quote-modal-landscape__right">
                <div style={{ padding: 18 }}>
                  <div className="zaptro-quote-calc-layout">
              <div className="zaptro-quote-calc-form">
                <p style={{ ...CALC_SECTION_TITLE, marginTop: 0 }}>
                  {activeCalcMode === 'freight' ? 'Parâmetros do frete' : 'Parâmetros da armazenagem'}
                </p>
                {activeCalcMode === 'freight' ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {(
                      [
                        { val: calcKm, set: setCalcKm, lab: 'Distância (km)' },
                        { val: calcWeight, set: setCalcWeight, lab: 'Peso (t)' },
                        { val: calcRate, set: setCalcRate, lab: 'Taxa por km (R$)' },
                        { val: calcBase, set: setCalcBase, lab: 'Taxa fixa / pedágio (R$)' },
                        { val: calcExtras, set: setCalcExtras, lab: 'Extras (R$) — calculadora' },
                      ] as const
                    ).map(({ val, set, lab }) => (
                      <label
                        key={lab}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <span style={CALC_FIELD_LABEL}>{lab}</span>
                        <input
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          inputMode="decimal"
                          style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: `1px solid ${border}`,
                            background: palette.searchBg,
                            color: palette.text,
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: 'inherit',
                          }}
                        />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    {(
                      [
                        { val: storageM2, set: setStorageM2, lab: 'Área (m²)' },
                        { val: storageDays, set: setStorageDays, lab: 'Dias' },
                        { val: storageRate, set: setStorageRate, lab: 'R$ / m² · dia' },
                        { val: storageExtras, set: setStorageExtras, lab: 'Extras (R$) — calculadora' },
                      ] as const
                    ).map(({ val, set, lab }) => (
                      <label
                        key={lab}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <span style={CALC_FIELD_LABEL}>{lab}</span>
                        <input
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          inputMode="decimal"
                          style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: `1px solid ${border}`,
                            background: palette.searchBg,
                            color: palette.text,
                            fontWeight: 700,
                            fontSize: 13,
                            fontFamily: 'inherit',
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 14,
                    marginBottom: 0,
                    backgroundColor: isDark ? 'rgba(217,255,0,0.08)' : 'rgba(217,255,0,0.16)',
                    border: `1px solid ${isDark ? 'rgba(217,255,0,0.22)' : 'rgba(0,0,0,0.06)'}`,
                  }}
                >
                  <div style={{ ...CALC_SECTION_TITLE, marginBottom: 4 }}>Valor estimado</div>
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      marginTop: 4,
                      color: palette.text,
                    }}
                  >
                    {formatBrl(activeCalcMode === 'freight' ? suggestedFreight : suggestedStorage)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        fontWeight: 500,
                        color: 'rgba(168, 168, 168, 1)',
                        lineHeight: 1.4,
                        flex: '1 1 240px',
                      }}
                    >
                      Abra a calculadora para somar (+/−) e aplicar o total em Extras.
                    </p>
                    <button
                      type="button"
                      onClick={() => setNumericCalcOpen(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 12,
                        border: `1px solid ${border}`,
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                        color: palette.text,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Calculator size={16} /> Abrir calculadora
                    </button>
                  </div>
                </div>
              </div>
                  </div>
                </div>

            <style>{`
              .zaptro-quote-modal-landscape{
                display:grid;
                grid-template-columns: minmax(0, 1fr) 360px;
                height: calc(90vh - 58px);
              }
              .zaptro-quote-modal-landscape__left{
                overflow: auto;
              }
              .zaptro-quote-modal-landscape__right{
                overflow: auto;
                border-left: 1px solid ${border};
                background: ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.02)'};
              }
              @media (max-width: 1020px){
                .zaptro-quote-modal-landscape{
                  grid-template-columns: minmax(0, 1fr);
                  height: calc(90vh - 58px);
                }
                .zaptro-quote-modal-landscape__right{
                  border-left: none;
                  border-top: 1px solid ${border};
                }
              }
              .zaptro-quote-calc-layout {
                display: flex;
                flex-direction: column;
                gap: 16px;
                align-items: start;
                margin-top: 0;
                margin-bottom: 16px;
              }
              .zaptro-quote-calc-form {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
            `}</style>

            {lastSavedQuoteUrl ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f4f4f4',
                }}
              >
                <div style={{ ...CALC_SECTION_TITLE, marginBottom: 6 }}>Link para o cliente</div>
                <a href={lastSavedQuoteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: palette.text, wordBreak: 'break-all' }}>
                  {lastSavedQuoteUrl}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(lastSavedQuoteUrl).catch(() => {});
                    notifyZaptro('success', 'Link', 'URL do orçamento copiada.');
                  }}
                  style={{
                    marginTop: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#000',
                    color: LIME,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Copy size={14} /> Copiar link
                </button>
              </div>
            ) : null}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={closeFreightModal}
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: palette.textMuted,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard
                    ?.writeText(String(activeCalcMode === 'freight' ? suggestedFreight : suggestedStorage))
                    .catch(() => {});
                  notifyZaptro('success', 'Valor', 'Montante copiado.');
                }}
                style={{
                  padding: '12px 18px',
                  borderRadius: 14,
                  border: `1px solid ${border}`,
                  background: palette.searchBg,
                  color: palette.text,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Copiar valor
              </button>
              <button
                type="button"
                onClick={saveQuickQuote}
                style={{
                  padding: '12px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: '#000',
                  color: LIME,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Guardar orçamento
              </button>
            </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {numericCalcOpen ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 7000,
            backgroundColor: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setNumericCalcOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Calculadora"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 22,
              overflow: 'hidden',
              backgroundColor: isDark ? 'rgba(17,17,17,0.98)' : '#fff',
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.55)' : '0 24px 64px rgba(15,23,42,0.14)',
              color: palette.text,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderBottom: `1px solid ${border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <span
                  aria-hidden
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 14,
                    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: palette.text,
                  }}
                >
                  <Calculator size={18} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em' }}>Calculadora</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: palette.textMuted }}>
                    Aplicar em Extras ({activeCalcMode === 'freight' ? 'frete' : 'armazenagem'})
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setNumericCalcOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color={palette.textMuted} />
              </button>
            </div>
            <div style={{ padding: 14 }}>
              <ZaptroNumericCalculator
                title=""
                hint="Digite números, use + e −, depois =."
                applyLabel={activeCalcMode === 'freight' ? 'Aplicar aos extras (frete)' : 'Aplicar aos extras (armaz.)'}
                onApply={(value) => {
                  const rounded = Math.max(0, Math.round(value));
                  if (activeCalcMode === 'freight') {
                    setCalcExtras(String(rounded));
                  } else {
                    setStorageExtras(String(rounded));
                  }
                  notifyZaptro('success', 'Calculadora', `R$ ${rounded.toLocaleString('pt-BR')} aplicado aos extras.`);
                  setNumericCalcOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {!embedOverlay && selectedQuoteDetail ? (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 6000,
            backgroundColor: 'rgba(15,23,42,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            boxSizing: 'border-box',
          }}
          onClick={() => setSelectedQuoteDetail(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 700,
              borderRadius: 28,
              padding: 32,
              backgroundColor: isDark ? 'rgba(17,17,17,0.98)' : '#fff',
              border: `1px solid ${border}`,
              boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.55)' : '0 24px 64px rgba(15,23,42,0.14)',
              color: palette.text,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Detalhes do Orçamento
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 14, color: palette.textMuted, fontWeight: 600 }}>
                  ID: {selectedQuoteDetail.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteDetail(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4 }}
              >
                <X size={24} color={palette.textMuted} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>CLIENTE</label>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{leadMetaMap[selectedQuoteDetail.leadId]?.clientName || selectedQuoteDetail.clientNameSnapshot || '—'}</p>
               </div>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>ESTADO</label>
                  <span style={quoteStatusBadgeStyle(selectedQuoteDetail.status, isDark, LIME)}>{QUOTE_STATUS_LABEL[selectedQuoteDetail.status]}</span>
               </div>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>SERVIÇO</label>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{selectedQuoteDetail.productService}</p>
               </div>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>ORIGEM E DESTINO</label>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{selectedQuoteDetail.origin || '—'} → {selectedQuoteDetail.destination || '—'}</p>
               </div>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>QUANTIDADE / DETALHE</label>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{selectedQuoteDetail.quantity}</p>
               </div>
               <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>VALOR</label>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isDark ? palette.text : '#000000' }}>
                    {formatBrl(quoteMonetaryValue(selectedQuoteDetail))}
                  </p>
               </div>
               <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: palette.textMuted, display: 'block', marginBottom: 6 }}>NOTAS / DESCRIÇÃO</label>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: palette.textMuted, whiteSpace: 'pre-wrap' }}>{selectedQuoteDetail.notes || 'Sem observações.'}</p>
               </div>
            </div>

            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
               <a
                  href={`${window.location.origin}${quotePublicPath(selectedQuoteDetail.token)}`}
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); quotePublicLinkClick(e, `${window.location.origin}${quotePublicPath(selectedQuoteDetail.token)}`); }}
                  style={{
                     display: 'inline-flex',
                     alignItems: 'center',
                     gap: 8,
                     padding: '12px 24px',
                     borderRadius: 14,
                     backgroundColor: 'rgba(217, 255, 0, 0.14)',
                     color: '#000',
                     border: '1px solid rgba(217, 255, 0, 1)',
                     fontWeight: 700,
                     fontSize: 13,
                     cursor: 'pointer',
                     textDecoration: 'none',
                  }}
               >
                  Ver Página Pública <ExternalLink size={16} />
               </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const ZaptroQuotesList: React.FC = () => (
  <ZaptroLayout contentFullWidth>
    <ZaptroQuotesListContent />
  </ZaptroLayout>
);

export default ZaptroQuotesList;
