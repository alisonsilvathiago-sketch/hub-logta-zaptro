import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search, X } from 'lucide-react';
import type { WaLinkConversation } from './waLinkInboxDb';
import { waLinkListPrimaryLabel } from './waLinkConfig';

type Props = {
  open: boolean;
  conversations: WaLinkConversation[];
  excludeConversationId: string | null;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
};

const WaLinkForwardDrawer: React.FC<Props> = ({
  open,
  conversations,
  excludeConversationId,
  onClose,
  onSelect,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations
      .filter((c) => c.id !== excludeConversationId)
      .filter((c) => {
        if (!q) return true;
        const name = (c.sender_name || c.sender_number || '').toLowerCase();
        return name.includes(q);
      })
      .sort((a, b) =>
        waLinkListPrimaryLabel(a.sender_name, a.sender_number).localeCompare(
          waLinkListPrimaryLabel(b.sender_name, b.sender_number),
          'pt-BR',
        ),
      );
  }, [conversations, excludeConversationId, query]);

  if (!open) return null;

  return (
    <div className="wa-forward-drawer-root" role="presentation">
      <button type="button" className="wa-forward-drawer-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="wa-forward-drawer" role="dialog" aria-label="Encaminhar mensagem">
        <header className="wa-forward-drawer-head">
          <button type="button" className="wa-forward-drawer-back" onClick={onClose} aria-label="Voltar">
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <h2>Encaminhar para</h2>
          <button type="button" className="wa-forward-drawer-close" onClick={onClose} aria-label="Fechar">
            <X size={20} strokeWidth={2} />
          </button>
        </header>
        <div className="wa-forward-drawer-search">
          <Search size={18} strokeWidth={2} />
          <input
            type="search"
            placeholder="Pesquisar contato"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <ul className="wa-forward-drawer-list">
          {list.length === 0 ? (
            <li className="wa-forward-drawer-empty">Nenhum contato disponível.</li>
          ) : (
            list.map((c) => {
              const label = waLinkListPrimaryLabel(c.sender_name, c.sender_number);
              const initial = label[0]?.toUpperCase() || '?';
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className="wa-forward-drawer-item"
                    onClick={() => {
                      onSelect(c.id);
                      onClose();
                    }}
                  >
                    <span className="wa-forward-drawer-avatar">
                      {c.customer_avatar ? <img src={c.customer_avatar} alt="" /> : initial}
                    </span>
                    <span>{label}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </div>
  );
};

export default WaLinkForwardDrawer;
