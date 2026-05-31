import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import {
  getSectionIconNav,
  getSectionNavLabel,
} from '@/components/layout/sectionSidebarIcons';
import type { AppSectionId } from '@/components/layout/resolveAppSection';
import SidebarTooltip from './SidebarTooltip';

type Props = {
  sectionId: AppSectionId;
};

const navClass = ({ isActive }: { isActive: boolean }) =>
  `logstoka-app-nav-item${isActive ? ' active' : ''}`;

const SectionSidebar: React.FC<Props> = ({ sectionId }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const items = getSectionIconNav(sectionId);
  const sectionLabel = getSectionNavLabel(sectionId);

  if (items.length === 0) return null;

  return (
    <aside
      className="logstoka-app-sidebar ls-section-sidebar-float"
      aria-label={`Menu ${sectionLabel}`}
    >
      <nav className="logstoka-app-nav" aria-label={sectionLabel}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarTooltip key={`${item.to}-${item.label}`} label={item.label}>
              <NavLink to={item.to} end={item.end} className={navClass}>
                <Icon size={18} strokeWidth={1.65} />
              </NavLink>
            </SidebarTooltip>
          );
        })}
      </nav>

      <footer className="logstoka-app-sidebar-foot">
        <SidebarTooltip label="Configurações">
          <button
            type="button"
            className="logstoka-app-nav-item"
            onClick={() => navigate(LOGSTOKA_ROUTES.SETTINGS)}
            aria-label="Configurações"
          >
            <Settings size={18} strokeWidth={1.65} />
          </button>
        </SidebarTooltip>
        <SidebarTooltip label="Sair">
          <button
            type="button"
            className="logstoka-app-nav-item logstoka-app-nav-item--logout"
            onClick={() => void signOut()}
            aria-label="Sair"
          >
            <LogOut size={18} strokeWidth={1.65} />
          </button>
        </SidebarTooltip>
      </footer>
    </aside>
  );
};

export default SectionSidebar;
