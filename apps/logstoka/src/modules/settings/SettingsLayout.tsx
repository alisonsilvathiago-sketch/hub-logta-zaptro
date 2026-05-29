import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { SETTINGS_NAV } from './settingsNav';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `ls-settings-nav-item${isActive ? ' ls-settings-nav-item--active' : ''}`;

const SettingsLayout: React.FC = () => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <Settings size={18} strokeWidth={2.2} />
        </span>
        <h1 className={LOGSTOKA_PAGE_TITLE_CLASS}>Configurações</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Perfil, empresa, equipe, integrações, API e preferências administrativas.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav className="ls-settings-nav" aria-label="Seções de configuração">
        {SETTINGS_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="ls-settings-panel">
        <Outlet />
      </div>
    </div>
  </div>
);

export default SettingsLayout;
