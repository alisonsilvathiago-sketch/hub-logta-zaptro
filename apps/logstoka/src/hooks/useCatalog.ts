import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLogstokaTenant } from '@/context/LogstokaTenantContext';
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
    if (!companyId) return;
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
  return { warehouses, reload };
}

export function useCategories() {
  const { companyId } = useLogstokaTenant();
  const [categories, setCategories] = useState<LsCategory[]>([]);
  const reload = useCallback(async () => {
    if (!companyId) return;
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
