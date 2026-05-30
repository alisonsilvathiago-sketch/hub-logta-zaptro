import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart } from 'lucide-react';
import { useReplenishment } from '@/hooks/useLogstokaData';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const LogstokaTopbarNotify: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading } = useReplenishment();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open || !wrapRef.current) return;
      if (e.target instanceof Node && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const count = items.length;

  return (
    <div className="lsdash-notify-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`lsdash-icon-btn lsdash-icon-btn--notify${open ? ' active' : ''}`}
        title="Reposição e alertas"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} strokeWidth={2} />
        {count > 0 ? <span className="lsdash-notify-badge">{count > 9 ? '9+' : count}</span> : null}
      </button>

      {open ? (
        <div className="lsdash-notify-popover" role="menu" aria-label="Centro de reposição">
          <div className="lsdash-notify-popover__head">
            <span className="lsdash-notify-popover__title">
              <ShoppingCart size={16} className="text-orange-600" />
              Centro de reposição
            </span>
            {count > 0 ? <span className="lsdash-notify-popover__count">{count}</span> : null}
          </div>

          {loading ? (
            <p className="lsdash-notify-popover__empty">Carregando…</p>
          ) : count === 0 ? (
            <p className="lsdash-notify-popover__empty">Nenhuma reposição sugerida.</p>
          ) : (
            <ul className="lsdash-notify-popover__list">
              {items.slice(0, 8).map((r, i) => (
                <li key={r.sku}>
                  <div className="lsdash-notify-popover__item">
                    <span className="lsdash-notify-popover__rank">{i + 1}</span>
                    <span className="lsdash-notify-popover__body">
                      <span className="lsdash-notify-popover__item-title">{r.name}</span>
                      <span className="lsdash-notify-popover__item-detail">{r.sku}</span>
                    </span>
                    <span className="lsdash-notify-popover__qty">+{r.suggested_purchase}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="lsdash-notify-popover__footer"
            onClick={() => {
              setOpen(false);
              navigate(LOGSTOKA_ROUTES.ALERTS);
            }}
          >
            Ver alertas e notificações
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default LogstokaTopbarNotify;
