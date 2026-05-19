import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, ExternalLink, Send, Sparkles } from 'lucide-react';
import { useTenant } from '../../../contexts/TenantContext';
import { resolveDemoCompanyId } from '../../../lib/seed';
import { showToast } from '../../../components/Toast';
import { loadOrcamentos, updateOrcamentoStatus, upsertOrcamento } from '../orcamentoStorage';
import type { OrcamentoProposal } from '../types';

export function OrcamentoDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);
  const [orc, setOrc] = React.useState<OrcamentoProposal | null>(null);

  React.useEffect(() => {
    const found = loadOrcamentos(companyId).find((o) => o.id === id) ?? null;
    setOrc(found);
  }, [id, companyId]);

  if (!orc) {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/crm/orcamentos')} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary">
          <ArrowLeft size={16} /> Voltar
        </button>
        <p className="py-12 text-center text-sm font-bold text-gray-400">Orçamento não encontrado</p>
      </div>
    );
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/orcamento/publico/${orc.publicToken}`;

  const enviar = () => {
    const next = updateOrcamentoStatus(companyId, orc.id, 'enviado', {
      historyLabel: 'Orçamento enviado ao cliente',
    });
    if (next) setOrc(next);
    showToast('success', 'Link público disponível para o cliente.', 'Orçamento enviado');
  };

  const saveField = (patch: Partial<OrcamentoProposal>) => {
    const next = { ...orc, ...patch, updatedAt: new Date().toISOString() };
    upsertOrcamento(companyId, next);
    setOrc(next);
  };

  return (
    <div className="space-y-8 text-left">
      <button type="button" onClick={() => navigate('/crm/orcamentos')} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary">
        <ArrowLeft size={16} /> Voltar para orçamentos
      </button>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-3xl font-black text-gray-900">{orc.number}</h2>
          <p className="text-xs font-bold uppercase tracking-normal text-gray-400">{orc.clientName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={enviar} className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20">
            <Send size={14} /> Enviar ao cliente
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(publicUrl);
              showToast('success', 'Link copiado.', 'Orçamento');
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700"
          >
            <Copy size={14} /> Copiar link
          </button>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700">
            <ExternalLink size={14} /> Página pública
          </a>
        </div>
      </div>

      {orc.aiScore != null ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
          <Sparkles className="text-primary" size={20} />
          <p className="text-xs font-semibold text-gray-700">
            IA prevê <strong>{orc.aiScore}%</strong> de chance de fechamento
            {orc.status === 'negociacao' ? ' — sugira follow-up nas próximas 24h.' : '.'}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm lg:col-span-2">
          <h3 className="text-xl font-black tracking-normal text-gray-900">Dados do orçamento</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Cliente</span>
              <input
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold"
                value={orc.clientName}
                onChange={(e) => saveField({ clientName: e.target.value })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black uppercase text-gray-400">Validade</span>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold"
                value={orc.validity}
                onChange={(e) => saveField({ validity: e.target.value })}
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-gray-400">Origem</span>
              <input className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold" value={orc.origin} onChange={(e) => saveField({ origin: e.target.value })} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-gray-400">Destino</span>
              <input className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold" value={orc.destination} onChange={(e) => saveField({ destination: e.target.value })} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black uppercase text-gray-400">Serviços</span>
              <textarea className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold" rows={3} value={orc.services} onChange={(e) => saveField({ services: e.target.value })} />
            </label>
          </div>
          <div className="flex justify-end gap-6 border-t border-gray-100 pt-4 text-sm font-black">
            <span className="text-gray-500">Total</span>
            <span className="text-xl text-primary">R$ {orc.total.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        <div className="space-y-6 rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
          <h3 className="border-b border-gray-50 pb-4 text-xl font-black tracking-normal text-gray-900">Histórico</h3>
          <div className="space-y-4">
            {orc.history.map((h) => (
              <div key={h.id} className="border-l-2 border-primary/30 pl-4">
                <p className="text-[10px] font-black uppercase text-gray-400">{new Date(h.at).toLocaleString('pt-BR')}</p>
                <p className="text-xs font-semibold text-gray-800">{h.label}</p>
                {h.meta ? <p className="text-[10px] text-gray-500">{h.meta}</p> : null}
              </div>
            ))}
          </div>
          {orc.clientId ? (
            <Link to={`/crm/clientes/${orc.clientId}`} className="block text-center text-xs font-bold text-primary hover:underline">
              Ver cliente no CRM
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
