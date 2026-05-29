import React from 'react';
import { Link } from 'react-router-dom';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { DEMO_STORE_GROUPS, getStoreById } from '@/lib/productPublication';
import { MARKETPLACE_LABELS } from '@/types';

const ProductStoreGroupsPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Grupos de lojas</h2>
      <p className="text-sm text-[#a3a3a3]">
        Agrupe contas do mesmo segmento para publicar em lote — ex.: Bebê em Shopee + ML + Amazon
      </p>
    </div>

    <div className="ls-hub-panel text-sm text-[#525252]">
      <p>
        Primeiro conecte os marketplaces em{' '}
        <Link to="/app/configuracoes/integracoes" className="font-bold text-orange-700 hover:underline">
          Configurações → Integrações
        </Link>
        . O LogStoka lista automaticamente todas as contas/lojas encontradas.
      </p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      {DEMO_STORE_GROUPS.map((group) => (
        <div key={group.id} className="ls-hub-panel">
          <h3 className="text-base font-black text-[#404040]">{group.name}</h3>
          <p className="mt-1 text-sm text-[#a3a3a3]">{group.description}</p>
          <ul className="mt-4 space-y-2">
            {group.storeIds.map((storeId) => {
              const store = getStoreById(storeId);
              if (!store) return null;
              return (
                <li key={storeId} className="flex items-center gap-2 text-sm font-semibold text-[#525252]">
                  <MarketplaceLogo marketplace={store.marketplace} size={20} />
                  <img src={store.logoUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
                  {store.name}
                  <span className="text-xs font-medium text-[#a3a3a3]">
                    ({MARKETPLACE_LABELS[store.marketplace]})
                  </span>
                </li>
              );
            })}
          </ul>
          <Link to="/app/products/publicacao" className="ls-btn-secondary mt-4 inline-flex text-xs">
            Usar na publicação →
          </Link>
        </div>
      ))}
    </div>
  </div>
);

export default ProductStoreGroupsPage;
