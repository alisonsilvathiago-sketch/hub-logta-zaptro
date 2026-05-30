import React from 'react';
import { Layers, Megaphone, Package, RefreshCw } from 'lucide-react';
import LogstokaIconNav, { type LogstokaIconNavLinkItem } from '@/components/ui/LogstokaIconNav';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const tabs: Array<{
  to: string;
  label: string;
  Icon: typeof Package;
  end?: boolean;
}> = [
  { to: LOGSTOKA_ROUTES.PRODUCTS, label: 'Cadastro', Icon: Package, end: true },
  { to: LOGSTOKA_ROUTES.PRODUCT_GROUPS, label: 'Grupos', Icon: Layers },
  { to: LOGSTOKA_ROUTES.PRODUCT_PUBLICATION, label: 'Publicação', Icon: Megaphone },
  { to: LOGSTOKA_ROUTES.PRODUCT_SYNC, label: 'Sincronização', Icon: RefreshCw },
];

const items: LogstokaIconNavLinkItem[] = tabs.map(({ to, label, Icon, end }) => ({
  type: 'link',
  key: to,
  to,
  label,
  end,
  icon: <Icon size={18} strokeWidth={2.2} aria-hidden />,
}));

const ProductsSectionNav: React.FC = () => (
  <LogstokaIconNav aria-label="Produtos" items={items} variant="section" />
);

export default ProductsSectionNav;
