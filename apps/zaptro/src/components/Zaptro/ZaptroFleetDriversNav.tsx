import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';

export type FleetDriversTab = 'drivers' | 'vehicles' | 'helpers';

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  borderRadius: 14,
  backgroundColor: active ? '#000' : 'transparent',
  color: active ? '#D9FF00' : '#949494',
  fontWeight: 700,
  fontSize: 13,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
});

export function resolveFleetDriversTab(pathname: string, search: string): FleetDriversTab {
  if (pathname.includes('/motoristas/ajudantes')) return 'helpers';
  if (pathname.includes('/motoristas/frota') || pathname.includes('/frota')) return 'vehicles';
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  if (params.get('tab') === 'veiculos') return 'vehicles';
  if (params.get('tab') === 'ajudantes') return 'helpers';
  return 'drivers';
}

type Props = {
  active: FleetDriversTab;
  onAdd?: () => void;
};

/** Abas Motoristas · Frota · Ajudantes + botão cadastrar. */
export const ZaptroFleetDriversNav: React.FC<Props> = ({ active, onAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const legacyTab = new URLSearchParams(location.search).get('tab');
    if (legacyTab === 'veiculos' && !location.pathname.includes('/frota')) {
      navigate(ZAPTRO_APP_ROUTES.FLEET, { replace: true });
    }
    if (legacyTab === 'ajudantes' && !location.pathname.includes('/ajudantes')) {
      navigate(ZAPTRO_APP_ROUTES.HELPERS, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, marginTop: 12, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => navigate(ZAPTRO_APP_ROUTES.DRIVERS)} style={tabBtn(active === 'drivers')}>
        Motoristas da Operação
      </button>
      <button type="button" onClick={() => navigate(ZAPTRO_APP_ROUTES.FLEET)} style={tabBtn(active === 'vehicles')}>
        Frota (Veículos)
      </button>
      <button type="button" onClick={() => navigate(ZAPTRO_APP_ROUTES.HELPERS)} style={tabBtn(active === 'helpers')}>
        Ajudantes
      </button>
      {onAdd ? (
        <button
          type="button"
          title={
            active === 'drivers'
              ? 'Cadastrar motorista'
              : active === 'vehicles'
                ? 'Cadastrar veículo'
                : 'Cadastrar ajudante'
          }
          onClick={onAdd}
          style={{
            marginLeft: 'auto',
            width: 40,
            height: 40,
            borderRadius: 14,
            border: 'none',
            backgroundColor: '#000',
            color: '#D9FF00',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>
      ) : null}
    </div>
  );
};
