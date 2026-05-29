import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { getAllConnectedStores } from '@/lib/productPublication';
import { MARKETPLACE_LABELS } from '@/types';
import type { MarketplaceStoreStats } from '@/lib/marketplaceStores';

function syncStatusBadge(status: MarketplaceStoreStats['status']): { className: string; label: string } {
  switch (status) {
    case 'connected':
      return { className: 'bg-green-50 text-green-800', label: 'Ativo' };
    case 'syncing':
      return { className: 'bg-yellow-50 text-yellow-800', label: 'Sincronizando' };
    case 'warning':
      return { className: 'bg-red-50 text-red-800', label: 'Erro' };
    default:
      return { className: 'bg-yellow-50 text-yellow-800', label: 'Sincronizando' };
  }
}

const ProductSyncPage: React.FC = () => {
  const stores = getAllConnectedStores();

  return (
    <div className="space-y-6">
      <div>
        <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Sincronização</h2>
        <p className="text-sm text-[#a3a3a3]">
          Após publicar, o LogStoka recebe vendas e envia estoque/preço por loja conectada
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="ls-hub-panel">
          <p className="flex items-center gap-2 text-sm font-black text-[#404040]">
            <ArrowDownLeft size={18} className="text-orange-600" />
            Receber (marketplace → LogStoka)
          </p>
          <ul className="mt-3 space-y-1 text-sm font-medium text-[#a3a3a3]">
            <li>Pedido criado / pago / enviado / entregue</li>
            <li>Cancelamento e devolução</li>
            <li>Atualização de estoque no canal</li>
          </ul>
        </div>
        <div className="ls-hub-panel">
          <p className="flex items-center gap-2 text-sm font-black text-[#404040]">
            <ArrowUpRight size={18} className="text-orange-600" />
            Enviar (LogStoka → marketplace)
          </p>
          <ul className="mt-3 space-y-1 text-sm font-medium text-[#a3a3a3]">
            <li>Estoque disponível</li>
            <li>Preço e promocional</li>
            <li>Fotos e descrição (quando alterados)</li>
          </ul>
        </div>
      </div>

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>Loja</th>
              <th>Marketplace</th>
              <th>Sync</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => {
              const badge = syncStatusBadge(s.status);
              return (
              <tr key={s.id}>
                <td className="font-bold">
                  <span className="inline-flex items-center gap-2">
                    <img src={s.logoUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    {s.name}
                  </span>
                </td>
                <td>
                  <span className="inline-flex items-center gap-2">
                    <MarketplaceLogo marketplace={s.marketplace} size={20} />
                    {MARKETPLACE_LABELS[s.marketplace]}
                  </span>
                </td>
                <td>{s.syncPercent}%</td>
                <td>
                  <span className={`ls-badge ${badge.className}`}>{badge.label}</span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-[#a3a3a3]">
        Logs detalhados em{' '}
        <Link to="/app/configuracoes/api-webhooks" className="font-semibold text-orange-700 hover:underline">
          API e Webhooks
        </Link>
        {' '}·{' '}
        <Link to="/app/configuracoes/auditoria?tab=interacoes" className="font-semibold text-orange-700 hover:underline">
          Interações
        </Link>
      </p>
    </div>
  );
};

export default ProductSyncPage;
