import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation, Truck } from 'lucide-react';
import { useZaptroTheme, type ZaptroThemePalette } from '../context/ZaptroThemeContext';
import { ZAPTRO_APP_ROUTES, zaptroAppOrLegacy } from '../app/zaptroAppRoutes';
import { ZAPTRO_ROUTES } from '../constants/zaptroRoutes';
import { ZaptroFleetDriversNav } from '../components/Zaptro/ZaptroFleetDriversNav';
import { ZaptroFleetStatsRow } from '../components/Zaptro/ZaptroFleetStatsRow';
import { ZaptroVehiclesTab } from './ZaptroVehiclesTab';
import { isZaptroVehiclesDemoEnabled, ZAPTRO_DEMO_VEHICLES } from '../constants/zaptroVehiclesDemo';

function buildStyles(p: ZaptroThemePalette): Record<string, React.CSSProperties> {
  const d = p.mode === 'dark';
  const border = p.sidebarBorder;
  return {
    headerRow: { display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap' },
    headerIcon: {
      width: 56,
      height: 56,
      borderRadius: 18,
      backgroundColor: d ? 'rgba(217,255,0,0.12)' : '#ebebeb',
      border: `1px solid ${border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    headerText: { flex: '1 1 240px', minWidth: 0 },
    title: { fontSize: 30, fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.02em' },
    subtitle: {
      margin: 0,
      fontSize: 11,
      color: 'rgba(156, 156, 156, 1)',
      fontWeight: 500,
      lineHeight: 1.55,
      width: '100%',
      maxWidth: 720,
      boxSizing: 'border-box',
    },
    code: { fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: p.text },
  };
}

export const ZaptroFleetContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { palette } = useZaptroTheme();
  const s = useMemo(() => buildStyles(palette), [palette]);
  const [registerVehicleOpen, setRegisterVehicleOpen] = useState(false);
  const vehicleStats = useMemo(() => {
    const list = isZaptroVehiclesDemoEnabled() ? ZAPTRO_DEMO_VEHICLES : [];
    return {
      total: list.length,
      disponivel: list.filter((v) => v.status === 'disponivel').length,
      emRota: list.filter((v) => v.status === 'em_rota').length,
    };
  }, []);

  return (
    <div className="zaptro-fleet-module zaptro-fleet-module--tall">
      <div style={{ ...s.headerRow, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flex: '1 1 280px', minWidth: 0 }}>
          <div style={s.headerIcon}>
            <Truck size={28} color={palette.lime} strokeWidth={2.2} />
          </div>
          <div style={s.headerText}>
            <h1 style={s.title}>Frota (Veículos)</h1>
            <p style={s.subtitle}>
              Gestão de ativos: placas, modelos, status e vínculo com motoristas. Dados em{' '}
              <span style={s.code}>veiculos</span> no Supabase Zaptro.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="zaptro-btn-toolbar"
          onClick={() =>
            navigate(zaptroAppOrLegacy(location.pathname, ZAPTRO_APP_ROUTES.ROUTES, ZAPTRO_ROUTES.ROUTES))
          }
          style={{
            border: `1px solid ${palette.sidebarBorder}`,
            backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F4F4F5',
            color: palette.text,
          }}
        >
          <Navigation size={16} strokeWidth={2.2} /> Rotas
        </button>
      </div>

      <ZaptroFleetStatsRow
        cards={[
          { label: 'Total veículos', value: vehicleStats.total, accent: true },
          { label: 'Disponíveis', value: vehicleStats.disponivel },
          { label: 'Em rota', value: vehicleStats.emRota },
        ]}
      />
      <div className="zaptro-fleet-module__body">
        <ZaptroFleetDriversNav active="vehicles" onAdd={() => setRegisterVehicleOpen(true)} />
        <div className="zaptro-fleet-module__scroll">
          <ZaptroVehiclesTab registerOpen={registerVehicleOpen} onRegisterClose={() => setRegisterVehicleOpen(false)} />
        </div>
      </div>
    </div>
  );
};
