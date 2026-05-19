import React from 'react';
import { MessageSquare, Send, X } from 'lucide-react';

type OrcamentoAlteracaoClienteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  submitting?: boolean;
};

export function OrcamentoAlteracaoClienteModal({
  open,
  onClose,
  onSubmit,
  submitting = false,
}: OrcamentoAlteracaoClienteModalProps) {
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (!open) setMessage('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed.length < 10) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-label="Fechar" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-[32px] border border-gray-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Solicitar alteração</h2>
            <p className="text-sm text-gray-500">Descreva o que precisa ser ajustado neste orçamento.</p>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="ml-1 text-[10px] font-black uppercase tracking-normal text-gray-400">
            O que precisa ser alterado?
          </span>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex.: alterar destino, revisar valor, incluir seguro, ajustar prazo de validade…"
            className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            required
            minLength={10}
            autoFocus
          />
          <span className="text-[10px] font-semibold text-gray-400">Mínimo 10 caracteres</span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-5 py-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || message.trim().length < 10}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-white shadow-lg shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} /> {submitting ? 'Enviando…' : 'Enviar solicitação'}
          </button>
        </div>
      </form>
    </div>
  );
}
