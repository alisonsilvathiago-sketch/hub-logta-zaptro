import React from 'react';
import { useLocation } from 'react-router-dom';
import { resolveAppSectionId } from '@/components/layout/resolveAppSection';
import SectionSidebar from '@/components/layout/SectionSidebar';
import InicioHomeSidePanel from '@/modules/inicio/InicioHomeSidePanel';

const AppSectionSidebar: React.FC = () => {
  const { pathname } = useLocation();
  const sectionId = resolveAppSectionId(pathname);
  const isHome = sectionId === 'home';

  return (
    <div className={`ls-app-section-sidebar-wrap${isHome ? ' ls-app-section-sidebar-wrap--home' : ''}`}>
      {isHome ? <InicioHomeSidePanel /> : <SectionSidebar sectionId={sectionId} />}
    </div>
  );
};

export default AppSectionSidebar;
