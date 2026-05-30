import React from 'react';
import { Plug } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { IntegrationConnection } from '@/lib/integrationConnections';
import type { IntegrationProvider } from '@/lib/integrationsCatalog';

type Props = {
  open: boolean;
  provider: IntegrationProvider | null;
  connection: IntegrationConnection | null;
  onClose: () => void;
  onSave: (conn: IntegrationConnection) => void;
};

const receiveFields: { key: keyof IntegrationConnection['sync']; label: string }[] = [
  { key: 'receiveOrders', label: 'Pedidos' },
  { key: 'receiveStock', label: 'Estoque' },
  { key: 'receiveReturns', label: 'Devoluções' },
  { key: 'receiveShipping', label: 'Entregas' },
];

const sendFields: { key: keyof IntegrationConnection['sync']; label: string }[] = [
  { key: 'sendProducts', label: 'Produtos' },
  { key: 'sendStock', label: 'Estoque' },
  { key: 'sendPrices', label: 'Preços' },
  { key: 'sendImages', label: 'Imagens' },
  { key: 'sendDescriptions', label: 'Descrições' },
];

const IntegrationConfigureModal: React.FC<Props> = ({ open, provider, connection, onClose, onSave }) => {
  const [draft, setDraft] = React.useState<IntegrationConnection | null>(connection);

  React.useEffect(() => {
    setDraft(connection);
  }, [connection, open]);

  if (!provider || !draft) return null;

  const toggleStore = (storeId: string) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            stores: d.stores.map((s) => (s.id === storeId ? { ...s, enabled: !s.enabled } : s)),
          }
        : d,
    );
  };

  const toggleSync = (key: keyof IntegrationConnection['sync']) => {
    setDraft((d) => (d ? { ...d, sync: { ...d.sync, [key]: !d.sync[key] } } : d));
  };

  return (
    <Modal
      open={open}
      size="landscape"
      title={`Configurar · ${provider.name}`}
      subtitle="Lojas conectadas e direção da sincronização"
      icon={<Plug size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ls-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="ls-btn-primary" onClick={() => draft && onSave(draft)}>
            Salvar
          </button>
        </>
      }
    >
      <div className="ls-publish-modal">
        <aside className="ls-publish-modal__aside">
          <p className="ls-publish-modal__aside-label">Status</p>
          <div className="ls-publish-modal__summary">
            <p className="text-xs font-bold text-[#525252]">
              Conectado em {draft.connectedAt ? new Date(draft.connectedAt).toLocaleDateString('pt-BR') : '—'}
            </p>
            {draft.sellerId && (
              <p className="ls-publish-modal__summary-hint">Seller ID · {draft.sellerId}</p>
            )}
          </div>
          <p className="ls-publish-modal__aside-label mt-5">Lojas encontradas</p>
          <div className="ls-publish-modal__groups">
            {draft.stores.length === 0 && (
              <p className="text-xs text-[#a3a3a3]">Nenhuma loja — reconecte a integração.</p>
            )}
            {draft.stores.map((store) => (
              <label key={store.id} className="ls-int-store-row cursor-pointer">
                <input type="checkbox" checked={store.enabled} onChange={() => toggleStore(store.id)} />
                <span className="text-sm font-bold text-[#404040]">{store.name}</span>
              </label>
            ))}
          </div>
        </aside>
        <div className="ls-publish-modal__main">
          <div className="ls-int-sync-grid">
            <div>
              <p className="ls-publish-modal__aside-label mb-3">Receber (marketplace → LogStoka)</p>
              <div className="space-y-2">
                {receiveFields.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#525252]">
                    <input type="checkbox" checked={draft.sync[key]} onChange={() => toggleSync(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="ls-publish-modal__aside-label mb-3">Enviar (LogStoka → marketplace)</p>
              <div className="space-y-2">
                {sendFields.map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#525252]">
                    <input type="checkbox" checked={draft.sync[key]} onChange={() => toggleSync(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IntegrationConfigureModal;
