import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  ZAPTRO_LIST_PAGE_SIZE_EXTENDED,
  ZAPTRO_LIST_PAGE_SIZE_MAX,
  ZAPTRO_LIST_PAGE_SIZE_MIN,
  ZAPTRO_LIST_PAGE_SIZE_PRESETS,
  clampZaptroPageSize,
  isZaptroListPageSizePreset,
  zaptroVisiblePageNumbers,
} from '../../hooks/useZaptroPaginatedList';
import './zaptroListPagination.css';

type Props = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  /** Barra full-bleed alinhada ao gutter (Clientes, Orçamentos). Desligar em cartões internos. */
  gutterBleed?: boolean;
};

const ALL_SELECT_OPTIONS = [...ZAPTRO_LIST_PAGE_SIZE_PRESETS, ...ZAPTRO_LIST_PAGE_SIZE_EXTENDED];

const ZaptroListPagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  gutterBleed = true,
}) => {
  const safeSize = clampZaptroPageSize(itemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const [customDraft, setCustomDraft] = useState(String(safeSize));
  const [customOpen, setCustomOpen] = useState(() => !isZaptroListPageSizePreset(safeSize));

  const selectValue =
    customOpen || !isZaptroListPageSizePreset(safeSize) ? 'custom' : String(safeSize);

  useEffect(() => {
    setCustomDraft(String(safeSize));
    if (isZaptroListPageSizePreset(safeSize)) setCustomOpen(false);
  }, [safeSize]);

  useEffect(() => {
    if (customOpen) customInputRef.current?.focus();
  }, [customOpen]);

  if (totalItems === 0) return null;

  const start = (currentPage - 1) * safeSize + 1;
  const end = Math.min(currentPage * safeSize, totalItems);
  const pageNums = zaptroVisiblePageNumbers(currentPage, totalPages);

  const applyCustom = () => {
    const parsed = clampZaptroPageSize(Number(customDraft));
    setCustomDraft(String(parsed));
    onItemsPerPageChange(parsed);
    setCustomOpen(!isZaptroListPageSizePreset(parsed));
  };

  const bar = (
    <footer
      className={`zaptro-list-pagination${gutterBleed ? ' zaptro-list-pagination--page-bleed' : ''}`}
      aria-label="Paginação da lista"
    >
      <p className="zaptro-list-pagination__info">
        A mostrar <strong>{start}</strong>–<strong>{end}</strong> de <strong>{totalItems}</strong>
        {totalPages > 1 ? (
          <>
            {' '}
            · página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </>
        ) : null}
      </p>

      <div className="zaptro-list-pagination__controls">
        <div className="zaptro-list-pagination__size">
          <span className="zaptro-list-pagination__size-label">Por página</span>
          <select
            className="zaptro-list-pagination__select"
            value={selectValue}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'custom') {
                setCustomOpen(true);
                return;
              }
              setCustomOpen(false);
              onItemsPerPageChange(clampZaptroPageSize(Number(v)));
            }}
            aria-label="Itens por página"
          >
            {ALL_SELECT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="custom">Personalizar…</option>
          </select>
          {customOpen ? (
            <input
              ref={customInputRef}
              type="number"
              className="zaptro-list-pagination__custom"
              min={ZAPTRO_LIST_PAGE_SIZE_MIN}
              max={ZAPTRO_LIST_PAGE_SIZE_MAX}
              step={1}
              value={customDraft}
              onChange={(e) => setCustomDraft(e.target.value)}
              onBlur={applyCustom}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyCustom();
                }
                if (e.key === 'Escape') {
                  setCustomOpen(isZaptroListPageSizePreset(safeSize));
                  setCustomDraft(String(safeSize));
                }
              }}
              title={`Entre ${ZAPTRO_LIST_PAGE_SIZE_MIN} e ${ZAPTRO_LIST_PAGE_SIZE_MAX} — Enter para aplicar`}
              aria-label="Quantidade personalizada por página"
              placeholder="Ex.: 25"
            />
          ) : null}
        </div>

        {totalPages > 1 ? (
          <div className="zaptro-list-pagination__pages">
            <button
              type="button"
              className="zaptro-list-pagination__nav"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(1)}
              aria-label="Primeira página"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              className="zaptro-list-pagination__nav"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNums.map((p, idx) => {
              const prev = pageNums[idx - 1];
              const showGap = prev != null && p - prev > 1;
              return (
                <React.Fragment key={p}>
                  {showGap ? <span className="zaptro-list-pagination__gap">…</span> : null}
                  <button
                    type="button"
                    className={`zaptro-list-pagination__page${p === currentPage ? ' is-active' : ''}`}
                    onClick={() => onPageChange(p)}
                    aria-label={`Página ${p}`}
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              type="button"
              className="zaptro-list-pagination__nav"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="zaptro-list-pagination__nav"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              aria-label="Última página"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </footer>
  );

  if (!gutterBleed) return bar;

  return <div className="zaptro-list-pagination-bleed-host">{bar}</div>;
};

export default ZaptroListPagination;
