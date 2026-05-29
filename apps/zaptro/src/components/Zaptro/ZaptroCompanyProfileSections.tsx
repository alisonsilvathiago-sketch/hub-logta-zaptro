import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Camera,
  Clock,
  Copy,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { formatBusinessLocation } from '../../lib/zaptroCompanyBusinessProfile';
import { SEGMENT_OPTIONS, type useZaptroCompanyBusinessProfile } from '../../hooks/useZaptroCompanyBusinessProfile';
import { ZAPTRO_APP_ROUTES } from '../../app/zaptroAppRoutes';
import '../../app/zaptroAppCompanyDrawer.css';

export type ZaptroCompanyProfileApi = ReturnType<typeof useZaptroCompanyBusinessProfile>;

export function ZaptroCompanyProfileToggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`zaptro-company-drawer-toggle${on ? ' is-on' : ''}`}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
    >
      <span />
    </button>
  );
}

export function ZaptroCompanyProfileAvatar({
  api,
  onPick,
}: {
  api: ZaptroCompanyProfileApi;
  onPick: () => void;
}) {
  const { displayLogoSrc, companyInitial, logoBusy } = api;
  return (
    <div className="zaptro-company-drawer-avatar-wrap">
      <button
        type="button"
        className={`zaptro-company-drawer-avatar-btn${logoBusy ? ' is-busy' : ''}`}
        onClick={onPick}
        disabled={logoBusy}
        aria-label="Alterar foto da empresa"
      >
        {displayLogoSrc ? (
          <img src={displayLogoSrc} alt="" className="zaptro-company-drawer-avatar-img" />
        ) : (
          <span className="zaptro-company-drawer-avatar-fallback">{companyInitial}</span>
        )}
        <span className="zaptro-company-drawer-avatar-edit">
          <Camera size={14} /> Editar
        </span>
        {logoBusy ? (
          <span className="zaptro-company-drawer-avatar-loading" aria-hidden>
            <Loader2 size={28} className="zaptro-spin" />
          </span>
        ) : null}
      </button>
    </div>
  );
}

export function ZaptroCompanyProfilePreviewCard({ api }: { api: ZaptroCompanyProfileApi }) {
  const { companyForm, displayLogoSrc, companyInitial, displayName, displayWaPhoneFormatted, displayWaPhone } = api;
  const locationLine = formatBusinessLocation(companyForm);

  return (
    <div className="zaptro-company-drawer-preview">
      <div className="zaptro-company-drawer-preview-head">
        <div className="zaptro-company-drawer-preview-avatar">
          {displayLogoSrc ? <img src={displayLogoSrc} alt="" /> : companyInitial}
        </div>
        <h3>{displayName || 'Sua empresa'}</h3>
        {companyForm.segment ? (
          <span className="cat">{companyForm.segment.replace(/_/g, ' ')}</span>
        ) : null}
      </div>
      {companyForm.description ? (
        <p className="zaptro-company-drawer-preview-about">{companyForm.description}</p>
      ) : (
        <p className="zaptro-company-drawer-preview-about" style={{ color: '#949494' }}>
          Adicione uma descrição no perfil comercial.
        </p>
      )}
      <div className="zaptro-company-drawer-preview-rows">
        {displayWaPhone ? (
          <div className="zaptro-company-drawer-preview-row">
            <Phone size={16} />
            <span>{displayWaPhoneFormatted}</span>
          </div>
        ) : null}
        {companyForm.email ? (
          <div className="zaptro-company-drawer-preview-row">
            <Mail size={16} />
            <span>{companyForm.email}</span>
          </div>
        ) : null}
        {companyForm.website ? (
          <div className="zaptro-company-drawer-preview-row">
            <Globe size={16} />
            <span>{companyForm.website}</span>
          </div>
        ) : null}
        {locationLine ? (
          <div className="zaptro-company-drawer-preview-row">
            <MapPin size={16} />
            <span>{locationLine}</span>
          </div>
        ) : null}
        {companyForm.openingHours ? (
          <div className="zaptro-company-drawer-preview-row">
            <Clock size={16} />
            <span>{companyForm.openingHours}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type FormProps = {
  api: ZaptroCompanyProfileApi;
  onOpenPreview?: () => void;
  showCompanyLink?: boolean;
  onCloseDrawer?: () => void;
};

export const ZaptroCompanyProfileForm: React.FC<FormProps> = ({
  api,
  onOpenPreview,
  showCompanyLink = true,
  onCloseDrawer,
}) => {
  const navigate = useNavigate();
  const {
    companyForm,
    setCompanyForm,
    fileRef,
    setLogoPreviewFromFile,
    uploadLogo,
    saving,
    saveCompanyProfile,
    displayWaPhoneFormatted,
    displayWaPhone,
    copyPhone,
    waProfileSyncing,
    waAccountLabel,
    displayName,
  } = api;

  return (
    <div className="zaptro-company-drawer-sub zaptro-company-in-profile">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setLogoPreviewFromFile(f);
          void uploadLogo(f);
        }}
      />

      <div className="zaptro-company-in-profile__hero">
        <ZaptroCompanyProfileAvatar api={api} onPick={() => fileRef.current?.click()} />
        <div>
          <h3 className="zaptro-company-in-profile__title">{displayName}</h3>
          <p className="zaptro-company-in-profile__sub">
            Perfil comercial • {waAccountLabel}
            {waProfileSyncing ? ' • sincronizando…' : ''}
          </p>
        </div>
      </div>

      <p className="zaptro-company-drawer-section-label">Dados visíveis no WhatsApp</p>
      <div className="zaptro-company-drawer-form-grid">
        <div className="zaptro-company-drawer-field">
          <label>Nome comercial</label>
          <input
            value={companyForm.name}
            onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Nome da empresa"
          />
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Segmento</label>
          <select
            value={companyForm.segment}
            onChange={(e) => setCompanyForm((f) => ({ ...f, segment: e.target.value }))}
          >
            {SEGMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Descrição / Recado</label>
          <textarea
            value={companyForm.description}
            onChange={(e) => setCompanyForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Conte em poucas linhas o que sua empresa faz"
          />
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Telefone WhatsApp (linha ligada)</label>
          <p className="zaptro-company-drawer-field-hint">
            Número da conta conectada pelo QR em Configurações. Não pode ser alterado aqui.
          </p>
          <div className="zaptro-company-drawer-field-row-phone">
            <input
              className="zaptro-company-drawer-input-readonly"
              readOnly
              value={displayWaPhoneFormatted}
              placeholder="Ligue o WhatsApp em Configurações"
              aria-readonly="true"
            />
            <button
              type="button"
              className="zaptro-company-drawer-back"
              onClick={copyPhone}
              disabled={!displayWaPhone}
              aria-label="Copiar telefone"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
        <div className="zaptro-company-drawer-field">
          <label>E-mail</label>
          <input
            type="email"
            value={companyForm.email}
            onChange={(e) => setCompanyForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="contato@empresa.com"
          />
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Site</label>
          <input
            value={companyForm.website}
            onChange={(e) => setCompanyForm((f) => ({ ...f, website: e.target.value }))}
            placeholder="https://suaempresa.com.br"
          />
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Endereço</label>
          <input
            value={companyForm.address}
            onChange={(e) => setCompanyForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="Rua, número, bairro"
          />
        </div>
        <div className="zaptro-company-drawer-field-row">
          <div className="zaptro-company-drawer-field">
            <label>Cidade</label>
            <input
              value={companyForm.city}
              onChange={(e) => setCompanyForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="São Paulo"
            />
          </div>
          <div className="zaptro-company-drawer-field">
            <label>Estado</label>
            <input
              value={companyForm.state}
              onChange={(e) => setCompanyForm((f) => ({ ...f, state: e.target.value }))}
              placeholder="SP"
              maxLength={2}
            />
          </div>
        </div>
        <div className="zaptro-company-drawer-field">
          <label>Horário de funcionamento</label>
          <input
            value={companyForm.openingHours}
            onChange={(e) => setCompanyForm((f) => ({ ...f, openingHours: e.target.value }))}
            placeholder="Seg–Sex, 08:00–18:00"
          />
        </div>
      </div>

      <button type="button" className="zaptro-company-drawer-save" disabled={saving} onClick={() => void saveCompanyProfile()}>
        {saving ? 'Salvando…' : 'Salvar perfil comercial'}
      </button>

      {onOpenPreview ? (
        <button type="button" className="zaptro-company-drawer-link" onClick={onOpenPreview}>
          Ver prévia do perfil público
        </button>
      ) : null}

      {showCompanyLink ? (
        <button
          type="button"
          className="zaptro-company-drawer-link"
          onClick={() => {
            onCloseDrawer?.();
            navigate(ZAPTRO_APP_ROUTES.COMPANY);
          }}
        >
          <Building2 size={14} /> Minha Empresa (white label e integrações)
        </button>
      ) : null}
    </div>
  );
};

export const ZaptroCompanyProfilePreview: React.FC<{
  api: ZaptroCompanyProfileApi;
  onEdit?: () => void;
}> = ({ api, onEdit }) => (
  <div className="zaptro-company-drawer-sub zaptro-company-in-profile">
    <p style={{ fontSize: 12, fontWeight: 650, color: '#949494', margin: '0 0 12px', lineHeight: 1.5 }}>
      Assim o cliente vê ao tocar na sua foto durante a conversa no WhatsApp:
    </p>
    <ZaptroCompanyProfilePreviewCard api={api} />
    {onEdit ? (
      <button type="button" className="zaptro-company-drawer-save" onClick={onEdit}>
        Editar informações
      </button>
    ) : null}
  </div>
);

export const ZaptroCompanyNotifSettings: React.FC<{ api: ZaptroCompanyProfileApi }> = ({ api }) => {
  const { notifPrefs, setNotifPrefs, saving, saveNotifications } = api;
  return (
    <div className="zaptro-company-drawer-sub zaptro-company-in-profile">
      <div className="zaptro-company-drawer-toggle-row">
        <div style={{ flex: 1 }}>
          <strong>Som ao receber mensagens</strong>
          <p>Alerta sonoro quando chegar mensagem nova no Zaptro.</p>
        </div>
        <ZaptroCompanyProfileToggle
          on={notifPrefs.sound}
          onToggle={() => setNotifPrefs((p) => ({ ...p, sound: !p.sound }))}
          label="Som"
        />
      </div>
      <div className="zaptro-company-drawer-toggle-row">
        <div style={{ flex: 1 }}>
          <strong>Notificação visual (desktop)</strong>
          <p>Prévia da mensagem no navegador.</p>
        </div>
        <ZaptroCompanyProfileToggle
          on={notifPrefs.visual}
          onToggle={() => setNotifPrefs((p) => ({ ...p, visual: !p.visual }))}
          label="Visual"
        />
      </div>
      <button type="button" className="zaptro-company-drawer-save" disabled={saving} onClick={() => void saveNotifications()}>
        {saving ? 'Salvando…' : 'Salvar notificações'}
      </button>
    </div>
  );
};
