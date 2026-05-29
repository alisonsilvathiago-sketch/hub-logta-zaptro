import React, { useMemo, useState } from 'react';
import { Clock, Smartphone } from 'lucide-react';
import { LogtaModalHeader } from '../../../../components/LogtaModalHeader';
import { showToast } from '../../../../components/Toast';
import type { ColaboradorRhProfile } from '../colaboradorRhStorage';
import { registerManualPontoForColaborador } from '../registerManualPonto';
import type { PontoConfig, PontoRecordType } from '../types';

const TIPOS: { value: PontoRecordType; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'pausa_inicio', label: 'Início de pausa' },
  { value: 'pausa_fim', label: 'Retorno de pausa' },
];

const inputClass =
  'w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary';

function defaultDateTimeLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type Props = {
  open: boolean;
  profile: ColaboradorRhProfile;
  companyId: string;
  pontoConfig: PontoConfig | null;
  onClose: () => void;
  onSaved: () => void;
};

export function RegistrarPontoManualModal({
  open,
  profile,
  companyId,
  pontoConfig,
  onClose,
  onSaved,
}: Props) {
  const [offline, setOffline] = useState(false);
  const initialWhen = useMemo(() => defaultDateTimeLocal(), [open, profile.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-[28px] border border-neutral-800 bg-[#18191B] p-6 text-white shadow-2xl animate-in zoom-in duration-200 md:p-8">
        <LogtaModalHeader icon={Clock} title="Registrar batida de ponto" onClose={onClose} />
        <p className="mt-2 text-xs font-medium text-neutral-400">
          {profile.fullName} · batidas pelo celular/link seguem{' '}
          <span className="text-primary">automáticas</span>. Use aqui se o aparelho estiver desligado ou sem
          sinal.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const type = (form.elements.namedItem('tipo') as HTMLSelectElement).value as PontoRecordType;
            const when = (form.elements.namedItem('when') as HTMLInputElement).value;
            const motivo = (form.elements.namedItem('motivo') as HTMLTextAreaElement).value.trim();
            try {
              registerManualPontoForColaborador(
                companyId,
                profile,
                {
                  type,
                  timestamp: when,
                  motivo: motivo || undefined,
                  origem: offline ? 'rh_offline' : 'rh_manual',
                },
                pontoConfig,
              );
              showToast('success', 'Batida registrada na jornada do colaborador.', 'Ponto');
              onSaved();
              onClose();
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Não foi possível registrar.',
                'Ponto',
              );
            }
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="tipo" className="text-[10px] font-bold uppercase text-neutral-400">
              Tipo de batida
            </label>
            <select id="tipo" name="tipo" className={inputClass} defaultValue="entrada">
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="when" className="text-[10px] font-bold uppercase text-neutral-400">
              Data e hora
            </label>
            <input
              id="when"
              name="when"
              type="datetime-local"
              required
              defaultValue={initialWhen}
              className={inputClass}
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-3">
            <input
              type="checkbox"
              checked={offline}
              onChange={(e) => setOffline(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-xs font-semibold text-neutral-200">
              <Smartphone size={14} className="mr-1 inline text-primary" />
              Celular do colaborador offline / sem internet
            </span>
          </label>

          <div className="space-y-1.5">
            <label htmlFor="motivo" className="text-[10px] font-bold uppercase text-neutral-400">
              Motivo (opcional)
            </label>
            <textarea
              id="motivo"
              name="motivo"
              rows={2}
              placeholder="Ex.: celular descarregado na rota SP → Curitiba"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-600 py-3 text-xs font-bold text-neutral-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-gray-900 shadow-lg hover:opacity-90"
            >
              Salvar batida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
