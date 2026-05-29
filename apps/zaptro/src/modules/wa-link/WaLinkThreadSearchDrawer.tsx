import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Search, X } from 'lucide-react';
import type { WaLinkMessage } from './useWaLinkInbox';

type Props = {
  open: boolean;
  messages: WaLinkMessage[];
  contactLabel: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
};

const WaLinkThreadSearchDrawer: React.FC<Props> = ({
  open,
  messages,
  contactLabel,
  onClose,
  onJumpToMessage,
}) => {
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      setDateFilter('');
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = [...messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    if (dateFilter) {
      list = list.filter((m) => m.created_at.slice(0, 10) === dateFilter);
    }
    if (!q) return list;
    return list.filter((m) => (m.content || '').toLowerCase().includes(q));
  }, [messages, query, dateFilter]);

  if (!open) return null;

  return (
    <div className="wa-thread-search-root" role="presentation">
      <button type="button" className="wa-thread-search-backdrop" aria-label="Fechar" onClick={onClose} />
      <aside className="wa-thread-search-drawer" role="dialog" aria-label="Pesquisar mensagens">
        <header className="wa-thread-search-head">
          <button type="button" className="wa-thread-search-close" onClick={onClose} aria-label="Fechar">
            <X size={22} strokeWidth={2} />
          </button>
          <h2>Pesquisar mensagens</h2>
        </header>

        <div className="wa-thread-search-toolbar">
          <label className="wa-thread-search-date" title="Filtrar por data">
            <Calendar size={18} strokeWidth={1.75} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filtrar por data"
            />
          </label>
          <div className="wa-thread-search-input-wrap">
            <Search size={18} strokeWidth={2} className="wa-thread-search-icon" />
            <input
              type="search"
              placeholder="Pesquisar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="wa-thread-search-scroll">
          {results.length === 0 ? (
            <p className="wa-thread-search-empty">
              {query.trim() || dateFilter
                ? 'Nenhuma mensagem encontrada.'
                : `Pesquisar mensagens com ${contactLabel}`}
            </p>
          ) : (
            <ul className="wa-thread-search-results">
              {results.map((m) => {
                const out = String(m.direction).toLowerCase() === 'out';
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className="wa-thread-search-result"
                      onClick={() => {
                        onJumpToMessage(m.id);
                        onClose();
                      }}
                    >
                      <span className="wa-thread-search-result-meta">
                        <strong>{out ? 'Você' : contactLabel}</strong>
                        <time>
                          {new Date(m.created_at).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </time>
                      </span>
                      <span className="wa-thread-search-result-text">{m.content || '—'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};

export default WaLinkThreadSearchDrawer;
