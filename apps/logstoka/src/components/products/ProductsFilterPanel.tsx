import React from 'react';
import { Info, ScanLine } from 'lucide-react';

export type ProductSearchField = 'codigo' | 'nome' | 'ean' | 'sku';
export type ProductStockTypeFilter = 'all' | 'simple' | 'kit';

export type ProductsFilterValues = {
  query: string;
  searchBy: ProductSearchField;
  warehouse: string;
  brand: string;
  supplier: string;
  stockType: ProductStockTypeFilter;
};

type Props = {
  values: ProductsFilterValues;
  onChange: (patch: Partial<ProductsFilterValues>) => void;
  onApply: () => void;
  onScan?: () => void;
  applying?: boolean;
};

const SEARCH_BY_OPTIONS: Array<{ value: ProductSearchField; label: string }> = [
  { value: 'codigo', label: 'Código' },
  { value: 'sku', label: 'SKU' },
  { value: 'nome', label: 'Nome' },
  { value: 'ean', label: 'EAN / GTIN' },
];

const STOCK_TYPE_OPTIONS: Array<{ value: ProductStockTypeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'simple', label: 'Simples' },
  { value: 'kit', label: 'Composições' },
];

function FieldLabel({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="ls-products-filter__label-row">
      <span className="ls-label !mb-0">{label}</span>
      <span className="ls-products-filter__info" title={hint} aria-label={hint}>
        <Info size={13} strokeWidth={2.5} />
      </span>
    </span>
  );
}

const ProductsFilterPanel: React.FC<Props> = ({ values, onChange, onApply, onScan, applying }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form className="ls-products-filter ls-products-page-inset" onSubmit={handleSubmit}>
      <div className="ls-products-filter__grid">
        <label className="ls-products-filter__field">
          <FieldLabel label="Pesquisar" hint="Digite o termo conforme o campo selecionado em Pesquisar por." />
          <input
            className="ls-input"
            placeholder="Pesquisar por código"
            value={values.query}
            onChange={(e) => onChange({ query: e.target.value })}
          />
        </label>

        <label className="ls-products-filter__field">
          <FieldLabel label="Pesquisar por" hint="Escolha qual coluna será usada na busca." />
          <select
            className="ls-input"
            value={values.searchBy}
            onChange={(e) => onChange({ searchBy: e.target.value as ProductSearchField })}
          >
            {SEARCH_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="ls-products-filter__field">
          <FieldLabel label="Depósito" hint="Filtra produtos com saldo no depósito informado." />
          <input
            className="ls-input"
            placeholder="Depósito dos produtos"
            value={values.warehouse}
            onChange={(e) => onChange({ warehouse: e.target.value })}
          />
        </label>

        <label className="ls-products-filter__field">
          <FieldLabel label="Marca" hint="Filtra pela marca cadastrada no produto." />
          <input
            className="ls-input"
            placeholder="Marca dos produtos"
            value={values.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
          />
        </label>

        <label className="ls-products-filter__field">
          <FieldLabel label="Fornecedor" hint="Filtra pelo código interno ou fornecedor vinculado." />
          <input
            className="ls-input"
            placeholder="Fornecedor dos produtos"
            value={values.supplier}
            onChange={(e) => onChange({ supplier: e.target.value })}
          />
        </label>

        <label className="ls-products-filter__field">
          <FieldLabel label="Tipo de estoque (composições)" hint="Simples ou produtos com composição/kit." />
          <select
            className="ls-input"
            value={values.stockType}
            onChange={(e) => onChange({ stockType: e.target.value as ProductStockTypeFilter })}
          >
            {STOCK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ls-products-filter__action">
          {onScan ? (
            <button
              type="button"
              className="ls-products-filter__scan"
              onClick={onScan}
              title="Scanner inteligente"
              aria-label="Scanner inteligente"
            >
              <ScanLine size={18} strokeWidth={2.2} aria-hidden />
            </button>
          ) : null}
          <button type="submit" className="ls-btn-primary ls-products-filter__submit" disabled={applying}>
            {applying ? 'Carregando…' : 'Visualizar'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductsFilterPanel;
