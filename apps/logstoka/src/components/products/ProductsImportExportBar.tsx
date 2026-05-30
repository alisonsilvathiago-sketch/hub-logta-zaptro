import React, { useRef, useState } from 'react';
import { Download, FileUp, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCategories } from '@/hooks/useCatalog';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_PRODUCTS } from '@/lib/logstokaDemoSeed';
import {
  downloadProductImportTemplate,
  downloadProductsExport,
  parseProductSpreadsheet,
  type ParsedProductImportRow,
} from '@/lib/productSpreadsheet';
import { supabase } from '@/lib/supabase';
import type { LsProduct } from '@/types';

type Props = {
  companyId: string | null;
  categoryName: (id?: string | null) => string;
  onImported: () => void;
  canWrite: boolean;
};

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

const ProductsImportExportBar: React.FC<Props> = ({ companyId, categoryName, onImported, canWrite }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const { categories } = useCategories();

  const handleExportTemplate = () => {
    downloadProductImportTemplate();
    toast.success('Modelo Excel baixado — preencha a aba Produtos');
  };

  const handleExportProducts = async () => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return;
    }

    if (isLogstokaDemoCompany(companyId)) {
      downloadProductsExport(DEMO_PRODUCTS, categoryName);
      toast.success(`${DEMO_PRODUCTS.length} produto(s) exportado(s)`);
      return;
    }

    const { data, error } = await supabase.from('ls_products').select('*').eq('company_id', companyId).order('sku');
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data?.length) {
      toast.error('Nenhum produto para exportar');
      return;
    }
    downloadProductsExport(data as LsProduct[], categoryName);
    toast.success(`${data.length} produto(s) exportado(s)`);
  };

  const handleImport = async (file: File) => {
    if (!companyId) {
      toast.error('Empresa não selecionada');
      return;
    }

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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canWrite ? (
        <>
          <button type="button" className="ls-btn-secondary" onClick={handleExportTemplate} title="Baixar modelo Excel">
            <Download size={16} />
            Modelo Excel
          </button>
          <button
            type="button"
            className="ls-btn-secondary"
            onClick={() => void handleExportProducts()}
            title="Exportar produtos atuais"
          >
            <Upload size={16} />
            Exportar
          </button>
          <button
            type="button"
            className="ls-btn-primary"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            title="Importar planilha preenchida"
          >
            <FileUp size={16} />
            {importing ? 'Importando…' : 'Importar'}
          </button>
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
        </>
      ) : null}
    </div>
  );
};

export default ProductsImportExportBar;
