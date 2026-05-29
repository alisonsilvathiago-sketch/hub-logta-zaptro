import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Eye, Plus, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProducts } from '@/hooks/useLogstokaData';
import { useCategories } from '@/hooks/useCatalog';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/storage';
import { can } from '@/lib/permissions';
import { useAuth } from '@shared/context/AuthContext';
import Modal from '@/components/ui/Modal';
import type { LsProduct } from '@/types';

const emptyForm = {
  sku: '',
  internal_code: '',
  barcode: '',
  name: '',
  description: '',
  category_id: '',
  brand: '',
  unit: 'UN',
  cost: '0',
  sale_price: '0',
  min_stock: '0',
  max_stock: '',
  status: 'active' as const,
};

const ProductsPage: React.FC = () => {
  const { profile } = useAuth();
  const { companyId } = useLogstokaTenant();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { products, total, loading, limit, reload } = useProducts(page, search);
  const { categories } = useCategories();
  const canWrite = can('products.write', profile?.role);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LsProduct | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (p: LsProduct) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      internal_code: p.internal_code ?? '',
      barcode: p.barcode ?? '',
      name: p.name,
      description: p.description ?? '',
      category_id: p.category_id ?? '',
      brand: p.brand ?? '',
      unit: p.unit,
      cost: String(p.cost),
      sale_price: String(p.sale_price),
      min_stock: String(p.min_stock),
      max_stock: p.max_stock != null ? String(p.max_stock) : '',
      status: p.status,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!companyId || !form.sku || !form.name) {
      toast.error('SKU e nome são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      let main_image_url = editing?.main_image_url ?? null;
      if (imageFile) main_image_url = await uploadProductImage(companyId, imageFile);

      const payload = {
        company_id: companyId,
        sku: form.sku.trim(),
        internal_code: form.internal_code || null,
        barcode: form.barcode || null,
        name: form.name.trim(),
        description: form.description || null,
        category_id: form.category_id || null,
        brand: form.brand || null,
        unit: form.unit || 'UN',
        cost: Number(form.cost) || 0,
        sale_price: Number(form.sale_price) || 0,
        min_stock: Number(form.min_stock) || 0,
        max_stock: form.max_stock ? Number(form.max_stock) : null,
        main_image_url,
        status: form.status,
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase.from('ls_products').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast.success('Produto atualizado');
      } else {
        const { error } = await supabase.from('ls_products').insert(payload);
        if (error) throw error;
        toast.success('Produto criado');
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Produtos</h2>
          <p className="text-sm text-slate-500">Cadastro completo multicanal</p>
        </div>
        {canWrite && (
          <button type="button" className="ls-btn-primary" onClick={openCreate}>
            <Plus size={16} />
            Novo produto
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="ls-input pl-9"
          placeholder="Buscar SKU, nome ou barcode"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="ls-table-wrap">
        <table className="ls-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Produto</th>
              <th className="ls-hide-mobile">Marca</th>
              <th>Custo</th>
              <th>Mín.</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">Carregando…</td>
              </tr>
            )}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">Nenhum produto cadastrado.</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="font-bold">{p.sku}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {p.main_image_url && (
                      <img src={p.main_image_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    )}
                    {p.name}
                  </div>
                </td>
                <td className="ls-hide-mobile">{p.brand || '—'}</td>
                <td>{Number(p.cost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>{p.min_stock}</td>
                <td>
                  <span className={`ls-badge ${p.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {p.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <Link to={`/app/products/${p.id}`} className="ls-btn-secondary px-2 py-1">
                      <Eye size={14} />
                    </Link>
                    {canWrite && (
                      <button type="button" className="ls-btn-secondary px-2 py-1" onClick={() => openEdit(p)}>
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{total} produtos</span>
        <div className="flex gap-2">
          <button type="button" className="ls-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <button type="button" className="ls-btn-secondary" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>
            Próxima
          </button>
        </div>
      </div>

      <Modal open={modalOpen} title={editing ? 'Editar produto' : 'Novo produto'} onClose={() => setModalOpen(false)} wide>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['sku', 'SKU', 'text'],
            ['internal_code', 'Código interno', 'text'],
            ['barcode', 'Código de barras', 'text'],
            ['name', 'Nome', 'text'],
            ['brand', 'Marca', 'text'],
            ['unit', 'Unidade', 'text'],
            ['cost', 'Custo', 'number'],
            ['sale_price', 'Preço venda', 'number'],
            ['min_stock', 'Estoque mínimo', 'number'],
            ['max_stock', 'Estoque máximo', 'number'],
          ].map(([key, label, type]) => (
            <div key={key}>
              <label className="ls-label">{label}</label>
              <input
                className="ls-input"
                type={type}
                value={form[key as keyof typeof form] as string}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="ls-label">Categoria</label>
            <select
              className="ls-input"
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="ls-label">Descrição</label>
            <textarea
              className="ls-input min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="ls-label">Status</label>
            <select
              className="ls-input"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div>
            <label className="ls-label">Foto principal</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="ls-btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
          <button type="button" className="ls-btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductsPage;
