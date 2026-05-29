import React from 'react';
import { Info, Loader2, Save, UserRound } from 'lucide-react';
import LogtaModal from '../Modal';
import { ZaptroModalLandscapeAvatar } from './ZaptroModalLandscapeAvatar';
import { ZAPTRO_PAGE_PERMISSION_DEFS, type ZaptroPagePermissionId } from '../../utils/zaptroPagePermissionMap';
import '../zaptroLandscapeModal.css';

export type TeamMemberEditForm = {
  full_name: string;
  email: string;
  role: string;
  phone: string;
  notes: string;
  avatarUrl: string | null;
  pagePerms: ZaptroPagePermissionId[];
  newPassword: string;
  confirmPassword: string;
};

type Props = {
  open: boolean;
  saving: boolean;
  isDemo: boolean;
  form: TeamMemberEditForm;
  assignableIds: ZaptroPagePermissionId[];
  roleOptions: { value: string; label: string }[];
  onClose: () => void;
  onChange: (next: TeamMemberEditForm) => void;
  onTogglePerm: (id: ZaptroPagePermissionId) => void;
  onSave: () => void;
};

const ZaptroTeamMemberEditModal: React.FC<Props> = ({
  open,
  saving,
  isDemo,
  form,
  assignableIds,
  roleOptions,
  onClose,
  onChange,
  onTogglePerm,
  onSave,
}) => {
  return (
    <LogtaModal isOpen={open} onClose={onClose} title="Editar colaborador" width="960px" variant="landscape">
      <div className="zaptro-modal-landscape-body">
        <div className="zaptro-modal-landscape__left">
          <div className="zaptro-modal-landscape-hero">
            <ZaptroModalLandscapeAvatar
              photoUrl={form.avatarUrl}
              name={form.full_name}
              fallbackIcon={<UserRound size={24} strokeWidth={2.5} />}
              onChange={(url) => onChange({ ...form, avatarUrl: url })}
              label="Foto do colaborador"
            />
            <div>
              <h2 className="zaptro-modal-landscape-hero__title">Editar colaborador</h2>
              <p className="zaptro-modal-landscape-hero__subtitle">Dados, login e permissões no painel</p>
            </div>
          </div>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Nome completo *</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.full_name}
                onChange={(e) => onChange({ ...form, full_name: e.target.value })}
                placeholder="Ex: Ana Ribeiro"
              />
            </label>
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">E-mail de login *</span>
              <input
                className="zaptro-modal-landscape-field__input"
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => onChange({ ...form, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </label>
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">WhatsApp / telefone</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.phone}
                onChange={(e) => onChange({ ...form, phone: e.target.value })}
                placeholder="5511999999999"
              />
            </label>
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Área / função</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.role}
                onChange={(e) => onChange({ ...form, role: e.target.value })}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Notas internas</span>
              <textarea
                className="zaptro-modal-landscape-field__textarea"
                value={form.notes}
                onChange={(e) => onChange({ ...form, notes: e.target.value })}
                placeholder="Observações sobre desempenho, turno, restrições…"
              />
            </label>
          </div>

          <div className="zaptro-modal-landscape-tip">
            <div className="zaptro-modal-landscape-tip__inner">
              <Info size={18} strokeWidth={2} color="#000" aria-hidden />
              <p className="zaptro-modal-landscape-tip__text">
                {isDemo
                  ? 'Modo demo — alterações ficam só nesta sessão.'
                  : 'E-mail e permissões gravam no Supabase. Senha nova depende do Auth (convite ou admin API).'}
              </p>
            </div>
          </div>
        </div>

        <div className="zaptro-modal-landscape__right">
          <h3 className="zaptro-modal-landscape-right-title">Acessos & senha</h3>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Nova senha</span>
              <input
                className="zaptro-modal-landscape-field__input"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(e) => onChange({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres (opcional)"
              />
            </label>
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Confirmar senha</span>
              <input
                className="zaptro-modal-landscape-field__input"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })}
                placeholder="Repita a senha"
              />
            </label>
          </div>

          <p className="zaptro-team-perm-hint" style={{ marginTop: 8 }}>
            Páginas que este colaborador pode abrir no menu lateral.
          </p>
          <div className="zaptro-team-member-profile__perm-grid zaptro-team-member-edit-modal__perms">
            {assignableIds.map((pid) => {
              const def = ZAPTRO_PAGE_PERMISSION_DEFS.find((d) => d.id === pid);
              const checked = form.pagePerms.includes(pid);
              return (
                <label key={pid} className="zaptro-team-member-profile__perm-item">
                  <input type="checkbox" checked={checked} onChange={() => onTogglePerm(pid)} />
                  <span>{def?.label ?? pid}</span>
                </label>
              );
            })}
          </div>

          <div className="zaptro-modal-landscape-actions">
            <button
              type="button"
              className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary"
              disabled={saving}
              onClick={onSave}
            >
              {saving ? <Loader2 size={18} className="zaptro-clients-spin" /> : <Save size={18} />}
              Guardar colaborador
            </button>
          </div>
        </div>
      </div>
    </LogtaModal>
  );
};

export default ZaptroTeamMemberEditModal;
