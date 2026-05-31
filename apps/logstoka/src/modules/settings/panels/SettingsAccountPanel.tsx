import React from 'react';
import { Navigate } from 'react-router-dom';
import { CreditCard, Crown, Lock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { loadDemoAccountPlan } from '@/lib/logstokaAccountDemo';
import { canManageBilling, displayRoleLabel } from '@/lib/permissions';
import { LOGSTOKA_ADMIN_HIERARCHY } from '@/lib/logstokaOrgModel';

const SettingsAccountPanel: React.FC = () => {
  const { profile } = useAuth();
  const owner = canManageBilling(profile);
  const plan = loadDemoAccountPlan(profile);

  if (!owner) {
    return (
      <div className="space-y-6">
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-xl font-black text-gray-900">Conta e Plano</h2>
          <p className="mt-1 text-sm text-gray-500">Pagamento e contratação do LogStoka.</p>
        </div>
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
          <div className="flex items-start gap-3">
            <Lock size={22} className="text-amber-700" aria-hidden />
            <div>
              <p className="font-black text-amber-900">Somente o Admin Sênior altera pagamento</p>
              <p className="mt-2 text-sm font-medium text-amber-800">
                Você está logado como <strong>{displayRoleLabel(profile)}</strong>. Administradores regionais têm as
                mesmas funções operacionais, mas não podem atualizar plano, cartão ou dados de cobrança — isso fica
                exclusivamente com quem comprou a plataforma (titular da conta).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return <Navigate to="/app/configuracoes/meu-perfil" replace />;

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-black text-gray-900">Conta e Plano</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-orange-800">
            <Crown size={12} aria-hidden />
            Admin Sênior · Titular
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Dados da compra e cobrança — exclusivo do titular da conta. Outros administradores não acessam esta área.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Plano contratado</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{plan.planName}</p>
          <p className="mt-1 text-sm font-semibold text-gray-500">Código · {plan.planCode}</p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-gray-500">Compra em</dt>
              <dd className="font-black text-gray-900">
                {new Date(plan.purchasedAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-gray-500">Próxima renovação</dt>
              <dd className="font-black text-gray-900">
                {new Date(plan.renewsAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-gray-500">Valor mensal</dt>
              <dd className="font-black text-orange-700">
                {plan.monthlyAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-gray-500">CDs incluídos</dt>
              <dd className="font-black text-gray-900">até {plan.maxCds}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-bold text-gray-500">Usuários</dt>
              <dd className="font-black text-gray-900">até {plan.maxUsers}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6">
          <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Pagamento</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-orange-700 shadow-sm">
              <CreditCard size={20} aria-hidden />
            </span>
            <div>
              <p className="font-black text-gray-900">{plan.paymentMethod}</p>
              <p className="text-xs font-semibold text-gray-500">Status · {plan.status === 'active' ? 'Ativo' : 'Pendente'}</p>
            </div>
          </div>
          <button
            type="button"
            className="ls-btn-primary mt-6 w-full"
            onClick={() => toast.success('[Demo] Portal de pagamento — em produção via HUB billing')}
          >
            Atualizar forma de pagamento
          </button>
          <p className="mt-3 text-xs font-medium text-gray-500">
            Administradores regionais que você convidar terão as mesmas funções WMS, mas não verão nem alterarão estes
            dados.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-orange-600" aria-hidden />
          <h3 className="font-black text-gray-900">Hierarquia de acesso</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {LOGSTOKA_ADMIN_HIERARCHY.map((row) => (
            <article
              key={row.code}
              className={`rounded-2xl border p-4 ${row.code === 'owner' ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}
            >
              <p className="font-black text-gray-900">{row.title}</p>
              <p className="text-xs font-bold text-orange-700">{row.subtitle}</p>
              <p className="mt-2 text-sm text-gray-600">{row.powers}</p>
              <p className="mt-2 text-xs font-semibold text-gray-500">{row.limits}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsAccountPanel;
