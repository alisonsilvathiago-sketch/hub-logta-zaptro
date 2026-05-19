import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Zap } from 'lucide-react';
import { LogtaEmptyState } from '../../../components/EmptyState';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { useTenant } from '../../../contexts/TenantContext';
import { showToast } from '../../../components/Toast';
import { getSandboxCrmClients, resolveDemoCompanyId, shouldUseLogtaSandbox } from '../../../lib/seed';

const fmtBrl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const DEMO_INVOICES = [
  { id: 'fat-1', client: 'Alfa Logistics', value: 48_200, date: '12/05/2026', status: 'Paga' },
  { id: 'fat-2', client: 'Prime Cargo', value: 36_750, date: '10/05/2026', status: 'Paga' },
  { id: 'fat-3', client: 'TransBrasil', value: 29_400, date: '08/05/2026', status: 'Em aberto' },
  { id: 'fat-4', client: 'LogExpress', value: 18_900, date: '02/05/2026', status: 'Vencida' },
];

const DEMO_ALERTS = [
  {
    id: 'alert-1',
    tone: 'critical' as const,
    title: 'LogExpress — inadimplência',
    message: 'Fatura vencida há 16 dias. Limite de crédito bloqueado até regularização.',
  },
  {
    id: 'alert-2',
    tone: 'warning' as const,
    title: 'TransBrasil — limite em 78%',
    message: 'Cliente próximo do teto de crédito. Avalie antecipação de recebíveis.',
  },
];

export function CrmFinanceiroView() {
  const navigate = useNavigate();
  const { config } = useTenant();
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);

  const clients = React.useMemo(() => {
    const sandbox = shouldUseLogtaSandbox() ? getSandboxCrmClients(resolveDemoCompanyId(config.id)) : [];
    return sandbox.map((c) => ({
      id: c.id,
      name: c.name,
      revenue: c.revenue_ytd ?? 0,
      status: c.status ?? 'ativo',
      city: c.city ?? '—',
    }));
  }, [config.id]);

  const totalFaturado = clients.reduce((s, c) => s + c.revenue, 0);
  const creditLimit = 850_000;
  const creditUsed = Math.round(creditLimit * 0.42);
  const creditAvailable = creditLimit - creditUsed;
  const creditPct = Math.round((creditUsed / creditLimit) * 100);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        {/* Esquerda: transferência + faturamento + faturas */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="logta-panel-card flex flex-col p-6 sm:p-8">
            <h3 className="logta-card-heading mb-2">Transfira e pague mais rápido</h3>
            <p className="mb-6 text-sm font-medium text-gray-500">
              Pagamentos e transferências em tempo real para clientes do CRM. Registros sincronizam com o financeiro
              da empresa.
            </p>
            <button
              type="button"
              onClick={() => setIsTransferOpen(true)}
              className="mb-8 w-full rounded-2xl bg-gray-950 py-4 text-xs font-black uppercase tracking-normal text-white shadow-lg shadow-gray-950/20 transition-all hover:opacity-95"
            >
              + Fazer transferência
            </button>

            <h4 className="logta-card-heading mb-4 text-base">Faturamento consolidado por cliente</h4>
            <p className="mb-4 text-xs font-bold uppercase tracking-normal text-gray-400">
              Total carteira · {fmtBrl(totalFaturado)}
            </p>
            <div className="max-h-[280px] space-y-2 overflow-y-auto scrollbar-hide">
              {clients.length === 0 ? (
                <LogtaEmptyState type="financeiro" onAction={() => setIsTransferOpen(true)} />
              ) : (
                clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/crm/clientes/${c.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{c.name}</p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{c.city}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black text-primary">{fmtBrl(c.revenue)}</p>
                      <span
                        className={`text-[9px] font-black uppercase ${
                          c.status === 'inadimplente' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="logta-panel-card p-6 sm:p-8">
            <h3 className="logta-card-heading mb-6">Últimas faturas emitidas</h3>
            <div className="space-y-3">
              {DEMO_INVOICES.map((inv) => (
                <div
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-900">{inv.client}</p>
                    <p className="text-[10px] font-bold uppercase text-gray-400">{inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-gray-900">{fmtBrl(inv.value)}</p>
                    <span
                      className={`text-[9px] font-black uppercase ${
                        inv.status === 'Vencida'
                          ? 'text-red-600'
                          : inv.status === 'Em aberto'
                            ? 'text-amber-600'
                            : 'text-green-600'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direita: crédito + alertas */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="relative min-h-[320px] overflow-hidden rounded-[20px] bg-primary p-6 text-white shadow-xl shadow-primary/20 sm:p-8 md:sticky md:top-4">
            <div className="absolute top-0 right-0 p-8 opacity-20">
              <DollarSign size={80} />
            </div>
            <div className="relative z-10">
              <h4 className="logta-highlight-label">Crédito total disponível</h4>
              <p className="logta-highlight-value">{fmtBrl(creditAvailable)}</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 py-3">
                  <span className="text-sm text-white/70">Limite global</span>
                  <span className="text-sm font-bold">{fmtBrl(creditLimit)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-white/70">Utilizado</span>
                  <span className="text-sm font-bold">
                    {creditPct}% · {fmtBrl(creditUsed)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferOpen(true)}
                className="mt-6 w-full rounded-xl bg-white/15 py-3 text-xs font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25"
              >
                Fazer transferência
              </button>
            </div>
          </div>

          <div className="logta-panel-card p-6 sm:p-8">
            <h3 className="logta-card-heading mb-6">Alertas financeiros</h3>
            <div className="space-y-3">
              {DEMO_ALERTS.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-4 ${
                    a.tone === 'critical' ? 'border-red-200 bg-red-50/80' : 'border-amber-200 bg-amber-50/80'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-900">{a.title}</p>
                  <p className="mt-1 text-xs font-medium text-gray-600">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isTransferOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsTransferOpen(false)} />
          <div className="relative w-full max-w-lg rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
            <LogtaModalHeader icon={Zap} title="Transferência" onClose={() => setIsTransferOpen(false)} />
            <form
              className="mt-6 space-y-4 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                showToast('success', 'Transferência registrada. Integração bancária em homologação.', 'CRM Financeiro');
                setIsTransferOpen(false);
              }}
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-neutral-400">Destino (PIX / conta)</label>
                <input
                  required
                  placeholder="Chave PIX ou dados bancários"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Valor</label>
                  <input
                    required
                    type="text"
                    placeholder="R$ 0,00"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-neutral-400">Tipo</label>
                  <select className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary">
                    <option>PIX</option>
                    <option>TED</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
              >
                Confirmar transferência
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
