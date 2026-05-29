import React, { useMemo, useState } from 'react';
import { UserPlus } from 'lucide-react';
import ZaptroAppModuleShell from './ZaptroAppModuleShell';
import { ZaptroFleetDriversNav } from '../components/Zaptro/ZaptroFleetDriversNav';
import { ZaptroFleetStatsRow } from '../components/Zaptro/ZaptroFleetStatsRow';
import { ZaptroHelperRegisterModal } from '../components/Zaptro/ZaptroHelperRegisterModal';
import { ZaptroHelpersTab } from '../pages/ZaptroHelpersTab';
import { getVisibleDemoHelpers } from '../constants/zaptroHelpersDemo';

const ZaptroAppHelpersPage: React.FC = () => {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [helpersVersion, setHelpersVersion] = useState(0);

  const helpers = useMemo(() => getVisibleDemoHelpers(), [helpersVersion]);
  const stats = useMemo(
    () => ({
      total: helpers.length,
      empresa: helpers.filter((h) => h.employment === 'empresa').length,
      agregado: helpers.filter((h) => h.employment === 'agregado').length,
      ativos: helpers.filter((h) => h.status === 'ativo').length,
    }),
    [helpers],
  );

  return (
    <ZaptroAppModuleShell>
      <div className="zaptro-fleet-module zaptro-fleet-module--tall">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: '#ebebeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={28} color="#0f172a" />
          </div>
          <div>
            <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: '#000' }}>Ajudantes</h1>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#949494' }}>
              Vincule ajudantes da empresa ou do agregado — ID por WhatsApp, e-mail ou CPF · histórico de rotas e bloqueio.
            </p>
          </div>
        </div>
        <ZaptroFleetStatsRow
          cards={[
            { label: 'Total ajudantes', value: stats.total, accent: true },
            { label: 'Da empresa', value: stats.empresa },
            { label: 'Do agregado', value: stats.agregado },
            { label: 'Activos', value: stats.ativos },
          ]}
        />
        <div className="zaptro-fleet-module__body">
          <ZaptroFleetDriversNav active="helpers" onAdd={() => setRegisterOpen(true)} />
          <div className="zaptro-fleet-module__scroll">
            <ZaptroHelpersTab key={helpersVersion} />
          </div>
        </div>
      </div>
      <ZaptroHelperRegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSaved={() => setHelpersVersion((v) => v + 1)}
      />
    </ZaptroAppModuleShell>
  );
};

export default ZaptroAppHelpersPage;
