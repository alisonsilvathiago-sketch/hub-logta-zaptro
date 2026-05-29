import React from 'react';
import { HubOperationalDashboard } from './HubOperationalDashboard';

const MasterHubDashboard: React.FC = () => (
  <div className="animate-fade-in" style={{ marginLeft: 15, marginRight: 15 }}>
    <HubOperationalDashboard variant="page" />
  </div>
);

export default MasterHubDashboard;
