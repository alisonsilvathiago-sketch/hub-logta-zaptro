import React from 'react';
import ZaptroTeam from '../pages/ZaptroTeam';
import './zaptroAppModulePage.css';

const ZaptroAppTeamPage: React.FC = () => {
  return (
    <div className="zaptro-app-module-page">
      <ZaptroTeam hideLayout />
    </div>
  );
};

export default ZaptroAppTeamPage;

