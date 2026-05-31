import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileUp, Printer, RefreshCw, Share2, Sheet, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LogstokaIconTooltip from '@/components/ui/LogstokaIconTooltip';
import { useCategories } from '@/hooks/useCatalog';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import {
  downloadProductImportTemplate,
  downloadProductsExport,
  downloadProductsExportCsv,
  parseProductSpreadsheet,
  type ParsedProductImportRow,
} from '@/lib/productSpreadsheet';
import { printProductsReport } from '@/lib/printProductsReport';
import { supabase } from '@/lib/supabase';
import type { LsProduct } from '@/types';
import ProductsPrintReportModal, { type ProductPrintScope } from '@/components/products/ProductsPrintReportModal';
import ProductsProcessingBanner from '@/components/products/ProductsProcessingBanner';
import ProductsTipNotification from '@/components/products/ProductsTipNotification';

type Props = {
  companyId: string | null;
  categoryName: (id?: string | null) => string;
  onImported: () => void;
  canWrite: boolean;
  productsOnPage: LsProduct[];
  selectedProducts: LsProduct[];
  totalCount: number;
  onDeleteSelected?: () => void;
  onShareSelected?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  leftElement?: React.ReactNode;
};

type ExportFormat = 'xlsx' | 'csv' | 'pdf';
type ProcessingKind = 'template' | 'export' | 'import' | null;

function resolveCategoryId(name: string, categories: Array<{ id: string; name: string }>): string | null {
  if (!name.trim()) return null;
  const hit = categories.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  return hit?.id ?? null;
}

function buildPayload(row: ParsedProductImportRow, companyId: string, categoryId: string | null) {
  return {
    company_id: companyId,
    sku: row.sku,
    barcode: row.barcode || null,
    internal_code: row.internal_code || null,
    name: row.name,
    short_name: row.short_name || null,
    brand: row.brand || null,
    category_id: categoryId,
    ncm: row.ncm || null,
    origin_code: row.origin_code || '0',
    unit: row.unit || 'UN',
    description_short: row.description_short || null,
    description: row.description || null,
    cost: row.cost,
    sale_price: row.sale_price,
    promo_price: row.promo_price,
    min_stock: row.min_stock,
    max_stock: row.max_stock,
    weight_kg: row.weight_kg,
    height_cm: row.height_cm,
    width_cm: row.width_cm,
    length_cm: row.length_cm,
    status: row.status,
    publication_status: row.publication_status,
    updated_at: new Date().toISOString(),
  };
}

const PROCESSING_COPY: Record<Exclude<ProcessingKind, null>, { title: string; message: string }> = {
  template: {
    title: 'Modelo em processamento',
    message: 'Seu modelo Excel está sendo preparado. Por favor, aguarde enquanto o sistema gera o arquivo.',
  },
  export: {
    title: 'Relatório em processamento',
    message:
      'Seu relatório está sendo preparado. Por favor, aguarde enquanto o sistema obtém seus dados. Esse processo pode levar alguns segundos até ser concluído.',
  },
  import: {
    title: 'Importação em processamento',
    message:
      'Sua planilha está sendo validada e importada. Por favor, aguarde enquanto o sistema processa os produtos.',
  },
};

const EXPORT_FORMATS: Array<{ id: ExportFormat; label: string; icon: typeof Sheet }> = [
  { id: 'xlsx', label: 'XLSX', icon: Sheet },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
  { id: 'pdf', label: 'PDF', icon: FileText },
];

const IconAction: React.FC<{
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  accent?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, danger, accent, active, children }) => (
  <LogstokaIconTooltip label={label}>
    <button
      type="button"
      className={`ls-products-icon-action${danger ? ' ls-products-icon-action--danger' : ''}${accent ? ' ls-products-icon-action--accent' : ''}${active ? ' ls-products-icon-action--active' : ''}`}
      disabled={disabled}
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  </LogstokaIconTooltip>
);

const ProductsImportExportBar: React.FC<Props> = ({
  companyId,
  categoryName,
  onImported,
  canWrite,
  productsOnPage,
  selectedProducts,
  totalCount,
  onDeleteSelected,
  onShareSelected,
  onRefresh,
  loading = false,
  leftElement,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [importing, setImporting] = useState(false);
  const [processing, setProcessing] = useState<ProcessingKind>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const { categories } = useCategories();

  useEffect(() => {
    if (!exportOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [exportOpen]);

  const finishProcessing = () => {
    window.setTimeout(() => setProcessing(null), 1200);
  };

  const handleExportTemplate = () => {
    setProcessing('template');
    downloadProductImportTemplate();
    toast.success('Modelo Excel baixado — preencha a aba Produtos');
    finishProcessing();
  };

  const fetchProducts = async (): Promise<LsProduct[] | null> => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return null;
    }

    if (isLogstokaDemoCompany(companyId)) {
      return DEMO_PRODUCTS;
    }

    const { data, error } = await supabase.from('ls_products').select('*').eq('company_id', companyId).order('sku');
    if (error) {
      toast.error(error.message);
      return null;
    }
    if (!data?.length) {
      toast.error('Nenhum produto para exportar');
      return null;
    }
    return data as LsProduct[];
  };

  const resolvePrintProducts = async (scope: ProductPrintScope): Promise<LsProduct[]> => {
    if (scope === 'selected') return selectedProducts;
    if (scope === 'page') return productsOnPage;
    const all = await fetchProducts();
    return all ?? [];
  };

  const handlePrintConfirm = async ({ withImage, scope }: { withImage: boolean; scope: ProductPrintScope }) => {
    setPrintLoading(true);
    try {
      const list = await resolvePrintProducts(scope);
      if (!list.length) {
        toast.error('Nenhum produto para imprimir');
        return;
      }
      printProductsReport(list, { withImage, categoryName });
      setPrintOpen(false);
      toast.success(`Impressão aberta — ${list.length} produto(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao imprimir');
    } finally {
      setPrintLoading(false);
    }
  };

  const handleExportProducts = async (format: ExportFormat) => {
    setExportOpen(false);
    if (format === 'pdf') {
      toast('Exportação PDF em breve — use XLSX ou CSV por enquanto');
      return;
    }

    setProcessing('export');
    try {
      const products = await fetchProducts();
      if (!products?.length) return;

      if (format === 'csv') {
        downloadProductsExportCsv(products, categoryName);
      } else {
        downloadProductsExport(products, categoryName);
      }
      toast.success(`${products.length} produto(s) exportado(s)`);
    } finally {
      finishProcessing();
    }
  };

  const handleImport = async (file: File) => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    setProcessing('import');
    setImporting(true);
    try {
      const { rows, errors } = await parseProductSpreadsheet(file);
      if (errors.length > 0) {
        toast.error(errors.slice(0, 2).join(' · '));
        if (rows.length === 0) return;
      }

      if (isLogstokaDemoCompany(companyId)) {
        toast.success(`[Demo] ${rows.length} produto(s) validado(s) — planilha reconhecida`);
        onImported();
        return;
      }

      const { data: existing } = await supabase.from('ls_products').select('id, sku').eq('company_id', companyId);
      const bySku = new Map((existing ?? []).map((p) => [p.sku, p.id]));

      let created = 0;
      let updated = 0;
      const importErrors: string[] = [];

      for (const row of rows) {
        const categoryId = resolveCategoryId(row.category, categories);
        if (row.category && !categoryId) {
          importErrors.push(`Linha ${row.rowNumber}: categoria "${row.category}" não encontrada`);
        }

        const payload = buildPayload(row, companyId, categoryId);
        const existingId = bySku.get(row.sku);

        if (existingId) {
          const { error } = await supabase.from('ls_products').update(payload).eq('id', existingId);
          if (error) importErrors.push(`Linha ${row.rowNumber}: ${error.message}`);
          else updated += 1;
        } else {
          const { error } = await supabase.from('ls_products').insert({
            ...payload,
            main_image_url: null,
            publication_status: row.publication_status,
          });
          if (error) importErrors.push(`Linha ${row.rowNumber}: ${error.message}`);
          else created += 1;
        }
      }

      if (importErrors.length > 0) {
        toast.error(importErrors.slice(0, 2).join(' · '));
      }

      toast.success(`Importação concluída — ${created} criado(s), ${updated} atualizado(s)`);
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao importar planilha');
    } finally {
      setImporting(false);
      finishProcessing();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ls-products-import-export w-full" ref={barRef}>
      <ProductsTipNotification
        onLearnMore={() => {
          barRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          toast('Baixe o modelo Excel, preencha e use o ícone Importar');
        }}
      />

      {processing ? (
        <ProductsProcessingBanner
          title={PROCESSING_COPY[processing].title}
          message={PROCESSING_COPY[processing].message}
          onClose={() => setProcessing(null)}
        />
      ) : null}

      <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 mt-4">
        {leftElement ? (
          <div className="flex-1 w-full max-w-2xl">
            {leftElement}
          </div>
        ) : null}
        <div className="shrink-0 ml-auto">
          <div className="ls-products-toolbar">
            <div className="ls-products-icon-toolbar" aria-label="Ações do catálogo">
              <IconAction label="Atualizar catálogo" onClick={onRefresh} disabled={loading || !onRefresh}>
                <RefreshCw size={18} strokeWidth={2} className={loading ? 'animate-spin' : undefined} />
              </IconAction>

              <span className="ls-products-icon-toolbar__sep" aria-hidden />

              <IconAction label="Excluir selecionados" disabled={selectedProducts.length === 0 || !canWrite} danger onClick={onDeleteSelected}>
                <Trash2 size={18} strokeWidth={2} />
              </IconAction>
              <IconAction label="Compartilhar selecionados" disabled={selectedProducts.length === 0} onClick={onShareSelected}>
                <Share2 size={18} strokeWidth={2} />
              </IconAction>
              <IconAction label="Imprimir relatório" onClick={() => setPrintOpen(true)}>
                <Printer size={18} strokeWidth={2} />
              </IconAction>

              <span className="ls-products-icon-toolbar__sep" aria-hidden />

              <IconAction label="Baixar modelo Excel" disabled={!canWrite} onClick={handleExportTemplate}>
                <Download size={18} strokeWidth={2} />
              </IconAction>

              <div className="ls-products-icon-toolbar__wrap">
                <IconAction label="Exportar produtos" active={exportOpen} onClick={() => setExportOpen((open) => !open)}>
                  <Upload size={18} strokeWidth={2} />
                </IconAction>
                {exportOpen ? (
                  <div className="ls-products-export-popover ls-products-export-popover--icons" role="menu" aria-label="Formato de exportação">
                    {EXPORT_FORMATS.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        role="menuitem"
                        className="ls-products-export-popover__item"
                        onClick={() => void handleExportProducts(id)}
                      >
                        <span>{label}</span>
                        <Icon size={18} strokeWidth={2} aria-hidden />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <IconAction
                label={importing ? 'Importando planilha…' : 'Importar planilha'}
                disabled={importing || !canWrite}
                accent
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={18} strokeWidth={2} />
              </IconAction>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.txt"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
        }}
      />

      <ProductsPrintReportModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        selectedCount={selectedProducts.length}
        pageCount={productsOnPage.length}
        totalCount={totalCount}
        loading={printLoading}
        onConfirm={(opts) => void handlePrintConfirm(opts)}
      />
    </div>
  );
};

export default ProductsImportExportBar;
