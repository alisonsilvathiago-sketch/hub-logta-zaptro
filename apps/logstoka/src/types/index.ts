export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: LogstokaRoleCode | 'admin' | 'master_admin';
  company_id?: string;
  /** Titular da conta — quem comprou a plataforma (Admin Sênior). Só ele altera pagamento/plano. */
  is_account_owner?: boolean;
  /** Data em que a conta/plano foi contratado */
  account_purchased_at?: string | null;
  /** CD autorizado — operadores veem só este galpão; admin ignora */
  warehouse_id?: string | null;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  updated_at?: string;
}

export type LogstokaRoleCode = 'master_admin' | 'regional_admin' | 'logistics_manager' | 'operator';

export type ProductPublicationStatus = 'draft' | 'review' | 'ready' | 'published';

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
  short_name?: string | null;
  manufacturer_code?: string | null;
  ncm?: string | null;
  origin_code?: string | null;
  description_short?: string | null;
  description_html?: string | null;
  promo_price?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  width_cm?: number | null;
  length_cm?: number | null;
  publication_status?: ProductPublicationStatus;
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
  /** Endereço / metadados operacionais (JSONB no Supabase) */
  address_line?: string | null;
  city?: string | null;
  state?: string | null;
  manager_name?: string | null;
  manager_role?: string | null;
  manager_email?: string | null;
  manager_phone?: string | null;
}

export type WarehouseManagerRole =
  | 'Gestor de Estoque'
  | 'Supervisor Logístico'
  | 'Coordenador Operacional'
  | 'Gerente do CD';

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

export const DEFAULT_WAREHOUSES: Array<{
  code: string;
  name: string;
  type: LsWarehouse['type'];
  marketplace?: Marketplace;
  city?: string;
  state?: string;
  address_line?: string;
  manager_name?: string;
  manager_role?: WarehouseManagerRole;
  manager_email?: string;
  manager_phone?: string;
}> = [
  {
    code: 'CD-COTIA',
    name: 'CD Cotia',
    type: 'physical',
    city: 'Cotia',
    state: 'SP',
    address_line: 'Av. Industrial 1200',
    manager_name: 'Marina Costa',
    manager_role: 'Gestor de Estoque',
    manager_email: 'marina@logstoka.com',
    manager_phone: '(11) 91234-5678',
  },
  {
    code: 'CD-OSA',
    name: 'CD Osasco',
    type: 'physical',
    city: 'Osasco',
    state: 'SP',
    address_line: 'Rua dos Galpões 450',
    manager_name: 'Nádia Souza',
    manager_role: 'Supervisor Logístico',
    manager_email: 'nadia@logstoka.com',
    manager_phone: '(11) 93456-7890',
  },
  { code: 'FULL-SHOPEE', name: 'Full Shopee', type: 'full_marketplace', marketplace: 'shopee' },
  { code: 'FULL-ML', name: 'Full Mercado Livre', type: 'full_marketplace', marketplace: 'mercadolivre' },
  { code: 'FULL-AMZ', name: 'Full Amazon', type: 'full_marketplace', marketplace: 'amazon' },
  {
    code: 'CD-BAR',
    name: 'CD Barueri',
    type: 'physical',
    city: 'Barueri',
    state: 'SP',
    address_line: 'Rod. Presidente Castello Branco km 32',
    manager_name: 'Rafael Mendes',
    manager_role: 'Coordenador Operacional',
    manager_email: 'rafael@logstoka.com',
    manager_phone: '(11) 99876-5432',
  },
  {
    code: 'CD-RJ',
    name: 'CD Rio de Janeiro',
    type: 'physical',
    city: 'Rio de Janeiro',
    state: 'RJ',
    address_line: 'Av. Brasil 8800',
    manager_name: 'Carlos Lima',
    manager_role: 'Gerente do CD',
    manager_email: 'carlos.rj@logstoka.com',
    manager_phone: '(21) 98765-1234',
  },
];
