import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { processIntelligentScan, type IntelligentScanResult } from '@/lib/intelligentScanClient';
import type { ProductLookupResult, ProductScanMode } from '@/lib/productLookup';

export type IntelligentScanContext = 'entry' | 'exit' | 'transfer' | 'damage' | 'return';

export function useIntelligentScanState(
  companyId: string | null,
  demo: boolean,
  context: IntelligentScanContext = 'entry',
) {
  const [scanMode, setScanMode] = useState<ProductScanMode>('universal');
  const [scanValue, setScanValue] = useState('');
  const [scanInterpretation, setScanInterpretation] = useState<IntelligentScanResult | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [resolvedProduct, setResolvedProduct] = useState<ProductLookupResult | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!scanValue.trim()) {
      setResolvedProduct(null);
      setScanInterpretation(null);
      return;
    }

    let cancelled = false;
    setInterpreting(true);
    setResolving(true);
    void processIntelligentScan(companyId, scanValue, demo, context)
      .then((result) => {
        if (cancelled) return;
        setScanInterpretation(result);
        setResolvedProduct(result.catalogMatch);
      })
      .catch((err) => {
        if (!cancelled) {
          setScanInterpretation(null);
          setResolvedProduct(null);
          toast.error(err instanceof Error ? err.message : 'Erro ao interpretar leitura');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setInterpreting(false);
          setResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, demo, scanValue, context]);

  const clearScan = () => {
    setScanValue('');
    setResolvedProduct(null);
    setScanInterpretation(null);
  };

  const resolvedSku = () => resolvedProduct?.sku ?? scanValue.trim();

  return {
    scanMode,
    setScanMode,
    scanValue,
    setScanValue,
    scanInterpretation,
    interpreting,
    quantity,
    setQuantity,
    resolvedProduct,
    resolving,
    clearScan,
    resolvedSku,
  };
}
