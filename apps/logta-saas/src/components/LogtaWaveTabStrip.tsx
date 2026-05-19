import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export type LogtaWaveTab = {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  path?: string;
  /** Prefixo para destacar a aba em sub-rotas (ex.: /rh/jornada-ponto/colaborador/1). */
  matchPath?: string;
};

type LinkStripProps = {
  variant?: 'link';
  tabs: LogtaWaveTab[];
  basePath: string;
  defaultTabId: string;
  className?: string;
};

type ButtonStripProps = {
  variant: 'button';
  tabs: LogtaWaveTab[];
  activeId: string;
  onTabChange: (id: string) => void;
  className?: string;
};

export type LogtaWaveTabStripProps = LinkStripProps | ButtonStripProps;

export const LogtaWaveTabStrip: React.FC<LogtaWaveTabStripProps> = (props) => {
  const location = useLocation();
  const isButton = props.variant === 'button';
  const tabs = props.tabs;

  const activeIndex = isButton
    ? Math.max(0, tabs.findIndex((t) => t.id === props.activeId))
    : Math.max(
        0,
        tabs.findIndex(
          (tab) =>
            tab.path &&
            (location.pathname.startsWith(tab.matchPath ?? tab.path) ||
              location.pathname.startsWith(tab.path) ||
              (location.pathname === props.basePath && tab.id === props.defaultTabId)),
        ),
      );

  const navClass = `logta-icon-tabs${props.className ? ` ${props.className}` : ''}`;

  return (
    <nav className={navClass} aria-label="Navegação por módulo">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = i === activeIndex;
        const itemClass = `logta-icon-tabs__item${isActive ? ' is-active' : ''}`;

        const tooltip = tab.label;

        if (isButton) {
          return (
            <button
              key={tab.id}
              type="button"
              className={itemClass}
              data-tooltip={tooltip}
              title={tooltip}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => props.onTabChange(tab.id)}
            >
              <Icon size={20} strokeWidth={isActive ? 2.25 : 2} />
            </button>
          );
        }

        return (
          <Link
            key={tab.id}
            to={tab.path!}
            className={itemClass}
            data-tooltip={tooltip}
            title={tooltip}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.25 : 2} />
          </Link>
        );
      })}
    </nav>
  );
};

export default LogtaWaveTabStrip;
