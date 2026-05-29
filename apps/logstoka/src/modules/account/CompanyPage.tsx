import React from 'react';
import { LogstokaStandardPageLayout } from '@/components/layout/LogstokaStandardPageLayout';
import { MARKETPLACE_LABELS } from '@/types';

const CompanyPage: React.FC = () => (
  <LogstokaStandardPageLayout
    title="Minha empresa"
    subtitle="Operação WMS, depósitos e canais de venda configurados"
    kpis={[
      { label: 'Depósitos', value: '3' },
      { label: 'Marketplaces', value: String(Object.keys(MARKETPLACE_LABELS).length) },
      { label: 'SKUs ativos', value: '1.248' },
      { label: 'Integrações API', value: '5' },
    ]}
    mainContentTitle="Dados operacionais"
  >
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase text-gray-500">Razão social</p>
        <p className="mt-1 text-lg font-black text-gray-900">LogStoka Operações Demo</p>
      </div>
      <div className="rounded-2xl bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase text-gray-500">CNPJ</p>
        <p className="mt-1 text-lg font-black text-gray-900">00.000.000/0001-00</p>
      </div>
    </div>

    <div>
      <p className="mb-3 text-sm font-black text-gray-900">Canais configurados</p>
      <div className="flex flex-wrap gap-2">
        {Object.values(MARKETPLACE_LABELS).map((label) => (
          <span key={label} className="ls-badge bg-orange-50 text-orange-700">
            {label}
          </span>
        ))}
      </div>
    </div>
  </LogstokaStandardPageLayout>
);

export default CompanyPage;
