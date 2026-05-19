import React from 'react';
import { Plus } from 'lucide-react';

type LogtaModuleHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  titleClassName?: string;
  tabs?: React.ReactNode;
  /** Botão + azul imediatamente à direita das abas por ícone */
  onTabQuickAdd?: () => void;
  tabQuickAddLabel?: string;
  tabQuickAddActive?: boolean;
  /** Ações extras à direita das abas (ex.: botão Orçamento) */
  actions?: React.ReactNode;
  className?: string;
};

export const LogtaModuleHeader: React.FC<LogtaModuleHeaderProps> = ({
  title,
  subtitle,
  titleClassName = 'logta-page-title',
  tabs,
  onTabQuickAdd,
  tabQuickAddLabel = 'Adicionar',
  tabQuickAddActive = false,
  actions,
  className = '',
}) => {
  const showTabsRow = Boolean(tabs || onTabQuickAdd || actions);

  return (
    <header className={`logta-module-header${className ? ` ${className}` : ''}`}>
      <div className="logta-module-header__top">
        <div className="logta-module-header__intro min-w-0">
          {typeof title === 'string' ? (
            <h1 className={titleClassName}>{title}</h1>
          ) : (
            title
          )}
          {subtitle ? (
            <p className="logta-module-header__subtitle">{subtitle}</p>
          ) : null}
        </div>
        {showTabsRow ? (
          <div className="logta-module-header__tabs shrink-0">
            <div className="logta-module-header__tabs-row">
              {tabs}
              {onTabQuickAdd ? (
                <button
                  type="button"
                  className={`logta-module-header__tab-quick-add${tabQuickAddActive ? ' is-active' : ''}`}
                  onClick={onTabQuickAdd}
                  aria-label={tabQuickAddLabel}
                  aria-pressed={tabQuickAddActive}
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              ) : null}
              {actions ? <div className="logta-module-header__actions">{actions}</div> : null}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default LogtaModuleHeader;
