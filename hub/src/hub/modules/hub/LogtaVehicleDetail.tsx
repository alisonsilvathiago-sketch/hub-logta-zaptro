import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Settings,
  User,
  Activity,
  CheckCircle,
  Fuel,
  Calendar,
  Pencil,
  Lock,
  Trash2,
  Package,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { DetailHistorySection, detailHistoryRowTitle } from './DetailHistorySection';
import LogtaModal from '@shared/components/Modal';
import { toastSuccess } from '@core/lib/toast';

interface LogtaVehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
}

type VehicleBase = {
  client: string;
  model: string;
  plate: string;
  color: string;
  vin: string;
  driver: string;
};

type VehicleDisplay = VehicleBase & {
  status: string;
  statusColor: string;
  fuel: string;
  temp: string;
  speed: string;
  odometer: string;
  nextMaintenance: string;
};

type FleetTimelineEvent = {
  id: string;
  at: string;
  title: string;
  detail: string;
  driver: string;
  address?: string;
  mapQuery?: string;
  deliveryId?: string;
};

function vehicleBase(id: string): VehicleBase {
  const models: Record<string, VehicleBase> = {
    '1': { client: 'Transportadora Falcão', model: 'Scania R450 Highline', plate: 'ABC-1234', color: '#0061FF', vin: '9BW ZZZ377 DT01 0244', driver: 'Ricardo Silva' },
    'demo-11': { client: 'Expresso Federal', model: 'Volvo FH 540 Globetrotter', plate: 'DEF-5678', color: '#3B82F6', vin: '9BW ZZZ377 DT01 0245', driver: 'Ana Oliveira' },
    'demo-12': { client: 'Rápido Trans', model: 'Mercedes-Benz Axor 2544', plate: 'GHI-9012', color: '#8B5CF6', vin: '9BW ZZZ377 DT01 0246', driver: 'Carlos Souza' },
    'demo-13': { client: 'TransNorte Cargo', model: 'Volkswagen Constellation', plate: 'JKL-3456', color: '#F59E0B', vin: '9BW ZZZ377 DT01 0247', driver: 'Pedro Mendes' },
  };
  return models[id] || { client: 'Frota Integrada', model: 'Scania R450', plate: 'MNO-7890', color: '#0061FF', vin: '9BW ZZZ377 DT01 0999', driver: 'João Santos' };
}

function toDisplay(base: VehicleBase, blocked: boolean): VehicleDisplay {
  return {
    ...base,
    status: blocked ? 'Bloqueado' : 'Em Operação',
    statusColor: blocked ? '#EF4444' : '#0061FF',
    fuel: '84%',
    temp: '88°C',
    speed: '72 km/h',
    odometer: '124.902 km',
    nextMaintenance: 'Daqui a 5.000 km (Troca de Óleo)',
  };
}

function lastDeliveryForVehicle(id: string, plate: string): {
  finishedAt: string;
  recipient: string;
  clientCompany: string;
  address: string;
  mapQuery: string;
  driver: string;
  deliveryId: string;
  notes: string;
} {
  const common = {
    driver: vehicleBase(id).driver,
    deliveryId: `ENT-LOGTA-${plate.replace(/-/g, '')}-082`,
    notes: 'Canhoto digital assinado no LogDrive; sincronizado com o Hub Logta.',
  };
  if (id === '1' || plate === 'ABC-1234') {
    return {
      ...common,
      finishedAt: '13/05/2026 às 14:38',
      recipient: 'Distribuidora Sul RJ Ltda.',
      clientCompany: 'Transportadora Falcão',
      address: 'Av. das Américas, 3500 — Barra da Tijuca, Rio de Janeiro/RJ · CEP 22640-100',
      mapQuery: 'Av. das Américas, 3500 Barra da Tijuca Rio de Janeiro',
    };
  }
  if (id === 'demo-13' || plate === 'JKL-3456') {
    return {
      ...common,
      finishedAt: '12/05/2026 às 09:12',
      recipient: 'CD Norte Salvador',
      clientCompany: 'TransNorte Cargo',
      address: 'Rua do Limoeiro, 220 — São Cristóvão, Salvador/BA · CEP 41500-200',
      mapQuery: 'Rua do Limoeiro 220 São Cristóvão Salvador BA',
    };
  }
  return {
    ...common,
    finishedAt: '11/05/2026 às 17:05',
    recipient: 'Cliente final — hub Logta',
    clientCompany: vehicleBase(id).client,
    address: 'Rod. Anhanguera, km 42 — Campinas/SP · CEP 13054-000',
    mapQuery: 'Rodovia Anhanguera km 42 Campinas SP',
  };
}

function fleetTimelineForVehicle(id: string, base: VehicleBase): FleetTimelineEvent[] {
  const last = lastDeliveryForVehicle(id, base.plate);
  return [
    {
      id: `${id}-tl-1`,
      at: last.finishedAt,
      title: 'Entrega finalizada (Logta TMS)',
      detail: `${last.recipient} · NF vinculada ${last.deliveryId}`,
      driver: last.driver,
      address: last.address,
      mapQuery: last.mapQuery,
      deliveryId: last.deliveryId,
    },
    {
      id: `${id}-tl-2`,
      at: '12/05/2026 · 11:20',
      title: 'Chegada ao ponto de descarga',
      detail: 'Geofence Logta · tempo de doca 42 min',
      driver: base.driver,
      address: last.address,
      mapQuery: last.mapQuery,
    },
    {
      id: `${id}-tl-3`,
      at: '12/05/2026 · 06:50',
      title: 'Saída do CD — rota publicada',
      detail: `Operação ${base.client} · placa ${base.plate}`,
      driver: base.driver,
    },
    {
      id: `${id}-tl-4`,
      at: '10/05/2026',
      title: 'Abastecimento registrado (Logta Fuel)',
      detail: 'Posto Rede Logta parceiro · 280 L diesel S10',
      driver: base.driver,
    },
  ];
}

export const LogtaVehicleDetail: React.FC<LogtaVehicleDetailProps> = ({ vehicleId, onBack }) => {
  const [, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(vehicleId);
  const [historySearchDraft, setHistorySearchDraft] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [fleetHistDraft, setFleetHistDraft] = useState('');
  const [fleetHistQuery, setFleetHistQuery] = useState('');
  const [blockedIds, setBlockedIds] = useState<Record<string, boolean>>({});
  const [fieldOverrides, setFieldOverrides] = useState<Record<string, Partial<VehicleBase>>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [lastDeliveryOpen, setLastDeliveryOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<VehicleBase>>({});

  useEffect(() => {
    setActiveId(vehicleId);
  }, [vehicleId]);

  const history = useMemo(
    () => [
      { id: '1', client: 'Transportadora Falcão', plate: 'ABC-1234' },
      { id: 'demo-11', client: 'Expresso Federal', plate: 'DEF-5678' },
      { id: 'demo-12', client: 'Rápido Trans', plate: 'GHI-9012' },
      { id: 'demo-13', client: 'TransNorte Cargo', plate: 'JKL-3456' },
    ],
    [],
  );

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(h => h.client.toLowerCase().includes(q) || h.id.toLowerCase().includes(q) || h.plate.toLowerCase().includes(q));
  }, [history, historyQuery]);

  const mergedBase = useMemo((): VehicleBase => {
    const b = vehicleBase(activeId);
    const o = fieldOverrides[activeId] || {};
    return { ...b, ...o };
  }, [activeId, fieldOverrides]);

  const truck = useMemo(() => toDisplay(mergedBase, !!blockedIds[activeId]), [mergedBase, blockedIds, activeId]);

  const fleetTimeline = useMemo(() => fleetTimelineForVehicle(activeId, mergedBase), [activeId, mergedBase]);

  const filteredFleetTimeline = useMemo(() => {
    const q = fleetHistQuery.trim().toLowerCase();
    if (!q) return fleetTimeline;
    return fleetTimeline.filter(
      e =>
        e.title.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.at.toLowerCase().includes(q) ||
        (e.address && e.address.toLowerCase().includes(q)) ||
        (e.deliveryId && e.deliveryId.toLowerCase().includes(q)),
    );
  }, [fleetTimeline, fleetHistQuery]);

  const lastDelivery = useMemo(() => lastDeliveryForVehicle(activeId, truck.plate), [activeId, truck.plate]);

  const selectHistory = (id: string) => {
    setActiveId(id);
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);
      n.set('vehicleId', id);
      return n;
    }, { replace: true });
  };

  const openEdit = () => {
    setEditForm({ ...mergedBase });
    setEditOpen(true);
  };

  const saveEdit = () => {
    setFieldOverrides(prev => ({
      ...prev,
      [activeId]: {
        model: editForm.model?.trim() || mergedBase.model,
        plate: editForm.plate?.trim().toUpperCase() || mergedBase.plate,
        vin: editForm.vin?.trim() || mergedBase.vin,
        driver: editForm.driver?.trim() || mergedBase.driver,
        client: editForm.client?.trim() || mergedBase.client,
      },
    }));
    setEditOpen(false);
    toastSuccess('Cadastro do veículo atualizado no Hub Logta.');
  };

  const toggleBlock = () => {
    const next = !blockedIds[activeId];
    setBlockedIds(prev => ({ ...prev, [activeId]: next }));
    toastSuccess(next ? 'Veículo bloqueado para novas rotas no Hub Logta.' : 'Veículo liberado na frota Logta.');
  };

  const confirmDelete = () => {
    if (!window.confirm('Remover este ativo do inventário Logta? (demo — não persiste no banco.)')) return;
    toastSuccess('Exclusão registrada na fila de auditoria Logta.');
    onBack();
  };

  const openMaps = (q: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button type="button" style={s.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={s.title}>{truck.model}</h2>
              <span style={{ fontSize: '11px', fontWeight: '900', fontFamily: 'monospace', color: '#0F172A', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                {truck.plate}
              </span>
            </div>
            <p style={s.subtitle}>Patrimônio e Telemetria Veicular da Frota {truck.client}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" style={s.headerGhostBtn} onClick={() => setLastDeliveryOpen(true)} title="Última entrega">
            <Package size={16} />
            <span>Última entrega</span>
          </button>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" style={s.iconAction} onClick={openEdit} title="Editar cadastro">
              <Pencil size={18} />
            </button>
            <button type="button" style={{ ...s.iconAction, color: blockedIds[activeId] ? '#B91C1C' : '#64748B' }} onClick={toggleBlock} title={blockedIds[activeId] ? 'Desbloquear' : 'Bloquear frota'}>
              <Lock size={18} />
            </button>
            <button type="button" style={{ ...s.iconAction, color: '#B91C1C' }} onClick={confirmDelete} title="Excluir ativo">
              <Trash2 size={18} />
            </button>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: truck.statusColor, background: truck.statusColor + '15', padding: '8px 16px', borderRadius: '20px' }}>
            ● {truck.status}
          </span>
        </div>
      </header>

      <div style={s.content}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div style={s.cardCompact}>
            <div style={s.iconBox}>
              <Fuel size={18} color="#F59E0B" />
            </div>
            <div>
              <div style={s.label}>Combustível</div>
              <div style={s.val}>{truck.fuel}</div>
            </div>
          </div>
          <div style={s.cardCompact}>
            <div style={s.iconBox}>
              <Gauge size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={s.label}>Velocímetro GPS</div>
              <div style={s.val}>{truck.speed}</div>
            </div>
          </div>
          <div style={s.cardCompact}>
            <div style={s.iconBox}>
              <Activity size={18} color="#EF4444" />
            </div>
            <div>
              <div style={s.label}>Temp. Motor</div>
              <div style={s.val}>{truck.temp}</div>
            </div>
          </div>
          <div style={s.cardCompact}>
            <div style={s.iconBox}>
              <Settings size={18} color="#64748B" />
            </div>
            <div>
              <div style={s.label}>Odômetro Total</div>
              <div style={s.val}>{truck.odometer}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          <div style={s.card}>
            <h3 style={s.sectTitle}>Ficha Técnica & Cadastro do Ativo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
              <div>
                <div style={s.label}>Fabricante e Modelo</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{truck.model}</div>
              </div>
              <div>
                <div style={s.label}>Chassi (VIN)</div>
                <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: '#64748B', marginTop: '4px' }}>{truck.vin}</div>
              </div>
              <div>
                <div style={s.label}>Placa Mercosul</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E293B', marginTop: '4px' }}>{truck.plate}</div>
              </div>
              <div>
                <div style={s.label}>Motorista Frequente</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0061FF', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} /> {truck.driver}
                </div>
              </div>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={s.sectTitle}>Saúde do Veículo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', borderRadius: '16px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                <CheckCircle size={20} color="#0061FF" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1D4ED8' }}>Manutenção em Dia</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{truck.nextMaintenance}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <Calendar size={20} color="#64748B" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>Última Revisão Completa</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>12 de Abril de 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DetailHistorySection
          heading="Histórico completo da frota (Logta)"
          hint="Linha do tempo: entregas finalizadas, geofence, abastecimento e publicação de rota — dados alinhados ao TMS e LogDrive."
          searchPlaceholder="Filtrar por endereço, NF ou motorista…"
          searchDraft={fleetHistDraft}
          onSearchDraftChange={setFleetHistDraft}
          onApplySearch={() => setFleetHistQuery(fleetHistDraft)}
          exportStem={`frota-historico-${truck.plate.replace(/-/g, '')}`}
          listMaxHeight={320}
        >
          {filteredFleetTimeline.map(ev => (
            <div
              key={ev.id}
              style={{
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{ev.title}</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{ev.at}</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', flexShrink: 0 }}>Motorista: {ev.driver}</span>
              </div>
              <p style={{ ...detailHistoryRowTitle, margin: 0, fontSize: '12px', color: '#64748B', lineHeight: 1.45 }}>{ev.detail}</p>
              {ev.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: '#475569' }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{ev.address}</span>
                </div>
              )}
              {ev.mapQuery && (
                <button
                  type="button"
                  onClick={() => openMaps(ev.mapQuery!)}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #BFDBFE',
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={14} /> Ver no mapa (último ponto)
                </button>
              )}
            </div>
          ))}
        </DetailHistorySection>

        <DetailHistorySection
          heading="Veículos da base"
          hint="Selecione outro ativo; a URL usa vehicleId. Pesquisa, PDF e Excel."
          searchDraft={historySearchDraft}
          onSearchDraftChange={setHistorySearchDraft}
          onApplySearch={() => setHistoryQuery(historySearchDraft)}
          exportStem={`veiculos-${activeId}`}
          listMaxHeight={280}
        >
          {filteredHistory.map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => selectHistory(h.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 14px',
                borderRadius: '12px',
                border: activeId === h.id ? '2px solid #0061FF' : '1px solid #E2E8F0',
                background: activeId === h.id ? '#EFF6FF' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={detailHistoryRowTitle}>{h.client}</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#475569' }}>{h.plate}</span>
            </button>
          ))}
        </DetailHistorySection>
      </div>

      <LogtaModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar veículo (Logta)"
        subtitle="Alterações refletem no inventário do Hub Master (demo local)."
        primaryAction={{ label: 'Salvar', onClick: saveEdit }}
        secondaryAction={{ label: 'Cancelar', onClick: () => setEditOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(['client', 'model', 'plate', 'vin', 'driver'] as const).map(field => (
            <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                {field === 'client' ? 'Empresa / transportadora' : field === 'model' ? 'Modelo' : field === 'plate' ? 'Placa' : field === 'vin' ? 'Chassi (VIN)' : 'Motorista frequente'}
              </span>
              <input
                value={(editForm[field] as string) ?? ''}
                onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                style={inputStyle}
              />
            </label>
          ))}
        </div>
      </LogtaModal>

      <LogtaModal
        isOpen={lastDeliveryOpen}
        onClose={() => setLastDeliveryOpen(false)}
        title="Última entrega registrada (Logta)"
        subtitle="Dados do destinatário e encerramento da viagem no ecossistema LogDrive + TMS."
        primaryAction={{
          label: 'Abrir endereço no mapa',
          onClick: () => {
            openMaps(lastDelivery.mapQuery);
            toastSuccess('Link do mapa aberto em nova aba.');
          },
        }}
        secondaryAction={{ label: 'Fechar', onClick: () => setLastDeliveryOpen(false) }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#475569' }}>
          <p style={{ margin: 0 }}>
            <b style={{ color: '#0F172A' }}>Finalizada em:</b> {lastDelivery.finishedAt}
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: '#0F172A' }}>Motorista:</b> {lastDelivery.driver}
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: '#0F172A' }}>Cliente / tomador:</b> {lastDelivery.clientCompany}
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: '#0F172A' }}>Destinatário da encomenda:</b> {lastDelivery.recipient}
          </p>
          <p style={{ margin: 0 }}>
            <b style={{ color: '#0F172A' }}>Identificador Logta:</b> <span style={{ fontFamily: 'monospace' }}>{lastDelivery.deliveryId}</span>
          </p>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '4px' }}>
            <MapPin size={16} color="#3B82F6" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{lastDelivery.address}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>{lastDelivery.notes}</p>
        </div>
      </LogtaModal>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #E2E8F0',
  fontSize: '14px',
  fontWeight: 600,
  outline: 'none',
};

const s: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flex: 1, flexDirection: 'column', backgroundColor: '#FFFFFF' },
  header: { padding: '20px 72px 0', marginTop: 50, marginBottom: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  headerGhostBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #BFDBFE',
    background: '#FFFFFF',
    color: '#0061FF',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  iconAction: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#475569',
  },
  backBtn: { width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #E2E8F0', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' },
  title: { margin: 0, fontSize: '22px', fontWeight: '600', color: '#0F172A', letterSpacing: '0' },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' },
  content: { padding: '37px 0 38px 27px', display: 'flex', flexDirection: 'column', gap: '38px' },
  card: { backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E2E8F0' },
  cardCompact: { backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '16px 20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' },
  iconBox: { width: '40px', height: '40px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  val: { fontSize: '15px', fontWeight: '900', color: '#0F172A', marginTop: '2px' },
  sectTitle: { margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' },
};
