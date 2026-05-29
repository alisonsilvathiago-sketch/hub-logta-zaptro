import React from 'react';
import { Laptop, Lock, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SettingsSecurityPanel: React.FC = () => (
  <div className="space-y-10">
    <div className="border-b border-gray-100 pb-6">
      <h2 className="text-xl font-black text-gray-900">Segurança</h2>
      <p className="mt-1 text-sm text-gray-500">Senha, autenticação em duas etapas e sessões ativas.</p>
    </div>

    <div>
      <h3 className="text-lg font-black text-gray-900">Alterar senha</h3>
      <div className="mt-4 grid max-w-xl gap-4">
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
      <button type="button" className="ls-btn-primary mt-4" onClick={() => toast.success('[Demo] Senha atualizada')}>
        Atualizar senha
      </button>
    </div>

    <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-6">
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

    <div>
      <h3 className="text-lg font-black text-gray-900">Sessões ativas</h3>
      <div className="mt-4 space-y-3">
        {[
          { device: 'MacBook Pro · Chrome', loc: 'São Paulo, BR', current: true },
          { device: 'iPhone 15 · Safari', loc: 'São Paulo, BR', current: false },
        ].map((s) => (
          <div
            key={s.device}
            className={`flex items-center justify-between rounded-2xl border p-5 ${
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
    </div>
  </div>
);

export default SettingsSecurityPanel;
