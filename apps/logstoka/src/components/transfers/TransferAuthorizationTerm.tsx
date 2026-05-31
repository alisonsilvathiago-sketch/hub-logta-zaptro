import React from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { formatInternalSku } from '@/lib/formatInternalSku';
import type { ProductLookupResult } from '@/lib/productLookup';
import type { LsWarehouse } from '@/types';

type Props = {
  originWh?: LsWarehouse;
  destWh?: LsWarehouse;
  product: ProductLookupResult | null;
  productCode?: string;
  quantity: number;
  releasedByName: string;
  driverName: string;
  driverCpf?: string;
  companyName?: string;
  companyCnpj?: string;
  driverPlate: string;
  signatureDataUrl?: string;
  signedAt?: string | null;
};

function formatSignedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

const TransferAuthorizationTerm: React.FC<Props> = ({
  originWh,
  destWh,
  product,
  productCode,
  quantity,
  releasedByName,
  driverName,
  driverCpf = '',
  companyName = '',
  companyCnpj = '',
  driverPlate,
  signatureDataUrl,
  signedAt,
}) => {
  const code =
    productCode ||
    product?.internal_code ||
    (product ? formatInternalSku(Number.parseInt(product.id.replace(/\D/g, ''), 10) || 1) : '—');

  const originLabel = originWh?.name ?? 'CD de origem';
  const destLabel = destWh?.name ?? 'CD de destino';
  const signedLabel = formatSignedAt(signedAt);

  return (
    <article className="ls-transfer-auth-term">
      <header className="ls-transfer-auth-term__head">
        <FileText size={16} aria-hidden />
        <div>
          <h3 className="ls-transfer-auth-term__title">Termo de autorização de transferência</h3>
          <p className="ls-transfer-auth-term__ref">Documento comprobatório · LogStoka WMS</p>
        </div>
      </header>

      <div className="ls-transfer-auth-term__body">
        <p>
          Eu, <strong>{releasedByName.trim() || '________________'}</strong>, responsável pela liberação no{' '}
          <strong>{originLabel}</strong>, autorizo a saída e transferência dos itens abaixo para o{' '}
          <strong>{destLabel}</strong>, sob minha responsabilidade e ciência dos quantitativos conferidos.
        </p>

        <dl className="ls-transfer-auth-term__facts">
          <div>
            <dt>Produto</dt>
            <dd>{product?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Código LS</dt>
            <dd>{code}</dd>
          </div>
          <div>
            <dt>Quantidade</dt>
            <dd>{quantity.toLocaleString('pt-BR')} un.</dd>
          </div>
          <div>
            <dt>Rota</dt>
            <dd>
              {originLabel} → {destLabel}
            </dd>
          </div>
          <div>
            <dt>Motorista / entrega</dt>
            <dd>{driverName.trim() || '—'}</dd>
          </div>
          <div>
            <dt>CPF</dt>
            <dd>{driverCpf.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Empresa</dt>
            <dd>{companyName.trim() || '—'}</dd>
          </div>
          <div>
            <dt>CNPJ</dt>
            <dd>{companyCnpj.trim() || '—'}</dd>
          </div>
          <div>
            <dt>Placa</dt>
            <dd>{driverPlate.trim() || '—'}</dd>
          </div>
          <div className="ls-transfer-auth-term__facts-wide">
            <dt>Data e hora da assinatura</dt>
            <dd>{signedAt ? signedLabel : 'Preencha e assine abaixo'}</dd>
          </div>
        </dl>

        <p className="ls-transfer-auth-term__legal">
          Declaro ter conferido fisicamente os produtos e quantidades descritos. A assinatura digital abaixo
          equivale à minha anuência para fins de auditoria, rastreio e prevenção de divergências entre CDs.
        </p>
      </div>

      {signatureDataUrl ? (
        <p className="ls-transfer-auth-term__saved">
          <CheckCircle2 size={14} aria-hidden />
          Assinatura capturada e salva · {signedLabel}
        </p>
      ) : null}
    </article>
  );
};

export default TransferAuthorizationTerm;
