import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRhAdminHubConfig, getRhAdminHubForModule, getRhModule } from '../rhModules';
import { RhFeatureWorkspace } from './RhFeatureWorkspace';
import { ControlePontoView } from '../ponto/views/ControlePontoView';
import { ControleSalarialView } from '../pessoas/views/ControleSalarialView';
import { ContratacoesView } from '../pessoas/views/ContratacoesView';
import { DesligamentosView } from '../pessoas/views/DesligamentosView';
import { HistoricoFuncionarioView } from '../pessoas/views/HistoricoFuncionarioView';
import { AprovacaoAtestadosView } from '../pessoas/views/AprovacaoAtestadosView';
import { AprovacaoFeriasView } from '../pessoas/views/AprovacaoFeriasView';
import { PerformanceIndividualView } from '../performance/views/PerformanceIndividualView';
import { TreinamentosView } from '../performance/views/TreinamentosView';
import { MetasKpiView } from '../performance/views/MetasKpiView';
import { CertificadosView } from '../performance/views/CertificadosView';
import { IaPerformanceView } from '../performance/views/IaPerformanceView';
import { ComunicacaoInternaView } from '../comunicacao/views/ComunicacaoInternaView';
import { AvisosComunicadosView } from '../comunicacao/views/AvisosComunicadosView';
import { SolicitacoesInternasView } from '../comunicacao/views/SolicitacoesInternasView';
import { ChatInternoRhView } from '../comunicacao/views/ChatInternoRhView';
import { SuporteColaboradorView } from '../comunicacao/views/SuporteColaboradorView';
import { RelatoriosRhView } from '../governanca/views/RelatoriosRhView';
import { LogsAtividadeView } from '../governanca/views/LogsAtividadeView';
import { PermissoesCargosView } from '../governanca/views/PermissoesCargosView';
import { AuditoriaRhView } from '../governanca/views/AuditoriaRhView';
import { IaJornadaExcessivaView } from '../governanca/views/IaJornadaExcessivaView';
import { IaAlertasOperacionaisView } from '../governanca/views/IaAlertasOperacionaisView';
import type { RhAdminHubId } from '../rhModules';
import type { RhColaboradorListItem } from '../lib/mergeRhColaboradores';
import type { RhModuleCategory } from '../types';

type RhFeatureRouteProps = {
  category: RhModuleCategory;
  slug: string;
  colaboradoresCount: number;
  motoristasCount: number;
  colaboradores?: RhColaboradorListItem[];
  adminHubId?: RhAdminHubId;
};

const RH_ADMIN_FEATURE_PREFIXES = [
  '/rh/administrativo/',
  '/rh/jornada-ponto/',
  '/rh/documentos-compliance/',
];

type ModuleViewProps = {
  module: NonNullable<ReturnType<typeof getRhModule>>;
  hubPath: string;
  hubLabel: string;
};

const SLUG_VIEW_MAP: Record<string, React.ComponentType<ModuleViewProps>> = {
  // Performance & Desenvolvimento
  'performance-individual': PerformanceIndividualView,
  'metas-kpi': MetasKpiView,
  'treinamentos': TreinamentosView,
  'certificados': CertificadosView,
  'ia-performance': IaPerformanceView,
  // Comunicação Interna
  'comunicacao-interna': ComunicacaoInternaView,
  'avisos-comunicados': AvisosComunicadosView,
  'solicitacoes-internas': SolicitacoesInternasView,
  'chat-interno-rh': ChatInternoRhView,
  'suporte-colaborador': SuporteColaboradorView,
  // Governança & Integrações
  'relatorios-rh': RelatoriosRhView,
  'logs-atividade': LogsAtividadeView,
  'permissoes-cargos': PermissoesCargosView,
  'auditoria-rh': AuditoriaRhView,
  'ia-jornada-excessiva': IaJornadaExcessivaView,
  'ia-alertas-operacionais': IaAlertasOperacionaisView,
};

export function RhFeatureRoute({
  category,
  slug,
  colaboradoresCount,
  motoristasCount,
  colaboradores = [],
  adminHubId,
}: RhFeatureRouteProps) {
  const module = getRhModule(slug, category);

  if (!module) {
    const fallback =
      category === 'admin'
        ? getRhAdminHubConfig(adminHubId ?? 'administrativo').path
        : '/rh/operacional';
    return <Navigate to={fallback} replace />;
  }

  const resolvedAdminHub = category === 'admin' ? (adminHubId ?? getRhAdminHubForModule(module)) : null;
  const adminHub = resolvedAdminHub ? getRhAdminHubConfig(resolvedAdminHub) : null;

  if (
    module.externalPath &&
    !RH_ADMIN_FEATURE_PREFIXES.some((p) => module.externalPath!.includes(p)) &&
    !module.externalPath.includes('/rh/operacional/')
  ) {
    const isInternalRh =
      module.externalPath.startsWith('/rh/') &&
      !module.externalPath.includes('/administrativo/') &&
      !module.externalPath.includes('/jornada-ponto/') &&
      !module.externalPath.includes('/documentos-compliance/') &&
      !module.externalPath.includes('/operacional/');
    if (
      isInternalRh ||
      module.externalPath.startsWith('/frota') ||
      module.externalPath.startsWith('/financeiro') ||
      module.externalPath.startsWith('/pgr') ||
      module.externalPath.startsWith('/logistica') ||
      module.externalPath.startsWith('/mapa')
    ) {
      return <Navigate to={module.externalPath} replace />;
    }
  }

  const hubPath = category === 'admin' ? adminHub!.path : '/rh/operacional';
  const hubLabel = category === 'admin' ? adminHub!.label : 'RH Operacional';

  // Dedicated view for Controle de Ponto (requires extra props)
  if (slug === 'controle-ponto' && category === 'admin') {
    return (
      <ControlePontoView
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradoresCount={colaboradoresCount}
      />
    );
  }

  if (slug === 'contratacoes' && category === 'admin') {
    return (
      <ContratacoesView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }

  if (slug === 'desligamentos' && category === 'admin') {
    return (
      <DesligamentosView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }

  if (slug === 'historico-funcionario' && category === 'admin') {
    return (
      <HistoricoFuncionarioView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }

  if (slug === 'aprovacao-atestados' && category === 'admin') {
    return (
      <AprovacaoAtestadosView module={module} hubPath={hubPath} hubLabel={hubLabel} />
    );
  }

  if (slug === 'aprovacao-ferias' && category === 'admin') {
    return (
      <AprovacaoFeriasView module={module} hubPath={hubPath} hubLabel={hubLabel} />
    );
  }

  // Dedicated view for Controle Salarial (requires extra props)
  if (slug === 'controle-salarial' && category === 'admin') {
    return (
      <ControleSalarialView
        module={module}
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradores={colaboradores}
      />
    );
  }

  // All views registered in SLUG_VIEW_MAP
  if (category === 'admin' && slug in SLUG_VIEW_MAP) {
    const ViewComponent = SLUG_VIEW_MAP[slug];
    return <ViewComponent module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }

  return (
    <RhFeatureWorkspace
      module={module}
      hubPath={hubPath}
      hubLabel={hubLabel}
      colaboradoresCount={colaboradoresCount}
      motoristasCount={motoristasCount}
      colaboradores={colaboradores}
    />
  );
}
