import type { PermissionCode } from '@/lib/permissions';
import type { Profile } from '@/types';

export type DemoAccountPlan = {
  planName: string;
  planCode: string;
  purchasedAt: string;
  renewsAt: string;
  paymentMethod: string;
  monthlyAmount: number;
  status: 'active' | 'past_due';
  maxCds: number;
  maxUsers: number;
};

export const DEMO_ACCOUNT_PLAN: DemoAccountPlan = {
  planName: 'LogStoka WMS Multi-CD',
  planCode: 'wms-multi-cd-pro',
  purchasedAt: '2025-11-14T10:30:00.000Z',
  renewsAt: '2026-06-14T10:30:00.000Z',
  paymentMethod: 'Cartão •••• 4821',
  monthlyAmount: 890,
  status: 'active',
  maxCds: 50,
  maxUsers: 30,
};

export function loadDemoAccountPlan(profile: Profile | null | undefined): DemoAccountPlan | null {
  if (!profile?.is_account_owner) return null;
  return DEMO_ACCOUNT_PLAN;
}

export const BILLING_PERMISSIONS: PermissionCode[] = ['billing.read', 'billing.write', 'account.manage'];
