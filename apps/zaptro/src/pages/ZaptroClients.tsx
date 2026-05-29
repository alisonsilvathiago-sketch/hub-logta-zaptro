import React from 'react';
import ZaptroLayout from '../components/Zaptro/ZaptroLayout';
import { ZaptroClientsPanel } from './ZaptroClientsPanel';

const ZaptroClients: React.FC = () => (
  <ZaptroLayout>
    <ZaptroClientsPanel />
  </ZaptroLayout>
);

export default ZaptroClients;
