import React from 'react';
import { useLocation } from 'react-router-dom';
import { Scan } from 'lucide-react';
import { useLogstokaXRay, XRayPageContext } from '@/modules/ai/auditor/LogstokaXRayContext';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';

type Props = {
  eyebrow?: string;
  icon?: React.ReactNode;
  leading?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

const LogstokaPageHeader: React.FC<Props> = ({
  eyebrow,
  icon,
  leading,
  title,
  subtitle,
  actions,
  className = '',
}) => {
  const location = useLocation();
  const { openXRay } = useLogstokaXRay();

  // Helper to map pathname to active audit context
  const getPageContext = (path: string): XRayPageContext => {
    if (path.includes('/products')) return 'products';
    if (path.includes('/inventory') || path.includes('/warehouses')) return 'stock';
    if (path.includes('/movements') || path.includes('/transfers') || path.includes('/imports') || path.includes('/returns')) return 'movements';
    if (path.includes('/marketplace')) return 'marketplace';
    if (path.includes('/integrations')) return 'integrations';
    if (path.includes('/picking') || path.includes('/conference')) return 'conference';
    if (path.includes('/reports')) return 'reports';
    return 'global';
  };

  const xrayContext = getPageContext(location.pathname);

  return (
    <header className={`ls-page-header${className ? ` ${className}` : ''}`}>
      <div className="ls-page-header__main">
        {eyebrow ? <p className="ls-page-header__eyebrow">{eyebrow}</p> : null}
        <div className="ls-page-header__title-row">
          {leading ? <div className="ls-page-header__leading">{leading}</div> : null}
          {title ? (
            <h1 className="ls-page-header__title">
              {icon ? (
                <span className="ls-page-header__title-icon" aria-hidden>
                  {icon}
                </span>
              ) : null}
              <span className="ls-page-header__title-text">{title}</span>
            </h1>
          ) : null}
        </div>
        {subtitle ? <div className="ls-page-header__subtitle">{subtitle}</div> : null}
      </div>
      
      <div className="ls-page-header__actions flex items-center gap-2">
        <LogstokaIconTooltip label={`Auditar esta página (${getContextTitle(xrayContext)})`}>
          <button
            type="button"
            onClick={() => openXRay(xrayContext)}
            className="lsdash-icon-btn active xray-btn"
          >
            <Scan size={18} />
          </button>
        </LogstokaIconTooltip>
        {actions}
      </div>
    </header>
  );
};

function getContextTitle(context: XRayPageContext): string {
  switch (context) {
    case 'products': return 'Produtos';
    case 'stock': return 'Estoque';
    case 'movements': return 'Movimentações';
    case 'marketplace': return 'Marketplace';
    case 'integrations': return 'Integrações';
    case 'conference': return 'Conferência';
    case 'reports': return 'Relatórios';
    default: return 'Geral';
  }
}

export default LogstokaPageHeader;
