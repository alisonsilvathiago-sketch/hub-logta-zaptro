import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, PackagePlus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { getDemoProductBySku } from '@/lib/logstokaDemoSeed';
import {
  DIVERGENCE_REASON_LABELS,
  deleteConferenceDivergence,
  resolveConferenceDivergence,
  updateConferenceDivergence,
  type ConferenceDivergence,
  type DivergenceReason,
} from '@/lib/conferenceDivergences';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';

const REASONS: DivergenceReason[] = ['not_found', 'wrong_qty', 'damaged', 'swapped', 'other'];

type Props = {
  open: boolean;
  item: ConferenceDivergence | null;
  companyId: string | null;
  onClose: () => void;
  onChanged: () => void;
};

const ConferencePendingResolveModal: React.FC<Props> = ({ open, item, companyId, onClose, onChanged }) => {
  const [productName, setProductName] = useState('');
  const [orderRef, setOrderRef] = useState('');
  const [sku, setSku] = useState('');
  const [marketplaceLabel, setMarketplaceLabel] = useState('');
  const [reason, setReason] = useState<DivergenceReason>('not_found');
  const [note, setNote] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!open || !item) return;
    setProductName(item.productName);
    setOrderRef(item.orderRef);
    setSku(item.sku ?? '');
    setMarketplaceLabel(item.marketplaceLabel);
    setReason(item.reason);
    setNote(item.note ?? '');
    setResolutionNote('');
  }, [open, item]);

  const catalogProduct = useMemo(() => {
    if (!companyId || !isLogstokaDemoCompany(companyId)) return null;
    return getDemoProductBySku(sku.trim() || null);
  }, [companyId, sku]);

  if (!item || !companyId) return null;

  const saveEdits = (opts?: { silent?: boolean }) => {
    if (!productName.trim()) {
      toast.error('Informe o nome do produto');
      return false;
    }
    updateConferenceDivergence(companyId, item.id, {
      productName: productName.trim(),
      orderRef: orderRef.trim() || item.orderRef,
      sku: sku.trim() || undefined,
      marketplaceLabel: marketplaceLabel.trim() || item.marketplaceLabel,
      reason,
      note: note.trim() || undefined,
    });
    if (!opts?.silent) toast.success('Pendência atualizada');
    onChanged();
    return true;
  };

  const markResolved = () => {
    if (!saveEdits({ silent: true })) return;
    resolveConferenceDivergence(companyId, item.id, resolutionNote);
    toast.success('Pendência resolvida');
    onChanged();
    onClose();
  };

  const remove = () => {
    deleteConferenceDivergence(companyId, item.id);
    toast.success('Pendência excluída');
    onChanged();
    onClose();
  };

  const productAddUrl = `${LOGSTOKA_ROUTES.PRODUCT_ADD}?name=${encodeURIComponent(productName)}&sku=${encodeURIComponent(sku)}`;
  const catalogSearchUrl = `${LOGSTOKA_ROUTES.PRODUCTS}?search=${encodeURIComponent(sku || productName)}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Resolver pendência"
      subtitle={DIVERGENCE_REASON_LABELS[reason]}
      icon={<AlertTriangle size={20} strokeWidth={2.2} />}
      size="wide"
      footer={
        <>
          <button type="button" className="ls-btn-secondary inline-flex items-center gap-1 text-red-700" onClick={remove}>
            <Trash2 size={15} />
            Excluir
          </button>
          <button type="button" className="ls-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="ls-btn-secondary" onClick={() => saveEdits()}>
            Salvar alterações
          </button>
          <button type="button" className="ls-btn-primary" onClick={markResolved}>
            Marcar resolvida
          </button>
        </>
      }
    >
      <div className="ls-conf-pending-modal space-y-4">
        {reason === 'not_found' ? (
          <div className="ls-conf-pending-modal__hint">
            <p className="font-bold text-[#92400e]">Produto não encontrado no estoque</p>
            <p className="mt-1 text-sm text-[#78716c]">
              Cadastre o SKU no catálogo, corrija o código lido ou ajuste o pedido antes de marcar como resolvida.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={productAddUrl} className="ls-btn-primary inline-flex items-center gap-1 text-sm" onClick={onClose}>
                <PackagePlus size={15} />
                Cadastrar produto
              </Link>
              {catalogProduct ? (
                <Link
                  to={`${LOGSTOKA_ROUTES.PRODUCTS}/${catalogProduct.id}`}
                  className="ls-btn-secondary inline-flex items-center gap-1 text-sm"
                  onClick={onClose}
                >
                  <Pencil size={15} />
                  Editar no catálogo
                </Link>
              ) : (
                <Link to={catalogSearchUrl} className="ls-btn-secondary inline-flex items-center gap-1 text-sm" onClick={onClose}>
                  Buscar no catálogo
                </Link>
              )}
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="ls-label">Pedido / referência</span>
            <input className="ls-input mt-1" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} />
          </label>
          <label>
            <span className="ls-label">Canal</span>
            <input className="ls-input mt-1" value={marketplaceLabel} onChange={(e) => setMarketplaceLabel(e.target.value)} />
          </label>
          <label>
            <span className="ls-label">SKU</span>
            <input className="ls-input mt-1" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Código lido na conferência" />
          </label>
          <label>
            <span className="ls-label">Motivo</span>
            <select className="ls-input mt-1" value={reason} onChange={(e) => setReason(e.target.value as DivergenceReason)}>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {DIVERGENCE_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="ls-label">Nome do produto</span>
            <input className="ls-input mt-1" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </label>
          <label className="md:col-span-2">
            <span className="ls-label">Observação da divergência</span>
            <textarea className="ls-input mt-1 min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="O que aconteceu na conferência?" />
          </label>
          <label className="md:col-span-2">
            <span className="ls-label">Como foi resolvido</span>
            <textarea
              className="ls-input mt-1 min-h-[72px]"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Ex.: SKU cadastrado, etiqueta corrigida, quantidade ajustada no pedido…"
            />
          </label>
        </div>

        <p className="text-xs text-[#9ca3af]">
          Contexto: {item.context === 'inventory' ? 'Inventário' : 'Operação'} · {item.quantity} un. ·{' '}
          {new Date(item.createdAt).toLocaleString('pt-BR')}
        </p>
      </div>
    </Modal>
  );
};

export default ConferencePendingResolveModal;
