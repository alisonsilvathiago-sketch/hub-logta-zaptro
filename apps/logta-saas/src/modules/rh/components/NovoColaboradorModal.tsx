import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users } from 'lucide-react';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { showToast } from '../../../components/Toast';
import { buildEquipeRouteId, equipeProfileUrl } from '../lib/equipeRouteId';
import { registerRhColaborador } from '../lib/registerRhColaborador';

type Props = {
  open: boolean;
  companyId?: string;
  onClose: () => void;
  onSaved?: () => void;
  navigateToProfile?: boolean;
};

export function NovoColaboradorModal({
  open,
  companyId,
  onClose,
  onSaved,
  navigateToProfile = true,
}: Props) {
  const navigate = useNavigate();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] border border-neutral-800 bg-[#18191B] p-8 text-white shadow-2xl animate-in zoom-in duration-200">
        <LogtaModalHeader icon={Users} title="Novo colaborador" onClose={onClose} />
        <p className="mt-2 text-xs font-medium text-neutral-400">
          Cadastro completo do dossiê RH. CPF vira ID de busca. Após salvar, abre o perfil do colaborador.
        </p>
        <form
          className="mt-6 space-y-4 text-left"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value.trim();
            try {
              const profile = registerRhColaborador(companyId, {
                nome: get('nome'),
                email: get('email'),
                cargo: get('cargo'),
                departamento: get('departamento'),
                cpf: get('cpf'),
                telefone: get('telefone'),
                endereco: get('endereco'),
                cidade: get('cidade'),
                uf: get('uf'),
                fotoDataUrl: fotoPreview ?? undefined,
              });
              showToast(
                'success',
                `${profile.fullName} cadastrado. Dossiê disponível para toda a empresa.`,
                'RH',
              );
              onClose();
              onSaved?.();
              if (navigateToProfile) {
                navigate(equipeProfileUrl(buildEquipeRouteId(profile)));
              }
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Não foi possível salvar.',
                'RH',
              );
            }
          }}
        >
          <div className="flex items-center gap-4">
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-500 hover:border-primary">
              {fotoPreview ? (
                <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={28} />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setFotoPreview(String(reader.result));
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <p className="text-[10px] font-semibold text-neutral-400">Foto do colaborador (opcional)</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-neutral-400">Nome completo</label>
            <input
              name="nome"
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">CPF (ID busca)</label>
              <input
                name="cpf"
                required
                placeholder="000.000.000-00"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Telefone</label>
              <input
                name="telefone"
                placeholder="(11) 99999-9999"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-neutral-400">E-mail corporativo</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Cargo</label>
              <input
                name="cargo"
                required
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Departamento</label>
              <input
                name="departamento"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-neutral-400">Endereço</label>
            <input
              name="endereco"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">Cidade</label>
              <input
                name="cidade"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-neutral-400">UF</label>
              <input
                name="uf"
                maxLength={2}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-sm font-semibold text-white outline-none focus:border-primary"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-4 text-xs font-bold text-white shadow-lg shadow-primary/20 hover:opacity-90"
          >
            Criar e abrir perfil
          </button>
        </form>
      </div>
    </div>
  );
}
