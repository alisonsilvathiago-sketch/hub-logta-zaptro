import React, { useEffect, useState } from 'react';
import { Loader2, Save, Sparkles, Truck } from 'lucide-react';
import LogtaModal from '../Modal';
import { notifyZaptro } from './ZaptroNotificationSystem';
import { useAuth } from '../../context/AuthContext';
import { supabaseZaptro } from '../../lib/supabase-zaptro';
import {
  isZaptroDemoVehicleId,
  saveDemoVehicleEdit,
  type ZaptroVehicleDemo,
} from '../../constants/zaptroVehiclesDemo';
import { vehicleOwnershipLabel, type VehicleOwnershipType } from '../../lib/zaptroDriverProfileExtended';

export type VehicleRegisterForm = {
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: string;
  status: ZaptroVehicleDemo['status'];
  vehicleOwnership: VehicleOwnershipType;
  fuelType: string;
  loadCapacity: string;
};

const emptyForm = (): VehicleRegisterForm => ({
  plate: '',
  type: 'Van',
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  status: 'disponivel',
  vehicleOwnership: 'empresa',
  fuelType: '',
  loadCapacity: '',
});

export function vehicleToRegisterForm(v: ZaptroVehicleDemo): VehicleRegisterForm {
  return {
    plate: v.plate,
    type: v.type,
    brand: v.brand,
    model: v.model,
    year: v.year,
    status: v.status,
    vehicleOwnership: v.vehicleOwnership ?? 'empresa',
    fuelType: v.fuelType ?? '',
    loadCapacity: v.loadCapacity ?? '',
  };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editVehicleId?: string | null;
  initial?: Partial<VehicleRegisterForm>;
};

export const ZaptroVehicleRegisterModal: React.FC<Props> = ({ isOpen, onClose, onSaved, editVehicleId, initial }) => {
  const { profile } = useAuth();
  const [form, setForm] = useState<VehicleRegisterForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ ...emptyForm(), ...initial });
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plate = form.plate.trim();
    if (plate.length < 5) {
      notifyZaptro('warning', 'Placa inválida', 'Informe a placa do veículo.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        plate,
        type: form.type.trim() || 'Veículo',
        brand: form.brand.trim() || '—',
        model: form.model.trim() || '—',
        year: form.year.trim() || '—',
        status: form.status,
        vehicleOwnership: form.vehicleOwnership,
        fuelType: form.fuelType.trim() || undefined,
        loadCapacity: form.loadCapacity.trim() || undefined,
      };

      if (editVehicleId && isZaptroDemoVehicleId(editVehicleId)) {
        saveDemoVehicleEdit(editVehicleId, payload);
      } else if (profile?.company_id && editVehicleId) {
        const { error } = await supabaseZaptro
          .from('veiculos')
          .update({
            placa: payload.plate,
            tipo: payload.type,
            marca: payload.brand,
            modelo: payload.model,
            ano: payload.year,
            status: payload.status,
          })
          .eq('id', editVehicleId);
        if (error) throw error;
      }

      notifyZaptro('success', 'Veículo guardado', editVehicleId ? 'Dados actualizados.' : 'Veículo cadastrado com sucesso.');
      onSaved();
      onClose();
    } catch (err: unknown) {
      notifyZaptro('error', 'Erro', err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setSaving(false);
    }
  };

  const modalTitle = editVehicleId ? 'Editar veículo' : 'Cadastrar veículo';

  return (
    <LogtaModal isOpen={isOpen} onClose={onClose} title={modalTitle} width="960px" variant="landscape">
      <form onSubmit={(e) => void handleSubmit(e)} className="zaptro-modal-landscape-body">
        <div className="zaptro-modal-landscape__left">
          <div className="zaptro-modal-landscape-hero">
            <div className="zaptro-modal-landscape-hero__icon">
              <Truck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="zaptro-modal-landscape-hero__title">{modalTitle}</h2>
              <p className="zaptro-modal-landscape-hero__subtitle">Identificação e dados do veículo</p>
            </div>
          </div>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Placa *</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234"
                required
              />
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Tipo</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Caminhão">Caminhão</option>
                <option value="Van">Van</option>
                <option value="Furgão">Furgão</option>
                <option value="Carro">Carro</option>
                <option value="Moto">Moto</option>
              </select>
            </label>

            <div className="zaptro-modal-landscape-field-row">
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Marca</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="Ex.: Mercedes-Benz"
                />
              </label>
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Modelo</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="Ex.: Sprinter 415"
                />
              </label>
            </div>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Ano</span>
              <input
                className="zaptro-modal-landscape-field__input"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2023"
              />
            </label>
          </div>

          <div className="zaptro-modal-landscape-tip">
            <div className="zaptro-modal-landscape-tip__inner">
              <Sparkles size={18} color="#D9FF00" />
              <p className="zaptro-modal-landscape-tip__text">
                Veículo <strong>da empresa</strong> ou do <strong>agregado</strong> — placa e documentos usados em rotas,
                pedágio e rastreio da frota.
              </p>
            </div>
          </div>
        </div>

        <div className="zaptro-modal-landscape__right">
          <h3 className="zaptro-modal-landscape-right-title">Parâmetros operacionais</h3>

          <div className="zaptro-modal-landscape-fields">
            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Estado</span>
              <select
                className="zaptro-modal-landscape-field__select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ZaptroVehicleDemo['status'] })}
              >
                <option value="disponivel">Disponível</option>
                <option value="em_rota">Em rota</option>
                <option value="manutencao">Manutenção</option>
                <option value="inativo">Inactivo</option>
              </select>
            </label>

            <label className="zaptro-modal-landscape-field">
              <span className="zaptro-modal-landscape-field__label">Proprietário do veículo</span>
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

            <div className="zaptro-modal-landscape-field-row">
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Combustível</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.fuelType}
                  onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                  placeholder="Diesel S10"
                />
              </label>
              <label className="zaptro-modal-landscape-field">
                <span className="zaptro-modal-landscape-field__label">Capacidade de carga</span>
                <input
                  className="zaptro-modal-landscape-field__input"
                  value={form.loadCapacity}
                  onChange={(e) => setForm({ ...form, loadCapacity: e.target.value })}
                  placeholder="1.5 Ton"
                />
              </label>
            </div>

            <p className="zaptro-modal-landscape-tip__text">
              Vínculo actual: <strong>{vehicleOwnershipLabel(form.vehicleOwnership)}</strong>
            </p>
          </div>

          <div className="zaptro-modal-landscape-actions">
            <button type="button" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="zaptro-modal-landscape-btn zaptro-modal-landscape-btn--primary" disabled={saving}>
              {saving ? <Loader2 size={18} className="zaptro-clients-spin" /> : <Save size={18} />}
              {editVehicleId ? 'Guardar alterações' : 'Cadastrar veículo'}
            </button>
          </div>
        </div>
      </form>
    </LogtaModal>
  );
};
