import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { WarehouseDraft } from '@/lib/demoWarehouseStore';
import type { WarehouseManagerRole } from '@/types';
import './warehouseRegisterModal.css';

const MANAGER_ROLES: WarehouseManagerRole[] = [
  'Gestor de Estoque',
  'Supervisor Logístico',
  'Coordenador Operacional',
  'Gerente do CD',
];

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (draft: WarehouseDraft) => void;
};

const emptyDraft = (): WarehouseDraft => ({
  name: '',
  code: '',
  type: 'physical',
  address_line: '',
  city: '',
  state: 'SP',
  manager_name: '',
  manager_role: 'Gestor de Estoque',
  manager_email: '',
  manager_phone: '',
  is_active: true,
});

function suggestWarehouseCode(name: string): string {
  const cleaned = name.trim().replace(/^cd\s+/i, '');
  if (!cleaned) return '';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'CD';
  const token = words.length === 1 ? words[0].slice(0, 3) : words.map((w) => w[0]).join('');
  return `CD-${token.toUpperCase().slice(0, 4)}`;
}

function formatPhoneBr(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function locationPreview(draft: WarehouseDraft): string {
  const cityState = [draft.city?.trim(), draft.state?.trim()].filter(Boolean).join(' · ');
  return cityState || 'Cidade · UF';
}

const WarehouseRegisterModal: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [draft, setDraft] = useState<WarehouseDraft>(emptyDraft);
  const [codeTouched, setCodeTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(emptyDraft());
      setCodeTouched(false);
    }
  }, [open]);

  const update = <K extends keyof WarehouseDraft>(key: K, value: WarehouseDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleNameChange = (name: string) => {
    setDraft((prev) => ({
      ...prev,
      name,
      code: codeTouched ? prev.code : suggestWarehouseCode(name),
    }));
  };

  const canSave = draft.name.trim().length >= 2 && draft.code.trim().length >= 2;
  const missingFields = useMemo(() => {
    const missing: string[] = [];
    if (draft.name.trim().length < 2) missing.push('nome');
    if (draft.code.trim().length < 2) missing.push('código');
    return missing;
  }, [draft.name, draft.code]);

  const hasLocation = Boolean(draft.address_line?.trim() || draft.city?.trim());
  const hasContact = Boolean(draft.manager_name?.trim() || draft.manager_phone?.trim());

  return (
    <Modal
      open={open}
      size="wide"
      paddingVariant="balanced"
      panelClassName="ls-wh-register-modal-panel"
      title="Cadastrar centro de distribuição"
      subtitle="Galpão físico · estoque separado por CD · contato visível nas operações"
      icon={<Building2 size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={
        <>
          <p className={`ls-wh-register-modal__footer-note${!canSave ? ' ls-wh-register-modal__footer-note--warn' : ''}`}>
            {canSave
              ? 'Endereço e responsável aparecem em transferências, separações e portaria.'
              : `Informe ${missingFields.join(' e ')} para continuar.`}
          </p>
          <button type="button" className="ls-btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="ls-btn-primary"
            disabled={!canSave}
            onClick={() => onSave({ ...draft, type: 'physical' })}
          >
            Cadastrar CD
          </button>
        </>
      }
    >
      <div className="ls-wh-register-modal">
        <div className="ls-wh-register-modal__form">
          <section className="ls-wh-register-modal__section">
            <h4 className="ls-wh-register-modal__section-head">
              <Building2 size={15} aria-hidden />
              Identificação
            </h4>
            <div className="ls-wh-register-modal__grid ls-wh-register-modal__grid--2">
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-name">
                  Nome do CD
                </label>
                <input
                  id="wh-name"
                  className="ls-input"
                  placeholder="Ex.: CD Osasco"
                  value={draft.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-code">
                  Código interno
                </label>
                <input
                  id="wh-code"
                  className="ls-input"
                  placeholder="Ex.: CD-OSA"
                  value={draft.code}
                  onChange={(e) => {
                    setCodeTouched(true);
                    update('code', e.target.value.toUpperCase());
                  }}
                />
                {!codeTouched && draft.code ? (
                  <p className="ls-wh-register-modal__hint ls-wh-register-modal__hint--ok">Sugerido automaticamente</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="ls-wh-register-modal__section ls-wh-register-modal__section--location">
            <h4 className="ls-wh-register-modal__section-head">
              <MapPin size={15} aria-hidden />
              Localização do galpão
            </h4>
            <div className="ls-wh-register-modal__grid">
              <div className="ls-wh-register-modal__field ls-wh-register-modal__field--span2">
                <label className="ls-label" htmlFor="wh-address">
                  Endereço completo
                </label>
                <input
                  id="wh-address"
                  className="ls-input"
                  placeholder="Rua, número, galpão, bloco"
                  value={draft.address_line ?? ''}
                  onChange={(e) => update('address_line', e.target.value)}
                />
                <p className="ls-wh-register-modal__hint">Aparece em transferências, portaria e perfil do CD</p>
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-city">
                  Cidade
                </label>
                <input
                  id="wh-city"
                  className="ls-input"
                  placeholder="Ex.: Osasco"
                  value={draft.city ?? ''}
                  onChange={(e) => update('city', e.target.value)}
                />
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-state">
                  Estado
                </label>
                <select
                  id="wh-state"
                  className="ls-input"
                  value={draft.state ?? 'SP'}
                  onChange={(e) => update('state', e.target.value)}
                >
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="ls-wh-register-modal__section">
            <h4 className="ls-wh-register-modal__section-head">
              <UserRound size={15} aria-hidden />
              Responsável e contato
            </h4>
            <div className="ls-wh-register-modal__grid ls-wh-register-modal__grid--2">
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-manager">
                  Responsável
                </label>
                <input
                  id="wh-manager"
                  className="ls-input"
                  placeholder="Nome completo"
                  value={draft.manager_name ?? ''}
                  onChange={(e) => update('manager_name', e.target.value)}
                />
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-role">
                  Função
                </label>
                <select
                  id="wh-role"
                  className="ls-input"
                  value={draft.manager_role ?? 'Gestor de Estoque'}
                  onChange={(e) => update('manager_role', e.target.value as WarehouseManagerRole)}
                >
                  {MANAGER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-email">
                  E-mail
                </label>
                <input
                  id="wh-email"
                  type="email"
                  className="ls-input"
                  placeholder="gestor@empresa.com.br"
                  value={draft.manager_email ?? ''}
                  onChange={(e) => update('manager_email', e.target.value)}
                />
              </div>
              <div className="ls-wh-register-modal__field">
                <label className="ls-label" htmlFor="wh-phone">
                  Telefone
                </label>
                <input
                  id="wh-phone"
                  className="ls-input"
                  placeholder="(11) 99999-9999"
                  value={draft.manager_phone ?? ''}
                  onChange={(e) => update('manager_phone', formatPhoneBr(e.target.value))}
                />
                <p className="ls-wh-register-modal__hint">Para ligação rápida em operações e portaria</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="ls-wh-register-modal__preview" aria-live="polite">
          <p className="ls-wh-register-modal__preview-label">Prévia do CD</p>
          <p className="ls-wh-register-modal__preview-name">{draft.name.trim() || 'Novo centro de distribuição'}</p>
          <p className="ls-wh-register-modal__preview-code">{draft.code.trim() || 'Código interno'}</p>

          <div className="ls-wh-register-modal__preview-address">
            <p className="ls-wh-register-modal__preview-address-label">
              <MapPin size={13} aria-hidden />
              Endereço
            </p>
            <p className="ls-wh-register-modal__preview-address-line">
              {draft.address_line?.trim() || 'Endereço não informado'}
            </p>
            <p className="ls-wh-register-modal__preview-address-sub">{locationPreview(draft)}</p>
          </div>

          {hasContact ? (
            <div className="ls-wh-register-modal__preview-contact">
              <p className="ls-wh-register-modal__preview-address-label">
                <UserRound size={13} aria-hidden />
                Responsável
              </p>
              <p className="ls-wh-register-modal__preview-contact-name">
                {draft.manager_name?.trim() || '—'}
              </p>
              <p className="ls-wh-register-modal__preview-contact-role">{draft.manager_role}</p>
              {draft.manager_phone?.trim() ? (
                <p className="ls-wh-register-modal__preview-row">
                  <Phone size={13} aria-hidden />
                  {draft.manager_phone}
                </p>
              ) : null}
              {draft.manager_email?.trim() ? (
                <p className="ls-wh-register-modal__preview-row">
                  <Mail size={13} aria-hidden />
                  {draft.manager_email}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="ls-wh-register-modal__preview-empty">
              Preencha endereço e responsável — esses dados aparecem nas páginas de transferência, separação e portaria.
            </p>
          )}

          {!hasLocation && hasContact ? (
            <p className="ls-wh-register-modal__preview-empty">
              Falta o endereço — recomendado para identificar o galpão nas operações.
            </p>
          ) : null}
        </aside>
      </div>
    </Modal>
  );
};

export default WarehouseRegisterModal;
