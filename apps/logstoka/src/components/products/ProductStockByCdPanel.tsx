import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, UserRound } from 'lucide-react';
import {
  formatProductCdManagers,
  formatProductCdStockSummary,
  getProductStockTotalByCd,
  productCdLocationLabel,
  type ProductCdStockLine,
} from '@/lib/productStockByCd';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { isAccountOwner } from '@/lib/permissions';
import { useAuth } from '@/context/LogstokaAuthProvider';
import './productStockByCd.css';

type PanelProps = {
  productSku: string;
  lines: ProductCdStockLine[];
  showTotal?: boolean;
};

export const ProductStockByCdPanel: React.FC<PanelProps> = ({ productSku, lines, showTotal = true }) => {
  const { profile } = useAuth();
  const owner = isAccountOwner(profile);
  const total = getProductStockTotalByCd(lines);

  return (
    <section className="ls-product-cd-stock" aria-labelledby="product-cd-stock-title">
      <div className="ls-product-cd-stock__head">
        <div>
          <h3 id="product-cd-stock-title" className="ls-product-cd-stock__title">
            Estoque por CD
          </h3>
          <p className="ls-product-cd-stock__subtitle">
            Produto único <strong>{productSku}</strong> — saldo fracionado por galpão.{' '}
            {owner
              ? 'Visão consolidada de todos os CDs.'
              : 'Visão do seu CD autorizado — outras regiões não aparecem.'}
          </p>
        </div>
        {showTotal ? (
          <div className="ls-product-cd-stock__total">
            <span>{total.toLocaleString('pt-BR')}</span>
            <small>total empresa</small>
          </div>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <p className="ls-product-cd-stock__empty">
          Nenhum saldo neste CD — estoque aparece aqui quando houver movimentação nesta região.
        </p>
      ) : (
        <div className="ls-table-wrap">
          <table className="ls-table ls-product-cd-stock__table">
            <thead>
              <tr>
                <th>CD / Região</th>
                <th className="ls-hide-mobile">Endereço</th>
                <th>Responsável</th>
                <th>Qtd</th>
                <th className="ls-hide-mobile">Disp.</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.warehouse_id}>
                  <td>
                    <p className="ls-product-cd-stock__wh-name">{line.warehouse_name}</p>
                    <p className="ls-product-cd-stock__wh-code">{line.warehouse_code}</p>
                  </td>
                  <td className="ls-hide-mobile text-xs font-semibold text-[#737373]">
                    <MapPin size={12} className="mr-1 inline" aria-hidden />
                    {productCdLocationLabel(line)}
                  </td>
                  <td>
                    <p className="text-xs font-bold text-[#404040]">
                      <UserRound size={12} className="mr-1 inline" aria-hidden />
                      {line.manager_name ?? '—'}
                    </p>
                    {line.manager_role ? (
                      <p className="text-[10px] font-semibold text-[#a3a3a3]">{line.manager_role}</p>
                    ) : null}
                  </td>
                  <td className="font-black text-[#383838]">{line.quantity.toLocaleString('pt-BR')}</td>
                  <td className="ls-hide-mobile font-bold text-[#525252]">
                    {line.available.toLocaleString('pt-BR')}
                  </td>
                  <td>
                    <Link
                      to={LOGSTOKA_ROUTES.warehouseDetail(line.warehouse_id)}
                      className="text-[10px] font-black text-orange-700"
                    >
                      Raio-X CD →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

type CellProps = {
  lines: ProductCdStockLine[];
};

export const ProductCdStockCell: React.FC<CellProps> = ({ lines }) => {
  if (lines.length === 0) {
    return <span className="ls-product-cd-cell ls-product-cd-cell--empty">Sem estoque</span>;
  }

  return (
    <div className="ls-product-cd-cell">
      <p className="ls-product-cd-cell__summary">{formatProductCdStockSummary(lines)}</p>
      <p className="ls-product-cd-cell__manager">{formatProductCdManagers(lines)}</p>
    </div>
  );
};

export default ProductStockByCdPanel;
