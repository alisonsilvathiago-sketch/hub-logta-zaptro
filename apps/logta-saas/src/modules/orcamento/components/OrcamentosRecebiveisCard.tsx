import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import { showToast } from '../../../components/Toast';
import {
  getOrcamentosAguardandoPagamento,
  markOrcamentoPaymentReceived,
} from '../orcamentoStorage';
import type { OrcamentoProposal } from '../types';

type OrcamentosRecebiveisCardProps = {
  companyId: string;
  receivedByName?: string;
};

export function OrcamentosRecebiveisCard({ companyId, receivedByName = 'Financeiro' }: OrcamentosRecebiveisCardProps) {
  const [list, setList] = React.useState<OrcamentoProposal[]>(() => getOrcamentosAguardandoPagamento(companyId));

  const refresh = React.useCallback(() => {
    setList(getOrcamentosAguardandoPagamento(companyId));
  }, [companyId]);

  React.useEffect(() => {
    refresh();
    window.addEventListener('logta-orcamento-sync', refresh);
    return () => window.removeEventListener('logta-orcamento-sync', refresh);
  }, [refresh]);

  const total = list.reduce((s, o) => s + o.total, 0);

  if (list.length === 0) return null;

  return (
    <div className="logta-panel-card overflow-hidden border-primary/20">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-primary/5 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="logta-card-heading">Orçamentos aprovados — aguardando pagamento</h3>
            <p className="mt-1 text-xs font-medium text-gray-500">
              {list.length} orçamento(s) · Total R$ {total.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        <Link
          to="/crm/orcamentos"
          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-normal text-primary hover:underline"
        >
          Ver todos <ChevronRight size={14} />
        </Link>
      </div>
      <div className="divide-y divide-gray-100">
        {list.slice(0, 6).map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs font-black text-primary">{o.number}</p>
              <p className="text-sm font-bold text-gray-900">{o.clientName}</p>
              <p className="text-[10px] font-semibold text-gray-500">
                {o.approvedByTeam ? `Aprovado pela equipe (${o.teamApprovedByName ?? 'comercial'})` : 'Aprovado pelo cliente'}
                {o.approvedAt ? ` · ${new Date(o.approvedAt).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-black text-gray-900">R$ {o.total.toLocaleString('pt-BR')}</p>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    const next = await markOrcamentoPaymentReceived(companyId, o.id, receivedByName);
                    if (next) {
                      refresh();
                      showToast(
                        'success',
                        'Pagamento registrado. Receita criada em Contas a receber e Fluxo de caixa.',
                        'Financeiro',
                      );
                    }
                  })();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-[10px] font-bold uppercase text-white hover:bg-green-700"
              >
                <CheckCircle2 size={14} /> Confirmar pagamento
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
