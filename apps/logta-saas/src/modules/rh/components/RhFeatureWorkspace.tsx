import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, FileCheck, Timer, AlertTriangle, Users, Plus } from 'lucide-react';
import { ExportFormatModal } from '../../../components/ExportFormatModal';
import { showToast } from '../../../components/Toast';
import { useTenant } from '../../../contexts/TenantContext';
import {
  getSandboxOperationalBundle,
  resolveDemoCompanyId,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { buildEquipeRouteId, equipeProfileUrl } from '../lib/equipeRouteId';
import {
  listColaboradorProfilesForCompany,
  type ColaboradorRhProfile,
  type RhEmploymentStatus,
} from '../ponto/colaboradorRhStorage';
import { getRhSectionById, isRhAdministrativoSectionId } from '../rhModules';
import type { RhModuleDef } from '../types';
import { LogtaStandardPageLayout } from '../../../components/LogtaStandardPageLayout';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { AprovacaoAtestadosView } from '../pessoas/views/AprovacaoAtestadosView';
import { AprovacaoFeriasView } from '../pessoas/views/AprovacaoFeriasView';
import { ContratacoesView } from '../pessoas/views/ContratacoesView';
import { DesligamentosView } from '../pessoas/views/DesligamentosView';
import { HistoricoFuncionarioView } from '../pessoas/views/HistoricoFuncionarioView';
import { ControleSalarialView } from '../pessoas/views/ControleSalarialView';
import type { RhColaboradorListItem } from '../lib/mergeRhColaboradores';

function loadContratadosProfiles(companyId: string): ColaboradorRhProfile[] {
  if (shouldUseLogtaSandbox()) {
    seedLocalSandboxModules(companyId);
  }
  const bundle = getSandboxOperationalBundle(companyId);
  const byId = new Map<string, ColaboradorRhProfile>();
  for (const p of bundle.colaboradorProfiles) {
    byId.set(p.id, { ...p, companyId: p.companyId || companyId });
  }
  for (const p of listColaboradorProfilesForCompany(companyId)) {
    byId.set(p.id, p);
  }
  return Array.from(byId.values())
    .filter((p) => p.employmentStatus !== 'desligado' && p.employmentStatus !== 'falecido')
    .sort((a, b) => {
      const da = a.admissionDate ? new Date(a.admissionDate).getTime() : 0;
      const db = b.admissionDate ? new Date(b.admissionDate).getTime() : 0;
      return db - da;
    });
}

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

type RhFeatureWorkspaceProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradoresCount?: number;
  motoristasCount?: number;
  colaboradores?: RhColaboradorListItem[];
};

export function RhFeatureWorkspace({
  module,
  hubPath,
  hubLabel,
  colaboradoresCount = 0,
  motoristasCount = 0,
  colaboradores = [],
}: RhFeatureWorkspaceProps) {
  if (module.slug === 'aprovacao-ferias') {
    return <AprovacaoFeriasView module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }
  if (module.slug === 'aprovacao-atestados') {
    return <AprovacaoAtestadosView module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }
  if (module.slug === 'contratacoes') {
    return (
      <ContratacoesView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }
  if (module.slug === 'desligamentos') {
    return (
      <DesligamentosView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }
  if (module.slug === 'historico-funcionario') {
    return (
      <HistoricoFuncionarioView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }
  if (module.slug === 'controle-salarial') {
    return (
      <ControleSalarialView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }

  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [exportOpen, setExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isContratacoes = module.slug === 'contratacoes';
  const contratados = useMemo(
    () => (isContratacoes ? loadContratadosProfiles(companyId) : []),
    [isContratacoes, companyId],
  );

  const kpis = useMemo(() => {
    if (isContratacoes) {
      const ativos = contratados.filter((p) => (p.employmentStatus ?? 'ativo') === 'ativo').length;
      const afastados = contratados.filter((p) => p.employmentStatus === 'afastado').length;
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
    }
    return [
      { title: 'Total Ativos', value: String(colaboradoresCount + motoristasCount || 15), trend: 'up' as const, trendValue: '+5%', icon: Users },
      { title: 'Pendências', value: '2', trend: 'down' as const, trendValue: '-1', icon: AlertTriangle },
      { title: 'Aprovados (mês)', value: '14', trend: 'up' as const, trendValue: '+12%', icon: FileCheck },
      { title: 'SLA Médio', value: '1.2h', trend: 'neutral' as const, icon: Timer },
    ];
  }, [colaboradoresCount, motoristasCount, contratados, isContratacoes]);

  const backPath =
    hubPath === '/rh/administrativo' && isRhAdministrativoSectionId(module.sectionId)
      ? `${hubPath}/${module.sectionId}`
      : hubPath;
  const sectionTitle = getRhSectionById(module.sectionId)?.title;
  const backLabel =
    hubPath === '/rh/administrativo' && sectionTitle ? sectionTitle : hubLabel;

  const mockItems = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    title: `Registro ${i + 1} - ${module.title}`,
    status: i % 2 === 0 ? 'Concluído' : 'Em Andamento',
    date: new Date(Date.now() - i * 86400000).toLocaleDateString('pt-BR'),
  }));

  const mainContentAction = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      title="Novo registro"
      aria-label="Novo registro"
      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={20} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="space-y-8 text-left">
      <Link
        to={backPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {backLabel}
      </Link>

      <LogtaStandardPageLayout
        title={module.title}
        kpis={kpis}
        mainContentTitle={isContratacoes ? 'Colaboradores contratados' : `Últimos registros de ${module.title}`}
        mainContentAction={mainContentAction}
        onExportPdf={() => setExportOpen(true)}
        onExportExcel={() => setExportOpen(true)}
      >
        <div className="space-y-3">
          {isContratacoes ? (
            contratados.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-500">
                Nenhum colaborador contratado na base RH. Cadastre pela equipe ou use Novo colaborador.
              </p>
            ) : (
              contratados.map((colab, i) => {
                const status = colab.employmentStatus ?? 'ativo';
                return (
                  <button
                    key={colab.id}
                    type="button"
                    onClick={() => navigate(equipeProfileUrl(buildEquipeRouteId(colab)))}
                    className="group flex w-full items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold text-gray-900">{colab.fullName}</p>
                        <p className="text-xs text-gray-500">
                          {[colab.role, colab.sector].filter(Boolean).join(' · ') || 'Colaborador'}
                        </p>
                        <p className="text-[10px] font-bold uppercase text-gray-400">
                          Admissão {formatAdmissionDate(colab.admissionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${employmentStatusClass[status]}`}
                      >
                        {employmentStatusLabel[status]}
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-gray-300 transition-colors group-hover:text-primary"
                      />
                    </div>
                  </button>
                );
              })
            )
          ) : (
            mockItems.map((item, i) => (
              <div
                key={i}
                className="group flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-sm font-black text-primary">
                    #{item.id + 1}
                  </div>
                  <div>
                    <p className="line-clamp-1 text-[14px] font-bold text-gray-900">{item.title}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">{item.date}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-6">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ${item.status === 'Concluído' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                  >
                    {item.status}
                  </span>
                  <ChevronRight size={18} className="hidden text-gray-300 transition-colors group-hover:text-primary sm:block" />
                </div>
              </div>
            ))
          )}
        </div>
      </LogtaStandardPageLayout>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Exportar — ${module.title}`}
        getTabularData={() =>
          isContratacoes
            ? {
                title: 'Colaboradores contratados',
                filenameBase: 'rh-contratacoes',
                columns: ['Nome', 'Cargo', 'Setor', 'Admissão', 'Status'],
                rows: contratados.map((c) => [
                  c.fullName,
                  c.role ?? '',
                  c.sector ?? '',
                  formatAdmissionDate(c.admissionDate),
                  employmentStatusLabel[c.employmentStatus ?? 'ativo'],
                ]),
              }
            : {
                title: module.title,
                filenameBase: `rh-${module.slug}`,
                columns: ['ID', 'Registro', 'Status', 'Data'],
                rows: mockItems.map((m) => [String(m.id + 1), m.title, m.status, m.date]),
              }
        }
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-200 items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Fechar"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            className="relative max-h-[min(92dvh,640px)] w-full max-w-lg overflow-y-auto rounded-t-[28px] border border-neutral-800 bg-[#18191B] p-6 text-left shadow-2xl duration-200 animate-in zoom-in-95 sm:rounded-[40px] sm:p-8"
            role="dialog"
            aria-modal="true"
          >
            <LogtaModalHeader
              icon={module.icon}
              title={`Novo registro: ${module.title}`}
              onClose={() => setIsModalOpen(false)}
            />
            
            <div className="mt-8 space-y-4">
              <p className="text-sm text-neutral-400">
                O formulário dinâmico para o módulo <strong className="text-white">{module.title}</strong> está em configuração.
              </p>
              
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 flex flex-col gap-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Título do Registro</label>
                   <input type="text" className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none" placeholder="Ex: Nova certificação ISO 9001" />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Descrição</label>
                   <textarea className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-sm font-medium text-white placeholder-neutral-600 focus:border-primary/50 outline-none resize-none" rows={3} placeholder="Descreva os detalhes..." />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl border border-neutral-700 py-3.5 text-sm font-bold text-neutral-300 transition-colors hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('success', 'Registro inserido com sucesso.', 'Sucesso');
                    setIsModalOpen(false);
                  }}
                  className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Salvar Registro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
