import React from 'react';
import { Link } from 'react-router-dom';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { marketplaceHubPath } from '@/lib/marketplaceHub';
import { getStoresByMarketplace } from '@/lib/marketplaceStores';
import { MARKETPLACE_LABELS } from '@/types';
import type { Marketplace } from '@/types';
import { SETTINGS_BASE } from '@/modules/settings/settingsNav';

const SettingsIntegrationsPanel: React.FC = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">Integrações</h2>
        <p className="mt-1 text-sm text-gray-500">
          <strong>Passo 1:</strong> conecte os marketplaces antes de publicar produtos. O LogStoka descobre todas as
          contas/lojas vinculadas à sua autenticação.
        </p>
      </div>
      <Link to={`${SETTINGS_BASE}/integracoes/marketplaces`} className="ls-btn-secondary">
        Ranking por marketplace
      </Link>
    </div>

    <div className="ls-hub-panel">
      <h3 className="text-sm font-black text-[#404040]">Contas conectadas</h3>
      <p className="mt-1 text-xs text-[#a3a3a3]">Após conectar, use Grupos e Publicação para escolher loja por loja.</p>
      <div className="mt-4 space-y-4">
        {(Object.entries(MARKETPLACE_LABELS) as [Marketplace, string][]).map(([key, label]) => {
          const stores = getStoresByMarketplace(key);
          return (
            <div key={key}>
              <p className="mb-2 flex items-center gap-2 text-sm font-bold text-[#525252]">
                <MarketplaceLogo marketplace={key} size={22} />
                {label}
              </p>
              <ul className="ml-6 space-y-1 border-l-2 border-orange-100 pl-4">
                {stores.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-sm font-semibold text-[#525252]">
                    <img src={s.logoUrl} alt="" className="h-6 w-6 rounded-md object-cover" />
                    {s.name}
                    <span className="ls-badge bg-orange-50 text-orange-700 text-[10px]">Conectada</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {(Object.entries(MARKETPLACE_LABELS) as [Marketplace, string][]).map(([key, label]) => {
        const stores = getStoresByMarketplace(key);
        const hubUrl = marketplaceHubPath(key);
        return (
          <Link
            key={key}
            to={hubUrl}
            className="ls-card block transition hover:border-orange-200 hover:shadow-md"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <MarketplaceLogo marketplace={key} size={32} />
              <div>
                <p className="font-black">{label}</p>
                <p className="text-[10px] font-bold text-orange-600">{hubUrl}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {stores.length} loja{stores.length !== 1 ? 's' : ''} · Dashboard · Produtos · Baixas automáticas
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stores.slice(0, 3).map((s) => (
                <img
                  key={s.id}
                  src={s.logoUrl}
                  alt=""
                  title={s.name}
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200"
                />
              ))}
            </div>
            <span className="ls-badge mt-3 bg-orange-50 text-orange-700">Abrir painel →</span>
          </Link>
        );
      })}
    </div>
  </div>
);

export default SettingsIntegrationsPanel;
