import React from 'react';
import { Outlet } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';

const SettingsLayout: React.FC = () => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
          <Settings size={18} strokeWidth={2.2} />
        </span>
        <h1 className={LOGSTOKA_PAGE_TITLE_CLASS}>Configurações</h1>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Perfil, empresa, equipe, integrações, API e preferências administrativas.
      </p>
    </div>

    <div className="ls-settings-panel">
      <Outlet />
    </div>
  </div>
);

export default SettingsLayout;
