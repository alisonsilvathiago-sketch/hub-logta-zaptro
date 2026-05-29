import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileCheck, Timer, UserMinus, Users } from 'lucide-react';
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

type DesligamentosViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradores?: RhColaboradorListItem[];
};

const statusLabel: Record<RhEmploymentStatus, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  desligado: 'Desligado',
  falecido: 'Falecido',
};

const statusClass: Record<RhEmploymentStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  afastado: 'bg-amber-100 text-amber-800',
  desligado: 'bg-gray-200 text-gray-700',
  falecido: 'bg-slate-700 text-white',
};

function DesligadoListItem({
  colab,
  index,
  onOpen,
}: {
  colab: RhProfileCatalogRow;
  index: number;
  onOpen: () => void;
}) {
  const term = colab.lastEvent;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-black text-gray-600">
          #{index + 1}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-gray-900">{colab.fullName}</p>
          <p className="text-xs text-gray-500">
            {[colab.role, colab.sector].filter((x) => x && x !== '—').join(' · ')}
          </p>
          <p className="text-[10px] font-bold uppercase text-gray-400">
            Desligamento {formatRhDate(term?.at)}
            {term?.detail ? ` · ${term.detail}` : ''}
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

export function DesligamentosView({
  module,
  hubPath,
  hubLabel,
  colaboradores = [],
}: DesligamentosViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);

  const desligados = useMemo(
    () =>
      buildRhProfileCatalogRows(companyId, colaboradores, {
        employmentFilter: (s) => s === 'desligado' || s === 'falecido',
      }).sort((a, b) => {
        const da = a.lastEvent?.at ? new Date(a.lastEvent.at).getTime() : 0;
        const db = b.lastEvent?.at ? new Date(b.lastEvent.at).getTime() : 0;
        return db - da;
      }),
    [companyId, colaboradores],
  );

  const kpis = useMemo(() => {
    const desligado = desligados.filter((p) => p.status === 'desligado').length;
    const falecido = desligados.filter((p) => p.status === 'falecido').length;
    const esteMes = desligados.filter((p) => {
      if (!p.lastEvent?.at) return false;
      const d = new Date(p.lastEvent.at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return [
      { title: 'Total desligados', value: String(desligados.length), trend: 'neutral' as const, icon: UserMinus },
      { title: 'Desligamentos', value: String(desligado), trend: 'neutral' as const, icon: Users },
      { title: 'Falecimentos', value: String(falecido), trend: 'neutral' as const, icon: FileCheck },
      { title: 'No mês corrente', value: String(esteMes), trend: 'up' as const, trendValue: 'Corrente', icon: Timer },
    ];
  }, [desligados]);

  const openProfile = (row: RhProfileCatalogRow) => {
    navigate(`${equipeProfileUrl(row.equipeRouteId)}/timeline`, {
      state: {
        rhReturnTo: '/rh/administrativo/desligamentos',
        rhReturnLabel: 'Desligamentos',
        rhDismissedProfile: true,
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
        mainContentTitle="Colaboradores desligados"
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {desligados.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum desligamento registrado. Altere a situação para &quot;Desligado&quot; no perfil do colaborador
              em Equipe RH.
            </p>
          ) : (
            desligados.map((colab, i) => (
              <DesligadoListItem
                key={colab.key}
                colab={colab}
                index={i}
                onOpen={() => openProfile(colab)}
              />
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar — Desligamentos"
        getTabularData={() => ({
          title: 'Desligamentos RH',
          filenameBase: 'rh-desligamentos',
          columns: ['Nome', 'Cargo', 'Setor', 'Data desligamento', 'Situação'],
          rows: desligados.map((c) => [
            c.fullName,
            c.role,
            c.sector,
            formatRhDate(c.lastEvent?.at),
            statusLabel[c.status],
          ]),
        })}
      />
    </div>
  );
}
