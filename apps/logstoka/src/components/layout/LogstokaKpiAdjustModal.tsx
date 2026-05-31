import React, { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type Props = {
  open: boolean;
  title: string;
  label: string;
  currentValue: string | number;
  subtitle?: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (value: number, status: 'correct' | 'wrong') => void;
};

const LogstokaKpiAdjustModal: React.FC<Props> = ({
  open,
  title,
  label,
  currentValue,
  subtitle,
  saving = false,
  onClose,
  onSave,
}) => {
  const [quantity, setQuantity] = useState<number>(Number(currentValue) || 0);

  useEffect(() => {
    if (!open) return;
    const n = Number(String(currentValue).replace(/\D/g, ''));
    setQuantity(Number.isFinite(n) && n > 0 ? n : 1);
  }, [open, currentValue]);

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle ?? 'Informe a quantidade conferida e marque se está correta ou divergente'}
      icon={<Pencil size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="ls-btn-secondary inline-flex items-center gap-1.5"
            disabled={saving}
            onClick={() => onSave(quantity, 'wrong')}
          >
            <XCircle size={16} />
            Divergente
          </button>
          <button
            type="button"
            className="ls-btn-primary inline-flex items-center gap-1.5"
            disabled={saving || quantity < 1}
            onClick={() => onSave(quantity, 'correct')}
          >
            <CheckCircle2 size={16} />
            {saving ? 'Salvando…' : 'Confirmar conferência'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm font-semibold text-[#525252]">
          {label}: <strong className="text-[#383838]">{currentValue}</strong>
        </p>
        <label className="block">
          <span className="ls-label">Nova quantidade conferida</span>
          <input
            type="number"
            min={1}
            className="ls-input mt-1 w-full"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          />
        </label>
      </div>
    </Modal>
  );
};

export default LogstokaKpiAdjustModal;
