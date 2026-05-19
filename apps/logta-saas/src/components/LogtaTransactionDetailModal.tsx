import React from 'react';
import { Calendar, CreditCard, Truck, User, X } from 'lucide-react';
import type { TransactionDetailMeta } from '../lib/transactionMetaEnrich';

type Props = {
  open: boolean;
  transaction: Record<string, unknown> | null;
  mode: 'pagar' | 'receber' | 'view';
  onClose: () => void;
  onConfirm?: () => void;
};

export function LogtaTransactionDetailModal({ open, transaction, mode, onClose, onConfirm }: Props) {
  if (!open || !transaction) return null;

  const meta = (transaction.metadata || {}) as TransactionDetailMeta;
  const valor = Number(transaction.valor || transaction.amount || 0);
  const isExpense = transaction.tipo === 'despesa' || String(transaction.type).toLowerCase() === 'expense';
  const dataRef = transaction.data_vencimento || transaction.paid_at || transaction.created_at;
  const pessoa = meta.motorista_nome || meta.colaborador_nome || meta.pix_favorecido || '—';
  const tipoPessoa = meta.motorista_tipo === 'colaborador' ? 'Colaborador' : meta.motorista_tipo === 'motorista' ? 'Motorista' : 'Beneficiário';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="Fechar" onClick={onClose} />
      <div className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800">
          <X size={18} />
        </button>
        <p className="text-[10px] font-black uppercase text-primary">
          {mode === 'pagar' ? 'Contas a pagar' : mode === 'receber' ? 'Contas a receber' : 'Detalhe financeiro'}
        </p>
        <h2 className="mt-2 text-xl font-black">{String(transaction.descricao || transaction.description)}</h2>
        <p className="mt-1 text-2xl font-black text-primary">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p className="mt-1 text-xs text-neutral-400 uppercase">{String(transaction.categoria || transaction.category)}</p>

        <div className="mt-6 space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <Row icon={User} label="Quem utilizou / responsável" value={`${pessoa} (${tipoPessoa})`} />
          {meta.placa ? <Row icon={Truck} label="Veículo / placa" value={meta.placa} /> : null}
          {meta.posto ? <Row icon={Truck} label="Local / posto" value={meta.posto} /> : null}
          {meta.frete_numero ? <Row icon={Truck} label="Frete" value={meta.frete_numero} /> : null}
          {meta.cliente_nome ? <Row icon={User} label="Cliente" value={meta.cliente_nome} /> : null}
          <Row
            icon={Calendar}
            label="Data / hora"
            value={
              dataRef
                ? `${new Date(String(dataRef)).toLocaleDateString('pt-BR')}${meta.hora_uso ? ` · ${meta.hora_uso}` : ''}`
                : '—'
            }
          />
          {meta.litros ? <Row icon={Truck} label="Litros / km" value={`${meta.litros} L · ${meta.km_rodado ?? '—'} km`} /> : null}
        </div>

        {isExpense && (meta.pix_favorecido || meta.pix_chave) ? (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-5">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase text-primary">
              <CreditCard size={14} /> Dados para pagamento (PIX)
            </p>
            <p className="text-sm font-bold">{meta.pix_favorecido}</p>
            <p className="mt-1 text-xs text-neutral-300">
              {meta.pix_tipo}: {meta.pix_chave}
            </p>
            {meta.banco ? <p className="mt-1 text-xs text-neutral-500">{meta.banco}</p> : null}
          </div>
        ) : null}

        {meta.observacao ? <p className="mt-4 text-xs text-neutral-400">{meta.observacao}</p> : null}

        <div className="mt-8 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-neutral-700 py-3 text-sm font-bold text-neutral-300">
            Fechar
          </button>
          {mode === 'pagar' && onConfirm ? (
            <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold">
              Confirmar pagamento
            </button>
          ) : null}
          {mode === 'receber' && onConfirm ? (
            <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold">
              Marcar como recebido
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-left">
      <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
      <div>
        <p className="text-[10px] font-bold uppercase text-neutral-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
