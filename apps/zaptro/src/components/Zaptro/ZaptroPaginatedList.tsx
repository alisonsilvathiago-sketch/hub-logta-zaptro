import React from 'react';
import { useZaptroPaginatedList } from '../../hooks/useZaptroPaginatedList';
import ZaptroListPagination from './ZaptroListPagination';
import './zaptroListPagination.css';

type Props<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  empty?: React.ReactNode;
  listClassName?: string;
  defaultPageSize?: number;
  /** Reinicia para a página 1 quando muda (ex.: tab activa). */
  resetKey?: string | number;
  /** Mostrar barra de paginação (desligar em listas agrupadas com paginação única). */
  showPagination?: boolean;
};

export function ZaptroPaginatedList<T>({
  items,
  renderItem,
  keyExtractor,
  empty = null,
  listClassName = '',
  defaultPageSize = 10,
  resetKey,
  showPagination = true,
}: Props<T>) {
  const pag = useZaptroPaginatedList(items, defaultPageSize, resetKey);

  return (
    <div className="zaptro-paginated-list">
      <div className={listClassName ? `zaptro-paginated-list__body ${listClassName}` : 'zaptro-paginated-list__body'}>
        {pag.pageItems.length === 0
          ? empty
          : pag.pageItems.map((item, index) => (
              <React.Fragment key={keyExtractor(item)}>{renderItem(item, index)}</React.Fragment>
            ))}
      </div>
      {showPagination ? (
        <ZaptroListPagination
          currentPage={pag.currentPage}
          totalPages={pag.totalPages}
          totalItems={pag.totalItems}
          itemsPerPage={pag.itemsPerPage}
          onPageChange={pag.setCurrentPage}
          onItemsPerPageChange={pag.setItemsPerPage}
        />
      ) : null}
    </div>
  );
}

export default ZaptroPaginatedList;
