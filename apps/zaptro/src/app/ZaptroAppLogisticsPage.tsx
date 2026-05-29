import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, Truck } from 'lucide-react';
import { ZAPTRO_APP_ROUTES } from './zaptroAppRoutes';
import './zaptroAppModulePage.css';

const ZaptroAppLogisticsPage: React.FC = () => (
  <div className="zaptro-app-module-page">
    <header className="zaptro-app-module-head">
      <div>
        <h1>Logística</h1>
        <p>Rotas, motoristas e monitoramento em tempo real.</p>
      </div>
    </header>

    <div className="zaptro-app-module-links">
      <Link to={ZAPTRO_APP_ROUTES.ROUTES} className="zaptro-app-module-link-card">
        <Navigation size={20} />
        <strong>Rotas</strong>
        <span>Central logística, mapa ao vivo e novas operações.</span>
      </Link>
      <Link to={ZAPTRO_APP_ROUTES.DRIVERS} className="zaptro-app-module-link-card">
        <Truck size={20} />
        <strong>Motoristas</strong>
        <span>Gestão da frota e vínculo com rotas activas.</span>
      </Link>
    </div>
  </div>
);

export default ZaptroAppLogisticsPage;
