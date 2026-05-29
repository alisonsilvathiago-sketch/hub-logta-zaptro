import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  History,
  UserCheck,
  UserMinus,
} from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { useTenant } from '../../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../../lib/seed';
import { equipeProfileUrl } from '../../lib/equipeRouteId';
import {
  buildRhProfileCatalogRows,
  formatRhDate,
  type RhProfileCatalogRow,
} from '../../lib/rhProfileCatalog';
import type { RhColaboradorListItem } from '../../lib/mergeRhColaboradores';
import type { RhEmploymentStatus } from '../../ponto/colaboradorRhStorage';
import type { RhModuleDef } from '../../types';

type HistoricoFuncionarioViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradores?: RhColaboradorListItem[];
};

const statusLabel: Record<RhEmploymentStatus, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  desligado: 'Ex-colaborador',
  falecido: 'Falecido',
};

const statusClass: Record<RhEmploymentStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  afastado: 'bg-amber-100 text-amber-800',
  desligado: 'bg-gray-200 text-gray-700',
  falecido: 'bg-slate-700 text-white',
};

type HistoricoSection = {
  id: string;
  title: string;
  description: string;
  items: RhProfileCatalogRow[];
};

function HistoricoRow({
  colab,
  index,
  onOpen,
}: {
  colab: RhProfileCatalogRow;
  index: number;
  onOpen: () => void;
}) {
  const subtitle = colab.lastEvent
    ? `${colab.lastEvent.title} · ${formatRhDate(colab.lastEvent.at)}`
    : colab.admissionDate
      ? `Admissão ${formatRhDate(colab.admissionDate)}`
      : 'Sem eventos no dossiê';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
          #{index + 1}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-gray-900">{colab.fullName}</p>
          <p className="text-xs text-gray-500">
            {[colab.role, colab.sector].filter((x) => x && x !== '—').join(' · ')}
          </p>
          <p className="line-clamp-1 text-[10px] font-semibold text-gray-500">{subtitle}</p>
          <p className="text-[10px] font-bold uppercase text-gray-400">
            {colab.timelineCount} evento(s) no histórico
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[colab.status]}`}
        >
          {statusLabel[colab.status]}
        </span>
        <ChevronRight size={18} className="text-gray-300 transition-colors group-hover:text-primary" />
      </div>
    </button>
  );
}

function HistoricoSectionBlock({
  section,
  onOpen,
}: {
  section: HistoricoSection;
  onOpen: (row: RhProfileCatalogRow) => void;
}) {
  if (section.items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-600">{section.title}</h4>
        <p className="mt-1 text-xs font-medium text-gray-500">{section.description}</p>
        <p className="mt-1 text-[10px] font-bold text-primary">{section.items.length} pessoa(s)</p>
      </div>
      <div className="space-y-2">
        {section.items.map((colab, i) => (
          <HistoricoRow
            key={colab.key}
            colab={colab}
            index={i}
            onOpen={() => onOpen(colab)}
          />
        ))}
      </div>
    </section>
  );
}

export function HistoricoFuncionarioView({
  module,
  hubPath,
  hubLabel,
  colaboradores = [],
}: HistoricoFuncionarioViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);

  const todos = useMemo(
    () => buildRhProfileCatalogRows(companyId, colaboradores),
    [companyId, colaboradores],
  );

  const sections = useMemo((): HistoricoSection[] => {
    const ativos = todos.filter((p) => p.status === 'ativo');
    const afastados = todos.filter((p) => p.status === 'afastado');
    const exColaboradores = todos.filter((p) => p.status === 'desligado' || p.status === 'falecido');

    return [
      {
        id: 'ativos',
        title: 'Na empresa hoje',
        description: 'Colaboradores com vínculo ativo — admissão, metas, ponto e documentos.',
        items: ativos,
      },
      {
        id: 'afastados',
        title: 'Afastados',
        description: 'Afastamento temporário — histórico preservado no dossiê.',
        items: afastados,
      },
      {
        id: 'ex',
        title: 'Já passaram pela empresa',
        description: 'Ex-colaboradores e registros encerrados — linha do tempo completa no perfil.',
        items: exColaboradores,
      },
    ];
  }, [todos]);

  const kpis = useMemo(() => {
    const ativos = todos.filter((p) => p.status === 'ativo').length;
    const ex = todos.filter((p) => p.status === 'desligado' || p.status === 'falecido').length;
    const comTimeline = todos.filter((p) => p.timelineCount > 0).length;
    return [
      { title: 'Total no histórico', value: String(todos.length), trend: 'neutral' as const, icon: History },
      { title: 'Ativos', value: String(ativos), trend: 'up' as const, trendValue: 'Hoje', icon: UserCheck },
      { title: 'Ex-colaboradores', value: String(ex), trend: 'neutral' as const, icon: UserMinus },
      { title: 'Com dossiê', value: String(comTimeline), trend: 'neutral' as const, icon: Clock },
    ];
  }, [todos]);

  const openProfile = (row: RhProfileCatalogRow) => {
    const dismissed = row.status === 'desligado' || row.status === 'falecido';
    const profilePath = `${equipeProfileUrl(row.equipeRouteId)}/timeline`;
    navigate(profilePath, {
      state: {
        rhReturnTo: '/rh/administrativo/historico-funcionario',
        rhReturnLabel: 'Histórico do Funcionário',
        rhDismissedProfile: dismissed,
      },
    });
  };

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
        kpis={kpis}
        mainContentTitle="Todos que já passaram pela empresa"
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-8">
          {todos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum colaborador na base RH. Cadastre pela Equipe RH para montar o histórico.
            </p>
          ) : (
            sections.map((section) => (
              <HistoricoSectionBlock key={section.id} section={section} onOpen={openProfile} />
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar — Histórico do Funcionário"
        getTabularData={() => ({
          title: 'Histórico de colaboradores',
          filenameBase: 'rh-historico-funcionario',
          columns: ['Nome', 'Cargo', 'Setor', 'Situação', 'Eventos', 'Último evento'],
          rows: todos.map((c) => [
            c.fullName,
            c.role,
            c.sector,
            statusLabel[c.status],
            String(c.timelineCount),
            c.lastEvent ? `${c.lastEvent.title} (${formatRhDate(c.lastEvent.at)})` : '—',
          ]),
        })}
      />
    </div>
  );
}
