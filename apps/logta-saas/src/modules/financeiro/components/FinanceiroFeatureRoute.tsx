import React from 'react';
import { Navigate } from 'react-router-dom';
import { getFinanceiroModule } from '../financeiroModules';
import { FinanceiroControleDiariasView } from './FinanceiroControleDiariasView';
import { FinanceiroControleMultasView } from './FinanceiroControleMultasView';
import { FinanceiroMargemOperacionalView } from './FinanceiroMargemOperacionalView';
import { FinanceiroFeatureWorkspace } from './FinanceiroFeatureWorkspace';
import type { FinanceiroModuleCategory } from '../types';

type FinanceiroFeatureRouteProps = {
  category: FinanceiroModuleCategory;
  slug: string;
  transactionCount: number;
  saldo: number;
};

export function FinanceiroFeatureRoute({
  category,
  slug,
  transactionCount,
  saldo,
}: FinanceiroFeatureRouteProps) {
  const module = getFinanceiroModule(slug, category);

  if (!module) {
    return <Navigate to={category === 'operacional' ? '/financeiro/operacional' : '/financeiro/gestao'} replace />;
  }

  if (module.externalPath) {
    const internal =
      module.externalPath.startsWith('/financeiro/') &&
      !module.externalPath.includes('/operacional/') &&
      !module.externalPath.includes('/gestao/');
    const external =
      module.externalPath.startsWith('/frota') ||
      module.externalPath.startsWith('/rh') ||
      module.externalPath.startsWith('/logistica') ||
      module.externalPath.startsWith('/crm') ||
      module.externalPath.startsWith('/documentos');
    if (internal || external || module.externalPath.includes('?tab=')) {
      return <Navigate to={module.externalPath} replace />;
    }
  }

  const hubPath = category === 'operacional' ? '/financeiro/operacional' : '/financeiro/gestao';
  const hubLabel = category === 'operacional' ? 'Financeiro Operacional' : 'Gestão Financeira';

  if (slug === 'controle-diarias') {
    return <FinanceiroControleDiariasView module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }

  if (slug === 'margem-operacional') {
    return <FinanceiroMargemOperacionalView module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }

  if (slug === 'controle-multas') {
    return <FinanceiroControleMultasView module={module} hubPath={hubPath} hubLabel={hubLabel} />;
  }

  return (
    <FinanceiroFeatureWorkspace
      module={module}
      hubPath={hubPath}
      hubLabel={hubLabel}
      transactionCount={transactionCount}
      saldo={saldo}
    />
  );
}
