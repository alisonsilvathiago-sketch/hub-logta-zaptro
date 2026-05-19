import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Plus, Search, Sparkles } from 'lucide-react';
import { ExportFormatModal } from '../../../components/ExportFormatModal';
import { LogtaEmptyState } from '../../../components/EmptyState';
import { showToast } from '../../../components/Toast';
import { getRhSectionById, isRhAdministrativoSectionId } from '../rhModules';
import type { RhModuleDef } from '../types';

type RhFeatureWorkspaceProps = {
  module: RhModuleDef;
  hubPath: string;
  hubLabel: string;
  colaboradoresCount?: number;
  motoristasCount?: number;
};

export function RhFeatureWorkspace({
  module,
  hubPath,
  hubLabel,
  colaboradoresCount = 0,
  motoristasCount = 0,
}: RhFeatureWorkspaceProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [search, setSearch] = useState('');
  const Icon = module.icon;

  const kpis = useMemo(() => {
    const base = module.kpis ?? [
      { label: 'Registros ativos', value: String(colaboradoresCount + motoristasCount), tone: 'primary' as const },
      { label: 'Pendências', value: '0', tone: 'danger' as const },
      { label: 'Aprovados (mês)', value: '—', tone: 'success' as const },
      { label: 'SLA médio', value: '—', tone: 'primary' as const },
    ];
    return base;
  }, [module.kpis, colaboradoresCount, motoristasCount]);

  const integrationLabels: Record<string, string> = {
    frota: 'Frota',
    financeiro: 'Financeiro',
    logdock: 'LogDock',
    logistica: 'Logística',
    rastreamento: 'Rastreamento',
  };

  const backPath =
    hubPath === '/rh/administrativo' && isRhAdministrativoSectionId(module.sectionId)
      ? `${hubPath}/${module.sectionId}`
      : hubPath;
  const sectionTitle = getRhSectionById(module.sectionId)?.title;
  const backLabel =
    hubPath === '/rh/administrativo' && sectionTitle ? sectionTitle : hubLabel;

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-500">
      <Link
        to={backPath}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para {backLabel}
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon size={26} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h2 className="logta-page-title text-2xl sm:text-3xl">{module.title}</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500">{module.description}</p>
            {module.integrations?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {module.integrations.map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-normal text-gray-600"
                  >
                    {integrationLabels[key]}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setExportOpen(true)} className="hub-premium-pill secondary">
            <Download size={16} /> Exportar
          </button>
          <button
            type="button"
            onClick={() => showToast('info', `Fluxo "${module.title}" em configuração. Dados sincronizados com Supabase.`, 'RH')}
            className="hub-premium-pill primary"
          >
            <Plus size={16} /> Novo registro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="logta-stat-card">
            <p className="logta-stat-card__label logta-stat-card__label--spaced">{kpi.label}</p>
            <p className="logta-dashboard-stat-card__value logta-dashboard-stat-card__value--primary logta-dashboard-stat-card__value--lg">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="logta-performance-section grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="logta-panel-card overflow-hidden lg:col-span-2">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar em ${module.title}...`}
                className="w-full rounded-2xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary/50"
              />
            </div>
            <button type="button" className="hub-premium-pill secondary shrink-0">
              <Filter size={16} /> Filtros avançados
            </button>
          </div>
          <div className="p-6">
            <LogtaEmptyState
              type="rh"
              onAction={() => showToast('info', 'Cadastre colaboradores ou motoristas para popular este módulo.', module.title)}
            />
          </div>
        </div>

        <div className="space-y-6">
          {module.iaEnabled ? (
            <div className="logta-panel-card--dark logta-panel-card--retention p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-primary" />
                <h3 className="logta-card-heading text-white">Logta IA</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-gray-300">
                Monitoramento inteligente ativo para <strong className="text-white">{module.title}</strong>.
                Alertas preditivos serão exibidos conforme dados operacionais forem sincronizados.
              </p>
              <button
                type="button"
                onClick={() => showToast('success', 'Regras de IA aplicadas a este módulo.', 'Logta IA')}
                className="mt-6 w-full rounded-xl bg-primary py-3 text-xs font-bold text-white hover:opacity-90"
              >
                Ativar alertas IA
              </button>
            </div>
          ) : (
            <div className="logta-panel-card p-6">
              <h3 className="logta-card-heading mb-4">Atividade recente</h3>
              <p className="text-sm text-gray-400">Nenhum evento registrado ainda neste módulo.</p>
            </div>
          )}

          <div className="logta-panel-card p-6">
            <h3 className="logta-card-heading mb-4">Conformidade</h3>
            <ul className="space-y-3 text-xs font-medium text-gray-600">
              <li className="flex justify-between gap-2">
                <span>Auditoria RH</span>
                <span className="font-black text-green-600">Ativa</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Logs de atividade</span>
                <span className="font-black text-primary">Sincronizado</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>Permissões</span>
                <span className="font-black text-gray-900">Por cargo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <ExportFormatModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Exportar — ${module.title}`}
        getTabularData={() => ({
          title: module.title,
          filenameBase: `rh-${module.slug}`,
          columns: ['Campo', 'Valor'],
          rows: [
            ['Módulo', module.title],
            ['Categoria', module.category],
            ['Colaboradores', String(colaboradoresCount)],
            ['Motoristas', String(motoristasCount)],
            ['Busca', search || '—'],
          ],
        })}
      />
    </div>
  );
}
