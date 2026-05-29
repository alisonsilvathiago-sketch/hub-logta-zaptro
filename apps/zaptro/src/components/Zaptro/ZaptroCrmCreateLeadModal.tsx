import React from 'react';
import { Kanban, MapPin, Package, Save, Sparkles, UserPlus } from 'lucide-react';
import LogtaModal from '../Modal';

export type CrmCreateLeadForm = {
  clientName: string;
  phone: string;
  origin: string;
  destination: string;
  cargoType: string;
  estimatedValue: string;
  tag: '' | 'urgente' | 'vip' | 'retorno';
  assigneeId: string;
};

type TeamOption = { id: string; full_name?: string | null };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  form: CrmCreateLeadForm;
  onChange: (patch: Partial<CrmCreateLeadForm>) => void;
  onSubmit: () => void;
  isAdmin: boolean;
  teamOptions: TeamOption[];
  profileLabel: string;
};

export const ZaptroCrmCreateLeadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  form,
  onChange,
  onSubmit,
  isAdmin,
  teamOptions,
  profileLabel,
}) => (
  <LogtaModal isOpen={isOpen} onClose={onClose} title="Novo contato" width="960px" variant="landscape">
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="zaptro-modal-landscape-body"
    >
      <div className="zaptro-modal-landscape__left">
        <div className="zaptro-modal-landscape-hero">
          <div className="zaptro-modal-landscape-hero__icon">
            <UserPlus size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="zaptro-modal-landscape-hero__title">Novo contato</h2>
            <p className="zaptro-modal-landscape-hero__subtitle">
              Cadastre rapidamente um lead. Complete o perfil depois no funil.
            </p>
          </div>
        </div>

        <div className="zaptro-modal-landscape-fields">
          <label className="zaptro-modal-landscape-field">
            <span className="zaptro-modal-landscape-field__label">Cliente / empresa *</span>
            <input
              className="zaptro-modal-landscape-field__input"
              value={form.clientName}
              onChange={(e) => onChange({ clientName: e.target.value })}
              required
            />
          </label>

          <label className="zaptro-modal-landscape-field">
            <span className="zaptro-modal-landscape-field__label">Telefone / WhatsApp *</span>
            <input
              className="zaptro-modal-landscape-field__input"
              value={form.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              inputMode="tel"
              placeholder="5511999999999"
              required
            />
          </label>
        </div>

        <div className="zaptro-modal-landscape-tip">
          <div className="zaptro-modal-landscape-tip__inner">
            <Sparkles size={18} color="#D9FF00" />
            <p className="zaptro-modal-landscape-tip__text">
              Nome e WhatsApp são obrigatórios. O lead entra no funil e pode ser ligado à{' '}
              <strong>conversa</strong> e ao <strong>orçamento</strong> depois.
            </p>
          </div>
        </div>
      </div>

      <div className="zaptro-modal-landscape__right">
        <h3 className="zaptro-modal-landscape-right-title">
          <Kanban size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Dados da operação
        </h3>

        <div className="zaptro-modal-landscape-fields">
          <label className="zaptro-modal-landscape-field">
            <span className="zaptro-modal-landscape-field__label">Origem</span>
            <input
              className="zaptro-modal-landscape-field__input"
              value={form.origin}
              onChange={(e) => onChange({ origin: e.target.value })}
              placeholder="Ex.: São Paulo, SP"
            />
          </label>

          <label className="zaptro-modal-landscape-field">
            <span className="zaptro-modal-landscape-field__label">Destino</span>
            <input
              className="zaptro-modal-landscape-field__input"
              value={form.destination}
              onChange={(e) => onChange({ destination: e.target.value })}
              placeholder="Ex.: Santos, SP"
            />
          </label>

          <label className="zaptro-modal-landscape-field">
            <span className="zaptro-modal-landscape-field__label">Tipo de carga</span>
            <input
              className="zaptro-modal-landscape-field__input"
              value={form.cargoType}
              onChange={(e) => onChange({ cargoType: e.target.value })}
              placeholder="Ex.: paletizada, granel…"
            />
          </label>

          <div className="zaptro-modal-landscape-field-row">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Valor estimado (R$)</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.estimatedValue}
                onChange={(e) => onChange({ estimatedValue: e.target.value })}
                inputMode="numeric"
                placeholder="0"
              />
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Tag</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.tag}
                onChange={(e) => onChange({ tag: e.target.value as CrmCreateLeadForm['tag'] })}
              >
                <option value="">—</option>
                <option value="urgente">Urgente</option>
                <option value="vip">VIP</option>
                <option value="retorno">Retorno</option>
              </select>
            </label>
          </div>

          {isAdmin ? (
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Responsável</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.assigneeId}
                onChange={(e) => onChange({ assigneeId: e.target.value })}
              >
                <option value="">Eu ({profileLabel})</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <p className="zaptro-modal-landscape-tip__text" style={{ marginTop: 8 }}>
          <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Rota e carga ajudam a priorizar no kanban.
          <Package size={14} style={{ verticalAlign: 'middle', margin: '0 6px 0 12px' }} />
          Pode editar tudo no cartão depois.
        </p>

        <div className="zaptro-modal-landscape-actions">
          <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary">
            <Save size={18} />
            Criar lead
          </button>
        </div>
      </div>
    </form>
  </LogtaModal>
);

export default ZaptroCrmCreateLeadModal;
