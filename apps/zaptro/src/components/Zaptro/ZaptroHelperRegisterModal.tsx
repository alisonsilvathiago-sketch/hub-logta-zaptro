import React, { useEffect, useState } from 'react';
import { Loader2, Save, Shield, Sparkles, UserPlus } from 'lucide-react';
import LogtaModal from '../Modal';
import { notifyZaptro } from './ZaptroNotificationSystem';
import { ZaptroModalLandscapeAvatar } from './ZaptroModalLandscapeAvatar';
import { saveDemoHelperEdit, type ZaptroHelperDemo, type ZaptroHelperEmployment } from '../../constants/zaptroHelpersDemo';
import {
  helperPrimaryIdTypeLabel,
  saveHelperExtended,
  type HelperPrimaryIdType,
} from '../../lib/zaptroHelperProfileExtended';

export type HelperRegisterForm = {
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  cpf: string;
  primaryIdType: HelperPrimaryIdType;
  employment: ZaptroHelperEmployment;
  address: string;
  aggregatorBase: string;
  joinedAt: string;
  notes: string;
  status: ZaptroHelperDemo['status'];
  avatarUrl: string | null;
};

const emptyForm = (): HelperRegisterForm => ({
  name: '',
  phone: '',
  altPhone: '',
  email: '',
  cpf: '',
  primaryIdType: 'phone',
  employment: 'empresa',
  address: '',
  aggregatorBase: '',
  joinedAt: new Date().toISOString().slice(0, 10),
  notes: '',
  status: 'ativo',
  avatarUrl: null,
});

export function helperToRegisterForm(
  h: ZaptroHelperDemo,
  extended?: {
    primaryIdType?: HelperPrimaryIdType;
    altPhone?: string;
    address?: string;
    aggregatorBase?: string;
    notes?: string;
  },
): HelperRegisterForm {
  return {
    name: h.name,
    phone: h.phone,
    altPhone: extended?.altPhone ?? '',
    email: h.email ?? '',
    cpf: h.cpf ?? '',
    primaryIdType: extended?.primaryIdType ?? 'phone',
    employment: h.employment,
    address: extended?.address ?? '',
    aggregatorBase: extended?.aggregatorBase ?? '',
    joinedAt: h.joinedAt ?? new Date().toISOString().slice(0, 10),
    notes: extended?.notes ?? h.notes ?? '',
    status: h.status,
    avatarUrl: h.photo_url ?? null,
  };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editHelperId?: string | null;
  initial?: Partial<HelperRegisterForm>;
};

export const ZaptroHelperRegisterModal: React.FC<Props> = ({ isOpen, onClose, onSaved, editHelperId, initial }) => {
  const [form, setForm] = useState<HelperRegisterForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm(), ...initial });
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const digits = form.phone.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 10) {
      notifyZaptro('warning', 'Dados incompletos', 'Nome e WhatsApp válido são obrigatórios.');
      return;
    }
    if (form.primaryIdType === 'cpf' && !form.cpf.trim()) {
      notifyZaptro('warning', 'CPF obrigatório', 'Informe o CPF como ID do ajudante.');
      return;
    }
    if (form.primaryIdType === 'email' && !form.email.trim()) {
      notifyZaptro('warning', 'E-mail obrigatório', 'Informe o e-mail como ID do ajudante.');
      return;
    }

    setSaving(true);
    try {
      const id = editHelperId ?? `zaptro-helper-${Date.now()}`;
      saveDemoHelperEdit(id, {
        name,
        phone: digits,
        email: form.email.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        employment: form.employment,
        status: form.status,
        joinedAt: form.joinedAt,
        notes: form.notes.trim() || undefined,
        photo_url: form.avatarUrl ?? undefined,
      });
      saveHelperExtended(id, {
        primaryIdType: form.primaryIdType,
        altPhone: form.altPhone.replace(/\D/g, '') || undefined,
        address: form.address.trim() || undefined,
        aggregatorBase: form.employment === 'agregado' ? form.aggregatorBase.trim() || undefined : undefined,
        notes: form.notes.trim() || undefined,
      });
      notifyZaptro('success', 'Ajudante guardado', editHelperId ? 'Dados actualizados.' : 'Ajudante cadastrado com sucesso.');
      onSaved();
      onClose();
    } catch (err: unknown) {
      notifyZaptro('error', 'Erro', err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = editHelperId ? 'Editar ajudante' : 'Cadastrar ajudante';

  return (
    <LogtaModal isOpen={isOpen} onClose={onClose} title={modalTitle} width="960px" variant="landscape">
      <form onSubmit={(e) => void handleSubmit(e)} className="zaptro-modal-landscape-body">
        <div className="zaptro-modal-landscape__left">
          <div className="zaptro-modal-landscape-hero">
            <ZaptroModalLandscapeAvatar
              photoUrl={form.avatarUrl}
              name={form.name}
              fallbackIcon={<UserPlus size={24} strokeWidth={2.5} />}
              onChange={(url) => setForm({ ...form, avatarUrl: url })}
              label="Foto do ajudante"
            />
            <div>
              <h2 className="zaptro-modal-landscape-hero__title">{modalTitle}</h2>
              <p className="zaptro-modal-landscape-hero__subtitle">Identificação e contacto do ajudante</p>
            </div>
          </div>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Nome completo *</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">ID oficial (rastreio / segurança)</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.primaryIdType}
                onChange={(e) => setForm({ ...form, primaryIdType: e.target.value as HelperPrimaryIdType })}
              >
                <option value="phone">Telemóvel / WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
              </select>
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">WhatsApp / telemóvel *</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="tel"
                placeholder="5511999999999"
              />
            </label>

            {form.primaryIdType === 'cpf' ? (
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">CPF *</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </label>
            ) : null}

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">
                E-mail {form.primaryIdType === 'email' ? '*' : '(opcional)'}
              </span>
              <input
                type="email"
                className="zaptro-modal-landscape-field__input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Telefone secundário</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.altPhone}
                onChange={(e) => setForm({ ...form, altPhone: e.target.value })}
                inputMode="tel"
              />
            </label>
          </div>

          <div className="zaptro-modal-landscape-tip">
            <div className="zaptro-modal-landscape-tip__inner">
              <Sparkles size={18} color="#D9FF00" />
              <p className="zaptro-modal-landscape-tip__text">
                O <strong>ID oficial</strong> do ajudante é o WhatsApp, e-mail ou CPF — usado para rastreio e segurança
                anti-furto ao vincular motorista e rota do dia.
              </p>
            </div>
          </div>
        </div>

        <div className="zaptro-modal-landscape__right">
          <h3 className="zaptro-modal-landscape-right-title">
            <Shield size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Vínculo e segurança
          </h3>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Tipo de ajudante</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.employment}
                onChange={(e) => setForm({ ...form, employment: e.target.value as ZaptroHelperEmployment })}
              >
                <option value="empresa">Ajudante da empresa</option>
                <option value="agregado">Ajudante do agregado</option>
              </select>
            </label>

            {form.employment === 'agregado' ? (
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Base / localização do agregado</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.aggregatorBase}
                  onChange={(e) => setForm({ ...form, aggregatorBase: e.target.value })}
                  placeholder="Ex.: pátio, cidade, cooperativa…"
                />
              </label>
            ) : null}

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Endereço / referência</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Cidade, bairro ou referência"
              />
            </label>

            <div className="zaptro-modal-landscape-field-row">
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Data de entrada</span>
                <input
                  type="date"
                  className="zaptro-modal-landscape-field__input"
                  value={form.joinedAt}
                  onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                />
              </label>

              {editHelperId ? (
                <label className="zaptro-modal-landscape-field">
                  <span className="zaptro-modal-landscape-field__label">Estado</span>
                  <select
                    className="zaptro-modal-landscape-field__select"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ZaptroHelperDemo['status'] })}
                  >
                    <option value="ativo">Activo</option>
                    <option value="inativo">Inactivo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </label>
              ) : null}
            </div>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Notas de segurança (anti-furto)</span>
              <textarea
                className="zaptro-modal-landscape-field__textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Autorizações, restrições, documentos exigidos…"
              />
            </label>

            <p className="zaptro-modal-landscape-tip__text">
              ID activo: <strong>{helperPrimaryIdTypeLabel(form.primaryIdType)}</strong>
            </p>
          </div>

          <div className="zaptro-modal-landscape-actions">
            <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="zaptro-clients-spin" /> : <Save size={18} />}
              {editHelperId ? 'Guardar alterações' : 'Cadastrar ajudante'}
            </button>
          </div>
        </div>
      </form>
    </LogtaModal>
  );
};
