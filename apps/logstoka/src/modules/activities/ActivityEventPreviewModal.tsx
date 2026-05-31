import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ClipboardCheck, Package, Store, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import LogstokaMoneyValue from '@/components/privacy/LogstokaMoneyValue';
import LogstokaMoneyPrivacyToggle from '@/components/privacy/LogstokaMoneyPrivacyToggle';
import '@/components/privacy/moneyPrivacy.css';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { resolveActivityEventPreview } from '@/lib/activityEventPreview';
import type { OperationalActivityEvent } from '@/lib/operationalActivityLog';

type Props = {
  event: OperationalActivityEvent | null;
  onClose: () => void;
};

function resultClass(result: OperationalActivityEvent['result']): string {
  if (result === 'success') return 'ls-act-preview__status ls-act-preview__status--ok';
  if (result === 'warning') return 'ls-act-preview__status ls-act-preview__status--warn';
  if (result === 'error') return 'ls-act-preview__status ls-act-preview__status--err';
  return 'ls-act-preview__status';
}

const ActivityEventPreviewModal: React.FC<Props> = ({ event, onClose }) => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();

  if (!event) return null;

  const preview = resolveActivityEventPreview(event, companyId);
  const canOpenDetail = Boolean(preview.href);

  const footer = (
    <>
      <button type="button" className="ls-btn-secondary" onClick={onClose}>
        Fechar
      </button>
      {canOpenDetail ? (
        <button
          type="button"
          className="ls-btn-primary inline-flex items-center gap-2"
          onClick={() => {
            onClose();
            navigate(preview.href!);
          }}
        >
          {preview.showResponsible ? 'Ver histórico completo' : 'Ver ação completa'}
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </>
  );

  return (
    <Modal
      open
      title={preview.actionLabel}
      subtitle={`${preview.domainLabel} · ${preview.reference}`}
      icon={<CalendarClock size={20} strokeWidth={2.25} aria-hidden />}
      onClose={onClose}
      paddingVariant="balanced"
      footer={footer}
      panelClassName="ls-act-preview-modal"
    >
      <div className="ls-act-preview">
        {preview.showResponsible ? (
          <div className="ls-act-preview__responsible-card">
            <ClipboardCheck size={18} strokeWidth={2.25} aria-hidden />
            <div>
              <p className="ls-act-preview__responsible-label">{preview.responsibleLabel}</p>
              <p className="ls-act-preview__responsible-name">{preview.responsibleName}</p>
              {preview.responsibleHint ? (
                <p className="ls-act-preview__responsible-hint">{preview.responsibleHint}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <dl className="ls-act-preview__grid">
          <div>
            <dt>Data</dt>
            <dd>{preview.dateLabel}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{preview.timeLabel}</dd>
          </div>
          {!preview.showResponsible ? (
            <div className="ls-act-preview__span-2">
              <dt>Operador</dt>
              <dd className="ls-act-preview__product">
                <User size={15} strokeWidth={2.25} aria-hidden />
                {preview.responsibleName}
              </dd>
            </div>
          ) : null}
          <div className="ls-act-preview__span-2">
            <dt>Produto</dt>
            <dd className="ls-act-preview__product">
              <Package size={15} strokeWidth={2.25} aria-hidden />
              {preview.productName}
            </dd>
          </div>
          {preview.storeOrChannel ? (
            <div className="ls-act-preview__span-2">
              <dt>Loja / canal</dt>
              <dd className="ls-act-preview__product">
                <Store size={15} strokeWidth={2.25} aria-hidden />
                {preview.storeOrChannel}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Quantidade</dt>
            <dd>{preview.quantityLabel}</dd>
          </div>
          <div>
            <dt>Valor estimado</dt>
            <dd>
              {preview.valueLabel === '—' ? (
                '—'
              ) : (
                <span className="ls-money-value-row">
                  <LogstokaMoneyPrivacyToggle size="sm" />
                  <LogstokaMoneyValue isMoney>{preview.valueLabel}</LogstokaMoneyValue>
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={resultClass(event.result)}>{preview.status}</span>
            </dd>
          </div>
          <div>
            <dt>Referência</dt>
            <dd>{preview.reference}</dd>
          </div>
        </dl>

        <p className="ls-act-preview__desc">{preview.description}</p>
      </div>
    </Modal>
  );
};

export default ActivityEventPreviewModal;
