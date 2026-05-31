import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Pencil, ScanLine, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import MovementScanSection from '@/components/movements/MovementScanSection';
import ProductThumb from '@/components/products/ProductThumb';
import Modal from '@/components/ui/Modal';
import { useIntelligentScanState } from '@/hooks/useIntelligentScanState';
import { getDemoStockQty } from '@/lib/logstokaDemoSeed';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { LOGSTOKA_ROUTES } from '@/lib/logstokaRoutes';
import { searchProductsByName, type ProductLookupResult } from '@/lib/productLookup';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import '@/modules/scanner/intelligentScanGlobal.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onFilterProduct?: (query: string) => void;
};

const ProductsScanModal: React.FC<Props> = ({ open, onClose, onFilterProduct }) => {
  const navigate = useNavigate();
  const { companyId } = useLogstokaTenant();
  const demo = isLogstokaDemoCompany(companyId);
  const scan = useIntelligentScanState(companyId, demo, 'entry');
  const [matches, setMatches] = useState<ProductLookupResult[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    if (!open) return;
    scan.clearScan();
    setMatches([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset ao abrir
  }, [open]);

  useEffect(() => {
    const value = scan.scanValue.trim();
    if (!open || !value || scan.interpreting || scan.resolving) {
      if (!value) setMatches([]);
      return;
    }

    let cancelled = false;
    setLoadingMatches(true);

    void searchProductsByName(companyId, value, demo, 12)
      .then((results) => {
        if (cancelled) return;
        const primary = scan.resolvedProduct;
        const merged = primary
          ? [primary, ...results.filter((item) => item.id !== primary.id)]
          : results;
        setMatches(merged);
      })
      .catch((err) => {
        if (!cancelled) {
          setMatches(scan.resolvedProduct ? [scan.resolvedProduct] : []);
          toast.error(err instanceof Error ? err.message : 'Erro ao buscar produtos');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    companyId,
    demo,
    scan.scanValue,
    scan.interpreting,
    scan.resolving,
    scan.resolvedProduct,
  ]);

  const hasResults = matches.length > 0;
  const showNotFound = scan.scanValue.trim() && !scan.interpreting && !scan.resolving && !loadingMatches && !hasResults;

  const closeAll = () => {
    scan.clearScan();
    setMatches([]);
    onClose();
  };

  const filterInList = (product: ProductLookupResult) => {
    const query = product.sku || product.internal_code || product.barcode || scan.scanValue.trim();
    onFilterProduct?.(query);
    closeAll();
    toast.success(`Lista filtrada por ${product.sku}`);
  };

  const openProduct = (product: ProductLookupResult) => {
    closeAll();
    navigate(`/app/products/${product.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={closeAll}
      title="Buscar produto"
      subtitle="Leia QR Code, EAN, SKU ou código interno — resultados aparecem abaixo"
      icon={<ScanLine size={20} strokeWidth={2.2} />}
      size="landscape"
      panelClassName="ls-global-scan-modal ls-products-scan-modal"
    >
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
        onClearScan={() => {
          scan.clearScan();
          setMatches([]);
        }}
        quantity={scan.quantity}
        onQuantityChange={scan.setQuantity}
        resolvedProduct={scan.resolvedProduct}
        resolving={scan.resolving}
        interpreting={scan.interpreting}
        scanInterpretation={scan.scanInterpretation}
        movementLabel="Catálogo"
        embedded
        scanOnly
        suppressPageHeader
        inputId="ls-products-scan-input"
        onRegister={() => undefined}
        onUseExisting={() => undefined}
      />

      {(hasResults || loadingMatches || showNotFound) && (
        <section className="ls-products-scan-results" aria-live="polite">
          <h3 className="ls-products-scan-results__title">
            {loadingMatches ? 'Buscando produtos…' : hasResults ? `${matches.length} produto(s) encontrado(s)` : 'Nenhum produto encontrado'}
          </h3>

          {scan.scanInterpretation?.ai?.summary && hasResults ? (
            <p className="ls-global-scan__ai ls-global-scan__ai--block">
              <Sparkles size={14} aria-hidden />
              {scan.scanInterpretation.ai.summary}
            </p>
          ) : null}

          {showNotFound ? (
            <div className="ls-products-scan-results__empty">
              <p>
                Código lido: <code>{scan.scanValue}</code>
              </p>
              <div className="ls-global-scan__not-found-actions">
                <Link
                  to={`${LOGSTOKA_ROUTES.PRODUCTS}?scan=${encodeURIComponent(scan.scanValue)}`}
                  className="ls-btn-primary"
                  onClick={closeAll}
                >
                  Cadastrar produto
                </Link>
                <button type="button" className="ls-btn-secondary" onClick={() => scan.clearScan()}>
                  Nova leitura
                </button>
              </div>
            </div>
          ) : null}

          {hasResults ? (
            <ul className="ls-products-scan-results__list">
              {matches.map((product) => {
                const stockQty = demo ? getDemoStockQty(product.id) : null;
                return (
                  <li key={product.id} className="ls-products-scan-results__item">
                    <ProductThumb src={product.main_image_url} name={product.name} size={44} />
                    <div className="ls-products-scan-results__meta min-w-0 flex-1">
                      <p className="ls-products-scan-results__name">{product.name}</p>
                      <p className="ls-products-scan-results__codes">
                        <strong>{product.sku}</strong>
                        {product.internal_code ? ` · ${product.internal_code}` : ''}
                        {product.barcode ? ` · EAN ${product.barcode}` : ''}
                      </p>
                      {stockQty != null ? (
                        <p className="ls-products-scan-results__stock">{stockQty.toLocaleString('pt-BR')} un. em estoque</p>
                      ) : null}
                    </div>
                    <div className="ls-products-scan-results__actions">
                      <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => openProduct(product)} title="Ver ficha">
                        <Eye size={14} />
                      </button>
                      <button type="button" className="ls-btn-secondary px-2 py-1 text-xs" onClick={() => openProduct(product)} title="Editar">
                        <Pencil size={14} />
                      </button>
                      {onFilterProduct ? (
                        <button type="button" className="ls-btn-primary px-2 py-1 text-xs" onClick={() => filterInList(product)}>
                          Filtrar
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      )}
    </Modal>
  );
};

export default ProductsScanModal;
