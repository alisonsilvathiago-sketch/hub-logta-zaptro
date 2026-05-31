import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Store } from 'lucide-react';
import { useStores } from '@/hooks/useCatalog';
import { DEMO_STORES } from '@/lib/logstokaDemoSeed';
import {
  allStoresPagePath,
  resolveActiveStoreFromPath,
  storeListLabel,
  storePagePath,
} from '@/lib/storeNavigation';
import type { LsStore } from '@/types';

type Props = {
  className?: string;
};

const LogstokaStoreSwitcher: React.FC<Props> = ({ className = '' }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { stores } = useStores();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const visibleStores = useMemo(() => {
    const active = stores.filter((store) => store.is_active);
    return active.length > 0 ? active : DEMO_STORES.filter((store) => store.is_active);
  }, [stores]);

  const activeStore = useMemo(
    () => resolveActiveStoreFromPath(pathname, visibleStores),
    [pathname, visibleStores],
  );

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (!open || !ref.current) return;
      if (event.target instanceof Node && !ref.current.contains(event.target)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const triggerLabel = activeStore?.name ?? 'Todas as lojas';

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const selectAll = () => go(allStoresPagePath());
  const selectStore = (store: LsStore) => go(storePagePath(store));

  return (
    <div className={`lsdash-store-switcher${className ? ` ${className}` : ''}`} ref={ref}>
      <button
        type="button"
        className={`lsdash-store-switcher__trigger${open ? ' lsdash-store-switcher__trigger--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Store size={14} strokeWidth={2.25} aria-hidden />
        <span className="lsdash-store-switcher__trigger-label">{triggerLabel}</span>
        <ChevronDown size={14} strokeWidth={2.25} className="lsdash-store-switcher__chevron" aria-hidden />
      </button>

      {open ? (
        <div className="lsdash-store-switcher__menu" role="listbox" aria-label="Selecionar loja">
          <button
            type="button"
            role="option"
            aria-selected={!activeStore}
            className={`lsdash-store-switcher__item${!activeStore ? ' lsdash-store-switcher__item--selected' : ''}`}
            onClick={selectAll}
          >
            <span className="lsdash-store-switcher__check" aria-hidden>
              {!activeStore ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            <span className="lsdash-store-switcher__item-text">Todas as lojas</span>
          </button>

          <div className="lsdash-store-switcher__divider" />

          <div className="lsdash-store-switcher__list">
            {visibleStores.map((store) => {
              const selected = activeStore?.storeId === store.id;
              return (
                <button
                  key={store.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`lsdash-store-switcher__item${selected ? ' lsdash-store-switcher__item--selected' : ''}`}
                  onClick={() => selectStore(store)}
                >
                  <span className="lsdash-store-switcher__check" aria-hidden>
                    {selected ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  <span className="lsdash-store-switcher__item-text">{storeListLabel(store)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default LogstokaStoreSwitcher;
