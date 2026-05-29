import React from 'react';
import { ZaptroFleetContent } from '../pages/ZaptroFleet';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';

const ZaptroAppFleetPage: React.FC = () => (
  <ZaptroAppModuleShell>
    <ZaptroFleetContent />
  </ZaptroAppModuleShell>
);

export default ZaptroAppFleetPage;
