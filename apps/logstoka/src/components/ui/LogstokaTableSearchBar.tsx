import React from 'react';
import { Search, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: React.ReactNode;
  resultCount?: number;
};

const LogstokaTableSearchBar: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Buscar SKU, produto, referência…',
  filters,
  resultCount,
}) => (
  <div className="ls-table-search-bar">
    <div className="ls-table-search-bar__field">
      <Search size={16} className="ls-table-search-bar__icon" aria-hidden />
      <input
        type="search"
        className="ls-table-search-bar__input"
        value={value}
        placeholder={placeholder}
        aria-label="Pesquisar na lista"
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="ls-table-search-bar__clear"
          aria-label="Limpar pesquisa"
          onClick={() => onChange('')}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
    {filters ? <div className="ls-table-search-bar__filters">{filters}</div> : null}
    {typeof resultCount === 'number' ? (
      <p className="ls-table-search-bar__count">{resultCount} registro(s)</p>
    ) : null}
  </div>
);

export default LogstokaTableSearchBar;
