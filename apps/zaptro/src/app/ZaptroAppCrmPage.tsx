import React from 'react';
import { ZaptroCrmContent } from '../pages/ZaptroCrm';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';

const ZaptroAppCrmPage: React.FC = () => (
  <ZaptroAppModuleShell fullBleed>
    <ZaptroCrmContent />
  </ZaptroAppModuleShell>
);

export default ZaptroAppCrmPage;
