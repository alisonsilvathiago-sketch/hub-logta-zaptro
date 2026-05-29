import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Edit2, Trash2, User, Truck, Phone, Save, Loader2, RefreshCw, X, Navigation, Filter, Zap } from 'lucide-react';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { useAuth } from '../context/AuthContext';
import { useZaptroTheme, type ZaptroThemePalette } from '../context/ZaptroThemeContext';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { toastLoading, toastDismiss } from '../lib/toast';
import { ZAPTRO_SHADOW } from '../constants/zaptroShadows';
import {
  hideZaptroDemoDriverId,
  isZaptroDemoDriverId,
  isZaptroDriversDemoEnabled,
  readHiddenZaptroDemoDriverIds,
  resetHiddenZaptroDemoDrivers,
  ZAPTRO_DEMO_DRIVERS,
} from '../constants/zaptroDriversDemo';
import { isZaptroPreviewDataEnabled } from '../lib/zaptroPreviewMode';
import { zaptroAppOrLegacy, ZAPTRO_APP_ROUTES } from '../app/zaptroAppRoutes';
import { ZAPTRO_ROUTES } from '../constants/zaptroRoutes';
import { extractPlateFromVehicleText, vehicleTextContainsPlate } from '../utils/zaptroDriverVehicle';
import ZaptroKpiMetricCard from '../components/Zaptro/ZaptroKpiMetricCard';
import { ZaptroFleetDriversNav } from '../components/Zaptro/ZaptroFleetDriversNav';
import { ZaptroFleetStatsRow } from '../components/Zaptro/ZaptroFleetStatsRow';
import { ZaptroDriverRegisterModal } from '../components/Zaptro/ZaptroDriverRegisterModal';
import { ZaptroListImportToolbar } from '../components/Zaptro/ZaptroListImportToolbar';
import { exportToExcel } from '../lib/exportToExcel';
import { downloadCsvTemplate } from '../lib/downloadCsvTemplate';
import {
  DRIVER_CSV_TEMPLATE_EXAMPLE,
  DRIVER_CSV_TEMPLATE_HEADERS,
  importDriversCsvRows,
  parseDriversCsv,
} from '../lib/zaptroDriversImport';
function buildStyles(p: ZaptroThemePalette): Record<string, React.CSSProperties> {
  const d = p.mode === 'dark';
  const border = p.sidebarBorder;
  const surface = d ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const surface2 = d ? 'rgba(255,255,255,0.06)' : p.searchBg;
  const soft = d ? 'rgba(255,255,255,0.06)' : '#f4f4f4';

  return {
    headerRow: { display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: d ? 'rgba(217,255,0,0.12)' : '#ebebeb',
      border: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerText: { flex: '1 1 240px', minWidth: 0 },
    title: { fontSize: 30, fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.02em' },
    subtitle: {
      margin: 0,
      fontSize: 11,
      color: 'rgba(156, 156, 156, 1)',
      fontWeight: 500,
      lineHeight: 1.55,
      width: '100%',
      maxWidth: 720,
    },
    code: { fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: p.text },

    noTenantBanner: {
      marginBottom: 22,
      padding: '14px 18px',
      borderRadius: 1,
      border: `1px solid ${d ? 'rgba(250,204,21,0.35)' : '#FDE68A'}`,
      backgroundColor: d ? 'rgba(66,32,6,0.45)' : '#FFFBEB',
      fontSize: 11,
      fontWeight: 600,
      color: d ? '#fde68a' : '#92400E',
      lineHeight: 1.5,
      width: '100%',
      boxSizing: 'border-box',
    },

    mainLayout: { display: 'flex', gap: 32, alignItems: 'flex-start' },
    formCard: {
      width: 380,
      maxWidth: '100%',
      boxSizing: 'border-box',
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: 22,
      padding: 28,
      height: 'fit-content',
      position: 'sticky',
      top: 20,
      boxShadow: d ? 'none' : ZAPTRO_SHADOW.xs,
    },
    cardTitle: { fontSize: 17, fontWeight: 700, color: p.text, marginBottom: 22, letterSpacing: '-0.3px' },
    form: { display: 'flex', flexDirection: 'column', gap: 18 },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
    label: { fontSize: 10, fontWeight: 700, color: p.text, letterSpacing: '0.12em' },
    input: {
      padding: '14px 16px',
      borderRadius: 14,
      border: `1px solid ${border}`,
      outline: 'none',
      fontSize: 14,
      fontWeight: 600,
      color: p.text,
      backgroundColor: surface2,
      fontFamily: 'inherit',
      boxSizing: 'border-box',
    },
    formActions: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 },
    cancelBtn: {
      padding: 14,
      backgroundColor: 'transparent',
      border: `1px solid ${border}`,
      borderRadius: 14,
      fontWeight: 600,
      color: p.text,
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    saveBtn: {
      padding: 16,
      backgroundColor: p.lime,
      color: '#000000',
      border: 'none',
      borderRadius: 16,
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontFamily: 'inherit',
    },

    listSection: { flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 },
    toolbar: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
    toolbarFilters: { display: 'flex', flex: '1 1 320px', gap: 10, flexWrap: 'wrap', minWidth: 0 },
    search: {
      flex: '1 1 200px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 40,
      minHeight: 40,
      maxHeight: 40,
      backgroundColor: surface2,
      padding: '0 14px',
      borderRadius: 18,
      border: `1px solid ${border}`,
      minWidth: 0,
      boxSizing: 'border-box',
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      fontSize: 12,
      fontWeight: 600,
      width: '100%',
      minWidth: 0,
      color: 'rgba(46, 46, 46, 1)',
      backgroundColor: 'transparent',
      fontFamily: 'inherit',
      padding: 0,
      margin: 0,
      lineHeight: 1.2,
    },
    refreshBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      border: `1px solid ${border}`,
      backgroundColor: surface2,
      color: p.text,
      padding: '0 14px',
      borderRadius: 18,
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      height: 40,
      minHeight: 40,
      maxHeight: 40,
      boxSizing: 'border-box',
      fontFamily: 'inherit',
    },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 },
    card: {
      backgroundColor: surface,
      border: `1px solid ${border}`,
      borderRadius: 22,
      padding: 22,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      boxShadow: d ? 'none' : ZAPTRO_SHADOW.sm,
    },
    cardHeader: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: d ? 'rgba(217,255,0,0.14)' : '#EEFCEF',
      border: `1px solid ${d ? 'rgba(217,255,0,0.25)' : border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    driverName: { fontSize: 16, fontWeight: 700, color: p.text, margin: '0 0 4px 0', letterSpacing: '-0.02em' },
    statusBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: p.textMuted },
    statusDot: { width: 6, height: 6, borderRadius: '50%' },
    actions: { display: 'flex', gap: 6 },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: 11,
      border: `1px solid ${border}`,
      backgroundColor: surface2,
      color: p.textMuted,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },

    cardBody: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, paddingLeft: 62 },
    infoRow: { display: 'flex', alignItems: 'center', gap: 8 },
    infoText: { fontSize: 13, fontWeight: 700, color: p.textMuted },
    infoPhone: { fontSize: 13, fontWeight: 800, color: 'rgba(54, 54, 54, 1)' },

    cardFooter: {
      borderTop: `1px solid ${border}`,
      paddingTop: 14,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 62,
    },
    footerLabel: { fontSize: 9, fontWeight: 700, color: p.textMuted, letterSpacing: '0.02em' },
    waIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: '#000000',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      padding: 0,
      fontFamily: 'inherit',
      transition: 'background 0.15s ease, transform 0.15s ease',
    },

    loadingState: { padding: 80, textAlign: 'center' },
    emptyList: {
      padding: '44px 22px',
      textAlign: 'center',
      backgroundColor: soft,
      borderRadius: 20,
      border: `1px dashed ${border}`,
    },
    emptyTitle: { margin: 0, fontWeight: 700, color: p.text, fontSize: 16 },
    emptySub: { margin: '10px 0 0', color: p.textMuted, fontSize: 14, fontWeight: 600, lineHeight: 1.5 },

    deleteOverlay: {
      position: 'fixed',
      inset: 0,
      zIndex: 200000,
      backgroundColor: d ? 'rgba(0,0,0,0.65)' : 'rgba(15,23,42,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      boxSizing: 'border-box',
    },
    deleteModalCard: {
      width: 'min(400px, 100%)',
      borderRadius: 22,
      padding: '28px 24px 22px',
      boxSizing: 'border-box',
      position: 'relative',
      boxShadow: d ? '0 24px 80px rgba(0,0,0,0.5)' : ZAPTRO_SHADOW.lg,
      border: `1px solid ${border}`,
      backgroundColor: surface,
    },
    deleteModalClose: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 40,
      height: 40,
      borderRadius: 12,
      border: `1px solid ${border}`,
      backgroundColor: surface2,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    deleteModalIconWrap: {
      width: 72,
      height: 72,
      margin: '0 auto 16px',
      borderRadius: '50%',
      border: `1px solid ${border}`,
      backgroundColor: d ? 'rgba(217,255,0,0.08)' : '#F4F4F5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteModalTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: p.text, textAlign: 'center', letterSpacing: '-0.02em' },
    deleteModalName: {
      margin: '10px 0 0',
      fontSize: 17,
      fontWeight: 700,
      color: p.text,
      textAlign: 'center',
      letterSpacing: '-0.02em',
    },
    deleteModalDesc: {
      margin: '14px 0 0',
      fontSize: 13,
      fontWeight: 600,
      color: p.textMuted,
      lineHeight: 1.55,
      textAlign: 'center',
    },
    deleteModalActions: { marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 },
    deleteConfirmBtn: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '15px 20px',
      borderRadius: 16,
      border: 'none',
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
    deleteConfirmBtnDemo: {
      backgroundColor: '#000000',
      color: p.lime,
    },
    deleteConfirmBtnReal: {
      backgroundColor: '#dc2626',
      color: '#ffffff',
    },
    deleteCancelBtnModal: {
      width: '100%',
      boxSizing: 'border-box',
      padding: '13px 20px',
      borderRadius: 16,
      border: `1px solid ${border}`,
      backgroundColor: 'transparent',
      color: p.textMuted,
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      fontFamily: 'inherit',
    },
  };
}

export const ZaptroDriversContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { palette } = useZaptroTheme();
  const s = useMemo(() => buildStyles(palette), [palette]);
  const isDark = palette.mode === 'dark';

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [plateFilter, setPlateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'bloqueado'>('all');
  const [registerOpen, setRegisterOpen] = useState(false);

  const [deleteIntent, setDeleteIntent] = useState<{ id: string; name: string; isDemo: boolean } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [hiddenDemoIds, setHiddenDemoIds] = useState<string[]>(() => readHiddenZaptroDemoDriverIds());

  const demoEnabled = isZaptroDriversDemoEnabled();
  const visibleDemoDrivers = useMemo(
    () => ZAPTRO_DEMO_DRIVERS.filter((d) => !hiddenDemoIds.includes(d.id)),
    [hiddenDemoIds],
  );

  const fetchDrivers = async () => {
    setLoading(true);
    if (!profile?.company_id) {
      setDrivers([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabaseZaptro
        .from('whatsapp_drivers')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name', { ascending: true });

      if (error) throw error;
      setDrivers(data || []);
    } catch (err: any) {
      notifyZaptro(
        'error',
        'Erro ao carregar motoristas',
        err.message || 'Verifique sua conexão, faça login de novo em /login ou tente Atualizar.'
      );
    } finally {
      setLoading(false);
      setListRefreshing(false);
    }
  };

  const onRefreshList = async () => {
    setListRefreshing(true);
    await fetchDrivers();
  };

  useEffect(() => {
    fetchDrivers();
  }, [profile?.company_id]);

  useEffect(() => {
    if (!deleteIntent) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && !deleteBusy) setDeleteIntent(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleteIntent, deleteBusy]);

  const runDeleteFromModal = async () => {
    if (!deleteIntent) return;
    const { id, isDemo } = deleteIntent;
    setDeleteBusy(true);
    const tId = toastLoading('Removendo...');
    try {
      if (isDemo) {
        hideZaptroDemoDriverId(id);
        setHiddenDemoIds(readHiddenZaptroDemoDriverIds());
        notifyZaptro('success', 'Exemplo removido', 'Recarregue a página para ver todos os exemplos de novo.');
        setDeleteIntent(null);
        return;
      }
      const { error } = await supabaseZaptro.from('whatsapp_drivers').delete().eq('id', id);
      if (error) throw error;
      notifyZaptro('success', 'Motorista removido', 'O registro foi excluído da sua frota.');
      await fetchDrivers();
      setDeleteIntent(null);
    } catch (err: any) {
      notifyZaptro(
        'error',
        'Erro ao remover',
        err.message || 'Não foi possível excluir. Atualize a página e tente novamente.'
      );
    } finally {
      toastDismiss(tId);
      setDeleteBusy(false);
    }
  };

  const showingDemoPlaceholders = demoEnabled && drivers.length === 0 && visibleDemoDrivers.length > 0;
  const listForDisplay = drivers.length > 0 ? drivers : demoEnabled ? visibleDemoDrivers : [];

  const q = searchTerm.toLowerCase();
  const plateNorm = plateFilter.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const filteredDrivers = listForDisplay.filter((d) => {
    const nameOk = (d.name || '').toLowerCase().includes(q);
    const phoneOk = String(d.phone || '').includes(searchTerm);
    const textOk = nameOk || phoneOk;
    
    let statusOk = true;
    if (statusFilter !== 'all') {
      statusOk = d.status === statusFilter;
    }

    if (!plateNorm) return textOk && statusOk;
    const plateOk = vehicleTextContainsPlate(d.vehicle, plateNorm) || extractPlateFromVehicleText(d.vehicle) === plateNorm;
    return textOk && plateOk && statusOk;
  });

  const driverStats = useMemo(() => {
    const total = listForDisplay.length;
    return {
      total,
      ativos: listForDisplay.filter((d) => d.status === 'ativo').length,
      inativos: listForDisplay.filter((d) => d.status === 'inativo').length,
      bloqueados: listForDisplay.filter((d) => d.status === 'bloqueado').length,
    };
  }, [listForDisplay]);

  const iconMuted = palette.textMuted;

  const handleExportDrivers = () => {
    if (!filteredDrivers.length) {
      notifyZaptro('warning', 'Exportação', 'Nenhum motorista para exportar.');
      return;
    }
    exportToExcel(
      filteredDrivers.map((d) => ({
        nome: d.name ?? '',
        whatsapp: d.phone ?? '',
        veiculo: d.vehicle ?? '',
        status: d.status ?? '',
      })),
      'motoristas_frota',
      { nome: 'Nome', whatsapp: 'WhatsApp', veiculo: 'Veículo', status: 'Status' },
    );
    notifyZaptro('success', 'Exportado', `${filteredDrivers.length} motorista(s) exportado(s).`);
  };

  const handleDownloadDriverTemplate = () => {
    downloadCsvTemplate(
      'modelo_motoristas_zaptro.csv',
      DRIVER_CSV_TEMPLATE_HEADERS,
      DRIVER_CSV_TEMPLATE_EXAMPLE,
      'Preencha o modelo e use «Importar motoristas» na barra abaixo.',
    );
  };

  const handleImportDrivers = async (file: File) => {
    if (!profile?.company_id) {
      notifyZaptro('error', 'Importação', 'Empresa não identificada.');
      return;
    }
    try {
      const text = await file.text();
      const rows = parseDriversCsv(text);
      if (!rows.length) {
        notifyZaptro('error', 'Importação', 'Nenhuma linha válida. Use o modelo com colunas «nome» e «whatsapp».');
        return;
      }
      notifyZaptro('info', 'Importação', `A importar ${rows.length} motorista(s)...`);
      const result = await importDriversCsvRows(profile.company_id, rows);
      await fetchDrivers();
      notifyZaptro(
        'success',
        'Importação concluída',
        `${result.imported} motorista(s) importado(s)${result.failed ? `, ${result.failed} falharam` : ''}.`,
      );
    } catch (err: unknown) {
      notifyZaptro('error', 'Importação', err instanceof Error ? err.message : 'Falha ao importar.');
    }
  };

  return (
    <>
      <div className="zaptro-fleet-module zaptro-fleet-module--tall">
        <div style={{ ...s.headerRow, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flex: '1 1 280px', minWidth: 0 }}>
            <div style={s.headerIcon}>
              <Truck size={28} color={palette.lime} strokeWidth={2.2} />
            </div>
            <div style={s.headerText}>
              <h1 style={s.title}>Motoristas</h1>
              <p style={s.subtitle}>
                Frota de campo: clique num <strong>cartão</strong> para abrir o perfil (<span style={s.code}>/app/motoristas/perfil/…</span>).
                Filtre por <strong>nome</strong>, <strong>telemóvel</strong> ou <strong>placa</strong> (a mesma placa pode aparecer em vários motoristas). Dados em{' '}
                <span style={s.code}>whatsapp_drivers</span>.
              </p>
            </div>
          </div>
        <button
          type="button"
          className="zaptro-btn-toolbar"
          onClick={() =>
            navigate(zaptroAppOrLegacy(location.pathname, ZAPTRO_APP_ROUTES.ROUTES, ZAPTRO_ROUTES.ROUTES))
          }
          style={{
            border: `1px solid ${palette.sidebarBorder}`,
            backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F4F4F5',
            color: palette.text,
          }}
        >
          <Navigation size={16} strokeWidth={2.2} /> Rotas
        </button>
        </div>

        {!profile?.company_id && (
          <div style={s.noTenantBanner}>
            Para carregar e salvar motoristas no banco, use uma conta Zaptro com empresa vinculada (login real). O
            acesso dev por senha de teste não cria sessão nem vínculo com a transportadora no banco.
          </div>
        )}

        <ZaptroFleetStatsRow
          cards={[
            { label: 'Total motoristas', value: driverStats.total, accent: true },
            { label: 'Activos', value: driverStats.ativos, hint: 'Com acesso a rotas' },
            { label: 'Inactivos', value: driverStats.inativos },
            { label: 'Bloqueados', value: driverStats.bloqueados, hint: 'Sem acesso a links' },
          ]}
        />

        <div className="zaptro-fleet-module__body">
          <ZaptroFleetDriversNav active="drivers" onAdd={() => setRegisterOpen(true)} />
          <div className="zaptro-drivers-main" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
          <div style={s.listSection}>
            {showingDemoPlaceholders ? (
              <div className="zaptro-fleet-demo-banner">
                Pré-visualização — {visibleDemoDrivers.length} motoristas de exemplo. Use o botão <strong>+</strong> para cadastrar.
              </div>
            ) : null}
            {demoEnabled && visibleDemoDrivers.length === 0 ? (
              <div className="zaptro-fleet-demo-banner">
                Exemplos ocultos neste browser.{' '}
                <button
                  type="button"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#92400E',
                    fontWeight: 800,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => {
                    resetHiddenZaptroDemoDrivers();
                    setHiddenDemoIds([]);
                  }}
                >
                  Mostrar motoristas de exemplo
                </button>
              </div>
            ) : null}
            <div style={s.toolbar}>
              <div style={s.toolbarFilters}>
                <div style={{ ...s.search, flex: '1 1 200px' }}>
                  <Search size={16} color={iconMuted} />
                  <input
                    placeholder="Nome ou telemóvel…"
                    style={s.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div style={{ ...s.search, flex: '1 1 140px', maxWidth: 200 }}>
                  <Truck size={16} color={iconMuted} />
                  <input
                    placeholder="Placa (ex.: ABC1D23)"
                    style={s.searchInput}
                    value={plateFilter}
                    onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
                  />
                </div>
                <div style={{ ...s.search, flex: '1 1 120px', maxWidth: 160 }}>
                  <Filter size={16} color={iconMuted} />
                  <select
                    style={{ ...s.searchInput, cursor: 'pointer', appearance: 'none', background: 'transparent' }}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">Status: Todos</option>
                    <option value="ativo">Status: Ativo</option>
                    <option value="inativo">Status: Inativo</option>
                    <option value="bloqueado">Status: Bloqueado</option>
                  </select>
                </div>
              </div>
              <ZaptroListImportToolbar
                inputId="zaptro-drivers-import-input"
                exportLabel="Baixar motoristas"
                importLabel="Importar motoristas"
                templateLabel="Modelo"
                onExport={handleExportDrivers}
                onImport={handleImportDrivers}
                onDownloadTemplate={handleDownloadDriverTemplate}
                exportDisabled={filteredDrivers.length === 0}
              />
              <button
                type="button"
                style={{ ...s.refreshBtn, opacity: listRefreshing ? 0.7 : 1 }}
                disabled={listRefreshing}
                onClick={() => void onRefreshList()}
              >
                <RefreshCw size={16} className={listRefreshing ? 'animate-spin' : ''} />
                {listRefreshing ? 'A actualizar…' : 'Actualizar'}
              </button>
            </div>

            {loading ? (
              <div style={s.loadingState}>
                <Loader2 className="animate-spin" size={32} color={palette.lime} />
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div style={s.emptyList}>
                <p style={s.emptyTitle}>Nenhum motorista nesta busca</p>
                <p style={s.emptySub}>
                  {searchTerm || plateFilter
                    ? 'Limpe os filtros ou use o botão + para cadastrar.'
                    : demoEnabled && hiddenDemoIds.length > 0
                      ? 'Os exemplos foram ocultados neste browser. Recarregue a página ou cadastre um motorista real.'
                      : 'Use o botão + para cadastrar o primeiro motorista da frota.'}
                </p>
              </div>
            ) : (
                <div style={s.grid}>
                  {filteredDrivers.map((d) => (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      className="zaptro-driver-card"
                      style={{ ...s.card, cursor: 'pointer' }}
                      onClick={() => navigate(ZAPTRO_APP_ROUTES.driverProfile(String(d.id)))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(ZAPTRO_APP_ROUTES.driverProfile(String(d.id)));
                        }
                      }}
                    >
                      <div style={s.cardHeader}>
                        <div style={s.avatar}>
                          {d.photo_url ? (
                            <img
                              src={d.photo_url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
                            />
                          ) : (
                            <User size={22} color={isDark ? palette.lime : '#0f172a'} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={s.driverName}>{d.name}</h3>
                          <div style={s.statusBadge}>
                            <div
                              style={{
                                ...s.statusDot,
                                backgroundColor:
                                  d.status === 'ativo' ? '#22c55e' : d.status === 'bloqueado' ? '#ef4444' : '#949494',
                              }}
                            />
                            {d.status === 'ativo'
                              ? 'OPERACIONAL'
                              : d.status === 'bloqueado'
                                ? 'BLOQUEADO'
                                : 'INACTIVO'}
                          </div>
                        </div>
                        <div style={s.actions}>
                          <button
                            type="button"
                            style={s.iconBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDriver(d);
                            }}
                            title="Editar"
                          >
                            <Edit2 size={14} color={iconMuted} />
                          </button>
                          <button
                            type="button"
                            style={{
                              ...s.iconBtn,
                              color: isZaptroDemoDriverId(String(d.id)) ? '#b45309' : '#ef4444',
                            }}
                            title={
                              isZaptroDemoDriverId(String(d.id))
                                ? 'Remover exemplo da pré-visualização'
                                : 'Remover'
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteIntent({
                                id: String(d.id),
                                name: (d.name || '').trim() || 'Motorista',
                                isDemo: isZaptroDemoDriverId(String(d.id)),
                              });
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={s.cardBody}>
                        <div style={s.infoRow}>
                          <Phone size={14} color={iconMuted} /> <span style={s.infoPhone}>{d.phone}</span>
                        </div>
                        <div style={s.infoRow}>
                          <Truck size={14} color={iconMuted} /> <span style={s.infoText}>{d.vehicle || 'Sem veículo'}</span>
                        </div>
                      </div>
                      <div style={s.cardFooter}>
                        <span style={s.footerLabel}>WHATSAPP · CANAL ZAPTRO</span>
                        <button
                          type="button"
                          className="zaptro-driver-card__inbox-btn"
                          style={s.waIcon}
                          title="Conversar com motorista"
                          aria-label={`Conversar com ${d.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const digits = (d.phone || '').replace(/\D/g, '');
                            if (digits.length < 10) {
                              notifyZaptro('warning', 'Sem WhatsApp', 'Motorista sem número válido para conversar.');
                              return;
                            }
                            navigate(`${ZAPTRO_APP_ROUTES.INBOX}?c=${encodeURIComponent(digits)}`);
                          }}
                        >
                          <Zap size={18} strokeWidth={1.9} color="#d9ff00" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
          </div>
        </div>
      </div>

      <ZaptroDriverRegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSaved={() => void fetchDrivers()}
      />

      {deleteIntent && (
        <div
          style={s.deleteOverlay}
          onClick={() => {
            if (!deleteBusy) setDeleteIntent(null);
          }}
          role="presentation"
        >
          <div
            style={s.deleteModalCard}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="zaptro-driver-delete-title"
            aria-describedby="zaptro-driver-delete-desc"
          >
            <button
              type="button"
              style={s.deleteModalClose}
              aria-label="Fechar"
              disabled={deleteBusy}
              onClick={() => setDeleteIntent(null)}
            >
              <X size={20} color={palette.textMuted} />
            </button>
            <div style={s.deleteModalIconWrap} aria-hidden>
              <Trash2 size={28} color={palette.text} strokeWidth={2} />
            </div>
            <h2 id="zaptro-driver-delete-title" style={s.deleteModalTitle}>
              {deleteIntent.isDemo ? 'Remover exemplo?' : 'Excluir motorista?'}
            </h2>
            <p style={s.deleteModalName}>{deleteIntent.name}</p>
            <p id="zaptro-driver-delete-desc" style={s.deleteModalDesc}>
              {deleteIntent.isDemo
                ? 'Isto não apaga dados no servidor — só oculta o cartão de demonstração neste browser. Pode recarregar a página para voltar a ver os exemplos.'
                : 'Esta ação remove o registo da frota na base de dados. Confirme se é o motorista certo antes de continuar.'}
            </p>
            <div style={s.deleteModalActions}>
              <button
                type="button"
                style={{
                  ...s.deleteConfirmBtn,
                  ...(deleteIntent.isDemo ? s.deleteConfirmBtnDemo : s.deleteConfirmBtnReal),
                  opacity: deleteBusy ? 0.75 : 1,
                  cursor: deleteBusy ? 'wait' : 'pointer',
                }}
                disabled={deleteBusy}
                onClick={() => void runDeleteFromModal()}
              >
                {deleteBusy && !deleteIntent.isDemo
                  ? 'A excluir…'
                  : deleteIntent.isDemo
                    ? 'Remover exemplo'
                    : 'Excluir definitivamente'}
              </button>
              <button
                type="button"
                style={s.deleteCancelBtnModal}
                disabled={deleteBusy}
                onClick={() => setDeleteIntent(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.9s linear infinite; }
        .zaptro-driver-card:hover {
          transform: translateY(-2px);
          box-shadow: ${isDark ? '0 12px 40px rgba(0,0,0,0.35)' : '0 14px 40px rgba(15,23,42,0.08)'};
        }
        .zaptro-driver-card__inbox-btn:hover {
          background: #111111 !important;
          transform: translateY(-1px);
        }
        @media (max-width: 960px) {
          .zaptro-drivers-main {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .zaptro-drivers-form {
            width: 100% !important;
            position: static !important;
          }
        }
      `}</style>
    </>
  );
};

const ZaptroDrivers: React.FC = () => (
  <ZaptroLayout contentFullWidth>
    <ZaptroDriversContent />
  </ZaptroLayout>
);

export default ZaptroDrivers;
