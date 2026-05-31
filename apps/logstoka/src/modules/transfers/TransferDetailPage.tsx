import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeftRight, Package, Printer, ShieldCheck, Truck, UserRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LogstokaDetailPageLayout } from '@/components/layout/LogstokaDetailPageLayout';
import OperationalProductItemsPanel from '@/components/operational/OperationalProductItemsPanel';
import OperationalWarehouseCard from '@/components/operational/OperationalWarehouseCard';
import Modal from '@/components/ui/Modal';
import SignaturePad from '@/components/ui/SignaturePad';
import MarketplaceLogo from '@/components/marketplace/MarketplaceLogo';
import { useAuth } from '@/context/LogstokaAuthProvider';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import {
  getMergedDemoTransfer,
  receiveDemoTransfer,
  shipDemoTransfer,
} from '@/lib/demoTransferStore';
import { getDemoWarehouseById } from '@/lib/demoWarehouseStore';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  transferStatusBadgeClass,
  transferStatusExplain,
  transferStatusLabel,
} from '@/lib/operationalTransferStatus';
import { printTransferAuthorizationDoc } from '@/lib/printTransferAuthorization';
import type { DemoTransferRow } from '@/lib/logstokaDemoSeed';
import './transferDetailPage.css';
import '@/components/operational/operationalDetailShared.css';
import '@/components/transfers/transferRegisterModal.css';

const fmtQty = (n: number) => n.toLocaleString('pt-BR');
const fmtDate = (iso: string) => new Date(iso).toLocaleString('pt-BR');

const TransferDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const { profile } = useAuth();
  const demo = isLogstokaDemoCompany(companyId);
  const [transfer, setTransfer] = useState<DemoTransferRow | null>(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receivedByName, setReceivedByName] = useState('');
  const [receiveSignature, setReceiveSignature] = useState('');
  const [receiveConfirmed, setReceiveConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!demo || !companyId || !id) {
      setTransfer(null);
      return;
    }
    setTransfer(getMergedDemoTransfer(companyId, id));
  }, [companyId, demo, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener('logstoka:demo-transfers-updated', onUpdate);
    return () => window.removeEventListener('logstoka:demo-transfers-updated', onUpdate);
  }, [load]);

  const originWh = useMemo(
    () => (companyId && transfer ? getDemoWarehouseById(companyId, transfer.origin_warehouse_id) : null),
    [companyId, transfer],
  );
  const destWh = useMemo(
    () => (companyId && transfer ? getDemoWarehouseById(companyId, transfer.destination_warehouse_id) : null),
    [companyId, transfer],
  );

  useEffect(() => {
    if (!receiveOpen || !transfer || receivedByName.trim()) return;
    setReceivedByName(destWh?.manager_name ?? profile?.full_name ?? '');
  }, [receiveOpen, transfer, destWh?.manager_name, profile?.full_name, receivedByName]);

  if (!transfer) {
    return (
      <LogstokaDetailPageLayout backTo="/app/transfers" title="Transferência" subtitle="Registro não encontrado">
        <div className="ls-card text-sm text-slate-500">Transferência não encontrada.</div>
      </LogstokaDetailPageLayout>
    );
  }

  const release = transfer.release_approval;
  const receive = transfer.receive_approval;
  const totalQty = transfer.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusExplain = transferStatusExplain(transfer);

  const handleShip = () => {
    if (!companyId || !release) {
      toast.error('Transferência sem aprovação de origem');
      return;
    }
    setBusy(true);
    const updated = shipDemoTransfer(companyId, transfer.id);
    setBusy(false);
    if (updated) {
      setTransfer(updated);
      toast.success('Envio liberado — em trânsito');
    }
  };

  const handleReceive = () => {
    if (!companyId) return;
    if (!receivedByName.trim()) {
      toast.error('Informe quem recebe no CD de destino');
      return;
    }
    if (!receiveSignature) {
      toast.error('Assinatura de recebimento obrigatória');
      return;
    }
    if (!receiveConfirmed) {
      toast.error('Confirme que conferiu os itens recebidos');
      return;
    }
    setBusy(true);
    const updated = receiveDemoTransfer(companyId, transfer.id, {
      received_by_name: receivedByName.trim(),
      signature_data_url: receiveSignature,
      received_at: new Date().toISOString(),
    });
    setBusy(false);
    if (updated) {
      setTransfer(updated);
      setReceiveOpen(false);
      setReceiveSignature('');
      setReceiveConfirmed(false);
      toast.success('Recebimento confirmado com assinatura');
    }
  };

  return (
    <LogstokaDetailPageLayout
      backTo="/app/transfers"
      backLabel="Voltar para transferências"
      hideTitleRow
    >
      <div className="space-y-6">
        <section className="ls-op-detail-hero">
          <div className="ls-op-detail-hero__icon" aria-hidden>
            <ArrowLeftRight size={32} strokeWidth={2.25} />
          </div>

          <div className="min-w-0">
            <p className="ls-op-detail-hero__eyebrow">Transferência · {transfer.id}</p>
            <h1 className="ls-op-detail-hero__title">
              {transfer.origin_name} → {transfer.destination_name}
            </h1>
            <div className="ls-op-detail-hero__meta">
              <span className={`ls-badge ${transferStatusBadgeClass(transfer.status)}`}>
                {transferStatusLabel(transfer.status)}
              </span>
              {destWh?.marketplace ? (
                <span className="ls-badge inline-flex items-center gap-1.5 bg-[#f5f5f5] text-[#565656]">
                  <MarketplaceLogo marketplace={destWh.marketplace} size={14} />
                  Fulfillment
                </span>
              ) : null}
              <span className="ls-badge bg-orange-50 text-orange-700">
                {transfer.items.length} item{transfer.items.length === 1 ? '' : 'ns'}
              </span>
            </div>
            <p className="ls-op-detail-hero__explain">{statusExplain}</p>
            {transfer.notes ? (
              <p className="mt-2 text-xs font-semibold text-[#737373]">{transfer.notes}</p>
            ) : null}
            <p className="mt-2 text-xs font-semibold text-[#949494]">{fmtDate(transfer.created_at)}</p>
          </div>

          <div className="ls-op-detail-hero__aside">
            <div className="mb-4 flex flex-wrap justify-end gap-2">
              {release ? (
                <button
                  type="button"
                  className="ls-btn-secondary"
                  onClick={() =>
                    printTransferAuthorizationDoc({
                      originName: transfer.origin_name,
                      destinationName: transfer.destination_name,
                      productName: transfer.items[0]?.name ?? '—',
                      productCode: transfer.items[0]?.sku ?? '—',
                      quantity: transfer.items[0]?.quantity ?? 0,
                      release,
                    })
                  }
                >
                  <Printer size={16} />
                  Imprimir termo
                </button>
              ) : null}
              {transfer.status === 'pending' && release ? (
                <button type="button" className="ls-btn-primary" disabled={busy} onClick={handleShip}>
                  <Truck size={16} />
                  Liberar envio
                </button>
              ) : null}
              {transfer.status === 'in_transit' ? (
                <button type="button" className="ls-btn-primary" disabled={busy} onClick={() => setReceiveOpen(true)}>
                  <Package size={16} />
                  Confirmar recebimento
                </button>
              ) : null}
            </div>
            <p className="ls-op-detail-hero__qty">{fmtQty(totalQty)}</p>
            <p className="ls-op-detail-hero__qty-label">unidades transferidas</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Quantidade total</p>
            <p className="ls-op-detail-kpi__value">{fmtQty(totalQty)}</p>
            <p className="ls-op-detail-kpi__hint">unidades nesta transferência</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Status</p>
            <p className="ls-op-detail-kpi__value text-xl">{transferStatusLabel(transfer.status)}</p>
            <p className="ls-op-detail-kpi__hint">situação operacional</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Origem</p>
            <p className="ls-op-detail-kpi__value text-xl">{transfer.origin_name}</p>
            <p className="ls-op-detail-kpi__hint">{originWh?.manager_name ?? 'CD de saída'}</p>
          </div>
          <div className="ls-op-detail-kpi">
            <p className="ls-op-detail-kpi__label">Destino</p>
            <p className="ls-op-detail-kpi__value text-xl">{transfer.destination_name}</p>
            <p className="ls-op-detail-kpi__hint">{destWh?.marketplace ? 'Fulfillment' : destWh?.manager_name ?? 'CD de entrada'}</p>
          </div>
        </div>

        <section className="ls-op-detail-panel">
          <h3 className="ls-op-detail-panel__title">Rota e pontos de contato</h3>
          <div className="ls-op-detail-route mb-4">
            <span className="text-sm font-bold text-[#525252]">{transfer.origin_name}</span>
            <span className="ls-op-detail-route__arrow" aria-hidden>
              <ArrowLeftRight size={18} />
            </span>
            <span className="text-sm font-bold text-[#525252]">{transfer.destination_name}</span>
          </div>
          <div className="ls-op-detail-wh-grid">
            <OperationalWarehouseCard
              warehouse={originWh}
              fallbackName={transfer.origin_name}
              role="Origem"
              variant="origin"
            />
            <OperationalWarehouseCard
              warehouse={destWh}
              fallbackName={transfer.destination_name}
              role="Destino"
              variant="destination"
            />
          </div>
        </section>

        <OperationalProductItemsPanel items={transfer.items} title="Produtos da transferência" />

        <section className="ls-card ls-transfer-detail__approval">
          <h3 className="ls-transfer-detail__approval-title">
            <ShieldCheck size={18} aria-hidden />
            Aprovação na origem
          </h3>
          {release ? (
            <div className="ls-transfer-detail__approval-grid">
              <div>
                <p className="ls-transfer-detail__label">
                  <UserRound size={14} aria-hidden /> Responsável
                </p>
                <p className="ls-transfer-detail__value">{release.released_by_name}</p>
                <p className="ls-transfer-detail__meta">{fmtDate(release.approved_at)}</p>
              </div>
              <div>
                <p className="ls-transfer-detail__label">
                  <Truck size={14} aria-hidden /> Motorista
                </p>
                <p className="ls-transfer-detail__value">{release.driver_name}</p>
                {release.driver_cpf ? (
                  <p className="ls-transfer-detail__meta">CPF {release.driver_cpf}</p>
                ) : null}
                {release.company_name ? (
                  <p className="ls-transfer-detail__meta">
                    {release.company_name}
                    {release.company_cnpj ? ` · ${release.company_cnpj}` : ''}
                  </p>
                ) : null}
                {release.driver_plate ? (
                  <p className="ls-transfer-detail__meta">Placa {release.driver_plate}</p>
                ) : null}
              </div>
              <div className="ls-transfer-detail__signature">
                <p className="ls-transfer-detail__label">Assinatura</p>
                <img src={release.signature_data_url} alt="Assinatura do responsável" />
              </div>
            </div>
          ) : (
            <p className="text-sm text-orange-800 font-semibold">
              Sem aprovação registrada — transferências novas exigem responsável, motorista e assinatura.
            </p>
          )}
        </section>

        {receive ? (
          <section className="ls-card ls-transfer-detail__approval">
            <h3 className="ls-transfer-detail__approval-title">
              <Package size={18} aria-hidden />
              Recebimento no destino
            </h3>
            <div className="ls-transfer-detail__approval-grid">
              <div>
                <p className="ls-transfer-detail__label">Recebido por</p>
                <p className="ls-transfer-detail__value">{receive.received_by_name}</p>
                <p className="ls-transfer-detail__meta">{fmtDate(receive.received_at)}</p>
              </div>
              <div className="ls-transfer-detail__signature">
                <p className="ls-transfer-detail__label">Assinatura</p>
                <img src={receive.signature_data_url} alt="Assinatura de recebimento" />
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <Modal
        open={receiveOpen}
        title="Confirmar recebimento"
        subtitle={`CD destino: ${transfer.destination_name}`}
        icon={<Package size={20} strokeWidth={2.25} />}
        onClose={() => setReceiveOpen(false)}
        footer={
          <>
            <button type="button" className="ls-btn-secondary" onClick={() => setReceiveOpen(false)} disabled={busy}>
              Cancelar
            </button>
            <button type="button" className="ls-btn-primary" onClick={handleReceive} disabled={busy}>
              {busy ? 'Salvando…' : 'Confirmar com assinatura'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#525252]">
            O responsável no CD de destino confere os itens e assina — fecha o ciclo e evita divergências.
          </p>
          <div>
            <label className="ls-label">Responsável pelo recebimento</label>
            <input
              className="ls-input"
              value={receivedByName}
              onChange={(e) => setReceivedByName(e.target.value)}
              placeholder="Nome de quem recebe no galpão"
            />
          </div>
          <SignaturePad
            label="Assinatura de recebimento"
            value={receiveSignature}
            onChange={setReceiveSignature}
          />
          <label className="ls-transfer-modal__confirm">
            <input
              type="checkbox"
              checked={receiveConfirmed}
              onChange={(e) => setReceiveConfirmed(e.target.checked)}
            />
            <span>Confirmo que conferi os itens e quantidades recebidos de {transfer.origin_name}.</span>
          </label>
        </div>
      </Modal>
    </LogstokaDetailPageLayout>
  );
};

export default TransferDetailPage;
