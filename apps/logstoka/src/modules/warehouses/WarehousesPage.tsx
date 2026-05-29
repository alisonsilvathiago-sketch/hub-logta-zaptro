import React from 'react';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { DEFAULT_WAREHOUSES } from '@/types';
import type { LsWarehouse } from '@/types';
import { useEffect, useState } from 'react';

const WarehousesPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [warehouses, setWarehouses] = useState<LsWarehouse[]>([]);

  const load = async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from('ls_warehouses')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    setWarehouses((data ?? []) as LsWarehouse[]);
  };

  useEffect(() => {
    void load();
  }, [companyId]);

  const seedDefaults = async () => {
    if (!companyId) return;
    const rows = DEFAULT_WAREHOUSES.map((w) => ({ ...w, company_id: companyId, is_active: true }));
    const { error } = await supabase.from('ls_warehouses').upsert(rows, {
      onConflict: 'company_id,code',
      ignoreDuplicates: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Depósitos padrão criados');
      await load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Depósitos</h2>
          <p className="text-sm text-slate-500">CDs físicos e depósitos Full por marketplace</p>
        </div>
        <button type="button" className="ls-btn-primary" onClick={() => void seedDefaults()}>
          Criar depósitos padrão
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((w) => (
          <div key={w.id} className="ls-card">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <WarehouseIcon size={18} />
              </div>
              <div>
                <p className="font-black text-slate-900">{w.name}</p>
                <p className="text-xs font-semibold text-slate-500">{w.code}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ls-badge bg-slate-100 text-slate-700">{w.type}</span>
              {w.marketplace && <span className="ls-badge bg-blue-50 text-blue-700">{w.marketplace}</span>}
              <span className={`ls-badge ${w.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {w.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && (
          <div className="ls-card md:col-span-2 xl:col-span-3">
            <p className="text-sm text-slate-500">Nenhum depósito cadastrado. Use o botão acima para criar a estrutura padrão.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehousesPage;
