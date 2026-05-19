import { useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import {
  LOGTA_DEMO_COMPANY_ID,
  resolveDemoCompanyId,
  seedLocalSandboxModules,
  shouldUseLogtaSandbox,
} from '../lib/seed';
import { seedOrcamentosSandbox } from '../modules/orcamento/orcamentoStorage';

/** Garante empresa demo + dados locais (ponto, perfis RH) para apresentação. */
export function LogtaSandboxBootstrap() {
  const { config } = useTenant();

  useEffect(() => {
    if (!shouldUseLogtaSandbox()) return;
    const companyId = resolveDemoCompanyId(config.id);
    seedLocalSandboxModules(companyId);
    seedOrcamentosSandbox(companyId);
  }, [config.id]);

  useEffect(() => {
    if (!shouldUseLogtaSandbox() || config.id) return;
    document.documentElement.dataset.logtaDemo = LOGTA_DEMO_COMPANY_ID;
  }, [config.id]);

  return null;
}
