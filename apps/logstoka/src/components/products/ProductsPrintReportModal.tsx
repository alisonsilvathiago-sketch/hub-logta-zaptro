import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { LsProduct } from '@/types';

export type ProductPrintScope = 'selected' | 'page' | 'all';

type Props = {
  open: boolean;
  onClose: () => void;
  selectedCount: number;
  pageCount: number;
  totalCount: number;
  onConfirm: (opts: { withImage: boolean; scope: ProductPrintScope }) => void;
  loading?: boolean;
};

const ProductsPrintReportModal: React.FC<Props> = ({
  open,
  onClose,
  selectedCount,
  pageCount,
  totalCount,
  onConfirm,
  loading = false,
}) => {
  const [withImage, setWithImage] = useState(true);
  const [scope, setScope] = useState<ProductPrintScope>('page');
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWithImage(true);
    setSelectAll(false);
    setScope(selectedCount > 0 ? 'selected' : 'page');
  }, [open, selectedCount]);

  useEffect(() => {
    if (selectAll) setScope('all');
  }, [selectAll]);

  const effectiveScope: ProductPrintScope = selectAll ? 'all' : scope;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Relatório de produtos"
      icon={<Printer size={20} strokeWidth={2.2} />}
      paddingVariant="balanced"
      footer={
        <>
          <button type="button" className="ls-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ls-btn-primary"
            disabled={loading || (!selectAll && effectiveScope === 'selected' && selectedCount === 0)}
            onClick={() => onConfirm({ withImage, scope: effectiveScope })}
          >
            {loading ? 'Preparando…' : 'OK'}
          </button>
        </>
      }
    >
      <div className="ls-products-print-modal space-y-4">
        <label className="ls-label block">
          Impressão
          <select className="ls-input mt-1" value={withImage ? 'with' : 'without'} onChange={(e) => setWithImage(e.target.value === 'with')}>
            <option value="with">Com imagem</option>
            <option value="without">Sem imagem</option>
          </select>
        </label>

        <fieldset className="ls-products-print-modal__scope">
          <legend className="ls-label ls-products-print-modal__legend block">Produtos para imprimir</legend>
          <label className="ls-products-print-modal__radio">
            <input
              type="radio"
              name="print-scope"
              checked={!selectAll && scope === 'selected'}
              disabled={selectedCount === 0}
              onChange={() => {
                setSelectAll(false);
                setScope('selected');
              }}
            />
            <span>Selecionados ({selectedCount})</span>
          </label>
          <label className="ls-products-print-modal__radio">
            <input
              type="radio"
              name="print-scope"
              checked={!selectAll && scope === 'page'}
              onChange={() => {
                setSelectAll(false);
                setScope('page');
              }}
            />
            <span>Página atual ({pageCount})</span>
          </label>
          <label className="ls-products-print-modal__radio">
            <input
              type="radio"
              name="print-scope"
              checked={selectAll || scope === 'all'}
              onChange={() => {
                setSelectAll(true);
                setScope('all');
              }}
            />
            <span>Todos do catálogo ({totalCount})</span>
          </label>
          <label className="ls-products-print-modal__check">
            <input type="checkbox" checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} />
            <span>Selecionar tudo para imprimir</span>
          </label>
        </fieldset>

        <p className="text-xs text-[#737373]">
          Ao confirmar, abriremos a janela de impressão do seu computador com o relatório escolhido.
        </p>
      </div>
    </Modal>
  );
};

export default ProductsPrintReportModal;
