import React from 'react';
import {
  Briefcase,
  CheckCircle2,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { resolveRole } from '@/lib/permissions';

const SettingsProfilePanel: React.FC = () => {
  const { profile } = useAuth();
  const role = resolveRole(profile?.role);
  const roleLabel = role === 'master_admin' ? 'Administrador WMS' : 'Operador WMS';
  const initials =
    profile?.full_name?.trim()?.[0]?.toUpperCase() ||
    profile?.email?.trim()?.[0]?.toUpperCase() ||
    'L';

  const save = () => toast.success('[Demo] Dados pessoais salvos');

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">Meu Perfil</h2>
        <p className="mt-1 text-sm text-gray-500">Informações pessoais da sua conta LogStoka.</p>
      </div>

      <div className="flex flex-wrap items-center gap-8 border-b border-gray-100 pb-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border-4 border-white bg-gradient-to-tr from-orange-600 to-gray-900 text-2xl font-black text-white shadow-xl">
          {initials}
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-900">{profile?.full_name || 'Usuário LogStoka'}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-normal text-orange-600">{roleLabel}</p>
          <p className="mt-2 text-sm font-medium text-gray-500">{profile?.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[
          { label: 'Nome completo', icon: User, value: profile?.full_name || '' },
          { label: 'E-mail', icon: Mail, value: profile?.email || '' },
          { label: 'Telefone / WhatsApp', icon: Phone, value: '(11) 98765-4321' },
          { label: 'Cargo', icon: Briefcase, value: roleLabel },
        ].map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.label} className="space-y-2">
              <label className="ml-1 text-[10px] font-black uppercase tracking-normal text-gray-400">
                {field.label}
              </label>
              <div className="relative">
                <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  defaultValue={field.value}
                  className="w-full rounded-2xl border border-transparent bg-gray-50 py-3.5 pl-12 pr-4 text-sm font-bold text-gray-900 outline-none transition-all hover:border-gray-200 focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button type="button" className="ls-btn-primary px-8" onClick={save}>
          <CheckCircle2 size={18} />
          Salvar dados pessoais
        </button>
      </div>
    </div>
  );
};

export default SettingsProfilePanel;
