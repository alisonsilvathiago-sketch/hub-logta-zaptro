import React from 'react';
import { Navigate } from 'react-router-dom';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';

/** Legado: `/app/conexao` redireciona para Configuração → WhatsApp. */
const WaLinkConnectPage: React.FC = () => (
  <Navigate to={`${ZAPTRO_APP_ROUTES.SETTINGS}?tab=config`} replace />
);

export default WaLinkConnectPage;
