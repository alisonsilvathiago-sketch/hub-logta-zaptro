import React from 'react';
import { WaLinkConnectPanel } from '../modules/wa-link/WaLinkConnectPanel';

/** Ligação WhatsApp (QR Evolution) — único ponto no app: Configuração → tab config. */
const WhatsAppConfig: React.FC = () => <WaLinkConnectPanel embedded />;

export default WhatsAppConfig;
