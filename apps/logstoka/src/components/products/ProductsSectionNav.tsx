import React from 'react';
import { Layers, Megaphone, Package, RefreshCw } from 'lucide-react';
import LogstokaIconNav, { type LogstokaIconNavLinkItem } from '@/components/ui/LogstokaIconNav';
import { useMarketplaceModule } from '@/hooks/useMarketplaceModule';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

type TabItem = {
  to: string;
  label: string;
  Icon: typeof Package;
  end?: boolean;
  marketplaceOnly?: boolean;
};

const baseTabs: TabItem[] = [
  { to: LOGSTOKA_ROUTES.PRODUCTS, label: 'Cadastro', Icon: Package, end: true },
  { to: LOGSTOKA_ROUTES.PRODUCT_GROUPS, label: 'Grupos', Icon: Layers, marketplaceOnly: true },
  { to: LOGSTOKA_ROUTES.PRODUCT_PUBLICATION, label: 'Publicação', Icon: Megaphone, marketplaceOnly: true },
  { to: LOGSTOKA_ROUTES.PRODUCT_SYNC, label: 'Sincronização', Icon: RefreshCw, marketplaceOnly: true },
];

const ProductsSectionNav: React.FC = () => {
  const { isActive } = useMarketplaceModule();

  const tabs = baseTabs.filter((tab) => !tab.marketplaceOnly || isActive);

  const items: LogstokaIconNavLinkItem[] = tabs.map(({ to, label, Icon, end }) => ({
    type: 'link',
    key: to,
    to,
    label,
    end,
    icon: <Icon size={18} strokeWidth={2.2} aria-hidden />,
  }));

  return <LogstokaIconNav aria-label="Produtos" items={items} variant="section" />;
};

export default ProductsSectionNav;
