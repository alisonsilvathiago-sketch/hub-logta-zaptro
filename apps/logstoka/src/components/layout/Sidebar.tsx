import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaBranding } from '@/context/LogstokaBrandingContext';
import { can } from '@/lib/permissions';
import { LOGSTOKA_NAV } from './logstokaNavItems';
import SidebarTooltip from './SidebarTooltip';

type Props = {
  onSignOut: () => void;
};

const navClass = ({ isActive }: { isActive: boolean }) =>
  `logstoka-app-nav-item${isActive ? ' active' : ''}`;

const Sidebar: React.FC<Props> = ({ onSignOut }) => {
  const { profile } = useAuth();
  const { branding } = useLogstokaBranding();
  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  return (
    <div className="logstoka-app-sidebar-wrap">
      <aside className="logstoka-app-sidebar" aria-label="Menu LogStoka">
        <SidebarTooltip label={branding.companyName || 'LogStoka'}>
          <NavLink
            to="/app"
            end
            className={`logstoka-app-brand${branding.logoUrl ? ' logstoka-app-brand--custom' : ''}`}
          >
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="logstoka-app-brand-logo" />
            ) : (
              <img src="/logstoka-mark.svg" alt="LogStoka" className="logstoka-app-brand-mark-img" />
            )}
          </NavLink>
        </SidebarTooltip>

        <span className="logstoka-app-nav-divider" aria-hidden />

        <nav className="logstoka-app-nav">
          {LOGSTOKA_NAV.map((item) => {
            if (item.perm && !can(item.perm, profile?.role)) return null;
            const Icon = item.icon;

            return (
              <SidebarTooltip key={`${item.label}-${item.to}`} label={item.label}>
                <NavLink
                  to={item.to!}
                  end={item.end}
                  className={navClass}
                >
                  <Icon size={18} strokeWidth={1.65} />
                </NavLink>
              </SidebarTooltip>
            );
          })}
        </nav>

        <div className="logstoka-app-sidebar-foot">
          <span className="logstoka-app-nav-divider" aria-hidden />
          <SidebarTooltip label={profile?.full_name || profile?.email || 'Perfil'}>
            <div className="logstoka-app-nav-profile">
              {initials}
            </div>
          </SidebarTooltip>
          <SidebarTooltip label="Sair">
            <button
              type="button"
              className="logstoka-app-nav-item"
              onClick={onSignOut}
              style={{ color: '#ef4444' }}
            >
              <LogOut size={18} strokeWidth={1.65} />
            </button>
          </SidebarTooltip>
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
