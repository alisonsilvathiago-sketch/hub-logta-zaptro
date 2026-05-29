import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileCheck, Plus, Timer, AlertTriangle, Users } from 'lucide-react';
import { LogtaStandardPageLayout } from '../../../../components/LogtaStandardPageLayout';
import { ExportFormatModal } from '../../../../components/ExportFormatModal';
import { showToast } from '../../../../components/Toast';
import { useTenant } from '../../../../contexts/TenantContext';
import {
  refreshSandboxRhProfiles,
  resolveDemoCompanyId,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../../lib/seed';
import { buildEquipeRouteId, equipeProfileUrl } from '../../lib/equipeRouteId';
import type { RhColaboradorListItem } from '../../lib/mergeRhColaboradores';
import {
  findColaboradorRhProfileByRouteId,
  listColaboradorProfilesForCompany,
  type ColaboradorRhProfile,
  type RhEmploymentStatus,
} from '../../ponto/colaboradorRhStorage';
import { getSandboxOperationalBundle } from '../../../../lib/seed';
import type { RhModuleDef } from '../../types';

type ContratacoesViewProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradores?: RhColaboradorListItem[];
};

type ContratadoRow = {
  key: string;
  equipeRouteId: string;
  fullName: string;
  role: string;
  sector: string;
  admissionDate?: string;
  status: RhEmploymentStatus;
};

function formatAdmissionDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

const employmentStatusLabel: Record<RhEmploymentStatus, string> = {
  ativo: 'Contratado',
  afastado: 'Afastado',
  desligado: 'Desligado',
  falecido: 'Falecido',
};

const employmentStatusClass: Record<RhEmploymentStatus, string> = {
  ativo: 'bg-green-100 text-green-700',
  afastado: 'bg-amber-100 text-amber-800',
  desligado: 'bg-gray-100 text-gray-600',
  falecido: 'bg-gray-100 text-gray-600',
};

function loadAllRhProfiles(companyId: string): ColaboradorRhProfile[] {
  if (shouldUseLogtaSandbox()) {
    seedLocalSandboxModules(companyId);
    refreshSandboxRhProfiles(companyId);
  }
  const bundle = getSandboxOperationalBundle(companyId);
  const byId = new Map<string, ColaboradorRhProfile>();
  for (const p of bundle.colaboradorProfiles) {
    byId.set(p.id, { ...p, companyId: p.companyId || companyId });
  }
  for (const p of listColaboradorProfilesForCompany(companyId)) {
    byId.set(p.id, p);
  }
  return Array.from(byId.values()).filter(
    (p) => p.employmentStatus !== 'desligado' && p.employmentStatus !== 'falecido',
  );
}

function buildContratadoRows(
  companyId: string,
  colaboradoresEquipe: RhColaboradorListItem[],
): ContratadoRow[] {
  const profiles = loadAllRhProfiles(companyId);
  const profileByRoute = new Map<string, ColaboradorRhProfile>();
  for (const p of profiles) {
    profileByRoute.set(buildEquipeRouteId(p), p);
    if (p.id) profileByRoute.set(p.id, p);
  }

  const rows = new Map<string, ContratadoRow>();

  const addRow = (routeId: string, name: string, profile?: ColaboradorRhProfile | null, fallback?: RhColaboradorListItem) => {
    const rh = profile ?? findColaboradorRhProfileByRouteId(companyId, routeId);
    const key = routeId || name;
    if (!key || rows.has(key)) return;
    rows.set(key, {
      key,
      equipeRouteId: routeId,
      fullName: rh?.fullName ?? name,
      role: rh?.role ?? fallback?.role ?? 'Colaborador',
      sector: rh?.sector ?? fallback?.department ?? '—',
      admissionDate: rh?.admissionDate ?? fallback?.created_at,
      status: rh?.employmentStatus ?? 'ativo',
    });
  };

  for (const c of colaboradoresEquipe) {
    addRow(c.equipeRouteId || c.id, c.full_name, profileByRoute.get(c.equipeRouteId || c.id), c);
  }

  for (const p of profiles) {
    addRow(buildEquipeRouteId(p), p.fullName, p);
  }

  return Array.from(rows.values()).sort((a, b) => {
    const da = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
    const db = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
    return db - da;
  });
}

export function ContratacoesView({
  module,
  hubPath,
  hubLabel,
  colaboradores = [],
}: ContratacoesViewProps) {
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);

  const contratados = useMemo(
    () => buildContratadoRows(companyId, colaboradores),
    [companyId, colaboradores],
  );

  const kpis = useMemo(() => {
    const ativos = contratados.filter((p) => p.status === 'ativo').length;
    const afastados = contratados.filter((p) => p.status === 'afastado').length;
    const esteMes = contratados.filter((p) => {
      if (!p.admissionDate) return false;
      const d = new Date(p.admissionDate);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return [
      { title: 'Colaboradores contratados', value: String(contratados.length), trend: 'up' as const, trendValue: 'Base RH', icon: Users },
      { title: 'Ativos', value: String(ativos), trend: 'neutral' as const, icon: FileCheck },
      { title: 'Afastados', value: String(afastados), trend: 'neutral' as const, icon: AlertTriangle },
      { title: 'Admissões no mês', value: String(esteMes), trend: 'up' as const, trendValue: 'Corrente', icon: Timer },
    ];
  }, [contratados]);

  const mainContentAction = (
    <button
      type="button"
      onClick={() => showToast('info', 'Use Equipe RH ou o botão + no menu para novo colaborador.', 'Nova contratação')}
      title="Nova contratação"
      aria-label="Nova contratação"
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
        kpis={kpis}
        mainContentTitle="Colaboradores contratados"
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {contratados.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
              Nenhum colaborador na base. Cadastre em Equipe RH.
            </p>
          ) : (
            contratados.map((colab, i) => (
              <button
                key={colab.key}
                type="button"
                onClick={() => navigate(equipeProfileUrl(colab.equipeRouteId))}
                className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-gray-900">{colab.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {[colab.role, colab.sector].filter((x) => x && x !== '—').join(' · ') || 'Colaborador'}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Admissão {formatAdmissionDate(colab.admissionDate)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${employmentStatusClass[colab.status]}`}
                  >
                    {employmentStatusLabel[colab.status]}
                  </span>
                  <ChevronRight size={18} className="text-gray-300 transition-colors group-hover:text-primary" />
                </div>
              </button>
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Exportar — Contratações"
        getTabularData={() => ({
          title: 'Colaboradores contratados',
          filenameBase: 'rh-contratacoes',
          columns: ['Nome', 'Cargo', 'Setor', 'Admissão', 'Status'],
          rows: contratados.map((c) => [
            c.fullName,
            c.role,
            c.sector,
            formatAdmissionDate(c.admissionDate),
            employmentStatusLabel[c.status],
          ]),
        })}
      />
    </div>
  );
}
