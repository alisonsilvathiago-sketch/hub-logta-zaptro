import React from 'react';
import { HUB_SIDEBAR_NAV_LABEL } from '@hub/styles/hubPageTypography';
import { HUB_MASTER_SECTION_NAV } from '@hub/styles/hubMasterSectionNavStyles';

export type HubMasterSectionNavItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

type HubMasterSectionAsideProps = {
  heading: string;
  ariaLabel: string;
  sectionLabel?: string;
  items: HubMasterSectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  footer?: React.ReactNode;
};

const HubMasterSectionAside: React.FC<HubMasterSectionAsideProps> = ({
  heading,
  ariaLabel,
  sectionLabel = 'Módulos',
  items,
  activeId,
  onSelect,
  footer,
}) => (
  <aside style={HUB_MASTER_SECTION_NAV.sidebarWrapper}>
    <nav style={HUB_MASTER_SECTION_NAV.sidebar} aria-label={ariaLabel}>
      <h2 style={HUB_MASTER_SECTION_NAV.sidebarHeading}>{heading}</h2>
      <div style={HUB_MASTER_SECTION_NAV.sidebarHeadingRule} aria-hidden />
      <div style={HUB_MASTER_SECTION_NAV.sidebarSection}>
        <div className="hub-settings-section-label" style={HUB_MASTER_SECTION_NAV.sidebarSectionLabel}>
          {sectionLabel}
        </div>
        <div style={HUB_MASTER_SECTION_NAV.sidebarSectionItems}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={`hub-sidebar-item expanded${isActive ? ' active' : ''}`}
                style={{
                  border: 'none',
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                aria-current={isActive ? 'page' : undefined}
              >
                {Icon ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
                  </div>
                ) : null}
                <span style={{ ...HUB_SIDEBAR_NAV_LABEL, marginLeft: Icon ? 12 : 0, flex: 1, textAlign: 'left' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {footer}
    </nav>
  </aside>
);

export default HubMasterSectionAside;
