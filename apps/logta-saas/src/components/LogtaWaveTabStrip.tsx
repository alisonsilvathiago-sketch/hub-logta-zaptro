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
  /** Abas isoladas no fim da barra (ex.: Jornada & Ponto no RH). */
  trailingTabs?: LogtaWaveTab[];
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
  /** Ícones/ações antes das abas (ex.: telefone, e-mail no perfil RH). */
  leadingSlot?: React.ReactNode;
};

export type LogtaWaveTabStripProps = LinkStripProps | ButtonStripProps;

function tabIsActive(
  tab: LogtaWaveTab,
  pathname: string,
  basePath: string,
  defaultTabId: string,
): boolean {
  if (!tab.path) return false;
  return (
    pathname.startsWith(tab.matchPath ?? tab.path) ||
    pathname.startsWith(tab.path) ||
    (pathname === basePath && tab.id === defaultTabId)
  );
}

export const LogtaWaveTabStrip: React.FC<LogtaWaveTabStripProps> = (props) => {
  const location = useLocation();
  const isButton = props.variant === 'button';
  const tabs = props.tabs;
  const trailingTabs = !isButton && props.trailingTabs ? props.trailingTabs : [];

  const renderTabItem = (tab: LogtaWaveTab, isActive: boolean) => {
    const Icon = tab.icon;
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
  };

  const linkBasePath = !isButton ? props.basePath : '';
  const linkDefaultTabId = !isButton ? props.defaultTabId : '';

  const activeMainIndex = isButton
    ? Math.max(0, tabs.findIndex((t) => t.id === props.activeId))
    : Math.max(
        0,
        tabs.findIndex((tab) =>
          tabIsActive(tab, location.pathname, linkBasePath, linkDefaultTabId),
        ),
      );

  const trailingActiveId = trailingTabs.find((tab) =>
    tabIsActive(tab, location.pathname, linkBasePath, linkDefaultTabId),
  )?.id;

  const navClass = `logta-icon-tabs${props.className ? ` ${props.className}` : ''}`;

  return (
    <>
      <nav className={navClass} aria-label="Navegação por módulo">
        {isButton && props.leadingSlot ? props.leadingSlot : null}
        {tabs.map((tab, i) => renderTabItem(tab, !trailingActiveId && i === activeMainIndex))}
      </nav>
      {trailingTabs.length > 0 ? (
        <div className="logta-icon-tabs__trailing" aria-label="Jornada e ponto">
          {trailingTabs.map((tab) => renderTabItem(tab, trailingActiveId === tab.id))}
        </div>
      ) : null}
    </>
  );
};

export default LogtaWaveTabStrip;
