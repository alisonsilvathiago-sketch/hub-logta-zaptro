import React from 'react';
import { ZaptroClientsPanel } from '../pages/ZaptroClientsPanel';
import './zaptroAppClients.css';

const ZaptroAppClientsPage: React.FC = () => (
  <div className="zaptro-app-clients-page">
    <ZaptroClientsPanel embedded showLeadsTab={false} />
  </div>
);

export default ZaptroAppClientsPage;
