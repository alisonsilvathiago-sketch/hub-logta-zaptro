import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementScanSection from '@/components/movements/MovementScanSection';
import { LogstokaKpiStrip } from '@/components/layout/LogstokaStandardPageLayout';
import ClickableTableRow from '@/components/ui/ClickableTableRow';
import LogstokaTableFooter from '@/components/ui/LogstokaTableFooter';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { useTablePagination } from '@/hooks/useTablePagination';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PICKING, pickingDetailKey } from '@/lib/logstokaDemoSeed';
import type { ProductLookupResult } from '@/lib/productLookup';
import { MARKETPLACE_LABELS } from '@/types';
import { supabase } from '@/lib/supabase';

interface PickRow {
  sku: string;
  name: string;
  marketplace?: string | null;
  store?: string | null;
  quantity: number;
}

const PickingPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const [rows, setRows] = useState<PickRow[]>([]);
  const [registering, setRegistering] = useState(false);

  const scan = useIntelligentScanState(companyId, demo, 'exit');

  useEffect(() => {
    if (!companyId) return;
    if (demo) {
      setRows(DEMO_PICKING);
      return;
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    void supabase
      .from('ls_stock_movements')
      .select('marketplace, reference_code, ls_stock_movement_items(sku, quantity, ls_products(name))')
      .eq('company_id', companyId)
      .eq('movement_type', 'exit')
      .gte('created_at', start.toISOString())
      .then((res) => {
        const map = new Map<string, PickRow>();
        for (const mov of res.data ?? []) {
          const movement = mov as unknown as {
            marketplace?: string | null;
            reference_code?: string | null;
            ls_stock_movement_items?: Array<{ sku: string; quantity: number; ls_products?: { name?: string } | null }>;
          };
          for (const item of movement.ls_stock_movement_items ?? []) {
            const key = `${item.sku}-${movement.marketplace}-${movement.reference_code}`;
            const existing = map.get(key);
            if (existing) existing.quantity += Number(item.quantity);
            else {
              map.set(key, {
                sku: item.sku,
                name: item.ls_products?.name ?? item.sku,
                marketplace: movement.marketplace,
                store: movement.reference_code,
                quantity: Number(item.quantity),
              });
            }
          }
        }
        setRows([...map.values()].sort((a, b) => b.quantity - a.quantity));
      });
  }, [companyId, demo]);

  const { paginatedItems, footerProps } = useTablePagination(rows);

  const totals = useMemo(
    () => ({
      skus: rows.length,
      units: rows.reduce((sum, row) => sum + row.quantity, 0),
      channels: new Set(rows.map((row) => row.marketplace).filter(Boolean)).size,
    }),
    [rows],
  );

  const confirmPicking = () => {
    const sku = scan.resolvedSku();
    if (!sku) {
      toast.error('Leia ou digite um código primeiro');
      return;
    }
    setRegistering(true);
    try {
      toast.success(`[${demo ? 'Demo' : 'OK'}] Separação confirmada: ${sku} × ${scan.quantity}`);
      scan.clearScan();
    } finally {
      setRegistering(false);
    }
  };

  const handleUseExisting = (_product: ProductLookupResult) => {
    confirmPicking();
  };

  return (
    <div className="space-y-6">
      <MovementScanSection
        companyId={companyId}
        demo={demo}
        scanMode={scan.scanMode}
        onScanModeChange={scan.setScanMode}
        scanValue={scan.scanValue}
        onScanValueChange={(value) => {
          scan.setScanValue(value);
          toast.success(`Código lido: ${value}`);
        }}
        onClearScan={scan.clearScan}
        quantity={scan.quantity}
        onQuantityChange={scan.setQuantity}
        resolvedProduct={scan.resolvedProduct}
        resolving={scan.resolving}
        interpreting={scan.interpreting}
        scanInterpretation={scan.scanInterpretation}
        movementLabel="Separação de Pedidos"
        pageTitleIcon={<ClipboardList size={20} strokeWidth={2.25} aria-hidden />}
        onRegister={confirmPicking}
        onUseExisting={handleUseExisting}
        registering={registering}
      />

      <LogstokaKpiStrip
        items={[
          { label: 'SKUs hoje', value: totals.skus },
          { label: 'Un. a separar', value: totals.units.toLocaleString('pt-BR') },
          { label: 'Canais', value: totals.channels },
          { label: 'Lista', value: rows.length ? 'Ativa' : 'Vazia' },
        ]}
      />

      <section className="ls-page-table">
        <div className="ls-table-wrap">
          <table className="ls-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Produto</th>
                <th>Marketplace</th>
                <th>Loja</th>
                <th>Qtd. a separar</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((r) => (
                <ClickableTableRow key={`${r.sku}-${r.marketplace}-${r.store}`} to={`/app/picking/${pickingDetailKey(r)}`}>
                  <td className="font-bold">{r.sku}</td>
                  <td>{r.name}</td>
                  <td>{r.marketplace ? MARKETPLACE_LABELS[r.marketplace as keyof typeof MARKETPLACE_LABELS] : '—'}</td>
                  <td>{r.store || '—'}</td>
                  <td className="font-black text-orange-700">{r.quantity}</td>
                </ClickableTableRow>
              ))}
            </tbody>
          </table>
        </div>
        <LogstokaTableFooter {...footerProps} />
      </section>
    </div>
  );
};

export default PickingPage;
