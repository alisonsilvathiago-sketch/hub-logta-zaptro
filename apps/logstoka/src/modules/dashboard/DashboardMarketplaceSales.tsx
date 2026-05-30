import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import MarketplaceSalesSection from '@/modules/integrations/MarketplaceSalesSection';
import {
  downloadBaixaDocument,
  getAllMarketplaceSaleOrders,
  type MarketplaceSaleOrderWithSource,
} from '@/lib/marketplaceHub';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';

const DashboardMarketplaceSales: React.FC = () => {
  const initialOrders = useMemo(() => getAllMarketplaceSaleOrders(), []);
  const [orders, setOrders] = useState<MarketplaceSaleOrderWithSource[]>(initialOrders);

  const handleBaixa = (order: MarketplaceSaleOrderWithSource) => {
    const product = DEMO_PRODUCTS.find((p) => p.sku === order.sku);
    downloadBaixaDocument(order.marketplace, order, product);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: 'baixa_done' as const } : o)),
    );
    toast.success(`Documento de baixa gerado · ${order.marketplaceLabel} · ${order.orderRef}`);
  };

  return (
    <section className="ls-dashboard-panel !px-0 !pb-0">
      <MarketplaceSalesSection
        id="dashboard-vendas"
        orders={orders}
        onBaixa={handleBaixa}
        title="Vendas · Baixa de estoque"
        description="Pedidos pagos em Shopee, Mercado Livre, Amazon, TikTok Shop e Magalu. Pendentes em destaque."
        className="!px-0"
        showMarketplaceBadge
        layout="carousel"
        carouselVisibleCount={4}
      />
      <div className="border-t border-gray-50 px-6 py-3 sm:px-8">
        <Link
          to={LOGSTOKA_ROUTES.INTEGRATIONS_CENTRAL}
          className="text-[11px] font-bold uppercase tracking-wide text-orange-600 hover:underline"
        >
          Ver integrações por marketplace →
        </Link>
      </div>
    </section>
  );
};

export default DashboardMarketplaceSales;
