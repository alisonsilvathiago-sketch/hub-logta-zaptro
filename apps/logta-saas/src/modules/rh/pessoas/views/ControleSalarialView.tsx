import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { useTenant } from '../../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { equipeProfileUrl } from '../../lib/equipeRouteId';
import type { RhColaboradorListItem } from '../../lib/mergeRhColaboradores';
import {
  buildSalarioColaboradorRows,
  computeSalarioKpis,
  formatSalarioBrl,
  type SalarioColaboradorRow,
  type SalarioRemuneracaoStatus,
} from '../controleSalarialData';
import type { RhModuleDef } from '../../types';

type ControleSalarialViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradores?: RhColaboradorListItem[];
};

const SALARIAL_RETURN_PATH = '/rh/administrativo/controle-salarial';
const SALARIAL_RETURN_LABEL = 'Controle Salarial';

const remuneracaoClass: Record<SalarioRemuneracaoStatus, string> = {
  regular: 'bg-green-100 text-green-700',
  pendente: 'bg-blue-100 text-blue-700',
  defasado: 'bg-red-100 text-red-700',
};

const employmentClass = {
  ativo: '',
  afastado: 'ring-1 ring-amber-200',
  desligado: '',
  falecido: '',
} as const;

type FilterTab = 'todos' | SalarioRemuneracaoStatus;

export function ControleSalarialView({
  module,
  hubPath,
  hubLabel,
  colaboradores = [],
}: ControleSalarialViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('todos');

  const allRows = useMemo(
    () => buildSalarioColaboradorRows(companyId, colaboradores),
    [companyId, colaboradores],
  );

  const filtered = useMemo(() => {
    if (filter === 'todos') return allRows;
    return allRows.filter((r) => r.remuneracaoStatus === filter);
  }, [allRows, filter]);

  const kpis = useMemo(() => computeSalarioKpis(allRows), [allRows]);

  const kpiCards = useMemo(
    () => [
      { title: 'Folha base', value: kpis.folhaBaseLabel, trend: 'up' as const, trendValue: `${allRows.length} colab.`, icon: Banknote },
      {
        title: 'Reajustes no mês',
        value: String(kpis.reajustesMes),
        trend: kpis.reajustesMes > 0 ? ('up' as const) : ('neutral' as const),
        icon: TrendingUp,
      },
      { title: 'Encargos est.', value: kpis.encargosLabel, trend: 'neutral' as const, icon: Users },
      { title: 'Média salarial', value: kpis.mediaLabel, trend: 'neutral' as const, icon: BadgeCheck },
    ],
    [kpis, allRows.length],
  );

  const openFinanceiro = (row: SalarioColaboradorRow) => {
    navigate(`${equipeProfileUrl(row.equipeRouteId)}/financeiro`, {
      state: {
        rhReturnTo: SALARIAL_RETURN_PATH,
        rhReturnLabel: SALARIAL_RETURN_LABEL,
      },
    });
  };

  const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'regular', label: 'Regular' },
    { id: 'pendente', label: 'Pendente' },
    { id: 'defasado', label: 'Defasado' },
  ];

  const mainContentAction = (
    <button
      type="button"
      onClick={() => {
        if (filtered[0]) openFinanceiro(filtered[0]);
      }}
      title="Novo reajuste (abre dossiê)"
      aria-label="Novo reajuste"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

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
        mainContentTitle="Colaboradores e remuneração"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <p className="mb-4 text-xs font-medium text-gray-500">
          Clique em um colaborador para abrir o dossiê na aba Financeiro RH — motoristas, equipe e
          demais perfis com salário base, reajustes e status de remuneração.
        </p>

        {(kpis.pendentes > 0 || kpis.defasados > 0) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs font-semibold text-amber-900">
            <AlertTriangle size={14} className="shrink-0" />
            {kpis.pendentes > 0 ? `${kpis.pendentes} sem salário cadastrado ou pendente` : null}
            {kpis.pendentes > 0 && kpis.defasados > 0 ? ' · ' : null}
            {kpis.defasados > 0 ? `${kpis.defasados} com reajuste defasado (+12 meses)` : null}
          </div>
        )}

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
              Nenhum colaborador neste filtro.
            </p>
          ) : (
            filtered.map((colab) => (
              <button
                key={colab.key}
                type="button"
                onClick={() => openFinanceiro(colab)}
                className={`group flex w-full cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between ${employmentClass[colab.employmentStatus]}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {colab.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="truncate text-[14px] font-bold text-gray-900">{colab.fullName}</h4>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {colab.role}
                      {colab.employmentStatus === 'afastado' ? ' · Afastado' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-gray-400">Salário base</p>
                    <p className="text-sm font-black text-primary">
                      {colab.currentSalary > 0 ? formatSalarioBrl(colab.currentSalary) : '—'}
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-bold text-gray-400">Último reajuste</p>
                    <p className="text-sm font-bold text-gray-700">{colab.ultimoReajusteLabel}</p>
                  </div>
                  <div className="w-24 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${remuneracaoClass[colab.remuneracaoStatus]}`}
                    >
                      {colab.remuneracaoLabel}
                    </span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="hidden shrink-0 text-gray-300 transition-colors group-hover:text-primary sm:block"
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
        title="Exportar — Controle salarial"
        getTabularData={() => ({
          title: 'Controle salarial',
          filenameBase: 'rh-controle-salarial',
          columns: ['Nome', 'Cargo', 'Salário', 'Último reajuste', 'Status remuneração', 'Situação'],
          rows: allRows.map((c) => [
            c.fullName,
            c.role,
            c.currentSalary > 0 ? formatSalarioBrl(c.currentSalary) : '—',
            c.ultimoReajusteLabel,
            c.remuneracaoLabel,
            c.employmentStatus,
          ]),
        })}
      />
    </div>
  );
}
