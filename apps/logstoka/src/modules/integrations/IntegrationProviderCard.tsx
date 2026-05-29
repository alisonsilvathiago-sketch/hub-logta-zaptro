import React from 'react';
import { Link2, RefreshCw, Settings, Unplug } from 'lucide-react';
import type { IntegrationConnection } from '@/lib/integrationConnections';
import type { IntegrationProvider } from '@/lib/integrationsCatalog';

type Props = {
  provider: IntegrationProvider;
  connection: IntegrationConnection;
  onConnect: () => void;
  onConfigure: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  connecting?: boolean;
};

const IntegrationProviderCard: React.FC<Props> = ({
  provider,
  connection,
  onConnect,
  onConfigure,
  onSync,
  onDisconnect,
  connecting,
}) => {
  const connected = connection.connected;

  return (
    <div className="ls-int-card">
      <div className="flex items-start gap-3">
        <div
          className="ls-int-card__logo"
          style={{ background: `#${provider.logoColor}` }}
          aria-hidden
        >
          {provider.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[#404040]">{provider.name}</p>
          <p className="mt-0.5 text-xs font-medium text-[#a3a3a3]">{provider.description}</p>
          <p className={`ls-int-card__status mt-2 ${connected ? 'text-green-800' : 'text-[#a3a3a3]'}`}>
            <span className={`ls-int-card__status-dot ${connected ? 'ls-int-card__status-dot--on' : 'ls-int-card__status-dot--off'}`} />
            {connected ? 'Conectado' : 'Não conectado'}
          </p>
        </div>
      </div>

      {connected && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-semibold text-[#a3a3a3]">
          <dt>Última sync</dt>
          <dd className="text-right text-[#525252]">
            {connection.lastSyncAt ? new Date(connection.lastSyncAt).toLocaleString('pt-BR') : '—'}
          </dd>
          <dt>Pedidos</dt>
          <dd className="text-right text-[#525252]">{connection.ordersSynced.toLocaleString('pt-BR')}</dd>
          <dt>Produtos</dt>
          <dd className="text-right text-[#525252]">{connection.productsSynced.toLocaleString('pt-BR')}</dd>
          <dt>Erros</dt>
          <dd className={`text-right ${connection.errorCount > 0 ? 'text-red-600' : 'text-[#525252]'}`}>
            {connection.errorCount}
          </dd>
        </dl>
      )}

      <div className="ls-int-card__actions">
        {!connected ? (
          <button type="button" className="ls-btn-primary text-xs py-1.5" disabled={connecting} onClick={onConnect}>
            <Link2 size={14} />
            {connecting ? 'Redirecionando…' : 'Conectar'}
          </button>
        ) : (
          <>
            <button type="button" className="ls-btn-secondary text-xs py-1.5" onClick={onConfigure}>
              <Settings size={14} />
              Configurar
            </button>
            <button type="button" className="ls-btn-secondary text-xs py-1.5" onClick={onSync}>
              <RefreshCw size={14} />
              Sincronizar
            </button>
            <button type="button" className="ls-btn-secondary text-xs py-1.5 text-red-700" onClick={onDisconnect}>
              <Unplug size={14} />
              Desconectar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default IntegrationProviderCard;
