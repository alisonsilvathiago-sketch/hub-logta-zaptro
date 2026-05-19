import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, hasRealConfig } from '../lib/supabase';
import {
  getSandboxOperationalBundle,
  mergeOperationalWithSandbox,
  resolveDemoCompanyId,
  shouldUseLogtaSandbox,
} from '../lib/seed';
import { useTenant } from './TenantContext';
import { normalizeShipment } from '../modules/fretes/fretesAnalytics';
import type { ShipmentNormalized } from '../modules/fretes/types';
import { loadLocalFinanceTransactions } from '../lib/financeLocalStorage';
import { normalizeDeliveryFromShipment } from '../modules/roteirizacao/roteirizacaoAnalytics';
import type { RouteDeliveryNormalized } from '../modules/roteirizacao/types';

export type MotoristaRow = { id: string; nome?: string; status?: string; cnh_vencimento?: string };
export type VehicleRow = { id: string; plate?: string; status?: string; modelo?: string };
export type TransactionRow = {
  id: string;
  type?: string;
  amount?: number;
  description?: string;
  category?: string;
  paid_at?: string;
  created_at?: string;
  company_id?: string;
};

type OperationalDataContextValue = {
  hasBackend: boolean;
  loading: boolean;
  error: string | null;
  shipments: ShipmentNormalized[];
  deliveries: RouteDeliveryNormalized[];
  motoristas: MotoristaRow[];
  vehicles: VehicleRow[];
  transactions: TransactionRow[];
  profiles: { id: string; full_name?: string; email?: string; role?: string }[];
  lastSyncAt: Date | null;
  refresh: () => Promise<void>;
};

const OperationalDataContext = createContext<OperationalDataContextValue | null>(null);

export function OperationalDataProvider({ children }: { children: React.ReactNode }) {
  const { config } = useTenant();
  const [loading, setLoading] = useState(() => !shouldUseLogtaSandbox());
  const [error, setError] = useState<string | null>(null);
  const [shipments, setShipments] = useState<ShipmentNormalized[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaRow[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [profiles, setProfiles] = useState<OperationalDataContextValue['profiles']>([]);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    const companyId = resolveDemoCompanyId(config?.id);
    if (!shouldUseLogtaSandbox() && !config?.id) {
      setLoading(false);
      return;
    }

    const sandbox = getSandboxOperationalBundle(companyId);
    if (shouldUseLogtaSandbox()) {
      setShipments(sandbox.shipments);
      setMotoristas(sandbox.motoristas);
      setVehicles(sandbox.vehicles);
      setTransactions(sandbox.transactions);
      setProfiles(sandbox.profiles);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    let dbShipments: ShipmentNormalized[] = [];
    let dbMotoristas: MotoristaRow[] = [];
    let dbVehicles: VehicleRow[] = [];
    let dbTransactions: TransactionRow[] = [];
    let dbProfiles: OperationalDataContextValue['profiles'] = [];

    if (config?.id) {
      try {
        const [shipRes, motRes, vecRes, transRes, profRes] = await Promise.all([
          supabase
            .from('shipments')
            .select('*, motoristas(id, nome), vehicles(plate, status, modelo)')
            .eq('company_id', config.id)
            .order('created_at', { ascending: false })
            .limit(120),
          supabase.from('motoristas').select('id, nome, status, cnh_vencimento').eq('company_id', config.id),
          supabase.from('vehicles').select('id, plate, status, modelo').eq('company_id', config.id),
          supabase
            .from('transactions')
            .select('*')
            .eq('company_id', config.id)
            .order('paid_at', { ascending: false })
            .limit(200),
          supabase.from('profiles').select('id, full_name, email, role').eq('company_id', config.id),
        ]);

        if (!shipRes.error) {
          dbShipments = (shipRes.data || []).map((s) => normalizeShipment(s as Record<string, unknown>));
        }
        if (!motRes.error) dbMotoristas = motRes.data || [];
        if (!vecRes.error) dbVehicles = vecRes.data || [];
        const localFinance = loadLocalFinanceTransactions(companyId);
        if (!transRes.error) {
          const remote = (transRes.data || []) as TransactionRow[];
          const remoteIds = new Set(remote.map((t) => String(t.id)));
          dbTransactions = [
            ...localFinance.filter((t) => !remoteIds.has(String(t.id))),
            ...remote,
          ];
        } else {
          dbTransactions = localFinance;
        }
        if (!profRes.error) dbProfiles = profRes.data || [];
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao sincronizar dados operacionais';
        if (!shouldUseLogtaSandbox()) {
          setError(msg);
          console.error('[OperationalData]', e);
        }
      }
    }

    setShipments(mergeOperationalWithSandbox(dbShipments, sandbox.shipments, 3));
    setMotoristas(mergeOperationalWithSandbox(dbMotoristas, sandbox.motoristas, 2));
    setVehicles(mergeOperationalWithSandbox(dbVehicles, sandbox.vehicles, 2));
    setTransactions(mergeOperationalWithSandbox(dbTransactions, sandbox.transactions, 5));
    setProfiles(mergeOperationalWithSandbox(dbProfiles, sandbox.profiles, 2));
    setLastSyncAt(new Date());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('logta-operational-sync'));
    }
    setLoading(false);
  }, [config?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!config?.id || !hasRealConfig) return;
    const channel = supabase
      .channel('logta-operational-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'motoristas' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [config?.id, refresh]);

  const deliveries = useMemo(
    () => shipments.map((s, i) => normalizeDeliveryFromShipment(s as unknown as Record<string, unknown>, i)),
    [shipments],
  );

  const value: OperationalDataContextValue = {
    hasBackend: hasRealConfig,
    loading,
    error,
    shipments,
    deliveries,
    motoristas,
    vehicles,
    transactions,
    profiles,
    lastSyncAt,
    refresh,
  };

  return <OperationalDataContext.Provider value={value}>{children}</OperationalDataContext.Provider>;
}

export function useOperationalData() {
  const ctx = useContext(OperationalDataContext);
  if (!ctx) throw new Error('useOperationalData must be used within OperationalDataProvider');
  return ctx;
}
