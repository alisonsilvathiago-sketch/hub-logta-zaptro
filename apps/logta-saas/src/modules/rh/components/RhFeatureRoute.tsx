import React from 'react';
import { Navigate } from 'react-router-dom';
import { getRhAdminHubConfig, getRhAdminHubForModule, getRhModule } from '../rhModules';
import { RhFeatureWorkspace } from './RhFeatureWorkspace';
import { ControlePontoView } from '../ponto/views/ControlePontoView';
import type { RhAdminHubId } from '../rhModules';
import type { RhModuleCategory } from '../types';

type RhFeatureRouteProps = {
  category: RhModuleCategory;
  slug: string;
  colaboradoresCount: number;
  motoristasCount: number;
  adminHubId?: RhAdminHubId;
};

const RH_ADMIN_FEATURE_PREFIXES = [
  '/rh/administrativo/',
  '/rh/jornada-ponto/',
  '/rh/documentos-compliance/',
];

export function RhFeatureRoute({
  category,
  slug,
  colaboradoresCount,
  motoristasCount,
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

  if (slug === 'controle-ponto' && category === 'admin') {
    return (
      <ControlePontoView
        hubPath={hubPath}
        hubLabel={hubLabel}
        colaboradoresCount={colaboradoresCount}
      />
    );
  }

  return (
    <RhFeatureWorkspace
      module={module}
      hubPath={hubPath}
      hubLabel={hubLabel}
      colaboradoresCount={colaboradoresCount}
      motoristasCount={motoristasCount}
    />
  );
}
