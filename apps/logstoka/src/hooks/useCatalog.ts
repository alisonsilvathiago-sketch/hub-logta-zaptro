import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
import { isLogstokaDemoCompany } from '@/lib/logstokaDemoMode';
import {
  loadMergedDemoWarehouses,
} from '@/lib/demoWarehouseStore';
import {
  DEMO_CATEGORIES,
  DEMO_STORES,
  DEMO_SUPPLIERS,
} from '@/lib/logstokaDemoSeed';
import type { LsStore, LsWarehouse } from '@/types';

export interface LsCategory {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface LsSupplier {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
  is_active: boolean;
}

export function useWarehouses() {
  const { companyId } = useLogstokaTenant();
  const [warehouses, setWarehouses] = useState<LsWarehouse[]>([]);
  const reload = useCallback(async () => {
    if (!companyId) {
      setWarehouses([]);
      return;
    }
    if (isLogstokaDemoCompany(companyId)) {
      setWarehouses(loadMergedDemoWarehouses(companyId));
      return;
    }
    const { data } = await supabase
      .from('ls_warehouses')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');
    setWarehouses((data ?? []) as LsWarehouse[]);
  }, [companyId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    const onPulse = () => void reload();
    const onDemoWarehouses = () => void reload();
    window.addEventListener('logstoka:system-pulse', onPulse);
    window.addEventListener('logstoka:demo-warehouses-updated', onDemoWarehouses);
    return () => {
      window.removeEventListener('logstoka:system-pulse', onPulse);
      window.removeEventListener('logstoka:demo-warehouses-updated', onDemoWarehouses);
    };
  }, [reload]);
  return { warehouses, reload };
}

export function useCategories() {
  const { companyId } = useLogstokaTenant();
  const [categories, setCategories] = useState<LsCategory[]>([]);
  const reload = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setCategories(DEMO_CATEGORIES);
      return;
    }
    const { data } = await supabase
      .from('ls_categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    setCategories((data ?? []) as LsCategory[]);
  }, [companyId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { categories, reload };
}

export function useStores() {
  const { companyId } = useLogstokaTenant();
  const [stores, setStores] = useState<LsStore[]>([]);
  const reload = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setStores(DEMO_STORES);
      return;
    }
    const { data } = await supabase
      .from('ls_stores')
      .select('*')
      .eq('company_id', companyId)
      .order('marketplace')
      .order('name');
    setStores((data ?? []) as LsStore[]);
  }, [companyId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { stores, reload };
}

export function useSuppliers() {
  const { companyId } = useLogstokaTenant();
  const [suppliers, setSuppliers] = useState<LsSupplier[]>([]);
  const reload = useCallback(async () => {
    if (!companyId) return;
    if (isLogstokaDemoCompany(companyId)) {
      setSuppliers(DEMO_SUPPLIERS);
      return;
    }
    const { data } = await supabase
      .from('ls_suppliers')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name');
    setSuppliers((data ?? []) as LsSupplier[]);
  }, [companyId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { suppliers, reload };
}
