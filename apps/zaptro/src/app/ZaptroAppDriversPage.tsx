import React from 'react';
import { ZaptroDriversContent } from '../pages/ZaptroDrivers';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';

const ZaptroAppDriversPage: React.FC = () => (
  <ZaptroAppModuleShell>
    <ZaptroDriversContent />
  </ZaptroAppModuleShell>
);

export default ZaptroAppDriversPage;
