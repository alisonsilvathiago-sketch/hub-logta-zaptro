import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LOGTA_MODULE_CONTENT_SHELL, LOGTA_PAGE_VIEW } from '../constants/logtaLayout';

/** Cartão branco do miolo — só título da página + abas/ações à direita (sem dados da sessão). */
type ModulePageChromeProps = {
  title: string;
  badge?: string;
  trailing?: ReactNode;
};

const MODULE_CHROME: Record<string, CSSProperties> = {
  shell: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
    backgroundColor: '#ffffff',
    padding: '16px 32px',
    borderRadius: 24,
    border: '1px solid var(--border)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
    position: 'relative',
    zIndex: 40,
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
    flexShrink: 0,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: 900,
    color: 'var(--primary)',
    backgroundColor: 'var(--primary-light)',
    padding: '4px 12px',
    borderRadius: 24,
    width: 'fit-content',
    letterSpacing: '0.05em',
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: 900,
    color: 'var(--text-main)',
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1.12,
  },
  trailingWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    flex: 1,
    minWidth: 0,
  },
};

const ModulePageChrome: React.FC<ModulePageChromeProps> = ({ title, badge, trailing }) => (
  <header
    data-logta-module-chrome="1"
    style={MODULE_CHROME.shell}
  >
    <div style={MODULE_CHROME.titleArea}>
      {badge ? <div style={MODULE_CHROME.headerBadge}>{badge}</div> : null}
      <h1 style={MODULE_CHROME.pageTitle} aria-live="polite">
        {title}
      </h1>
    </div>
    {trailing != null && trailing !== false ? (
      <div style={MODULE_CHROME.trailingWrap}>{trailing}</div>
    ) : null}
  </header>
);

interface ModuleNavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
}

interface ModuleLayoutProps {
  title: string;
  badge?: string;
  items: ModuleNavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Quando definido, cada aba usa `<Link>` (navegação fiável por cima de mapas Leaflet, etc.). */
  tabHref?: (id: string) => string;
  children: React.ReactNode;
  /** CRM: abas um pouco mais compactas (rótulos ficam só em `title` / `aria-label` nas abas só-ícone). */
  showAllTabLabels?: boolean;
  /** Botões à direita do bloco de navegação (ex.: Exportar, Novo lead). */
  actions?: React.ReactNode;
}

const ModuleLayout: React.FC<ModuleLayoutProps> = ({
  title,
  badge,
  items,
  activeTab,
  onTabChange,
  tabHref,
  children,
  showAllTabLabels = false,
  actions,
}) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  return (
    <div style={styles.container}>
      <ModulePageChrome
        title={title}
        badge={badge}
        trailing={
          <div style={styles.headerRight}>
            <div style={styles.navOuter}>
            <nav style={styles.topNav} aria-label="Secções do módulo">
              {items.map((item) => {
                const isActive = activeTab === item.id;
                const navStyle: CSSProperties = {
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  ...(showAllTabLabels ? styles.navItemDense : {}),
                  outline: 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                };
                const iconColor = {
                  ...styles.iconWrapper,
                  color: isActive ? '#5b21b6' : 'rgba(91, 33, 182, 0.45)',
                };
                const inner = (
                  <>
                    {item.badge !== undefined && item.badge !== '' && (
                      <span style={styles.itemBadgeFloating}>{item.badge}</span>
                    )}
                    <span style={iconColor}>
                      <item.icon size={showAllTabLabels ? 20 : 22} strokeWidth={2} aria-hidden />
                    </span>
                    {hoveredTab === item.id && (
                      <div style={styles.customTooltip}>
                        {item.label}
                        <div style={styles.tooltipArrow} />
                      </div>
                    )}
                  </>
                );
                const to = tabHref?.(item.id);
                return to ? (
                  <Link
                    key={item.id}
                    to={to}
                    role="tab"
                    aria-current={isActive ? 'page' : undefined}
                    aria-selected={isActive}
                    aria-label={item.label}
                    style={navStyle}
                    onClick={() => onTabChange(item.id)}
                    onMouseEnter={() => setHoveredTab(item.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={item.label}
                    style={navStyle}
                    onClick={() => onTabChange(item.id)}
                    onMouseEnter={() => setHoveredTab(item.id)}
                    onMouseLeave={() => setHoveredTab(null)}
                  >
                    {inner}
                  </button>
                );
              })}
            </nav>
          </div>
          {actions ? <div style={styles.actionsWrap}>{actions}</div> : null}
          </div>
        }
      />

      <main style={styles.content}>
        <div className="animate-fade-in logta-module-stack" style={LOGTA_MODULE_CONTENT_SHELL}>
          {children}
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: {
    ...LOGTA_PAGE_VIEW,
  },
  headerRight: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '16px',
    flex: 1,
    minWidth: 0,
  },
  /** Ocupa o espaço entre o título e as ações; centra o `<nav>` de abas. */
  navOuter: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  topNav: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7F8',
    padding: '6px',
    borderRadius: '24px',
    border: '1px solid var(--border)',
    gap: '4px',
    maxWidth: '100%',
  },
  navItem: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 12px',
    borderRadius: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    gap: 0,
    border: 'none',
    background: 'transparent',
    font: 'inherit',
    minWidth: 48,
    minHeight: 48,
  },
  navItemDense: {
    padding: '10px 10px',
    minWidth: 46,
    minHeight: 46,
  },
  navItemActive: {
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid var(--border)',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBadgeFloating: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: 'var(--primary)',
    color: 'white',
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    borderRadius: '999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    zIndex: 1,
  },
  customTooltip: {
    position: 'absolute' as const,
    bottom: '-35px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#0f172a',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '800',
    whiteSpace: 'nowrap' as const,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'none' as const,
    animation: 'fadeIn 0.2s ease',
  },
  tooltipArrow: {
    position: 'absolute' as const,
    top: '-4px',
    left: '50%',
    transform: 'translateX(-50%) rotate(45deg)',
    width: '8px',
    height: '8px',
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
};

export default ModuleLayout;
