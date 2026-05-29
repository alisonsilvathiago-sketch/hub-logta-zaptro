import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Palmtree,
  AlertTriangle,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { useTenant } from '../../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { equipeProfileUrl } from '../../lib/equipeRouteId';
import {
  buildFeriasFromProfiles,
  computeFeriasKpis,
  formatFeriasDate,
  type FeriasAprovacaoRecord,
  type FeriasAprovacaoStatus,
} from '../feriasAprovacaoStorage';
import type { RhModuleDef } from '../../types';

type AprovacaoFeriasViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
};

const statusLabel: Record<FeriasAprovacaoStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

const statusClass: Record<FeriasAprovacaoStatus, string> = {
  pendente: 'bg-amber-100 text-amber-800',
  em_analise: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-700',
  recusado: 'bg-red-100 text-red-700',
};

type FilterTab = 'todos' | FeriasAprovacaoStatus;

const FERIAS_RETURN_PATH = '/rh/administrativo/aprovacao-ferias';
const FERIAS_RETURN_LABEL = 'Aprovação de Férias';

export function AprovacaoFeriasView({ module, hubPath, hubLabel }: AprovacaoFeriasViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('todos');
  const allRows = useMemo(() => buildFeriasFromProfiles(companyId), [companyId]);

  const filtered = useMemo(() => {
    if (filter === 'todos') return allRows;
    return allRows.filter((r) => r.status === filter);
  }, [allRows, filter]);

  const kpis = useMemo(() => computeFeriasKpis(allRows), [allRows]);

  const kpiCards = useMemo(
    () => [
      { title: 'Solicitações', value: String(kpis.total), trend: 'neutral' as const, icon: Calendar },
      {
        title: 'Pendentes',
        value: String(kpis.pendentes),
        trend: kpis.pendentes > 0 ? ('down' as const) : ('neutral' as const),
        trendValue: kpis.pendentes > 0 ? 'Aguardando RH' : undefined,
        icon: AlertTriangle,
      },
      {
        title: 'Aprovadas (mês)',
        value: String(kpis.aprovadosMes),
        trend: 'up' as const,
        trendValue: 'Corrente',
        icon: CheckCircle2,
      },
      {
        title: 'Dias pendentes',
        value: String(kpis.diasPendentes),
        trend: 'neutral' as const,
        icon: Palmtree,
      },
    ],
    [kpis],
  );

  const openColaboradorFerias = useCallback(
    (row: FeriasAprovacaoRecord) => {
      navigate(`${equipeProfileUrl(row.equipeRouteId)}/agenda`, {
        state: {
          rhReturnTo: FERIAS_RETURN_PATH,
          rhReturnLabel: FERIAS_RETURN_LABEL,
          feriasApprovalId: row.id,
        },
      });
    },
    [navigate],
  );

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendente', label: 'Pendentes' },
    { id: 'em_analise', label: 'Em análise' },
    { id: 'aprovado', label: 'Aprovadas' },
    { id: 'recusado', label: 'Recusadas' },
  ];

  return (
    <div className="space-y-8 text-left">
      <Link
        to={`${hubPath}/pessoas`}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {hubLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpiCards}
        mainContentTitle="Solicitações de férias"
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <p className="mb-4 text-xs font-medium text-gray-500">
          Clique em uma solicitação para abrir o dossiê do colaborador e aprovar, colocar em
          andamento ou reprovar — o sistema atualiza agenda, timeline e solicitações automaticamente.
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-normal transition-all ${
                filter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/30'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhuma solicitação de férias neste filtro.
            </p>
          ) : (
            filtered.map((row, i) => (
              <button
                key={row.id}
                type="button"
                onClick={() => openColaboradorFerias(row)}
                className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-gray-900">{row.collaboratorName}</p>
                    <p className="text-xs text-gray-500">
                      {row.reason} · {row.days} dia(s)
                      {row.saldoDias != null ? ` · Saldo ${row.saldoDias}d` : ''}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      {formatFeriasDate(row.startDate)}
                      {row.endDate ? ` → ${formatFeriasDate(row.endDate)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[row.status]}`}
                  >
                    {statusLabel[row.status]}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-gray-300 transition-colors group-hover:text-primary"
                  />
                </div>
              </button>
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar — Férias"
        getTabularData={() => ({
          title: 'Aprovação de férias',
          filenameBase: 'rh-ferias',
          columns: ['Colaborador', 'Período', 'Dias', 'Status', 'Saldo', 'Motivo'],
          rows: allRows.map((r) => [
            r.collaboratorName,
            `${formatFeriasDate(r.startDate)}${r.endDate ? ` a ${formatFeriasDate(r.endDate)}` : ''}`,
            String(r.days),
            statusLabel[r.status],
            r.saldoDias != null ? String(r.saldoDias) : '—',
            r.reason,
          ]),
        })}
      />
    </div>
  );
}
