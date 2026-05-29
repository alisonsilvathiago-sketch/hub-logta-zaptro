export type LogstokaRoleCode = 'master_admin' | 'logistics_manager' | 'operator';

export type Marketplace =
  | 'shopee'
  | 'mercadolivre'
  | 'amazon'
  | 'tiktok'
  | 'magalu';

export type MovementType =
  | 'entry'
  | 'exit'
  | 'transfer'
  | 'return'
  | 'damage'
  | 'inventory_adjustment';

export interface LsProduct {
  id: string;
  company_id: string;
  sku: string;
  internal_code?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  category_id?: string | null;
  brand?: string | null;
  unit: string;
  cost: number;
  sale_price: number;
  min_stock: number;
  max_stock?: number | null;
  main_image_url?: string | null;
  extra_images?: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface LsWarehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: 'physical' | 'full_marketplace' | 'transit';
  marketplace?: Marketplace | null;
  is_active: boolean;
}

export interface LsStockRow {
  id: string;
  company_id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reserved_quantity: number;
  ls_products?: Pick<LsProduct, 'sku' | 'name'>;
  ls_warehouses?: Pick<LsWarehouse, 'name' | 'code'>;
}

export interface LsStore {
  id: string;
  company_id: string;
  marketplace: Marketplace;
  name: string;
  is_active: boolean;
}

export interface LsStockMovement {
  id: string;
  company_id: string;
  movement_type: MovementType;
  sub_type: string;
  status: string;
  warehouse_id?: string | null;
  marketplace?: Marketplace | null;
  reference_code?: string | null;
  total_quantity: number;
  created_at: string;
}

export interface LsAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  today: {
    entries: number;
    exits: number;
    transfers: number;
    returns: number;
  };
  stock: {
    totalQuantity: number;
    totalValue: number;
  };
  lowStockCount: number;
  staleProducts: {
    days30: number;
    days60: number;
    days90: number;
  };
}

export const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  shopee: 'Shopee',
  mercadolivre: 'Mercado Livre',
  amazon: 'Amazon',
  tiktok: 'TikTok Shop',
  magalu: 'Magalu',
};

export const DEFAULT_STORES: Array<{ marketplace: Marketplace; name: string }> = [
  { marketplace: 'shopee', name: 'Stock Express' },
  { marketplace: 'shopee', name: 'Pluma Baby' },
  { marketplace: 'shopee', name: 'Stock 2.0' },
  { marketplace: 'shopee', name: 'Baby Bear' },
  { marketplace: 'mercadolivre', name: 'Stock Express' },
  { marketplace: 'mercadolivre', name: 'Pluma Baby' },
  { marketplace: 'amazon', name: 'Amazon Oficial' },
  { marketplace: 'tiktok', name: 'TikTok Oficial' },
  { marketplace: 'magalu', name: 'Magalu Oficial' },
];

export const DEFAULT_WAREHOUSES: Array<{ code: string; name: string; type: LsWarehouse['type']; marketplace?: Marketplace }> = [
  { code: 'CD-MAIN', name: 'CD Principal', type: 'physical' },
  { code: 'CD-SEC', name: 'CD Secundário', type: 'physical' },
  { code: 'FULL-SHOPEE', name: 'Full Shopee', type: 'full_marketplace', marketplace: 'shopee' },
  { code: 'FULL-ML', name: 'Full Mercado Livre', type: 'full_marketplace', marketplace: 'mercadolivre' },
  { code: 'FULL-AMZ', name: 'Full Amazon', type: 'full_marketplace', marketplace: 'amazon' },
];
