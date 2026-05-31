import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, Package, User } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import LogstokaMoneyValue from '@/components/privacy/LogstokaMoneyValue';
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

  if (!event) return null;

  const preview = resolveActivityEventPreview(event);
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
          Ver ação completa
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
        <dl className="ls-act-preview__grid">
          <div>
            <dt>Data</dt>
            <dd>{preview.dateLabel}</dd>
          </div>
          <div>
            <dt>Hora</dt>
            <dd>{preview.timeLabel}</dd>
          </div>
          <div className="ls-act-preview__span-2">
            <dt>Produto</dt>
            <dd className="ls-act-preview__product">
              <Package size={15} strokeWidth={2.25} aria-hidden />
              {preview.productName}
            </dd>
          </div>
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
                <LogstokaMoneyValue isMoney>{preview.valueLabel}</LogstokaMoneyValue>
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

        <p className="ls-act-preview__actor">
          <User size={14} strokeWidth={2.25} aria-hidden />
          {preview.actorName}
        </p>
      </div>
    </Modal>
  );
};

export default ActivityEventPreviewModal;
