import React, { useEffect, useState } from 'react';
import LogtaModal from '../Modal';
import { notifyZaptro } from './ZaptroNotificationSystem';
import {
  clientToEditForm,
  fetchContactAvatarByPhone,
  saveClientProfileEdit,
  type ZaptroClientProfileEditForm,
  type ZaptroClientProfileMetadata,
} from '../../lib/zaptroClientProfileEdits';
import { isZaptroDemoClientId } from '../../constants/zaptroClientsDemo';
import '../../app/zaptroAppClientProfile.css';

type ClientRow = {
  id: string;
  sender_name: string;
  sender_number: string;
  customer_avatar?: string | null;
  metadata: ZaptroClientProfileMetadata;
};

type Props = {
  open: boolean;
  client: ClientRow | null;
  companyId: string;
  onClose: () => void;
  onSaved: () => void;
};

const ZaptroClientEditModal: React.FC<Props> = ({ open, client, companyId, onClose, onSaved }) => {
  const [form, setForm] = useState<ZaptroClientProfileEditForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !client) {
      setForm(null);
      return;
    }
    void (async () => {
      const base = clientToEditForm(client);
      if (!base.avatarUrl && companyId && !isZaptroDemoClientId(client.id)) {
        const fromWa = await fetchContactAvatarByPhone(companyId, client.sender_number);
        if (fromWa) base.avatarUrl = fromWa;
      }
      setForm(base);
    })();
  }, [open, client, companyId]);

  const handlePhotoFile = (file: File | undefined) => {
    if (!file || !form) return;
    if (!file.type.startsWith('image/')) {
      notifyZaptro('error', 'Foto', 'Escolha um ficheiro de imagem (JPG ou PNG).');
      return;
    }
    if (file.size > 1_500_000) {
      notifyZaptro('error', 'Foto', 'Imagem demasiado grande (máx. 1,5 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm({ ...form, avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!client || !form) return;
    setSaving(true);
    try {
      await saveClientProfileEdit(companyId, client.id, form, client.metadata);
      notifyZaptro('success', 'Cliente', 'Dados actualizados.');
      onSaved();
      onClose();
    } catch (err) {
      notifyZaptro('error', 'Cliente', err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LogtaModal
      isOpen={open && !!form && !!client}
      onClose={onClose}
      title="Editar cliente"
      width="640px"
      variant="center"
      headerStyle={{ padding: '14px 20px' }}
      contentStyle={{ padding: '16px 20px 20px' }}
    >
      {form ? (
        <div className="zaptro-client-profile__edit-modal">
          <div className="zaptro-client-profile__edit-photo">
            <div className="zaptro-client-profile__edit-photo-preview">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="" />
              ) : (
                form.responsibleName?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div>
              <label className="zaptro-client-profile__edit-label">
                Foto do cliente
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    handlePhotoFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              {form.avatarUrl ? (
                <button
                  type="button"
                  className="zaptro-client-profile__btn-link"
                  onClick={() => setForm({ ...form, avatarUrl: null })}
                >
                  Remover foto
                </button>
              ) : null}
            </div>
          </div>

          <div className="zaptro-client-profile__edit-grid">
            <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
              Nome do responsável *
              <input
                value={form.responsibleName}
                onChange={(e) => setForm({ ...form, responsibleName: e.target.value })}
                placeholder="Nome completo"
              />
            </label>
            <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
              Nome da empresa
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Razão social ou nome fantasia"
              />
            </label>
            <label className="zaptro-client-profile__edit-label">
              Telefone / WhatsApp *
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                inputMode="tel"
                placeholder="5511999999999"
              />
            </label>
            <label className="zaptro-client-profile__edit-label">
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@empresa.com.br"
              />
            </label>
            <label className="zaptro-client-profile__edit-label">
              Tipo de documento
              <select
                value={form.documentType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    documentType: e.target.value as ZaptroClientProfileEditForm['documentType'],
                  })
                }
              >
                <option value="">—</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
              </select>
            </label>
            <label className="zaptro-client-profile__edit-label">
              Documento
              <input
                value={form.document}
                onChange={(e) => setForm({ ...form, document: e.target.value })}
                placeholder="Somente números"
              />
            </label>
            <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
              Endereço
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Rua, número, cidade"
              />
            </label>
            <label className="zaptro-client-profile__edit-label zaptro-client-profile__edit-grid--full">
              Notas internas
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observações visíveis só para a equipa"
                rows={3}
              />
            </label>
          </div>

          <div className="zaptro-client-profile__edit-foot">
            <button type="button" className="hub-premium-pill secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="hub-premium-pill dark"
              disabled={saving || !form.responsibleName.trim()}
              onClick={() => void handleSave()}
            >
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </button>
          </div>
        </div>
      ) : null}
    </LogtaModal>
  );
};

export default ZaptroClientEditModal;
