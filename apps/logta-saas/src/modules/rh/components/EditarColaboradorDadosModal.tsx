import React, { useEffect, useState } from 'react';
import { Pencil, User } from 'lucide-react';
import { LogtaModalHeader } from '../../../components/LogtaModalHeader';
import { showToast } from '../../../components/Toast';
import {
  updateRhColaboradorDados,
  type RhColaboradorDadosUpdateInput,
} from '../lib/registerRhColaborador';
import type { ColaboradorRhProfile } from '../ponto/colaboradorRhStorage';

const inputClass =
  'w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-primary';

type Props = {
  open: boolean;
  profile: ColaboradorRhProfile;
  onClose: () => void;
  onSaved: (profile: ColaboradorRhProfile) => void;
};

export function EditarColaboradorDadosModal({ open, profile, onClose, onSaved }: Props) {
  const [fotoPreview, setFotoPreview] = useState<string | null>(profile.photoUrl ?? null);

  useEffect(() => {
    if (open) setFotoPreview(profile.photoUrl ?? null);
  }, [open, profile.photoUrl, profile.id]);

  if (!open) return null;

  const defaultValues: RhColaboradorDadosUpdateInput = {
    nome: profile.fullName,
    cpf: profile.document,
    email: profile.email ?? '',
    telefone: profile.phone ?? '',
    cargo: profile.role ?? '',
    departamento: profile.sector ?? '',
    endereco: profile.address ?? '',
    cidade: profile.city ?? '',
    uf: profile.state ?? '',
    admissionDate: profile.admissionDate ?? '',
    salario: profile.currentSalary ?? 0,
    feriasDisponiveis: profile.vacationDaysAvailable,
    linkedProfileId: profile.linkedProfileId ?? '',
    matricula: profile.equipeMatricula ?? '',
    fotoDataUrl: profile.photoUrl,
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-colaborador-title"
        className="relative flex h-[765px] max-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-neutral-800 bg-[#18191B] text-white shadow-2xl animate-in zoom-in duration-200"
      >
        <div className="flex h-[84px] shrink-0 items-center border-b border-neutral-800 px-6 md:px-8 [&_.logta-modal-header]:mb-0 [&_.logta-modal-header]:w-full">
          <LogtaModalHeader
            icon={Pencil}
            title="Editar cadastro do colaborador"
            onClose={onClose}
          />
          <p id="editar-colaborador-title" className="sr-only">
            Editar cadastro do colaborador
          </p>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement).value.trim();
            const salarioRaw = get('salario').replace(/\./g, '').replace(',', '.');
            const feriasRaw = get('ferias');
            try {
              const next = updateRhColaboradorDados(profile, {
                nome: get('nome'),
                cpf: get('cpf'),
                email: get('email'),
                telefone: get('telefone'),
                cargo: get('cargo'),
                departamento: get('departamento'),
                endereco: get('endereco'),
                cidade: get('cidade'),
                uf: get('uf'),
                admissionDate: get('admissionDate'),
                salario: salarioRaw ? Number(salarioRaw) : undefined,
                feriasDisponiveis: feriasRaw ? Number(feriasRaw) : undefined,
                linkedProfileId: get('linkedProfileId'),
                matricula: get('matricula'),
                fotoDataUrl: fotoPreview ?? undefined,
              });
              showToast('success', 'Cadastro atualizado no dossiê RH.', 'RH');
              onSaved(next);
              onClose();
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Não foi possível salvar.',
                'RH',
              );
            }
          }}
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">
          <div className="mb-6 flex items-center gap-4 border-b border-neutral-800 pb-6">
            <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-500 hover:border-primary">
              {fotoPreview ? (
                <img src={fotoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={32} />
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
            <div>
              <p className="text-xs font-bold text-white">Foto do colaborador</p>
              <p className="text-[10px] text-neutral-500">Registro interno: {profile.id}</p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <fieldset className="space-y-4">
              <legend className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">
                Identificação
              </legend>
              <Field label="Nome completo" name="nome" required defaultValue={defaultValues.nome} />
              <Field label="CPF (ID na equipe)" name="cpf" defaultValue={defaultValues.cpf} />
              <Field
                label="Matrícula RH (sem CPF)"
                name="matricula"
                defaultValue={defaultValues.matricula}
              />
              <Field
                label="Perfil vinculado (Supabase)"
                name="linkedProfileId"
                defaultValue={defaultValues.linkedProfileId}
              />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">
                Contato & endereço
              </legend>
              <Field label="E-mail corporativo" name="email" type="email" required defaultValue={defaultValues.email} />
              <Field label="Telefone / WhatsApp" name="telefone" defaultValue={defaultValues.telefone} />
              <Field label="Logradouro" name="endereco" defaultValue={defaultValues.endereco} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade" name="cidade" defaultValue={defaultValues.cidade} />
                <Field label="UF" name="uf" maxLength={2} defaultValue={defaultValues.uf} />
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-2 text-[10px] font-black uppercase tracking-normal text-primary">
                Contrato & RH
              </legend>
              <Field label="Cargo" name="cargo" required defaultValue={defaultValues.cargo} />
              <Field label="Setor / departamento" name="departamento" defaultValue={defaultValues.departamento} />
              <Field
                label="Data de admissão"
                name="admissionDate"
                type="date"
                defaultValue={defaultValues.admissionDate}
              />
              <Field
                label="Salário atual (R$)"
                name="salario"
                type="number"
                min={0}
                step="0.01"
                defaultValue={String(defaultValues.salario ?? 0)}
              />
              <Field
                label="Férias disponíveis (dias)"
                name="ferias"
                type="number"
                min={0}
                defaultValue={
                  defaultValues.feriasDisponiveis != null
                    ? String(defaultValues.feriasDisponiveis)
                    : ''
                }
              />
            </fieldset>
          </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-neutral-800 px-6 py-4 md:px-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-600 px-6 py-3 text-xs font-bold text-neutral-300 hover:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-8 py-3 text-xs font-bold text-gray-900 shadow-lg hover:opacity-90"
            >
              Salvar cadastro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = 'text',
  maxLength,
  min,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
  min?: number;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-[10px] font-bold uppercase text-neutral-400">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        maxLength={maxLength}
        min={min}
        step={step}
        className={inputClass}
      />
    </div>
  );
}
