import React, { useEffect, useState } from 'react';
import { LOGSTOKA_PAGE_TITLE_CLASS } from '@/components/layout/LogstokaStandardPageLayout';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import { DEMO_WAREHOUSES } from '@/lib/logstokaDemoSeed';
import type { LsWarehouse } from '@/types';

const WarehousesPage: React.FC = () => {
  const { companyId } = useLogstokaTenant();
  const [warehouses, setWarehouses] = useState<LsWarehouse[]>([]);

  const load = async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setWarehouses(DEMO_WAREHOUSES);
      return;
    }
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
    if (isLogstokaDemoCompany(companyId)) {
      toast.success('Depósitos demo já carregados');
      setWarehouses(DEMO_WAREHOUSES);
      return;
    }
    toast.error('Use ambiente com Supabase para criar depósitos reais');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={LOGSTOKA_PAGE_TITLE_CLASS}>Depósitos</h2>
          <p className="text-sm text-slate-500">CDs físicos e depósitos Full por marketplace</p>
        </div>
        <button type="button" className="ls-btn-secondary" onClick={() => void seedDefaults()}>
          Recarregar demo
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {warehouses.map((w) => (
          <div key={w.id} className="ls-card">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-orange-50 p-2 text-orange-700">
                <WarehouseIcon size={18} />
              </div>
              <div>
                <p className="font-black text-slate-900">{w.name}</p>
                <p className="text-xs font-semibold text-slate-500">{w.code}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="ls-badge bg-slate-100 text-slate-700">{w.type}</span>
              {w.marketplace && <span className="ls-badge bg-orange-50 text-orange-700">{w.marketplace}</span>}
              <span className={`ls-badge ${w.is_active ? 'bg-orange-50 text-orange-700' : 'bg-rose-50 text-rose-700'}`}>
                {w.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehousesPage;
