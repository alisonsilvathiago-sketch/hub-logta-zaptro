import React from 'react';
import { WaLinkBroadcasts } from './WaLinkBroadcasts';
import './waLink.css';
import './waLinkBroadcasts.css';

/** Página dedicada — listas de transmissão WhatsApp. */
const WaLinkBroadcastsPage: React.FC = () => (
  <div className="wa-conversas wa-conversas--broadcasts-only">
    <WaLinkBroadcasts />
  </div>
);

export default WaLinkBroadcastsPage;
