import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Printer, RefreshCw, ScanSearch, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaShareModal from '@/components/sharing/LogstokaShareModal';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import LogstokaTableIconToolbar, { type LogstokaToolbarAction } from '@/components/ui/LogstokaTableIconToolbar';
import { useTablePagination } from '@/hooks/useTablePagination';
import { getWarehouseProductLines } from '@/lib/productStockByCd';
import {
  buildWarehouseXraySnapshot,
  downloadWarehouseXrayPdf,
  exportWarehouseXrayCsv,
  printWarehouseXrayList,
  productLineCode,
} from '@/lib/warehouseXrayUtils';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import type { LsWarehouse } from '@/types';
import '@/components/products/productStockByCd.css';

type Props = {
  warehouse: LsWarehouse;
};

const WarehouseProductsXRayPanel: React.FC<Props> = ({ warehouse }) => {
  const { companyId } = useLogstokaTenant();
  const [shareOpen, setShareOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const lines = useMemo(
    () => {
      void refreshTick;
      return getWarehouseProductLines(warehouse.id, companyId);
    },
    [warehouse.id, companyId, refreshTick],
  );

  const { paginatedItems, footerProps } = useTablePagination(lines, 10);
  const slug = warehouse.name.replace(/\s+/g, '-').toLowerCase();

  const tableToolbarActions: LogstokaToolbarAction[] = [
    {
      key: 'refresh',
      label: 'Atualizar lista',
      icon: <RefreshCw size={18} strokeWidth={2} />,
      onClick: () => {
        setRefreshTick((v) => v + 1);
        toast.success('Lista atualizada');
      },
    },
    {
      key: 'print',
      label: 'Imprimir raio-X',
      icon: <Printer size={18} strokeWidth={2} />,
      onClick: () => {
        printWarehouseXrayList(warehouse, lines);
      },
      separatorBefore: true,
      disabled: lines.length === 0,
    },
    {
      key: 'csv',
      label: 'Exportar CSV',
      icon: <Download size={18} strokeWidth={2} />,
      onClick: () => {
        exportWarehouseXrayCsv(warehouse, lines, `raio-x-${slug}.csv`);
        toast.success(`CSV exportado · ${lines.length} produto(s)`);
      },
      disabled: lines.length === 0,
    },
    {
      key: 'pdf',
      label: 'Baixar PDF',
      icon: <FileText size={18} strokeWidth={2} />,
      onClick: () => {
        downloadWarehouseXrayPdf(warehouse, lines);
        toast('Use “Salvar como PDF” na janela de impressão', { icon: '📄' });
      },
      disabled: lines.length === 0,
    },
    {
      key: 'share',
      label: 'Compartilhar raio-X',
      icon: <Share2 size={18} strokeWidth={2} />,
      onClick: () => setShareOpen(true),
      disabled: lines.length === 0,
    },
  ];

  return (
    <>
      <section className="ls-card ls-warehouse-xray">
        <div className="ls-warehouse-xray__head">
          <div>
            <div className="flex items-center gap-2">
              <ScanSearch size={18} className="text-orange-600" aria-hidden />
              <h2 className="text-base font-black text-[#383838]">Raio-X · Produtos neste CD</h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#737373]">
              Conferência remota do estoque em <strong>{warehouse.name}</strong> — admin vê da sede; operador
              local continua movimentando só este galpão.
            </p>
          </div>
          <div className="ls-warehouse-xray__head-actions">
            <span className="text-xs font-bold text-[#737373]">{lines.length} produto(s) com saldo</span>
            <LogstokaTableIconToolbar actions={tableToolbarActions} ariaLabel="Ações do raio-X de produtos" />
          </div>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm font-semibold text-[#a3a3a3]">
            Nenhum produto com saldo neste CD ainda. Movimentações e entradas aparecerão aqui.
          </p>
        ) : (
          <>
            <div className="ls-table-wrap">
              <table className="ls-table ls-warehouse-xray__table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Qtd</th>
                    <th>Disp.</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((line) => (
                    <tr key={line.product_id}>
                      <td className="font-bold text-[#404040]">{line.name}</td>
                      <td>
                        <span className="ls-warehouse-xray__sku">{productLineCode(line)}</span>
                      </td>
                      <td className="font-black">{line.quantity.toLocaleString('pt-BR')}</td>
                      <td className="font-bold text-[#525252]">{line.available.toLocaleString('pt-BR')}</td>
                      <td>
                        <Link
                          to={`/app/products/${line.product_id}`}
                          className="text-[10px] font-black text-orange-700"
                        >
                          Ver produto →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <LogstokaTableFooter {...footerProps} itemLabel="produtos" />
          </>
        )}
      </section>

      <LogstokaShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        resourceType="general_table"
        resourceId={`warehouse-xray-${warehouse.id}`}
        resourceName={`Raio-X · ${warehouse.name}`}
        snapshotData={buildWarehouseXraySnapshot(warehouse, lines)}
      />
    </>
  );
};

export default WarehouseProductsXRayPanel;
