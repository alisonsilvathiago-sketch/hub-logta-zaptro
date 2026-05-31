import React, { useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import DriverLookupField, { type DriverLookupValue } from '@/components/drivers/DriverLookupField';
import Modal from '@/components/ui/Modal';
import SignaturePad from '@/components/ui/SignaturePad';
import type { DemoDriverGateDirection } from '@/lib/logstokaDemoSeed';
import type { LsWarehouse } from '@/types';
import './driverGateRegisterModal.css';

export type DriverGateFormState = {
  direction: DemoDriverGateDirection;
  warehouseId: string;
  driverId: string;
  driverName: string;
  driverCpf: string;
  companyName: string;
  companyCnpj: string;
  vehiclePlate: string;
  productDescription: string;
  destination: string;
  registeredByName: string;
  notes: string;
  signatureDataUrl: string;
  signatureSignedAt: string;
  confirmed: boolean;
};

type Props = {
  open: boolean;
  saving?: boolean;
  companyId: string | null;
  form: DriverGateFormState;
  warehouses: LsWarehouse[];
  defaultOperatorName?: string;
  onClose: () => void;
  onChange: (patch: Partial<DriverGateFormState>) => void;
  onSubmit: () => void;
};

const DriverGateRegisterModal: React.FC<Props> = ({
  open,
  saving = false,
  companyId,
  form,
  warehouses,
  defaultOperatorName = '',
  onClose,
  onChange,
  onSubmit,
}) => {
  const warehouse = warehouses.find((w) => w.id === form.warehouseId);
  const isEntry = form.direction === 'entry';

  useEffect(() => {
    if (!open || form.registeredByName.trim() || !defaultOperatorName.trim()) return;
    onChange({ registeredByName: defaultOperatorName });
  }, [open, defaultOperatorName, form.registeredByName, onChange]);

  const driverValue: DriverLookupValue = {
    driverId: form.driverId,
    driverName: form.driverName,
    driverCpf: form.driverCpf,
    companyName: form.companyName,
    companyCnpj: form.companyCnpj,
  };

  const handleDriverChange = (patch: Partial<DriverLookupValue>) => {
    onChange({
      driverId: patch.driverId ?? form.driverId,
      driverName: patch.driverName ?? form.driverName,
      driverCpf: patch.driverCpf ?? form.driverCpf,
      companyName: patch.companyName ?? form.companyName,
      companyCnpj: patch.companyCnpj ?? form.companyCnpj,
    });
  };

  const handleSignatureChange = (dataUrl: string) => {
    onChange({
      signatureDataUrl: dataUrl,
      signatureSignedAt: dataUrl ? new Date().toISOString() : '',
    });
  };

  const signedLabel = form.signatureSignedAt
    ? new Date(form.signatureSignedAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    : 'Preencha e assine abaixo';

  const footer = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={onClose} disabled={saving}>
        Cancelar
      </button>
      <button type="button" className="ls-btn-primary" disabled={saving} onClick={onSubmit}>
        {saving ? 'Registrando…' : isEntry ? 'Registrar entrada' : 'Registrar saída'}
      </button>
    </>
  );

  return (
    <Modal
      open={open}
      size="wide"
      paddingVariant="balanced"
      panelClassName="ls-driver-gate-modal-panel"
      title={isEntry ? 'Entrada de motorista' : 'Saída de motorista'}
      subtitle="Portaria · identificação, produto/destino e assinatura digital"
      icon={isEntry ? <ArrowDownLeft size={20} strokeWidth={2.25} /> : <ArrowUpRight size={20} strokeWidth={2.25} />}
      onClose={onClose}
      footer={footer}
    >
      <div className="ls-driver-gate-modal">
        <div className="ls-driver-gate-modal__direction">
          <button
            type="button"
            data-direction="entry"
            className={`ls-driver-gate-modal__direction-btn${form.direction === 'entry' ? ' ls-driver-gate-modal__direction-btn--active' : ''}`}
            onClick={() => onChange({ direction: 'entry' })}
          >
            Entrada
          </button>
          <button
            type="button"
            data-direction="exit"
            className={`ls-driver-gate-modal__direction-btn${form.direction === 'exit' ? ' ls-driver-gate-modal__direction-btn--active' : ''}`}
            onClick={() => onChange({ direction: 'exit' })}
          >
            Saída
          </button>
        </div>

        <div className="ls-driver-gate-modal__grid">
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">CD / Galpão</label>
            <select
              className="ls-input"
              value={form.warehouseId}
              onChange={(e) => onChange({ warehouseId: e.target.value })}
            >
              <option value="">Selecione o CD</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.city ? ` · ${w.city}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">Placa do veículo</label>
            <input
              className="ls-input"
              placeholder="Ex.: ABC1D23"
              value={form.vehiclePlate}
              onChange={(e) => onChange({ vehiclePlate: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="ls-driver-gate-modal__grid ls-driver-gate-modal__grid--wide">
          <div className="ls-driver-gate-modal__field ls-driver-gate-modal__field--span2">
            <label className="ls-label">Motorista / transportadora</label>
            <DriverLookupField
              companyId={companyId}
              value={driverValue}
              onChange={handleDriverChange}
            />
          </div>
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">CPF</label>
            <input
              className="ls-input"
              placeholder="000.000.000-00"
              value={form.driverCpf}
              onChange={(e) => onChange({ driverCpf: e.target.value })}
            />
          </div>
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">Empresa</label>
            <input
              className="ls-input"
              placeholder="Razão social"
              value={form.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
            />
          </div>
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">CNPJ</label>
            <input
              className="ls-input"
              placeholder="00.000.000/0000-00"
              value={form.companyCnpj}
              onChange={(e) => onChange({ companyCnpj: e.target.value })}
            />
          </div>
        </div>

        <div className="ls-driver-gate-modal__grid">
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">{isEntry ? 'Produto / carga' : 'Produto retirado'}</label>
            <input
              className="ls-input"
              placeholder={isEntry ? 'O que veio buscar ou entregar' : 'O que está saindo do CD'}
              value={form.productDescription}
              onChange={(e) => onChange({ productDescription: e.target.value })}
            />
          </div>
          <div className="ls-driver-gate-modal__field">
            <label className="ls-label">Destino (opcional)</label>
            <input
              className="ls-input"
              placeholder="Para onde segue"
              value={form.destination}
              onChange={(e) => onChange({ destination: e.target.value })}
            />
          </div>
        </div>

        <section className="ls-driver-gate-modal__approval">
          <p className="ls-transfer-modal__approval-title">
            <ShieldCheck size={15} aria-hidden />
            Termo e assinatura
          </p>

          <article className="ls-driver-gate-modal__term">
            <h3>Registro de {isEntry ? 'entrada' : 'saída'} — portaria</h3>
            <p>
              Eu, <strong>{form.driverName.trim() || '________________'}</strong>, CPF{' '}
              <strong>{form.driverCpf.trim() || '—'}</strong>, representando{' '}
              <strong>{form.companyName.trim() || '—'}</strong> (CNPJ{' '}
              <strong>{form.companyCnpj.trim() || '—'}</strong>), declaro {isEntry ? 'minha chegada' : 'minha saída'} no{' '}
              <strong>{warehouse?.name ?? 'CD'}</strong> com veículo placa{' '}
              <strong>{form.vehiclePlate.trim() || '—'}</strong>
              {form.productDescription.trim() ? (
                <>
                  {' '}
                  referente a <strong>{form.productDescription.trim()}</strong>
                </>
              ) : null}
              {form.destination.trim() ? (
                <>
                  , com destino <strong>{form.destination.trim()}</strong>
                </>
              ) : null}
              .
            </p>
            <p>Data e hora da assinatura: {signedLabel}</p>
          </article>

          <div className="ls-driver-gate-modal__grid">
            <div className="ls-driver-gate-modal__field">
              <label className="ls-label">Registrado por</label>
              <input
                className="ls-input"
                placeholder="Operador da portaria"
                value={form.registeredByName}
                onChange={(e) => onChange({ registeredByName: e.target.value })}
              />
            </div>
            <div className="ls-driver-gate-modal__field">
              <label className="ls-label">Observação</label>
              <input
                className="ls-input"
                placeholder="Opcional"
                value={form.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
              />
            </div>
          </div>

          <div className="ls-transfer-modal__approval-sign">
            <SignaturePad
              compact
              fullWidth
              label="Assinatura do motorista"
              value={form.signatureDataUrl}
              onChange={handleSignatureChange}
            />
          </div>

          <label className="ls-transfer-modal__confirm">
            <input
              type="checkbox"
              checked={form.confirmed}
              onChange={(e) => onChange({ confirmed: e.target.checked })}
            />
            <span>
              Confirmo os dados acima e autorizo o registro de {isEntry ? 'entrada' : 'saída'} no histórico da portaria.
            </span>
          </label>
        </section>
      </div>
    </Modal>
  );
};

export default DriverGateRegisterModal;
