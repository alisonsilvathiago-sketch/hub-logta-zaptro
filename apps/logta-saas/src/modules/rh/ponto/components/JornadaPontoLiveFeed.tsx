import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useTenant } from '../../../../contexts/TenantContext';
import { usePontoConfig } from '../hooks/usePontoConfig';
import type { PontoRecord, PontoRecordType } from '../types';

const typeMeta: Record<
  PontoRecordType,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; tone: string }
> = {
  entrada: { label: 'Entrada', icon: LogIn, tone: 'text-green-600 bg-green-50 border-green-100' },
  saida: { label: 'Saída', icon: LogOut, tone: 'text-gray-700 bg-gray-100 border-gray-200' },
  pausa_inicio: { label: 'Início pausa', icon: Pause, tone: 'text-amber-600 bg-amber-50 border-amber-100' },
  pausa_fim: { label: 'Fim pausa', icon: Play, tone: 'text-blue-600 bg-blue-50 border-blue-100' },
};

type Props = {
  colaboradoresCount?: number;
};

export function JornadaPontoLiveFeed({ colaboradoresCount = 0 }: Props) {
  const { config: tenantConfig } = useTenant();
  const companyId = tenantConfig?.id;
  const { records, stats, refreshRecords } = usePontoConfig(companyId);

  useEffect(() => {
    if (!companyId) return;
    refreshRecords();
    const t = window.setInterval(refreshRecords, 4000);
    return () => window.clearInterval(t);
  }, [companyId, refreshRecords]);

  return (
    <section className="logta-panel-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-[10px] font-black uppercase text-green-700">Ao vivo</span>
          </div>
          <h3 className="logta-card-heading">Batidas de ponto em tempo real</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Quando um colaborador registrar ponto, aparece aqui. Clique para abrir o dossiê completo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase text-gray-600">
            <Users size={12} className="mr-1 inline" />
            {colaboradoresCount} na base
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase text-primary">
            {stats.registrosHoje} hoje
          </span>
          <button type="button" onClick={refreshRecords} className="hub-premium-pill secondary">
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>
      </div>

      <div className="max-h-[min(420px,50vh)] overflow-y-auto p-4">
        {records.length === 0 ? (
          <div className="py-14 text-center">
            <Clock className="mx-auto mb-3 text-gray-300" size={36} />
            <p className="text-sm font-bold text-gray-500">Nenhuma batida ainda</p>
            <p className="mt-1 text-xs font-medium text-gray-400">
              Compartilhe o link ou QR em Controle de Ponto — os registros surgem aqui na hora.
            </p>
            <Link
              to="/rh/jornada-ponto/controle-ponto"
              className="mt-4 inline-flex items-center gap-1 text-[10px] font-black uppercase text-primary"
            >
              Abrir controle de ponto <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {records.slice(0, 50).map((r) => (
              <PontoFeedRow key={r.id} record={r} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PontoFeedRow({ record }: { record: PontoRecord }) {
  const meta = typeMeta[record.type];
  const Icon = meta.icon;
  const collaboratorId =
    record.collaboratorId || `colab-${record.collaboratorDocument.replace(/\D/g, '')}`;
  const when = new Date(record.timestamp);

  return (
    <li>
      <Link
        to={`/rh/jornada-ponto/colaborador/${encodeURIComponent(collaboratorId)}`}
        className="group flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900 group-hover:text-primary">
              {record.collaboratorName}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-normal text-gray-400">
              {meta.label} · {when.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {record.validated ? (
            <span className="rounded-full border border-green-100 bg-green-50 px-2 py-0.5 text-[9px] font-black uppercase text-green-700">
              OK
            </span>
          ) : (
            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
              Revisar
            </span>
          )}
          {record.distanceMeters != null ? (
            <span className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500">
              <MapPin size={10} /> {Math.round(record.distanceMeters)}m
            </span>
          ) : null}
          <ChevronRight size={16} className="text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </li>
  );
}
