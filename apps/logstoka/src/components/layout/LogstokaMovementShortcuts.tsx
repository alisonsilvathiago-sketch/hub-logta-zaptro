import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, RefreshCw } from 'lucide-react';
import LogstokaIconNav, { type LogstokaIconNavItem } from '@/components/ui/LogstokaIconNav';

const shortcuts = [
  { tab: 'entry', label: 'Entrada', Icon: ArrowDownToLine },
  { tab: 'exit', label: 'Saída', Icon: ArrowUpFromLine },
  { tab: 'transfer', label: 'Transferência', Icon: ArrowLeftRight },
  { tab: 'damage', label: 'Avaria', Icon: AlertTriangle },
] as const;

type LogstokaMovementShortcutsProps = {
  onRefresh?: () => void;
  refreshing?: boolean;
  variant?: 'section' | 'inline' | 'action';
  className?: string;
};

const LogstokaMovementShortcuts: React.FC<LogstokaMovementShortcutsProps> = ({
  onRefresh,
  refreshing,
  variant = 'inline',
  className,
}) => {
  const location = useLocation();
  const onMovements = location.pathname.startsWith('/app/movements');
  const activeTab = onMovements
    ? (new URLSearchParams(location.search).get('tab') as (typeof shortcuts)[number]['tab'] | null) ?? 'entry'
    : null;

  const items = useMemo<LogstokaIconNavItem[]>(() => {
    const links: LogstokaIconNavItem[] = shortcuts.map(({ tab, label, Icon }) => ({
      type: 'link',
      key: tab,
      to: `/app/movements?tab=${tab}`,
      label,
      active: activeTab === tab,
      icon: <Icon size={18} strokeWidth={2.2} aria-hidden />,
    }));

    if (!onRefresh) return links;

    return [
      ...links,
      {
        type: 'button',
        key: 'refresh',
        label: 'Atualizar',
        disabled: refreshing,
        icon: (
          <RefreshCw
            size={18}
            strokeWidth={2.2}
            className={refreshing ? 'animate-spin' : undefined}
            aria-hidden
          />
        ),
        onClick: onRefresh,
      },
    ];
  }, [activeTab, onRefresh, refreshing]);

  return (
    <LogstokaIconNav
      aria-label="Atalhos de movimentação"
      items={items}
      variant={variant}
      className={className}
    />
  );
};

export default LogstokaMovementShortcuts;
