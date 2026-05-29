import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  FileText,
  Fuel,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
  User,
  Wrench,
} from 'lucide-react';
import { OperationalMapCanvas } from '../../../components/OperationalMapCanvas';
import { useOperationalData } from '../../../contexts/OperationalDataContext';
import { useTenant } from '../../../contexts/TenantContext';
import { getSandboxOperationalBundle, resolveDemoCompanyId } from '../../../lib/seed';
import { supabase } from '../../../lib/supabase';
import { useFrotaIntelligence } from '../context/FrotaIntelligenceContext';
import { VehicleTollTagBadge } from '../../../components/VehicleTollTagBadge';
import { getVehicleTollTag, normalizeVehiclePlate } from '../../../lib/vehicleTollTag';

export type VeiculoDetailRow = {
  id: string;
  placa: string;
  modelo: string;
  tipo_veiculo: string;
  ano_fabricacao?: number;
  status: string;
};

function normalizePlate(p?: string) {
  return normalizeVehiclePlate(p);
}

function mapVehicleRow(v: Record<string, unknown>): VeiculoDetailRow {
  return {
    id: String(v.id ?? ''),
    placa: String(v.plate || v.placa || ''),
    modelo: String(v.model || v.modelo || v.brand || 'Modelo não informado'),
    tipo_veiculo: String(v.type || v.tipo_veiculo || 'cavalo'),
    ano_fabricacao: typeof v.year === 'number' ? v.year : typeof v.ano_fabricacao === 'number' ? v.ano_fabricacao : undefined,
    status: String(v.status || 'disponivel'),
  };
}

function statusLabel(status: string) {
  const s = status.toLowerCase();
  if (s.includes('rota') || s.includes('transit')) return 'Em rota';
  if (s.includes('manut')) return 'Manutenção';
  if (s.includes('avail') || s.includes('dispon')) return 'Disponível';
  return status.replace(/_/g, ' ');
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes('rota') || s.includes('transit')) return 'bg-blue-50 text-blue-700';
  if (s.includes('manut')) return 'bg-red-50 text-red-700';
  return 'bg-green-50 text-green-700';
}

export function VeiculoDetailView() {
  const { placa: placaParam } = useParams<{ placa: string }>();
  const placaKey = normalizePlate(placaParam);
  const navigate = useNavigate();
  const { config } = useTenant();
  const { vehicles: opVehicles, shipments, loading: opLoading } = useOperationalData();
  const { activeAlerts } = useFrotaIntelligence();
  const [dbRow, setDbRow] = useState<VeiculoDetailRow | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!placaKey) {
      setDbLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setDbLoading(true);
      let query = supabase.from('vehicles').select('*').eq('plate', placaKey);
      if (config?.id) query = query.eq('company_id', config.id);
      const { data, error } = await query.maybeSingle();
      if (!cancelled) {
        if (!error && data) setDbRow(mapVehicleRow(data as Record<string, unknown>));
        else setDbRow(null);
        setDbLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [placaKey, config?.id]);

  const vehicle = useMemo(() => {
    if (!placaKey) return null;
    const fromOp = opVehicles.find((v) => normalizePlate(v.plate) === placaKey);
    if (fromOp) return mapVehicleRow(fromOp as Record<string, unknown>);
    const sandbox = getSandboxOperationalBundle(resolveDemoCompanyId(config?.id)).vehicles;
    const fromSandbox = sandbox.find((v) => normalizePlate(v.plate) === placaKey);
    if (fromSandbox) return mapVehicleRow(fromSandbox as Record<string, unknown>);
    if (dbRow && normalizePlate(dbRow.placa) === placaKey) return dbRow;
    return null;
  }, [placaKey, opVehicles, config?.id, dbRow]);

  const fretesVeiculo = useMemo(() => {
    if (!placaKey) return [];
    return shipments.filter((s) => normalizePlate(s.vehicles?.plate) === placaKey);
  }, [shipments, placaKey]);

  const alertasVeiculo = useMemo(
    () => activeAlerts.filter((a) => a.vehiclePlate && normalizePlate(a.vehiclePlate) === placaKey),
    [activeAlerts, placaKey],
  );

  const motoristaAtual = fretesVeiculo.find((f) => f.motoristas?.nome)?.motoristas;

  const mapVehicle = useMemo(() => {
    if (!vehicle) return undefined;
    const emRota = vehicle.status.toLowerCase().includes('rota') || vehicle.status.toLowerCase().includes('transit');
    return [
      {
        id: 1,
        driver: motoristaAtual?.nome || 'Sem motorista',
        plate: vehicle.placa,
        x: 42,
        y: 48,
        speed: emRota ? '54 km/h' : '0 km/h',
        status: emRota ? 'Em Rota' : 'Parado',
      },
    ];
  }, [vehicle, motoristaAtual]);

  const tollTag = useMemo(() => (vehicle ? getVehicleTollTag(vehicle.placa) : null), [vehicle]);

  const loading = opLoading && dbLoading && !vehicle;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-left">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold uppercase text-gray-400">Carregando veículo...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-left duration-500">
        <button
          type="button"
          onClick={() => navigate('/frota/veiculos')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar aos veículos
        </button>
        <div className="rounded-[40px] border border-gray-200 bg-white p-10 shadow-sm">
          <p className="text-sm text-gray-500">
            Veículo não encontrado para a placa <strong className="text-gray-900">{placaParam}</strong>.
          </p>
        </div>
      </div>
    );
  }

  const emRota = vehicle.status.toLowerCase().includes('rota') || vehicle.status.toLowerCase().includes('transit');
  const custoMes = Math.round(1250 + fretesVeiculo.length * 420);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-left duration-500">
      <button
        type="button"
        onClick={() => navigate('/frota/veiculos')}
        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Voltar aos veículos
      </button>

      <div className="logta-panel-card--operational p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              <Truck size={28} />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">Ficha do veículo</p>
              <h2 className="logta-card-heading text-2xl text-gray-900 sm:text-3xl">{vehicle.placa}</h2>
              <p className="mt-1 text-sm font-medium text-gray-600">
                {vehicle.modelo} · {vehicle.tipo_veiculo}
                {vehicle.ano_fabricacao ? ` · ${vehicle.ano_fabricacao}` : ''}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-normal ${statusTone(vehicle.status)}`}>
              {statusLabel(vehicle.status)}
            </span>
            {tollTag ? <VehicleTollTagBadge plate={vehicle.placa} tag={tollTag} compact showLinks={false} /> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Fretes vinculados', value: String(fretesVeiculo.length), Icon: Activity, tone: 'text-primary' },
          { label: 'Alertas', value: String(alertasVeiculo.length), Icon: AlertCircle, tone: 'text-red-500' },
          { label: 'Custo estimado/mês', value: `R$ ${custoMes.toLocaleString('pt-BR')}`, Icon: Fuel, tone: 'text-gray-900' },
          { label: 'Operação', value: emRota ? 'Ativa' : 'Parada', Icon: MapPin, tone: emRota ? 'text-blue-600' : 'text-gray-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="logta-metric-card">
            <p className="logta-metric-card__label">{kpi.label}</p>
            <p className={`logta-metric-card__value ${kpi.tone}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="relative min-h-[360px] overflow-hidden rounded-[20px] border border-gray-200 bg-gray-50 lg:col-span-2">
          <OperationalMapCanvas
            className="absolute inset-0 h-full w-full"
            vehicles={mapVehicle}
            showMetricsBubble={emRota}
            showHeroCar={false}
            metrics={{ km: '12,4', minutes: '38' }}
          />
          <div className="pointer-events-none absolute left-4 top-4 z-30 rounded-2xl border border-white/60 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
            <p className="text-[10px] font-black uppercase text-gray-400">Rastreamento</p>
            <p className="text-xs font-bold text-gray-900">{vehicle.placa} · {emRota ? 'Em deslocamento' : 'Garagem / parado'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="logta-card-heading mb-4">Dados cadastrais</h3>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="mb-1 text-[10px] font-black uppercase tracking-normal text-gray-400">Placa</dt>
                <dd className="font-bold text-gray-900">{vehicle.placa}</dd>
              </div>
              <div>
                <dt className="mb-1 text-[10px] font-black uppercase tracking-normal text-gray-400">Modelo</dt>
                <dd className="font-bold text-gray-900">{vehicle.modelo}</dd>
              </div>
              <div>
                <dt className="mb-1 text-[10px] font-black uppercase tracking-normal text-gray-400">Tipo</dt>
                <dd className="font-bold capitalize text-gray-900">{vehicle.tipo_veiculo}</dd>
              </div>
              <div>
                <dt className="mb-1 text-[10px] font-black uppercase tracking-normal text-gray-400">ID interno</dt>
                <dd className="break-all font-mono text-xs text-gray-600">{vehicle.id}</dd>
              </div>
            </dl>
          </div>

          {motoristaAtual?.id ? (
            <Link
              to={`/rh/equipe/${motoristaAtual.id}`}
              className="flex items-center justify-between rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Motorista atual</p>
                  <p className="text-sm font-bold text-gray-900">{motoristaAtual.nome}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          ) : null}

          {tollTag ? (
            <VehicleTollTagBadge plate={vehicle.placa} tag={tollTag} />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="logta-card-heading">Fretes com este veículo</h3>
            <Link to="/fretes/operacional" className="text-[10px] font-bold uppercase text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          {fretesVeiculo.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum frete vinculado a esta placa no momento.</p>
          ) : (
            <ul className="space-y-3">
              {fretesVeiculo.slice(0, 6).map((f) => (
                <li key={f.id}>
                  <Link
                    to={`/fretes/operacional/${f.id}`}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 transition-all hover:border-primary/30 hover:bg-white"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-sm font-bold text-gray-900">{f.numero_frete || f.id}</p>
                      <p className="truncate text-[10px] font-bold uppercase text-gray-400">
                        {f.origin} → {f.destination}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-gray-500">{f.cliente_nome}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="logta-card-heading mb-6">Alertas e manutenção</h3>
          {alertasVeiculo.length === 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/80 p-4">
              <ShieldCheck className="shrink-0 text-green-600" size={20} />
              <p className="text-sm font-medium text-green-800">Nenhum alerta crítico para esta unidade.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {alertasVeiculo.map((a) => (
                <li key={a.id} className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                  <p className="text-xs font-black uppercase text-amber-800">{a.title}</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">{a.message}</p>
                  {a.actionPath ? (
                    <Link to={a.actionPath} className="mt-2 inline-block text-[10px] font-bold uppercase text-primary hover:underline">
                      {a.actionLabel}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link
              to="/frota/manutencao"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white"
            >
              <Wrench size={16} /> Manutenção
            </Link>
            <Link
              to="/frota/combustivel"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white"
            >
              <Fuel size={16} /> Combustível
            </Link>
            <Link
              to="/fretes/financeiro"
              className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-white"
            >
              <FileText size={16} /> Financeiro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
