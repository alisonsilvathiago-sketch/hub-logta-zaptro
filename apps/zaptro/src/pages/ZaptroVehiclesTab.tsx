import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useZaptroTheme } from '../context/ZaptroThemeContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Truck, Edit2, Trash2, Navigation, User, RefreshCw, X } from 'lucide-react';
import { ZAPTRO_SHADOW } from '../constants/zaptroShadows';
import { notifyZaptro } from '../components/Zaptro/ZaptroNotificationSystem';
import { ZAPTRO_APP_ROUTES } from '../app/zaptroAppRoutes';
import {
  getVisibleDemoVehicles,
  isZaptroVehiclesDemoEnabled,
  type ZaptroVehicleDemo,
} from '../constants/zaptroVehiclesDemo';
import { supabaseZaptro } from '../lib/supabase-zaptro';
import { Activity } from 'lucide-react';
import { ZaptroListImportToolbar } from '../components/Zaptro/ZaptroListImportToolbar';
import { exportToExcel } from '../lib/exportToExcel';
import { downloadCsvTemplate } from '../lib/downloadCsvTemplate';
import {
  importVehiclesCsvRows,
  parseVehiclesCsv,
  VEHICLE_CSV_TEMPLATE_EXAMPLE,
  VEHICLE_CSV_TEMPLATE_HEADERS,
} from '../lib/zaptroVehiclesImport';

type VehicleRow = ZaptroVehicleDemo & { isDemo?: boolean };

type Props = {
  registerOpen?: boolean;
  onRegisterClose?: () => void;
};

export const ZaptroVehiclesTab: React.FC<Props> = ({ registerOpen, onRegisterClose }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { palette } = useZaptroTheme();
  const d = palette.mode === 'dark';
  const border = palette.sidebarBorder;
  const surface = d ? 'rgba(255,255,255,0.04)' : '#FFFFFF';
  const surface2 = d ? 'rgba(255,255,255,0.06)' : palette.searchBg;

  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    if (registerOpen) setShowModal(true);
  }, [registerOpen]);

  const closeModal = () => {
    setShowModal(false);
    onRegisterClose?.();
  };
  const [showingDemo, setShowingDemo] = useState(false);

  const fetchVehicles = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseZaptro
        .from('veiculos')
        .select(`
          *,
          motorista:motoristas(nome)
        `)
        .order('placa');

      if (error) throw error;
      const mapped =
        data?.map((v) => ({
          id: String(v.id),
          plate: String(v.placa ?? ''),
          type: String(v.tipo || 'Caminhão'),
          model: String(v.modelo || '---'),
          brand: String(v.marca || '---'),
          year: String(v.ano || '---'),
          status: (v.status || 'disponivel') as VehicleRow['status'],
          driver: (v.motorista as { nome?: string } | null)?.nome || null,
          isDemo: false,
        })) ?? [];

      if (mapped.length === 0 && isZaptroVehiclesDemoEnabled()) {
        setVehicles(getVisibleDemoVehicles().map((v) => ({ ...v, isDemo: true })));
        setShowingDemo(true);
      } else {
        setVehicles(mapped);
        setShowingDemo(false);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
      if (isZaptroVehiclesDemoEnabled()) {
        setVehicles(getVisibleDemoVehicles().map((v) => ({ ...v, isDemo: true })));
        setShowingDemo(true);
      } else {
        setVehicles([]);
        setShowingDemo(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const filtered = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.brand.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [vehicles, searchTerm],
  );

  const openVehicle = (v: VehicleRow) => {
    navigate(ZAPTRO_APP_ROUTES.vehicleProfile(v.id));
  };

  const getStatusColor = (s: string) => {
    if (s === 'disponivel') return '#22c55e';
    if (s === 'em_rota') return '#eab308';
    return '#ef4444';
  };

  const getStatusLabel = (s: string) => {
    if (s === 'disponivel') return 'Disponível';
    if (s === 'em_rota') return 'Em rota';
    return 'Inativo';
  };

  const handleExportVehicles = () => {
    if (!filtered.length) {
      notifyZaptro('warning', 'Exportação', 'Nenhum veículo para exportar.');
      return;
    }
    exportToExcel(
      filtered.map((v) => ({
        placa: v.plate,
        tipo: v.type,
        marca: v.brand,
        modelo: v.model,
        ano: v.year,
        status: v.status,
        motorista: v.driver ?? '',
      })),
      'veiculos_frota',
      {
        placa: 'Placa',
        tipo: 'Tipo',
        marca: 'Marca',
        modelo: 'Modelo',
        ano: 'Ano',
        status: 'Status',
        motorista: 'Motorista',
      },
    );
    notifyZaptro('success', 'Exportado', `${filtered.length} veículo(s) exportado(s).`);
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate(
      'modelo_veiculos_zaptro.csv',
      VEHICLE_CSV_TEMPLATE_HEADERS,
      VEHICLE_CSV_TEMPLATE_EXAMPLE,
      'Preencha o modelo e use «Importar veículos» na barra da frota.',
    );
  };

  const handleImportVehicles = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseVehiclesCsv(text);
      if (!rows.length) {
        notifyZaptro('error', 'Importação', 'Nenhuma linha válida. Use o modelo CSV com coluna «placa».');
        return;
      }
      notifyZaptro('info', 'Importação', `A importar ${rows.length} veículo(s)...`);
      const result = await importVehiclesCsvRows(rows, { demo: showingDemo || !profile?.company_id });
      await fetchVehicles();
      notifyZaptro(
        'success',
        'Importação concluída',
        `${result.imported} veículo(s) importado(s)${result.failed ? `, ${result.failed} falharam` : ''}.`,
      );
    } catch (err: unknown) {
      notifyZaptro('error', 'Importação', err instanceof Error ? err.message : 'Falha ao importar.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', flex: 1, minHeight: 0 }}>
      {showingDemo ? (
        <div className="zaptro-fleet-demo-banner">
          Pré-visualização — {vehicles.length} veículos de exemplo (design da frota). Cadastre veículos reais com
          &quot;Novo Veículo&quot; quando a tabela <code>veiculos</code> estiver disponível no Supabase.
        </div>
      ) : null}
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flex: '1 1 320px', gap: 10, flexWrap: 'wrap', minWidth: 0 }}>
          <div
            className="zaptro-field-wrap"
            style={{ flex: '1 1 200px', backgroundColor: surface2, borderColor: border }}
          >
            <Search size={16} color={palette.textMuted} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar placa, modelo..."
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <ZaptroListImportToolbar
            inputId="zaptro-vehicles-import-input"
            exportLabel="Baixar veículos"
            importLabel="Importar veículos"
            templateLabel="Modelo"
            exportTitle="Exportar frota visível para Excel/CSV"
            importTitle="Importar veículos de CSV ou Excel"
            onExport={handleExportVehicles}
            onImport={handleImportVehicles}
            onDownloadTemplate={handleDownloadTemplate}
            exportDisabled={filtered.length === 0}
          />
          <button
            type="button"
            className="zaptro-btn-toolbar"
            onClick={() => setShowModal(true)}
            style={{ backgroundColor: palette.lime, color: '#000' }}
          >
            <Plus size={16} strokeWidth={2.5} /> Novo Veículo
          </button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Activity className="animate-spin" size={32} color={palette.lime} />
            <span style={{ fontSize: 13, fontWeight: 700, color: palette.textMuted }}>CARREGANDO FROTA...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '60px 0', textAlign: 'center', color: palette.textMuted, fontWeight: 600 }}>
            Nenhum veículo encontrado.
          </div>
        ) : filtered.map(v => (
          <div 
            key={v.id} 
            onClick={() => openVehicle(v)}
            style={{ 
              backgroundColor: surface, 
              border: `1px solid ${border}`, 
              borderRadius: 22, 
              padding: 22, 
              boxShadow: d ? 'none' : ZAPTRO_SHADOW.sm,
              cursor: 'pointer',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = d ? '0 12px 40px rgba(0,0,0,0.3)' : '0 12px 32px rgba(15,23,42,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = d ? 'none' : ZAPTRO_SHADOW.sm;
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: d ? 'rgba(217,255,0,0.1)' : '#EEFCEF', border: `1px solid ${d ? 'rgba(217,255,0,0.2)' : border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} color={palette.lime} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: palette.text, letterSpacing: '-0.02em' }}>{v.plate}</h4>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.textMuted }}>{v.brand} {v.model} ({v.year})</p>
                </div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: getStatusColor(v.status) }} title={getStatusLabel(v.status)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18, paddingLeft: 60 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '4px 8px', borderRadius: 6, backgroundColor: surface2, fontSize: 10, fontWeight: 700, color: palette.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {v.type}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: palette.textMuted }}>{getStatusLabel(v.status)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={14} color={palette.textMuted} />
                <span style={{ fontSize: 13, fontWeight: 700, color: v.driver ? palette.text : palette.textMuted }}>
                  {v.driver || 'Sem motorista vinculado'}
                </span>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14, display: 'flex', gap: 8, justifycontent: 'flex-end' }}>
              <button title="Ver rota atual" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.textMuted, display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); notifyZaptro('info', 'Em breve', 'Integração de rota ao vivo do veículo'); }}>
                <Navigation size={16} />
              </button>
              <button title="Trocar motorista" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.textMuted, display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); notifyZaptro('info', 'Em breve', 'Vincular motorista'); }}>
                <RefreshCw size={16} />
              </button>
              <button title="Editar veículo" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.textMuted, display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setShowModal(true); }}>
                <Edit2 size={16} />
              </button>
              <button title="Desativar" style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${border}`, backgroundColor: surface2, color: '#ef4444', display: 'flex', alignItems: 'center', justifycontent: 'center', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); notifyZaptro('info', 'Em breve', 'Desativar veículo'); }}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Veículo */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100000, backgroundColor: d ? 'rgba(0,0,0,0.65)' : 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 'min(500px, 100%)', backgroundColor: surface, borderRadius: 22, border: `1px solid ${border}`, padding: 28, boxShadow: ZAPTRO_SHADOW.lg }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: palette.text, letterSpacing: '-0.02em' }}>Cadastrar Veículo</h3>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', color: palette.textMuted, cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: palette.text, letterSpacing: '0.12em', marginBottom: 8 }}>PLACA</label>
                  <input placeholder="ABC-1234" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.text, fontWeight: 600, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: palette.text, letterSpacing: '0.12em', marginBottom: 8 }}>TIPO</label>
                  <select style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.text, fontWeight: 600, boxSizing: 'border-box', WebkitAppearance: 'none' }}>
                    <option>Caminhão</option>
                    <option>Van</option>
                    <option>Carro</option>
                    <option>Moto</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: palette.text, letterSpacing: '0.12em', marginBottom: 8 }}>MARCA</label>
                  <input placeholder="Ex: Mercedes" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.text, fontWeight: 600, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: palette.text, letterSpacing: '0.12em', marginBottom: 8 }}>MODELO</label>
                  <input placeholder="Ex: Sprinter" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.text, fontWeight: 600, boxSizing: 'border-box' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: palette.text, letterSpacing: '0.12em', marginBottom: 8 }}>VÍNCULO DE MOTORISTA</label>
                <select style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${border}`, backgroundColor: surface2, color: palette.text, fontWeight: 600, boxSizing: 'border-box', WebkitAppearance: 'none' }}>
                  <option>Sem vínculo no momento</option>
                  <option>Alison Silva</option>
                  <option>João Santos</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button onClick={closeModal} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${border}`, backgroundColor: 'transparent', color: palette.text, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={() => { notifyZaptro('success', 'Salvo', 'Veículo salvo com sucesso'); closeModal(); }} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', backgroundColor: palette.lime, color: '#000', fontWeight: 700, cursor: 'pointer' }}>
                  Salvar Veículo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
