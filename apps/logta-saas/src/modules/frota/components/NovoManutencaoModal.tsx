import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, ChevronDown } from 'lucide-react';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { showToast } from '../../../components/Toast';
import { createDespesaFromManutencao } from '../frotaManutencaoFinanceBridge';
import {
  appendFrotaManutencao,
  FROTA_MANUTENCAO_TIPOS,
  normalizePlaca,
  type FrotaManutencaoRecord,
  type FrotaManutencaoTipo,
} from '../frotaManutencaoStorage';

export type VeiculoManutencaoOption = {
  id: string;
  placa: string;
  modelo: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  companyId: string;
  veiculos: VeiculoManutencaoOption[];
  initialPlaca?: string;
  onSaved: () => void;
};

export function NovoManutencaoModal({
  open,
  onClose,
  companyId,
  veiculos,
  initialPlaca,
  onSaved,
}: Props) {
  const [placaInput, setPlacaInput] = useState('');
  const [tipo, setTipo] = useState<FrotaManutencaoTipo>('troca_oleo');
  const [valor, setValor] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const placaKey = normalizePlaca(placaInput);
  const veiculoEncontrado = useMemo(
    () => veiculos.find((v) => normalizePlaca(v.placa) === placaKey),
    [veiculos, placaKey],
  );

  useEffect(() => {
    if (open && initialPlaca) setPlacaInput(initialPlaca);
  }, [open, initialPlaca]);

  if (!open) return null;

  const reset = () => {
    setPlacaInput(initialPlaca || '');
    setTipo('troca_oleo');
    setValor('');
    setResponsavel('');
    setMotivo('');
    setObservacao('');
    setData(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placaKey) {
      showToast('warning', 'Informe a placa do veículo.', 'Manutenção');
      return;
    }
    const valorNum = Number(String(valor).replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      showToast('warning', 'Informe um valor válido.', 'Manutenção');
      return;
    }
    if (!responsavel.trim()) {
      showToast('warning', 'Informe quem realizou a manutenção.', 'Manutenção');
      return;
    }

    setSaving(true);
    const id = `manut-${Date.now()}`;
    const realizadoEm = new Date(`${data}T12:00:00`).toISOString();
    const record: FrotaManutencaoRecord = {
      id,
      companyId,
      vehicleId: veiculoEncontrado?.id,
      placa: placaKey,
      modelo: veiculoEncontrado?.modelo || 'Veículo não cadastrado',
      tipo,
      valor: valorNum,
      responsavel: responsavel.trim(),
      motivo: motivo.trim() || undefined,
      observacao: observacao.trim() || undefined,
      realizadoEm,
      createdAt: new Date().toISOString(),
    };

    try {
      const financeId = await createDespesaFromManutencao(companyId, record);
      appendFrotaManutencao(companyId, { ...record, financeTransactionId: financeId });
      showToast('success', 'Manutenção lançada e vinculada ao Financeiro.', 'Frota');
      reset();
      onSaved();
      onClose();
    } catch {
      showToast('error', 'Não foi possível salvar o lançamento.', 'Manutenção');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
        <LogtaModalHeader icon={Wrench} title="Lançar manutenção" onClose={onClose} />
        <p className="mt-2 text-xs font-medium text-neutral-400">
          Óleo, pneus, filtros, motor e demais serviços. O valor entra automaticamente no Financeiro.
        </p>

        <form className="mt-6 space-y-4 text-left" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">PLACA DO VEÍCULO</label>
            <input
              list="frota-placas-manutencao"
              value={placaInput}
              onChange={(e) => setPlacaInput(e.target.value.toUpperCase())}
              placeholder="Ex.: BRA-2L22"
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
            <datalist id="frota-placas-manutencao">
              {veiculos.map((v) => (
                <option key={v.id} value={v.placa}>
                  {v.modelo}
                </option>
              ))}
            </datalist>
            {placaKey ? (
              <p className={`text-[10px] font-bold ${veiculoEncontrado ? 'text-green-400' : 'text-amber-400'}`}>
                {veiculoEncontrado
                  ? `Veículo encontrado: ${veiculoEncontrado.modelo}`
                  : 'Placa não cadastrada — o lançamento será salvo mesmo assim.'}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">TIPO DE MANUTENÇÃO</label>
            <div className="relative">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as FrotaManutencaoTipo)}
                className="w-full appearance-none rounded-xl border border-neutral-800 bg-neutral-900 p-3 pr-10 text-sm font-semibold text-white outline-none focus:border-primary"
              >
                {FROTA_MANUTENCAO_TIPOS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown size={16} className="text-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">VALOR (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">DATA</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              PROBLEMA / MOTIVO DA MANUTENÇÃO
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ex.: barulho no motor, vazamento de óleo, pneu careca..."
              className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">QUEM REALIZOU?</label>
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Oficina, mecânico ou colaborador"
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">OBSERVAÇÕES (OPCIONAL)</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="Detalhes do serviço, KM, peças..."
              className="w-full resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar e lançar no Financeiro'}
          </button>
        </form>
      </div>
    </div>
  );
}
