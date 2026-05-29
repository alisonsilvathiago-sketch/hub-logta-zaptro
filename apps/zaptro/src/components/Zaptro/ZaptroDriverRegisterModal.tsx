import React, { useEffect, useState } from 'react';
import { Loader2, Save, Sparkles, Truck, User } from 'lucide-react';
import LogtaModal from '../Modal';
import { notifyZaptro } from './ZaptroNotificationSystem';
import { ZaptroModalLandscapeAvatar } from './ZaptroModalLandscapeAvatar';
import { useAuth } from '../../context/AuthContext';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import { isZaptroDemoDriverId } from '../../constants/zaptroDriversDemo';
import {
  saveDriverExtendedProfile,
  type DriverEmploymentType,
  type DriverPrimaryIdType,
  type VehicleOwnershipType,
} from '../../lib/zaptroDriverProfileExtended';
import { getVisibleDemoHelpers } from '../../constants/zaptroHelpersDemo';

export type DriverRegisterForm = {
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  cpf: string;
  address: string;
  vehicle: string;
  status: string;
  employmentType: DriverEmploymentType;
  vehicleOwnership: VehicleOwnershipType;
  primaryIdType: DriverPrimaryIdType;
  joinedAt: string;
  hasHelper: boolean;
  helperIds: string[];
  notes: string;
  avatarUrl: string | null;
};

const emptyForm = (): DriverRegisterForm => ({
  name: '',
  phone: '',
  altPhone: '',
  email: '',
  cpf: '',
  address: '',
  vehicle: '',
  status: 'ativo',
  employmentType: 'agregado',
  vehicleOwnership: 'agregado',
  primaryIdType: 'phone',
  joinedAt: new Date().toISOString().slice(0, 10),
  hasHelper: false,
  helperIds: [],
  notes: '',
  avatarUrl: null,
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editDriverId?: string | null;
  initial?: Partial<DriverRegisterForm>;
};

export const ZaptroDriverRegisterModal: React.FC<Props> = ({ isOpen, onClose, onSaved, editDriverId, initial }) => {
  const { profile } = useAuth();
  const [form, setForm] = useState<DriverRegisterForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const helpers = getVisibleDemoHelpers();

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm(), ...initial });
  }, [isOpen, initial]);

  const toggleHelper = (id: string) => {
    const has = form.helperIds.includes(id);
    const helperIds = has ? form.helperIds.filter((x) => x !== id) : [...form.helperIds, id];
    setForm({ ...form, helperIds, hasHelper: helperIds.length > 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const digits = form.phone.replace(/\D/g, '');
    if (name.length < 2 || digits.length < 10) {
      notifyZaptro('warning', 'Dados incompletos', 'Nome e WhatsApp válido são obrigatórios.');
      return;
    }
    if (form.primaryIdType === 'cpf' && !form.cpf.trim()) {
      notifyZaptro('warning', 'CPF obrigatório', 'Informe o CPF como ID do motorista.');
      return;
    }
    if (form.primaryIdType === 'email' && !form.email.trim()) {
      notifyZaptro('warning', 'E-mail obrigatório', 'Informe o e-mail como ID do motorista.');
      return;
    }

    setSaving(true);
    try {
      const extended = {
        email: form.email.trim(),
        altPhone: form.altPhone.trim(),
        address: form.address.trim(),
        cpf: form.cpf.trim(),
        primaryIdType: form.primaryIdType,
        employmentType: form.employmentType,
        vehicleOwnership: form.vehicleOwnership,
        joinedAt: form.joinedAt,
        hasHelper: form.hasHelper && form.helperIds.length > 0,
        helperIds: form.hasHelper ? form.helperIds : [],
        notes: form.notes.trim(),
      };

      if (profile?.company_id && (!editDriverId || !isZaptroDemoDriverId(editDriverId))) {
        const payload = {
          company_id: profile.company_id,
          name,
          phone: digits,
          vehicle: form.vehicle.trim() || null,
          status: form.status,
        };
        if (editDriverId) {
          const { error } = await supabaseZaptro.from('whatsapp_drivers').update(payload).eq('id', editDriverId);
          if (error) throw error;
          saveDriverExtendedProfile(editDriverId, extended);
        } else {
          const { data, error } = await supabaseZaptro.from('whatsapp_drivers').insert([payload]).select('id').single();
          if (error) throw error;
          if (data?.id) saveDriverExtendedProfile(String(data.id), extended);
        }
      } else if (editDriverId && isZaptroDemoDriverId(editDriverId)) {
        try {
          const raw = localStorage.getItem('zaptro_demo_driver_edits_v1');
          const map = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          map[editDriverId] = {
            ...(map[editDriverId] as object),
            name,
            phone: digits,
            vehicle: form.vehicle.trim(),
            status: form.status,
            photo_url: form.avatarUrl ?? undefined,
          };
          localStorage.setItem('zaptro_demo_driver_edits_v1', JSON.stringify(map));
        } catch {
          /* ignore */
        }
        saveDriverExtendedProfile(editDriverId, extended);
      }

      notifyZaptro('success', 'Motorista guardado', 'Registo actualizado com sucesso.');
      onSaved();
      onClose();
    } catch (err: unknown) {
      notifyZaptro('error', 'Erro', err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = editDriverId ? 'Editar motorista' : 'Cadastrar motorista';

  return (
    <LogtaModal isOpen={isOpen} onClose={onClose} title={modalTitle} width="960px" variant="landscape">
      <form onSubmit={(e) => void handleSubmit(e)} className="zaptro-modal-landscape-body">
        <div className="zaptro-modal-landscape__left">
          <div className="zaptro-modal-landscape-hero">
            <ZaptroModalLandscapeAvatar
              photoUrl={form.avatarUrl}
              name={form.name}
              fallbackIcon={<User size={24} strokeWidth={2.5} />}
              onChange={(url) => setForm({ ...form, avatarUrl: url })}
              label="Foto do motorista"
            />
            <div>
              <h2 className="zaptro-modal-landscape-hero__title">{modalTitle}</h2>
              <p className="zaptro-modal-landscape-hero__subtitle">Detalhes do motorista e identificação</p>
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
              <span className="zaptro-modal-landscape-field__label">ID oficial (login / rastreio)</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.primaryIdType}
                onChange={(e) => setForm({ ...form, primaryIdType: e.target.value as DriverPrimaryIdType })}
              >
                <option value="phone">Telemóvel / WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
              </select>
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">WhatsApp (número real) *</span>
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
                Motorista <strong>da empresa (CLT)</strong> ou <strong>agregado</strong> · ID oficial via WhatsApp, e-mail ou
                CPF — usado no link de rota e rastreio.
              </p>
            </div>
          </div>
        </div>

        <div className="zaptro-modal-landscape__right">
          <h3 className="zaptro-modal-landscape-right-title">
            <Truck size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Parâmetros operacionais
          </h3>

          <div className="zaptro-modal-landscape-fields">
            <div className="zaptro-modal-landscape-field-row">
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Vínculo do motorista</span>
                <select
                  className="zaptro-modal-landscape-field__select"
                  value={form.employmentType}
                  onChange={(e) => setForm({ ...form, employmentType: e.target.value as DriverEmploymentType })}
                >
                  <option value="clt">Da empresa (CLT)</option>
                  <option value="agregado">Agregado / autónomo</option>
                </select>
              </label>

              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Veículo pertence a</span>
                <select
                  className="zaptro-modal-landscape-field__select"
                  value={form.vehicleOwnership}
                  onChange={(e) => setForm({ ...form, vehicleOwnership: e.target.value as VehicleOwnershipType })}
                >
                  <option value="empresa">Empresa</option>
                  <option value="agregado">Agregado</option>
                  <option value="terceiro">Terceiro</option>
                </select>
              </label>
            </div>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Veículo / placa</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.vehicle}
                onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                placeholder="Ex.: Volvo FH · ABC-1234"
              />
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Estado operacional</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ativo">Activo — com acesso a rotas</option>
                <option value="inativo">Inactivo — fora de operação</option>
                <option value="bloqueado">Bloqueado — sem acesso a links</option>
              </select>
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Endereço (opcional)</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>

            <label className="zaptro-modal-landscape-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={form.hasHelper}
                onChange={(e) =>
                  setForm({ ...form, hasHelper: e.target.checked, helperIds: e.target.checked ? form.helperIds : [] })
                }
              />
              <span className="zaptro-modal-landscape-field__label" style={{ margin: 0 }}>
                Trabalha com ajudante(s)
              </span>
            </label>

            {form.hasHelper ? (
              <div
                style={{
                  padding: 12,
                  borderRadius: 16,
                  border: '1.5px solid #e5e7eb',
                  background: '#fff',
                  maxHeight: 120,
                  overflowY: 'auto',
                }}
              >
                {helpers.length === 0 ? (
                  <p className="zaptro-modal-landscape-tip__text">Cadastre ajudantes na aba Ajudantes.</p>
                ) : (
                  helpers.map((h) => (
                    <label
                      key={h.id}
                      style={{ display: 'flex', gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 6, cursor: 'pointer' }}
                    >
                      <input type="checkbox" checked={form.helperIds.includes(h.id)} onChange={() => toggleHelper(h.id)} />
                      {h.name}
                    </label>
                  ))
                )}
              </div>
            ) : null}

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Observações operacionais</span>
              <textarea
                className="zaptro-modal-landscape-field__textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex.: Cuidado com carga frágil, ligar antes de chegar…"
              />
            </label>
          </div>

          <div className="zaptro-modal-landscape-actions">
            <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="zaptro-clients-spin" /> : <Save size={18} />}
              {saving ? 'A guardar…' : 'Guardar motorista'}
            </button>
          </div>
        </div>
      </form>
    </LogtaModal>
  );
};
