import React, { useState } from 'react';
import {
  Bell,
  Briefcase,
  CheckCircle2,
  Laptop,
  Lock,
  Mail,
  Phone,
  Shield,
  Smartphone,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { resolveRole } from '@/lib/permissions';

const PROFILE_TABS = [
  { id: 'pessoais', label: 'Dados Pessoais', icon: User },
  { id: 'seguranca', label: 'Segurança & Senha', icon: Shield },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'sessoes', label: 'Sessões Ativas', icon: Laptop },
] as const;

type TabId = (typeof PROFILE_TABS)[number]['id'];

const ProfilePage: React.FC = () => {
  const { profile } = useAuth();
  const role = resolveRole(profile?.role);
  const roleLabel = role === 'master_admin' ? 'Administrador WMS' : 'Operador WMS';
  const [activeTab, setActiveTab] = useState<TabId>('pessoais');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);

  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  const save = () => toast.success('[Demo] Preferências salvas');

  return (
    <div className="space-y-8">
      <div>
        <h1 className={LOGSTOKA_PAGE_TITLE_CLASS}>Meu Perfil</h1>
        <p className="mt-1 text-xs font-medium text-slate-400">
          Gerencie suas informações pessoais, segurança e notificações do LogStoka.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div className="space-y-2 lg:col-span-1">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-900/10'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          <div className="min-h-[600px] rounded-[40px] border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            {activeTab === 'pessoais' && (
              <div className="space-y-10">
                <div className="flex flex-wrap items-center gap-8 border-b border-gray-100 pb-10">
                  <div className="flex h-28 w-28 items-center justify-center rounded-[32px] border-4 border-white bg-gradient-to-tr from-orange-600 to-gray-900 text-3xl font-black text-white shadow-xl">
                    {initials}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">{profile?.full_name || 'Usuário LogStoka'}</h2>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-orange-600">{roleLabel}</p>
                    <p className="mt-2 text-sm font-medium text-gray-500">{profile?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  {[
                    { label: 'Nome completo', icon: User, value: profile?.full_name || '' },
                    { label: 'E-mail', icon: Mail, value: profile?.email || '' },
                    { label: 'Telefone / WhatsApp', icon: Phone, value: '(11) 98765-4321' },
                    { label: 'Cargo', icon: Briefcase, value: roleLabel },
                  ].map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.label} className="space-y-3">
                        <label className="ml-1 text-[10px] font-black uppercase tracking-normal text-gray-400">
                          {field.label}
                        </label>
                        <div className="relative">
                          <Icon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            defaultValue={field.value}
                            className="w-full rounded-[20px] border border-transparent bg-gray-50 py-4 pl-14 pr-5 text-sm font-bold text-gray-900 outline-none transition-all hover:border-gray-200 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" className="ls-btn-primary px-8 py-4" onClick={save}>
                    <CheckCircle2 size={18} />
                    Salvar dados pessoais
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="space-y-10">
                <div className="border-b border-gray-100 pb-8">
                  <h2 className="text-2xl font-black text-gray-900">Segurança & Senha</h2>
                  <p className="mt-1 text-sm text-gray-500">Altere sua senha e configure autenticação adicional.</p>
                </div>
                <div className="grid max-w-xl gap-4">
                  {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map((label) => (
                    <div key={label}>
                      <label className="ls-label">{label}</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="password" className="ls-input pl-11" defaultValue="••••••••" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6">
                  <div className="flex items-start gap-4">
                    <Smartphone className="text-orange-600" size={24} />
                    <div>
                      <p className="font-black text-gray-900">Autenticação em duas etapas</p>
                      <p className="mt-1 text-sm text-gray-600">Proteja sua conta WMS com código via app autenticador.</p>
                      <button type="button" className="mt-4 ls-btn-secondary" onClick={() => toast.success('[Demo] 2FA em breve')}>
                        Configurar 2FA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-8">
                  <h2 className="text-2xl font-black text-gray-900">Notificações</h2>
                  <p className="mt-1 text-sm text-gray-500">Alertas de estoque, ruptura, inventário e integrações.</p>
                </div>
                {[
                  { label: 'E-mail operacional', desc: 'Ruptura, mínimo e divergências de inventário', checked: notifyEmail, onChange: setNotifyEmail },
                  { label: 'Push no app', desc: 'Pedidos pagos, webhooks e transferências', checked: notifyPush, onChange: setNotifyPush },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-3xl border border-gray-100 bg-gray-50 p-6">
                    <div>
                      <p className="font-black text-gray-900">{row.label}</p>
                      <p className="text-sm text-gray-500">{row.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.checked}
                      onClick={() => row.onChange(!row.checked)}
                      className={`h-8 w-14 rounded-full transition ${row.checked ? 'bg-orange-600' : 'bg-gray-300'}`}
                    >
                      <span
                        className={`block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition ${row.checked ? 'translate-x-7' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'sessoes' && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-8">
                  <h2 className="text-2xl font-black text-gray-900">Sessões Ativas</h2>
                  <p className="mt-1 text-sm text-gray-500">Dispositivos conectados à sua conta LogStoka.</p>
                </div>
                {[
                  { device: 'MacBook Pro · Chrome', loc: 'São Paulo, BR', current: true },
                  { device: 'iPhone 15 · Safari', loc: 'São Paulo, BR', current: false },
                ].map((s) => (
                  <div
                    key={s.device}
                    className={`flex items-center justify-between rounded-3xl border p-6 ${
                      s.current ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Laptop size={22} className="text-gray-500" />
                      <div>
                        <p className="font-black text-gray-900">{s.device}</p>
                        <p className="text-sm text-gray-500">{s.loc}{s.current ? ' · Sessão atual' : ''}</p>
                      </div>
                    </div>
                    {!s.current ? (
                      <button type="button" className="text-sm font-bold text-red-600" onClick={() => toast.success('[Demo] Sessão encerrada')}>
                        Desconectar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
