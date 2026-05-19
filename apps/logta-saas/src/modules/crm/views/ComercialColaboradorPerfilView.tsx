import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  DollarSign,
  KanbanSquare,
  Mail,
  Phone,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { loadColaboradorProfile } from '../../rh/ponto/colaboradorRhStorage';
import {
  getColaboradorCrmPortfolio,
  getOwnerNameByColaboradorId,
  resolveDemoCompanyId,
  shouldUseLogtaSandbox,
} from '../../../lib/seed';
import { useTenant } from '../../../contexts/TenantContext';
import { loadOrcamentos } from '../../orcamento/orcamentoStorage';

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  inadimplente: 'Inadimplente',
  leads: 'Lead',
  contato: 'Em contato',
  negociacao: 'Negociação',
  proposta: 'Proposta',
  fechado: 'Fechado',
};

export function ComercialColaboradorPerfilView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { config } = useTenant();
  const companyId = resolveDemoCompanyId(config?.id);

  const portfolio = React.useMemo(() => {
    if (!id || !shouldUseLogtaSandbox()) return null;
    return getColaboradorCrmPortfolio(id);
  }, [id]);

  const profile = React.useMemo(() => {
    if (!id) return null;
    return loadColaboradorProfile(companyId, id);
  }, [id, companyId]);

  const orcamentos = React.useMemo(() => {
    if (!id) return [];
    return loadOrcamentos(companyId).filter((o) => o.ownerColabId === id || o.createdBy === id);
  }, [id, companyId]);

  const displayName = portfolio?.ownerName ?? profile?.fullName ?? getOwnerNameByColaboradorId(id ?? '') ?? 'Colaborador';
  const role = profile?.role ?? portfolio?.clients[0]?.ownerRole ?? 'Comercial';

  if (!id) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-bold text-gray-500">Colaborador não informado.</p>
      </div>
    );
  }

  if (!portfolio && !profile) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/crm/clientes')}
          className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Voltar para Clientes
        </button>
        <p className="py-16 text-center text-sm font-bold text-gray-400">Colaborador não encontrado no ambiente demo.</p>
      </div>
    );
  }

  const stats = portfolio?.stats ?? {
    clientesAtivos: 0,
    clientesTotal: 0,
    leadsAbertos: 0,
    negociosFechados: 0,
    faturamentoCarteira: 0,
    ticketMedio: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-left">
      <button
        type="button"
        onClick={() => navigate('/crm/clientes')}
        className="flex cursor-pointer items-center gap-2 text-xs font-bold text-gray-500 transition-colors hover:text-primary"
      >
        <ArrowLeft size={16} /> Voltar para Gestão de Clientes
      </button>

      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Users size={40} />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[40px] font-black leading-tight tracking-normal text-gray-900">{displayName}</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[9px] font-black uppercase tracking-normal text-green-700">
                Ativo
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-normal text-gray-400">
              {role} • {profile?.sector ?? 'Comercial'}
            </p>
            {profile?.email ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Mail size={14} className="text-primary" /> {profile.email}
              </p>
            ) : null}
            {profile?.phone ? (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                <Phone size={14} className="text-primary" /> {profile.phone}
              </p>
            ) : null}
          </div>
        </div>
        <Link
          to="/rh/equipe"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-xs font-bold text-gray-700 shadow-sm transition-colors hover:border-primary/30 hover:text-primary"
        >
          Ver ficha RH <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          { label: 'Clientes na carteira', value: String(stats.clientesTotal), sub: `${stats.clientesAtivos} ativos`, color: 'text-gray-900', icon: Building2 },
          { label: 'Negócios fechados', value: String(stats.negociosFechados), sub: 'Clientes + propostas', color: 'text-primary', icon: Target },
          { label: 'Faturamento carteira', value: `R$ ${stats.faturamentoCarteira.toLocaleString('pt-BR')}`, sub: 'YTD acumulado', color: 'text-blue-500', icon: TrendingUp },
          { label: 'Ticket médio', value: `R$ ${stats.ticketMedio.toLocaleString('pt-BR')}`, sub: `${stats.leadsAbertos} leads abertos`, color: 'text-emerald-500', icon: DollarSign },
        ].map((m, i) => (
          <div key={i} className="relative overflow-hidden rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm">
            <m.icon size={18} className="mb-2 text-gray-300" />
            <p className="mb-2 text-[10px] font-black uppercase tracking-normal text-gray-400">{m.label}</p>
            <h4 className={`my-[15px] text-xl font-extrabold tracking-normal ${m.color}`}>{m.value}</h4>
            <p className="text-[10px] font-semibold uppercase tracking-normal text-gray-400">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 border-b border-gray-50 pb-4 text-xl font-black tracking-normal text-gray-900">
              Clientes atendidos e fechados
            </h3>
            {portfolio && portfolio.clients.length > 0 ? (
              <div className="logta-table-wrap">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-black uppercase tracking-normal text-gray-400">
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Cidade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Faturamento YTD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-700">
                    {portfolio.clients.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/crm/clientes/${c.id}`)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-primary">{c.name}</td>
                        <td className="px-6 py-4">{c.city ?? '—'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                              c.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {STATUS_LABEL[c.status ?? ''] ?? c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900">
                          R$ {(c.revenueYtd ?? 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-xs font-bold uppercase text-gray-400">Nenhum cliente vinculado</p>
            )}
          </div>

          <div className="rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-xl font-black tracking-normal text-gray-900">Pipeline comercial (leads)</h3>
            {portfolio && portfolio.leads.length > 0 ? (
              <div className="space-y-3">
                {portfolio.leads.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/crm/clientes/${l.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-primary/30 hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <KanbanSquare size={18} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold text-gray-900">{l.name}</p>
                        <p className="text-[10px] font-bold uppercase text-gray-400">{l.segmento ?? 'Comercial'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">
                        {l.value ? `R$ ${Number(l.value).toLocaleString('pt-BR')}` : 'Sob consulta'}
                      </p>
                      <span className="text-[9px] font-black uppercase text-primary">
                        {STATUS_LABEL[l.status ?? ''] ?? l.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs font-bold uppercase text-gray-400">Sem leads no pipeline</p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-6 rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm">
            <h3 className="border-b border-gray-50 pb-4 text-xl font-black tracking-normal text-gray-900">
              Orçamentos emitidos
            </h3>
            {orcamentos.length > 0 ? (
              <div className="space-y-4">
                {orcamentos.map((o) => (
                  <Link
                    key={o.id}
                    to={`/crm/orcamentos/${o.id}`}
                    className="block rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:border-primary/30 hover:bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{o.number}</p>
                        <p className="text-[10px] font-medium text-gray-500">{o.clientName}</p>
                      </div>
                      {o.aiScore != null ? (
                        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black text-primary">
                          <Star size={10} /> {o.aiScore}%
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-black text-gray-900">
                      R$ {o.total.toLocaleString('pt-BR')}
                    </p>
                    <span className="mt-1 inline-block text-[9px] font-black uppercase text-gray-400">{o.status}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold uppercase text-gray-400">Nenhum orçamento vinculado</p>
            )}
            <Link
              to="/crm/orcamentos"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
            >
              Ver todos os orçamentos <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
