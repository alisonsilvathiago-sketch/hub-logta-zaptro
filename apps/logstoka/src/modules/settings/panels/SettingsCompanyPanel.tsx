import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { useCategories, useStores, useSuppliers, useWarehouses } from '@/hooks/useCatalog';
import { DEFAULT_STORES, MARKETPLACE_LABELS } from '@/types';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import type { Marketplace } from '@/types';
import Modal from '@/components/ui/Modal';

type Tab = 'dados' | 'stores' | 'categories' | 'suppliers';

const SettingsCompanyPanel: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const { stores, reload: reloadStores } = useStores();
  const { categories, reload: reloadCategories } = useCategories();
  const { suppliers, reload: reloadSuppliers } = useSuppliers();
  const { warehouses } = useWarehouses();
  const [tab, setTab] = useState<Tab>('dados');
  const [modal, setModal] = useState<'store' | 'category' | 'supplier' | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const seedStores = async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('[Demo] Lojas demo já carregadas');
      return;
    }
    const rows = DEFAULT_STORES.map((s) => ({ ...s, company_id: companyId, is_active: true }));
    const { error } = await supabase.from('ls_stores').upsert(rows, {
      onConflict: 'company_id,marketplace,name',
      ignoreDuplicates: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Lojas padrão criadas');
      await reloadStores();
    }
  };

  const save = async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('[Demo] Cadastro salvo');
      setModal(null);
      return;
    }
    try {
      if (modal === 'store') {
        const { error } = await supabase.from('ls_stores').insert({
          company_id: companyId,
          marketplace: form.marketplace,
          name: form.name,
          warehouse_id: form.warehouse_id || null,
          is_active: true,
        });
        if (error) throw error;
        await reloadStores();
      }
      if (modal === 'category') {
        const { error } = await supabase.from('ls_categories').insert({
          company_id: companyId,
          name: form.name,
          description: form.description || null,
        });
        if (error) throw error;
        await reloadCategories();
      }
      if (modal === 'supplier') {
        const { error } = await supabase.from('ls_suppliers').insert({
          company_id: companyId,
          name: form.name,
          document: form.document || null,
          email: form.email || null,
          phone: form.phone || null,
        });
        if (error) throw error;
        await reloadSuppliers();
      }
      toast.success('Salvo');
      setModal(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    }
  };

  const subTabs: Array<{ id: Tab; label: string }> = [
    { id: 'dados', label: 'Dados da empresa' },
    { id: 'stores', label: 'Lojas' },
    { id: 'categories', label: 'Categorias' },
    { id: 'suppliers', label: 'Fornecedores' },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-6">
        <h2 className="text-xl font-black text-gray-900">Perfil da Empresa</h2>
        <p className="mt-1 text-sm text-gray-500">Dados operacionais, lojas, categorias e fornecedores.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t.id ? 'bg-orange-600 text-white' : 'bg-gray-50 ring-1 ring-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dados' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">Razão social</p>
              <p className="mt-1 text-lg font-black text-gray-900">LogStoka Operações Demo</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase text-gray-500">CNPJ</p>
              <p className="mt-1 text-lg font-black text-gray-900">00.000.000/0001-00</p>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-black text-gray-900">Canais configurados</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(MARKETPLACE_LABELS).map((label) => (
                <span key={label} className="ls-badge bg-orange-50 text-orange-700">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'stores' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button type="button" className="ls-btn-primary" onClick={() => { setForm({ marketplace: 'shopee', name: '' }); setModal('store'); }}>Nova loja</button>
            <button type="button" className="ls-btn-secondary" onClick={() => void seedStores()}>Criar lojas padrão</button>
          </div>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead><tr><th>Marketplace</th><th>Loja</th><th>Status</th></tr></thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id}>
                    <td>{MARKETPLACE_LABELS[s.marketplace]}</td>
                    <td>{s.name}</td>
                    <td>{s.is_active ? 'Ativa' : 'Inativa'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="space-y-4">
          <button type="button" className="ls-btn-primary" onClick={() => { setForm({ name: '', description: '' }); setModal('category'); }}>Nova categoria</button>
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 font-bold">{c.name}</li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="space-y-4">
          <button type="button" className="ls-btn-primary" onClick={() => { setForm({ name: '', document: '', email: '', phone: '' }); setModal('supplier'); }}>Novo fornecedor</button>
          <div className="ls-table-wrap">
            <table className="ls-table">
              <thead><tr><th>Nome</th><th>Documento</th><th>Contato</th></tr></thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}><td>{s.name}</td><td>{s.document || '—'}</td><td>{s.email || s.phone || '—'}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal !== null} title="Cadastro" onClose={() => setModal(null)}>
        {modal === 'store' && (
          <div className="space-y-3">
            <select className="ls-input" value={form.marketplace} onChange={(e) => setForm((f) => ({ ...f, marketplace: e.target.value }))}>
              {(Object.keys(MARKETPLACE_LABELS) as Marketplace[]).map((k) => (
                <option key={k} value={k}>{MARKETPLACE_LABELS[k]}</option>
              ))}
            </select>
            <input className="ls-input" placeholder="Nome da loja" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <select className="ls-input" value={form.warehouse_id ?? ''} onChange={(e) => setForm((f) => ({ ...f, warehouse_id: e.target.value }))}>
              <option value="">Depósito vinculado</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        )}
        {modal === 'category' && (
          <div className="space-y-3">
            <input className="ls-input" placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="ls-input" placeholder="Descrição" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
        )}
        {modal === 'supplier' && (
          <div className="space-y-3">
            <input className="ls-input" placeholder="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="ls-input" placeholder="CNPJ/CPF" value={form.document} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} />
            <input className="ls-input" placeholder="E-mail" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <input className="ls-input" placeholder="Telefone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
        )}
        <button type="button" className="ls-btn-primary mt-4 w-full" onClick={() => void save()}>Salvar</button>
      </Modal>
    </div>
  );
};

export default SettingsCompanyPanel;
