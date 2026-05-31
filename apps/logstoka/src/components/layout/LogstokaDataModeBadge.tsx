import React from 'react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';

const LogstokaDataModeBadge: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const isDemo = isLogstokaDemoCompany(companyId);

  if (isDemo) {
    return (
      <span
        className="ls-data-mode-badge ls-data-mode-badge--demo"
        title="Você está vendo dados de exemplo. Conecte sua empresa para operação real."
      >
        Demonstração
      </span>
    );
  }

  return (
    <span className="ls-data-mode-badge ls-data-mode-badge--live" title="Dados sincronizados da sua operação">
      Ao vivo
    </span>
  );
};

export default LogstokaDataModeBadge;
