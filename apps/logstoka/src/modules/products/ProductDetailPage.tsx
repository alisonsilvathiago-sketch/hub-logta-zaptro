import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logstokaApi } from '@/lib/logstokaApi';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import type { LsProduct, LsStockMovement } from '@/types';
import { MARKETPLACE_LABELS } from '@/types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { companyId } = useLogstokaTenant();
  const [product, setProduct] = useState<LsProduct | null>(null);
  const [timeline, setTimeline] = useState<LsStockMovement[]>([]);

  useEffect(() => {
    if (!id || !companyId) return;
    void supabase
      .from('ls_products')
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single()
      .then(({ data }) => setProduct(data as LsProduct));

    void logstokaApi
      .getProductTimeline(id)
      .then((res) => setTimeline((res.data ?? []) as LsStockMovement[]))
      .catch(() => setTimeline([]));
  }, [id, companyId]);

  if (!product) {
    return <p className="text-slate-500">Carregando produto…</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/app/products" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <div className="ls-card flex flex-wrap gap-6">
        {product.main_image_url && (
          <img src={product.main_image_url} alt="" className="h-32 w-32 rounded-2xl object-cover" />
        )}
        <div>
          <h2 className="text-2xl font-black">{product.name}</h2>
          <p className="text-sm text-slate-500">SKU {product.sku} · {product.brand || 'Sem marca'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="ls-badge bg-slate-100">Custo R$ {product.cost}</span>
            <span className="ls-badge bg-slate-100">Venda R$ {product.sale_price}</span>
            <span className="ls-badge bg-amber-50 text-amber-700">Mín. {product.min_stock}</span>
          </div>
        </div>
      </div>

      <div className="ls-card">
        <h3 className="mb-4 text-lg font-black">Linha do tempo</h3>
        <div className="space-y-3">
          {timeline.length === 0 && <p className="text-sm text-slate-500">Sem movimentações registradas.</p>}
          {timeline.map((m) => (
            <div key={m.id} className="flex items-start justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div>
                <p className="font-bold capitalize text-slate-800">{m.movement_type.replace('_', ' ')} · {m.sub_type}</p>
                <p className="text-xs text-slate-500">
                  {m.marketplace ? MARKETPLACE_LABELS[m.marketplace as keyof typeof MARKETPLACE_LABELS] : '—'}
                  {m.reference_code ? ` · Ref ${m.reference_code}` : ''}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold">{m.total_quantity} un.</p>
                <p className="text-xs text-slate-500">{new Date(m.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
