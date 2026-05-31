import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { DemoMovementRow } from '@/lib/logstokaDemoSeed';

type Props = {
  open: boolean;
  movement: DemoMovementRow | null;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const EntryDeleteConfirmModal: React.FC<Props> = ({ open, movement, deleting, onClose, onConfirm }) => {
  if (!movement) return null;

  const typeLabel =
    movement.movement_type === 'exit'
      ? 'saída'
      : movement.movement_type === 'transfer'
        ? 'transferência'
        : movement.movement_type === 'damage'
          ? 'avaria'
          : 'entrada';

  return (
    <Modal
      open={open}
      title={`Excluir ${typeLabel}`}
      subtitle="Esta ação não poderá ser desfeita"
      icon={<Trash2 size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={deleting}>
            Cancelar
          </button>
          <button type="button" className="ls-btn-primary bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={deleting}>
            {deleting ? 'Excluindo…' : 'Excluir'}
          </button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-[#525252]">
        <p>
          Tem certeza que deseja excluir a {typeLabel} de{' '}
          <strong className="text-[#383838]">{movement.product_name ?? movement.sku}</strong>?
        </p>
        <p>
          SKU <strong>{movement.sku}</strong> · {movement.total_quantity} un. ·{' '}
          {movement.reference_code ?? 'Sem referência'}
        </p>
      </div>
    </Modal>
  );
};

export default EntryDeleteConfirmModal;
