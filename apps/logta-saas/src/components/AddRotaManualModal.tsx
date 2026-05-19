import React, { useEffect, useState } from 'react';
import { Navigation } from 'lucide-react';
import { LogtaModalHeader } from './LogtaModalHeader';
import { showToast } from './Toast';

export type ManualRouteForm = {
  nome: string;
  motorista: string;
  veiculo: string;
  origem: string;
  destino: string;
};

type AddRotaManualModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (form: ManualRouteForm) => void | Promise<void>;
};

const emptyForm = (): ManualRouteForm => ({
  nome: '',
  motorista: '',
  veiculo: '',
  origem: '',
  destino: '',
});

export const AddRotaManualModal: React.FC<AddRotaManualModalProps> = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState<ManualRouteForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) setForm(emptyForm());
  }, [open]);

  if (!open) return null;

  const update = (field: keyof ManualRouteForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.motorista.trim() || !form.origem.trim() || !form.destino.trim()) {
      showToast('error', 'Informe nome da rota, motorista, origem e destino.', 'Campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        nome: form.nome.trim(),
        motorista: form.motorista.trim(),
        veiculo: form.veiculo.trim(),
        origem: form.origem.trim(),
        destino: form.destino.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-rota-manual-title"
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-gray-100 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <LogtaModalHeader
          icon={Navigation}
          title="Nova rota manual"
          onClose={onClose}
          closeLabel="Fechar cadastro de rota"
        />
        <p id="add-rota-manual-title" className="sr-only">
          Cadastrar rota manualmente
        </p>
        <p className="mb-5 text-xs font-medium leading-relaxed text-gray-500">
          Use quando a roteirização automática não refletir a operação real. A rota aparece em Rotas ativas e no mapa.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {(
            [
              { key: 'nome' as const, label: 'Nome da rota', placeholder: 'Ex.: Entrega Zona Sul' },
              { key: 'motorista' as const, label: 'Motorista', placeholder: 'Ex.: Carlos Lima' },
              { key: 'veiculo' as const, label: 'Veículo', placeholder: 'Ex.: Sprinter BRA-2L22' },
              { key: 'origem' as const, label: 'Local de saída', placeholder: 'Endereço ou ponto de partida' },
              { key: 'destino' as const, label: 'Destino', placeholder: 'Endereço final da rota' },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <label key={key} className="block">
              <span className="mb-1 block text-[10px] font-black uppercase tracking-normal text-gray-400">
                {label}
              </span>
              <input
                type="text"
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-900 outline-none transition-all focus:border-primary/30 focus:bg-white"
              />
            </label>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-xs font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-60"
            >
              {saving ? 'Salvando…' : 'Adicionar rota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
