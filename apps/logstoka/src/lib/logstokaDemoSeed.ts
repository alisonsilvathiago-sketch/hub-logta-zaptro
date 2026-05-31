import type {
  DashboardSummary,
  LsAlert,
  LsProduct,
  LsStockMovement,
  LsStockRow,
  LsStore,
  LsWarehouse,
  Marketplace,
  MovementType,
} from '@/types';
import { DEFAULT_STORES, DEFAULT_WAREHOUSES, MARKETPLACE_LABELS } from '@/types';
import { LOGSTOKA_DEMO_COMPANY_ID } from '@/lib/logstokaDemoAuth';
import { formatInternalSku } from '@/lib/formatInternalSku';
import { generateLogstokaInternalEan13 } from '@/lib/productIdentifiers';
import type { LsCategory, LsSupplier } from '@/hooks/useCatalog';

const CID = LOGSTOKA_DEMO_COMPANY_ID;

const daysAgo = (d: number, h = 10) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, 30, 0, 0);
  return dt.toISOString();
};

export const DEMO_WAREHOUSES: LsWarehouse[] = DEFAULT_WAREHOUSES.map((w, i) => ({
  id: `wh-${i + 1}`,
  company_id: CID,
  code: w.code,
  name: w.name,
  type: w.type,
  marketplace: w.marketplace ?? null,
  is_active: true,
  address_line: w.address_line ?? null,
  city: w.city ?? null,
  state: w.state ?? null,
  manager_name: w.manager_name ?? null,
  manager_role: w.manager_role ?? null,
  manager_email: w.manager_email ?? null,
  manager_phone: w.manager_phone ?? null,
}));

export const DEMO_CATEGORIES: LsCategory[] = [
  { id: 'cat-1', name: 'Bebê & Infantil', description: 'Fraldas, lenços e higiene', is_active: true },
  { id: 'cat-2', name: 'Utilidades Domésticas', description: 'Organização e cozinha', is_active: true },
  { id: 'cat-3', name: 'Eletrônicos', description: 'Acessórios e cabos', is_active: true },
  { id: 'cat-4', name: 'Moda', description: 'Vestuário e acessórios', is_active: true },
  { id: 'cat-5', name: 'Pet', description: 'Ração e acessórios pet', is_active: true },
];

export const DEMO_SUPPLIERS: LsSupplier[] = [
  { id: 'sup-1', name: 'Distribuidora Pluma Ltda', document: '12.345.678/0001-90', email: 'compras@pluma.com.br', phone: '(11) 3456-7890', is_active: true },
  { id: 'sup-2', name: 'Stock Express Import', document: '98.765.432/0001-10', email: 'pedidos@stockexpress.com', phone: '(11) 2345-6789', is_active: true },
  { id: 'sup-3', name: 'Baby Bear Comercial', document: '11.222.333/0001-44', email: 'vendas@babybear.com.br', phone: '(21) 9876-5432', is_active: true },
  { id: 'sup-4', name: 'TechParts Brasil', document: '55.666.777/0001-88', email: 'erp@techparts.com', phone: '(47) 3333-2222', is_active: true },
];

export const DEMO_STORES: LsStore[] = DEFAULT_STORES.map((s, i) => ({
  id: `store-${i + 1}`,
  company_id: CID,
  marketplace: s.marketplace,
  name: s.name,
  is_active: true,
}));

const productDefs = [
  { sku: 'PLM-FRD-P', name: 'Fralda Pluma Premium P 60un', brand: 'Pluma', cat: 'cat-1', cost: 42.9, sale: 69.9, min: 120, qty: 840 },
  { sku: 'PLM-FRD-M', name: 'Fralda Pluma Premium M 54un', brand: 'Pluma', cat: 'cat-1', cost: 44.5, sale: 72.9, min: 150, qty: 620 },
  { sku: 'PLM-LEN-80', name: 'Lenço Umedecido Pluma 80un', brand: 'Pluma', cat: 'cat-1', cost: 8.2, sale: 14.9, min: 200, qty: 45 },
  { sku: 'STK-ORG-12', name: 'Organizador Modular 12 Gavetas', brand: 'Stock Express', cat: 'cat-2', cost: 89.0, sale: 149.9, min: 30, qty: 156 },
  { sku: 'STK-GAR-500', name: 'Pote Hermético 500ml Kit 6', brand: 'Stock Express', cat: 'cat-2', cost: 32.0, sale: 59.9, min: 80, qty: 310 },
  { sku: 'BBR-MAM-300', name: 'Mamadeira Anti-Cólica 300ml', brand: 'Baby Bear', cat: 'cat-1', cost: 18.5, sale: 34.9, min: 60, qty: 188 },
  { sku: 'BBR-CHU-A1', name: 'Chupeta Silicone 0-6m', brand: 'Baby Bear', cat: 'cat-1', cost: 6.8, sale: 12.9, min: 100, qty: 520 },
  { sku: 'TEC-CAB-2M', name: 'Cabo USB-C 2m Reforçado', brand: 'TechParts', cat: 'cat-3', cost: 9.5, sale: 24.9, min: 50, qty: 890 },
  { sku: 'TEC-FNT-20W', name: 'Carregador Turbo 20W', brand: 'TechParts', cat: 'cat-3', cost: 22.0, sale: 49.9, min: 40, qty: 275 },
  { sku: 'MOD-CAM-M', name: 'Camiseta Básica M Preta', brand: 'ModaStock', cat: 'cat-4', cost: 15.0, sale: 39.9, min: 25, qty: 98 },
  { sku: 'PET-RAC-10', name: 'Ração Premium Cães 10kg', brand: 'PetMax', cat: 'cat-5', cost: 78.0, sale: 119.9, min: 20, qty: 64 },
  { sku: 'PET-BOL-500', name: 'Bolsa Transporte Pet P', brand: 'PetMax', cat: 'cat-5', cost: 45.0, sale: 89.9, min: 15, qty: 32 },
];

export function getDemoStockQty(productId: string): number {
  return DEMO_STOCK.filter((s) => s.product_id === productId).reduce((sum, s) => sum + s.quantity, 0);
}

export function getDemoProductsCatalogKpis(_companyId?: string) {
  const totalProducts = DEMO_PRODUCTS.filter((p) => p.status === 'active').length;
  const totalStockUnits = DEMO_STOCK.reduce((sum, row) => sum + row.quantity, 0);
  const exitMovements = DEMO_MOVEMENTS.filter((m) => m.movement_type === 'exit');
  const totalExits = exitMovements.reduce((sum, m) => sum + m.total_quantity, 0);
  const revenueFromExits = exitMovements.reduce((sum, m) => {
    const prod = DEMO_PRODUCTS.find((p) => p.sku === m.sku);
    return sum + m.total_quantity * (prod?.sale_price ?? 0);
  }, 0);
  return { totalProducts, totalStockUnits, totalExits, revenueFromExits };
}

export const DEMO_PRODUCT_IMAGE = (sku: string) =>
  `https://picsum.photos/seed/logstoka-${encodeURIComponent(sku)}/400/400`;

export const DEMO_PRODUCTS: LsProduct[] = productDefs.map((p, i) => ({
  id: `prod-${i + 1}`,
  company_id: CID,
  sku: p.sku,
  internal_code: formatInternalSku(i + 1),
  barcode: generateLogstokaInternalEan13(i + 1),
  name: p.name,
  short_name: p.name.split(' ').slice(0, 4).join(' '),
  manufacturer_code: `MFR-${p.brand.slice(0, 3).toUpperCase()}${i + 1}`,
  ncm: '96190000',
  origin_code: '0',
  description_short: `${p.brand} — ${p.name.split(' ').slice(-2).join(' ')}`,
  description: `${p.name} — cadastro universal LogStoka. Compatível com publicação em Shopee, Mercado Livre, Amazon, TikTok Shop e Magalu.`,
  description_html: `<p><strong>${p.name}</strong></p><p>Produto cadastrado no padrão universal LogStoka (PIM multicanal).</p>`,
  category_id: p.cat,
  brand: p.brand,
  unit: 'UN',
  cost: p.cost,
  sale_price: p.sale,
  promo_price: Math.round(p.sale * 0.92 * 100) / 100,
  min_stock: p.min,
  max_stock: p.min * 4,
  weight_kg: 0.35 + i * 0.08,
  height_cm: 12 + i,
  width_cm: 18 + i,
  length_cm: 22 + i,
  main_image_url: DEMO_PRODUCT_IMAGE(p.sku),
  extra_images: [],
  status: 'active',
  publication_status: i < 2 ? 'draft' : i < 5 ? 'ready' : 'draft',
  created_at: daysAgo(30 - i),
  updated_at: daysAgo(1),
}));

export const DEMO_STOCK: LsStockRow[] = productDefs.flatMap((p, i) => {
  const prod = DEMO_PRODUCTS[i];
  const whMain = DEMO_WAREHOUSES[0];
  const whFull = DEMO_WAREHOUSES[2 + (i % 3)];
  const whOsasco = DEMO_WAREHOUSES[1];
  const whBarueri = DEMO_WAREHOUSES[5];
  const whRio = DEMO_WAREHOUSES[6];
  const rows: LsStockRow[] = [
    {
      id: `stk-${i}-a`,
      company_id: CID,
      warehouse_id: whMain.id,
      product_id: prod.id,
      quantity: Math.floor(p.qty * 0.55),
      reserved_quantity: Math.floor(p.qty * 0.05),
      ls_products: { sku: prod.sku, name: prod.name },
      ls_warehouses: { name: whMain.name, code: whMain.code },
    },
    {
      id: `stk-${i}-b`,
      company_id: CID,
      warehouse_id: whFull.id,
      product_id: prod.id,
      quantity: Math.floor(p.qty * 0.25),
      reserved_quantity: 0,
      ls_products: { sku: prod.sku, name: prod.name },
      ls_warehouses: { name: whFull.name, code: whFull.code },
    },
  ];
  if (i % 3 === 0) {
    rows.push({
      id: `stk-${i}-c`,
      company_id: CID,
      warehouse_id: whOsasco.id,
      product_id: prod.id,
      quantity: Math.floor(p.qty * 0.12),
      reserved_quantity: 0,
      ls_products: { sku: prod.sku, name: prod.name },
      ls_warehouses: { name: whOsasco.name, code: whOsasco.code },
    });
  }
  if (i % 4 === 0) {
    rows.push({
      id: `stk-${i}-d`,
      company_id: CID,
      warehouse_id: whBarueri.id,
      product_id: prod.id,
      quantity: Math.floor(p.qty * 0.08),
      reserved_quantity: 0,
      ls_products: { sku: prod.sku, name: prod.name },
      ls_warehouses: { name: whBarueri.name, code: whBarueri.code },
    });
  }
  if (i % 5 === 0) {
    rows.push({
      id: `stk-${i}-e`,
      company_id: CID,
      warehouse_id: whRio.id,
      product_id: prod.id,
      quantity: Math.floor(p.qty * 0.06),
      reserved_quantity: 0,
      ls_products: { sku: prod.sku, name: prod.name },
      ls_warehouses: { name: whRio.name, code: whRio.code },
    });
  }
  return rows;
});

export const DEMO_DASHBOARD: DashboardSummary = {
  today: { entries: 18, exits: 42, transfers: 6, returns: 4 },
  stock: { totalQuantity: 3842, totalValue: 287450.75 },
  lowStockCount: 3,
  staleProducts: { days30: 12, days60: 28, days90: 45 },
};

export const DEMO_ALERTS: LsAlert[] = [
  { id: 'al-1', alert_type: 'low_stock', severity: 'critical', title: 'Ruptura iminente — PLM-LEN-80', message: 'Estoque abaixo do mínimo no CD Cotia (45 / 200).', is_read: false, created_at: daysAgo(0, 8) },
  { id: 'al-2', alert_type: 'low_stock', severity: 'warning', title: 'Estoque mínimo — MOD-CAM-M', message: '98 unidades · mínimo configurado 25 · atenção reposição.', is_read: false, created_at: daysAgo(0, 9) },
  { id: 'al-3', alert_type: 'inventory', severity: 'warning', title: 'Divergência inventário Full ML', message: '3 SKUs com diferença pendente de aprovação.', is_read: false, created_at: daysAgo(1) },
  { id: 'al-4', alert_type: 'integration', severity: 'info', title: 'Sync Shopee concluída', message: '142 SKUs atualizados às 15:18.', is_read: true, created_at: daysAgo(0, 15) },
  { id: 'al-5', alert_type: 'return', severity: 'info', title: 'Devolução aguardando triagem', message: 'Pedido ML-884921 · 2 itens recebidos.', is_read: false, created_at: daysAgo(0, 11) },
  { id: 'al-6', alert_type: 'transfer', severity: 'info', title: 'Transferência em trânsito', message: 'CD Cotia → Full Shopee · TR-8841.', is_read: true, created_at: daysAgo(2) },
];

export type MovementExitApproval = {
  released_by_name: string;
  driver_id?: string | null;
  driver_name: string;
  driver_cpf?: string | null;
  company_name?: string | null;
  company_cnpj?: string | null;
  driver_plate?: string | null;
  signature_data_url: string;
  approved_at: string;
};

export type DemoMovementRow = LsStockMovement & {
  sku?: string;
  product_name?: string;
  warehouse_name?: string;
  exit_approval?: MovementExitApproval | null;
};

export const DEMO_MOVEMENTS: DemoMovementRow[] = [
  { id: 'mov-1', company_id: CID, movement_type: 'entry', sub_type: 'purchase', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'NF-45821', total_quantity: 240, created_at: daysAgo(0, 7), sku: 'PLM-FRD-P', product_name: 'Fralda Pluma Premium P', warehouse_name: 'CD Cotia' },
  { id: 'mov-2', company_id: CID, movement_type: 'entry', sub_type: 'factory', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'NF-45822', total_quantity: 180, created_at: daysAgo(0, 8), sku: 'STK-ORG-12', product_name: 'Organizador Modular', warehouse_name: 'CD Cotia' },
  { id: 'mov-3', company_id: CID, movement_type: 'exit', sub_type: 'sale', status: 'completed', warehouse_id: 'wh-3', marketplace: 'shopee', reference_code: 'Stock Express', total_quantity: 12, created_at: daysAgo(0, 9), sku: 'PLM-FRD-M', product_name: 'Fralda Pluma Premium M', warehouse_name: 'Full Shopee' },
  { id: 'mov-4', company_id: CID, movement_type: 'exit', sub_type: 'sale', status: 'completed', warehouse_id: 'wh-4', marketplace: 'mercadolivre', reference_code: 'Pluma Baby', total_quantity: 8, created_at: daysAgo(0, 10), sku: 'BBR-MAM-300', product_name: 'Mamadeira Anti-Cólica', warehouse_name: 'Full Mercado Livre' },
  { id: 'mov-5', company_id: CID, movement_type: 'exit', sub_type: 'sale', status: 'completed', warehouse_id: 'wh-3', marketplace: 'shopee', reference_code: 'Stock Express', total_quantity: 24, created_at: daysAgo(0, 11), sku: 'TEC-CAB-2M', product_name: 'Cabo USB-C 2m', warehouse_name: 'Full Shopee' },
  { id: 'mov-6', company_id: CID, movement_type: 'transfer', sub_type: 'warehouse', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'TR-8839', total_quantity: 60, created_at: daysAgo(0, 12), sku: 'STK-GAR-500', product_name: 'Pote Hermético Kit 6', warehouse_name: 'CD Cotia' },
  { id: 'mov-7', company_id: CID, movement_type: 'return', sub_type: 'customer', status: 'completed', warehouse_id: 'wh-4', marketplace: 'mercadolivre', reference_code: 'ML-884921', total_quantity: 2, created_at: daysAgo(0, 13), sku: 'PLM-FRD-P', product_name: 'Fralda Pluma Premium P', warehouse_name: 'Full Mercado Livre' },
  { id: 'mov-8', company_id: CID, movement_type: 'damage', sub_type: 'handling', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'AV-102', total_quantity: 3, created_at: daysAgo(1), sku: 'MOD-CAM-M', product_name: 'Camiseta Básica M', warehouse_name: 'CD Cotia' },
  { id: 'mov-9', company_id: CID, movement_type: 'exit', sub_type: 'sale', status: 'completed', warehouse_id: 'wh-5', marketplace: 'amazon', reference_code: 'Amazon Oficial', total_quantity: 6, created_at: daysAgo(0, 14), sku: 'PET-RAC-10', product_name: 'Ração Premium 10kg', warehouse_name: 'Full Amazon' },
  { id: 'mov-10', company_id: CID, movement_type: 'entry', sub_type: 'xml', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'NF-e 99281', total_quantity: 500, created_at: daysAgo(1, 16), sku: 'PLM-LEN-80', product_name: 'Lenço Umedecido', warehouse_name: 'CD Cotia' },
  { id: 'mov-11', company_id: CID, movement_type: 'entry', sub_type: 'factory', status: 'completed', warehouse_id: 'wh-2', marketplace: null, reference_code: 'NF-44100', total_quantity: 120, created_at: daysAgo(4, 10), sku: 'BBR-CHU-A1', product_name: 'Chupeta Silicone', warehouse_name: 'CD Osasco' },
  { id: 'mov-12', company_id: CID, movement_type: 'entry', sub_type: 'purchase', status: 'completed', warehouse_id: 'wh-1', marketplace: null, reference_code: 'NF-44002', total_quantity: 90, created_at: daysAgo(7, 9), sku: 'MOD-CAM-M', product_name: 'Camiseta Básica M', warehouse_name: 'CD Cotia' },
  { id: 'mov-13', company_id: CID, movement_type: 'transfer', sub_type: 'warehouse', status: 'completed', warehouse_id: 'wh-6', marketplace: null, reference_code: 'TR-9012', total_quantity: 50, created_at: daysAgo(0, 6), sku: 'PLM-FRD-P', product_name: 'Fralda Pluma Premium P', warehouse_name: 'CD Barueri' },
  { id: 'mov-14', company_id: CID, movement_type: 'entry', sub_type: 'purchase', status: 'completed', warehouse_id: 'wh-7', marketplace: null, reference_code: 'NF-RJ-2201', total_quantity: 80, created_at: daysAgo(2, 11), sku: 'PET-RAC-10', product_name: 'Ração Premium 10kg', warehouse_name: 'CD Rio de Janeiro' },
];

export type TransferReleaseApproval = {
  released_by_name: string;
  driver_id?: string | null;
  driver_name: string;
  driver_cpf?: string | null;
  company_name?: string | null;
  company_cnpj?: string | null;
  driver_plate?: string | null;
  signature_data_url: string;
  approved_at: string;
};

export type DemoDriver = {
  id: string;
  full_name: string;
  cpf: string;
  company_name: string;
  company_cnpj: string;
  phone?: string | null;
  first_seen_at: string;
  last_seen_at: string;
  warehouse_ids: string[];
  total_visits: number;
};

export type DemoDriverGateDirection = 'entry' | 'exit';

export type DemoDriverGateRecord = {
  id: string;
  direction: DemoDriverGateDirection;
  warehouse_id: string;
  warehouse_name: string;
  driver_id: string;
  driver_name: string;
  driver_cpf: string;
  company_name: string;
  company_cnpj: string;
  vehicle_plate: string;
  product_description?: string | null;
  destination?: string | null;
  signature_data_url: string;
  signed_at: string;
  registered_by_name: string;
  notes?: string | null;
  created_at: string;
};

/** Cadastro empresa-wide — mesmo motorista em qualquer CD da rede. */
export const DEMO_DRIVERS: DemoDriver[] = [
  {
    id: 'drv-1',
    full_name: 'João Pedro Silva',
    cpf: '123.456.789-09',
    company_name: 'Transportadora Rápida LTDA',
    company_cnpj: '12.345.678/0001-90',
    phone: '(11) 98765-4321',
    first_seen_at: daysAgo(1460, 9),
    last_seen_at: daysAgo(2, 14),
    warehouse_ids: ['wh-6', 'wh-1'],
    total_visits: 47,
  },
  {
    id: 'drv-2',
    full_name: 'Marcos Antônio Souza',
    cpf: '987.654.321-00',
    company_name: 'Log Express Transportes ME',
    company_cnpj: '98.765.432/0001-10',
    phone: '(11) 91234-5678',
    first_seen_at: daysAgo(400, 11),
    last_seen_at: daysAgo(0, 8),
    warehouse_ids: ['wh-1', 'wh-2'],
    total_visits: 22,
  },
  {
    id: 'drv-3',
    full_name: 'Carla Mendes',
    cpf: '456.789.123-45',
    company_name: 'Frota Própria LogStoka Demo',
    company_cnpj: '11.222.333/0001-44',
    phone: null,
    first_seen_at: daysAgo(90, 10),
    last_seen_at: daysAgo(7, 16),
    warehouse_ids: ['wh-7'],
    total_visits: 8,
  },
];

export const DEMO_DRIVER_GATES: DemoDriverGateRecord[] = [
  {
    id: 'gate-1',
    direction: 'entry',
    warehouse_id: 'wh-6',
    warehouse_name: 'CD Barueri',
    driver_id: 'drv-1',
    driver_name: 'João Pedro Silva',
    driver_cpf: '123.456.789-09',
    company_name: 'Transportadora Rápida LTDA',
    company_cnpj: '12.345.678/0001-90',
    vehicle_plate: 'ABC1D23',
    product_description: 'Coleta fraldas · 120 cx',
    destination: null,
    signature_data_url: '',
    signed_at: daysAgo(2, 14),
    registered_by_name: 'Alison Demo',
    notes: 'Entrada portaria — coleta programada',
    created_at: daysAgo(2, 14),
  },
  {
    id: 'gate-2',
    direction: 'exit',
    warehouse_id: 'wh-6',
    warehouse_name: 'CD Barueri',
    driver_id: 'drv-1',
    driver_name: 'João Pedro Silva',
    driver_cpf: '123.456.789-09',
    company_name: 'Transportadora Rápida LTDA',
    company_cnpj: '12.345.678/0001-90',
    vehicle_plate: 'ABC1D23',
    product_description: 'Saída confirmada · mesma carga',
    destination: 'CD Cotia',
    signature_data_url: '',
    signed_at: daysAgo(2, 15),
    registered_by_name: 'Alison Demo',
    notes: null,
    created_at: daysAgo(2, 15),
  },
  {
    id: 'gate-3',
    direction: 'entry',
    warehouse_id: 'wh-1',
    warehouse_name: 'CD Cotia',
    driver_id: 'drv-2',
    driver_name: 'Marcos Antônio Souza',
    driver_cpf: '987.654.321-00',
    company_name: 'Log Express Transportes ME',
    company_cnpj: '98.765.432/0001-10',
    vehicle_plate: 'FGH4E56',
    product_description: 'Entrega NF-e 99281',
    destination: null,
    signature_data_url: '',
    signed_at: daysAgo(0, 8),
    registered_by_name: 'Marina Cotia',
    notes: null,
    created_at: daysAgo(0, 8),
  },
];

export type TransferReceiveApproval = {
  received_by_name: string;
  signature_data_url: string;
  received_at: string;
};

export type DemoTransferRow = {
  id: string;
  status: string;
  notes?: string | null;
  created_at: string;
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  origin_name: string;
  destination_name: string;
  items: Array<{ sku: string; name: string; quantity: number }>;
  release_approval?: TransferReleaseApproval | null;
  receive_approval?: TransferReceiveApproval | null;
};

export const DEMO_TRANSFERS: DemoTransferRow[] = [
  { id: 'tr-1', status: 'completed', notes: 'Reposição Full Shopee', created_at: daysAgo(2), origin_warehouse_id: 'wh-1', destination_warehouse_id: 'wh-3', origin_name: 'CD Cotia', destination_name: 'Full Shopee', items: [{ sku: 'PLM-FRD-P', name: 'Fralda Pluma P', quantity: 120 }] },
  { id: 'tr-2', status: 'in_transit', notes: 'TR-8839 · reposição Full Shopee', created_at: daysAgo(0, 14), origin_warehouse_id: 'wh-1', destination_warehouse_id: 'wh-3', origin_name: 'CD Cotia', destination_name: 'Full Shopee', items: [{ sku: 'STK-GAR-500', name: 'Pote Hermético', quantity: 60 }] },
  { id: 'tr-3', status: 'pending', notes: 'Aguardando separação', created_at: daysAgo(0, 16), origin_warehouse_id: 'wh-2', destination_warehouse_id: 'wh-4', origin_name: 'CD Osasco', destination_name: 'Full Mercado Livre', items: [{ sku: 'BBR-CHU-A1', name: 'Chupeta Silicone', quantity: 200 }] },
  { id: 'tr-4', status: 'completed', notes: 'Cross-dock Amazon', created_at: daysAgo(3), origin_warehouse_id: 'wh-1', destination_warehouse_id: 'wh-5', origin_name: 'CD Cotia', destination_name: 'Full Amazon', items: [{ sku: 'TEC-FNT-20W', name: 'Carregador 20W', quantity: 80 }] },
  { id: 'tr-5', status: 'completed', notes: 'Balanceamento entre CDs SP', created_at: daysAgo(1), origin_warehouse_id: 'wh-1', destination_warehouse_id: 'wh-2', origin_name: 'CD Cotia', destination_name: 'CD Osasco', items: [{ sku: 'PLM-FRD-M', name: 'Fralda Pluma M', quantity: 50 }] },
  { id: 'tr-6', status: 'in_transit', notes: 'Envio regional RJ', created_at: daysAgo(0, 10), origin_warehouse_id: 'wh-6', destination_warehouse_id: 'wh-7', origin_name: 'CD Barueri', destination_name: 'CD Rio de Janeiro', items: [{ sku: 'PET-RAC-10', name: 'Ração Premium 10kg', quantity: 40 }] },
];

export type DemoReturnRow = {
  id: string;
  status: string;
  order_reference?: string | null;
  reason?: string | null;
  created_at: string;
  sku: string;
  product_name: string;
  quantity: number;
  store_name: string;
};

export const DEMO_RETURNS: DemoReturnRow[] = [
  { id: 'ret-1', status: 'triage', order_reference: 'ML-884921', reason: 'Embalagem violada', created_at: daysAgo(0, 13), sku: 'PLM-FRD-P', product_name: 'Fralda Pluma P', quantity: 2, store_name: 'Pluma Baby' },
  { id: 'ret-2', status: 'received', order_reference: 'SHP-992814', reason: 'Tamanho incorreto', created_at: daysAgo(0, 15), sku: 'MOD-CAM-M', product_name: 'Camiseta M Preta', quantity: 1, store_name: 'Stock Express' },
  { id: 'ret-3', status: 'approved', order_reference: 'AMZ-771234', reason: 'Defeito fabricação', created_at: daysAgo(1), sku: 'TEC-FNT-20W', product_name: 'Carregador 20W', quantity: 1, store_name: 'Amazon Oficial' },
  { id: 'ret-4', status: 'rejected', order_reference: 'ML-881100', reason: 'Uso constatado', created_at: daysAgo(2), sku: 'BBR-MAM-300', product_name: 'Mamadeira 300ml', quantity: 1, store_name: 'Baby Bear' },
  { id: 'ret-5', status: 'completed', order_reference: 'SHP-990001', reason: 'Arrependimento', created_at: daysAgo(4), sku: 'STK-ORG-12', product_name: 'Organizador 12 Gavetas', quantity: 1, store_name: 'Stock 2.0' },
];

export type DemoInventoryRow = {
  id: string;
  inventory_type: string;
  status: string;
  created_at: string;
  warehouse_name: string;
  ls_inventory_items: Array<{
    id: string;
    product_id: string;
    system_quantity: number;
    counted_quantity?: number | null;
    difference?: number | null;
    last_actor_name?: string | null;
    last_counted_at?: string | null;
    ls_products?: { sku: string; name: string };
  }>;
};

export const DEMO_INVENTORIES: DemoInventoryRow[] = [
  {
    id: 'inv-1',
    inventory_type: 'rotating',
    status: 'review',
    created_at: daysAgo(0, 8),
    warehouse_name: 'Full Mercado Livre',
    ls_inventory_items: [
      { id: 'ii-1', product_id: 'prod-1', system_quantity: 120, counted_quantity: 118, difference: -2, ls_products: { sku: 'PLM-FRD-P', name: 'Fralda Pluma Premium P' } },
      { id: 'ii-2', product_id: 'prod-6', system_quantity: 45, counted_quantity: 45, difference: 0, ls_products: { sku: 'BBR-MAM-300', name: 'Mamadeira Anti-Cólica' } },
      { id: 'ii-3', product_id: 'prod-7', system_quantity: 80, counted_quantity: 82, difference: 2, ls_products: { sku: 'BBR-CHU-A1', name: 'Chupeta Silicone' } },
    ],
  },
  {
    id: 'inv-2',
    inventory_type: 'general',
    status: 'completed',
    created_at: daysAgo(5),
    warehouse_name: 'CD Principal',
    ls_inventory_items: [
      { id: 'ii-4', product_id: 'prod-8', system_quantity: 620, counted_quantity: 620, difference: 0, ls_products: { sku: 'TEC-CAB-2M', name: 'Cabo USB-C 2m' } },
    ],
  },
  {
    id: 'inv-3',
    inventory_type: 'rotating',
    status: 'open',
    created_at: daysAgo(1),
    warehouse_name: 'Full Shopee',
    ls_inventory_items: [
      { id: 'ii-5', product_id: 'prod-2', system_quantity: 186, counted_quantity: null, difference: null, ls_products: { sku: 'PLM-FRD-M', name: 'Fralda Pluma Premium M' } },
    ],
  },
];

export const DEMO_PICKING = [
  { sku: 'TEC-CAB-2M', name: 'Cabo USB-C 2m Reforçado', marketplace: 'shopee', store: 'Stock Express', quantity: 24 },
  { sku: 'PLM-FRD-M', name: 'Fralda Pluma Premium M 54un', marketplace: 'shopee', store: 'Stock Express', quantity: 12 },
  { sku: 'BBR-MAM-300', name: 'Mamadeira Anti-Cólica 300ml', marketplace: 'mercadolivre', store: 'Pluma Baby', quantity: 8 },
  { sku: 'PET-RAC-10', name: 'Ração Premium Cães 10kg', marketplace: 'amazon', store: 'Amazon Oficial', quantity: 6 },
  { sku: 'STK-GAR-500', name: 'Pote Hermético 500ml Kit 6', marketplace: 'shopee', store: 'Stock 2.0', quantity: 5 },
  { sku: 'PLM-FRD-P', name: 'Fralda Pluma Premium P 60un', marketplace: 'mercadolivre', store: 'Stock Express', quantity: 4 },
];

export const DEMO_REPLENISHMENT = [
  { sku: 'PLM-LEN-80', name: 'Lenço Umedecido Pluma 80un', suggested_purchase: 320 },
  { sku: 'MOD-CAM-M', name: 'Camiseta Básica M Preta', suggested_purchase: 80 },
  { sku: 'PET-BOL-500', name: 'Bolsa Transporte Pet P', suggested_purchase: 45 },
];

export const DEMO_WEBHOOKS = [
  { id: 'whk-1', name: 'Pedidos Shopee', url: 'https://api.logstoka.com.br/webhooks/shopee', events: ['order.paid', 'order.cancelled'], is_active: true },
  { id: 'whk-2', name: 'Mercado Livre Orders', url: 'https://api.logstoka.com.br/webhooks/mercadolivre', events: ['order.paid', 'stock.changed'], is_active: true },
  { id: 'whk-3', name: 'ERP Logta Sync', url: 'https://erp.logta.com.br/hooks/stock', events: ['stock.changed'], is_active: true },
];

export const DEMO_INTEGRATION_LOGS = [
  { id: 'log-1', direction: 'inbound', endpoint: 'webhook/shopee', status: 'success', created_at: daysAgo(0, 15) },
  { id: 'log-2', direction: 'outbound', endpoint: 'sync/ml/catalog', status: 'warning', created_at: daysAgo(0, 14) },
  { id: 'log-3', direction: 'inbound', endpoint: 'webhook/ml', status: 'success', created_at: daysAgo(0, 12) },
  { id: 'log-4', direction: 'outbound', endpoint: 'amazon/inventory', status: 'success', created_at: daysAgo(1) },
];

export const DEMO_CONFERENCE: Record<string, { sold: number; exit: number; returned: number; damaged: number }> = {
  shopee: { sold: 41, exit: 41, returned: 2, damaged: 0 },
  mercadolivre: { sold: 28, exit: 27, returned: 3, damaged: 1 },
  amazon: { sold: 14, exit: 14, returned: 1, damaged: 0 },
  tiktok: { sold: 6, exit: 6, returned: 0, damaged: 0 },
  magalu: { sold: 9, exit: 9, returned: 0, damaged: 0 },
};

export const DEMO_AI_BRIEFING =
  'Hoje: 18 entradas, 42 saídas e 3 SKUs abaixo do mínimo. Priorize reposição de PLM-LEN-80 e aprovação do inventário Full ML. Transferência TR-8841 em trânsito para Full Shopee.';

export type ImportColumnIssue = {
  column_index: number;
  column_header: string;
  expected: string;
  severity: 'error' | 'warning';
  message: string;
};

export type ImportParsedLine = {
  row_index: number;
  sku: string;
  quantity: number;
  marketplace: string;
  store: string;
  warehouse: string;
  date: string;
  product_name: string;
  status: 'ok' | 'error' | 'warning';
  message?: string;
};

export type ImportValidationSnapshot = {
  valid: boolean;
  score: number;
  rows_total: number;
  rows_ok: number;
  summary: string;
  column_issues: ImportColumnIssue[];
  line_issues: Array<{ row_index: number; message: string; severity: 'error' | 'warning' }>;
  lines: ImportParsedLine[];
  headers: string[];
  raw_rows: string[][];
};

export type DemoImportRow = {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  rows_processed: number;
  created_at: string;
  validation?: ImportValidationSnapshot;
  movements_created?: number;
};

export const DEMO_IMPORTS: DemoImportRow[] = [
  { id: 'imp-1', file_name: 'NFe_45821.xml', file_type: 'xml', status: 'completed', rows_processed: 12, created_at: daysAgo(0, 7) },
  { id: 'imp-2', file_name: 'vendas_shopee_marco.csv', file_type: 'csv', status: 'completed', rows_processed: 842, created_at: daysAgo(1) },
  { id: 'imp-3', file_name: 'relatorio_ml.xlsx', file_type: 'xlsx', status: 'completed', rows_processed: 614, created_at: daysAgo(2) },
  { id: 'imp-4', file_name: 'nota_fiscal_scan.pdf', file_type: 'pdf', status: 'warning', rows_processed: 8, created_at: daysAgo(3) },
  {
    id: 'imp-6',
    file_name: 'vendas_semana_errada.xlsx',
    file_type: 'xlsx',
    status: 'failed',
    rows_processed: 0,
    created_at: daysAgo(0, 9),
    validation: {
      valid: false,
      score: 42,
      rows_total: 15,
      rows_ok: 6,
      summary: '2 coluna(s) com erro — refaça o cabeçalho usando o modelo oficial.',
      headers: ['produto', 'qtd_vendida', 'canal', 'loja_nome'],
      raw_rows: [],
      column_issues: [
        {
          column_index: 1,
          column_header: 'produto',
          expected: 'sku',
          severity: 'error',
          message: 'Coluna "produto" deveria ser "sku". Renomeie conforme o modelo oficial.',
        },
        {
          column_index: 2,
          column_header: 'qtd_vendida',
          expected: 'quantidade',
          severity: 'error',
          message: 'Coluna "qtd_vendida" deveria ser "quantidade".',
        },
      ],
      line_issues: [
        { row_index: 4, message: 'Linha 4: SKU "XYZ-999" não cadastrado', severity: 'warning' },
        { row_index: 8, message: 'Linha 8: quantidade "abc" inválida', severity: 'error' },
      ],
      lines: [],
    },
  },
  { id: 'imp-5', file_name: 'foto_romaneio.jpg', file_type: 'ocr', status: 'completed', rows_processed: 24, created_at: daysAgo(4) },
];

export function findDemoProductByScan(value: string, mode: 'code' | 'barcode') {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const q = trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');

  return (
    DEMO_PRODUCTS.find((p) => {
      if (mode === 'barcode') {
        return (
          (p.barcode ?? '').toLowerCase() === q ||
          (p.barcode ?? '').replace(/\D/g, '') === digits
        );
      }
      const internal = (p.internal_code ?? '').toLowerCase();
      return (
        p.sku.toLowerCase() === q ||
        internal === q ||
        internal === trimmed.toUpperCase() ||
        (p.barcode ?? '').replace(/\D/g, '') === digits ||
        p.name.toLowerCase() === q ||
        p.name.toLowerCase().includes(q)
      );
    }) ?? null
  );
}

export function filterDemoProducts(search: string, page: number, limit: number) {
  let list = [...DEMO_PRODUCTS];
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode ?? '').includes(q) ||
        (p.internal_code ?? '').toLowerCase().includes(q),
    );
  }
  const total = list.length;
  const from = (page - 1) * limit;
  return { products: list.slice(from, from + limit), total };
}

export function getDemoProductById(id: string) {
  return DEMO_PRODUCTS.find((p) => p.id === id) ?? null;
}

export function getDemoProductBySku(sku: string | null | undefined) {
  if (!sku || !DEMO_PRODUCTS?.length) return null;
  return DEMO_PRODUCTS.find((p) => p.sku === sku) ?? null;
}

export function patchDemoProductIdentifiers(
  productId: string,
  payload: { internal_code: string; barcode: string; sku?: string },
): void {
  const product = DEMO_PRODUCTS.find((p) => p.id === productId);
  if (!product) return;
  product.internal_code = payload.internal_code;
  product.barcode = payload.barcode;
  if (payload.sku) product.sku = payload.sku;
  product.updated_at = new Date().toISOString();
}

export function getDemoCategoryName(categoryId: string | null | undefined): string {
  if (!categoryId) return '—';
  return DEMO_CATEGORIES.find((c) => c.id === categoryId)?.name ?? '—';
}

export function getDemoStockForProduct(productId: string): LsStockRow[] {
  return DEMO_STOCK.filter((s) => s.product_id === productId);
}

export function getDemoProductStockStats(productId: string) {
  const rows = getDemoStockForProduct(productId);
  const total = rows.reduce((sum, r) => sum + r.quantity, 0);
  const reserved = rows.reduce((sum, r) => sum + r.reserved_quantity, 0);
  return { total, reserved, available: total - reserved, rows };
}

export function getDemoMovementById(id: string) {
  return DEMO_MOVEMENTS.find((m) => m.id === id) ?? null;
}

export function getDemoTransferForMovement(m: DemoMovementRow): DemoTransferRow | null {
  if (m.movement_type !== 'transfer') return null;
  const byRef = DEMO_TRANSFERS.find((t) => m.reference_code && t.notes?.includes(m.reference_code));
  if (byRef) return byRef;
  return (
    DEMO_TRANSFERS.find(
      (t) =>
        t.items.some((i) => i.sku === m.sku && i.quantity === m.total_quantity) &&
        (t.origin_warehouse_id === m.warehouse_id || t.origin_name === m.warehouse_name),
    ) ?? null
  );
}

export function getDemoRelatedMovements(m: DemoMovementRow, limit = 5): DemoMovementRow[] {
  if (!m.sku) return [];
  return DEMO_MOVEMENTS.filter((row) => row.sku === m.sku && row.id !== m.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function getDemoMovementStockSnapshot(m: DemoMovementRow) {
  const product = getDemoProductBySku(m.sku);
  if (!product) return null;
  const rows = getDemoStockForProduct(product.id);
  const atWarehouse = rows.find((r) => r.warehouse_id === m.warehouse_id);
  const total = rows.reduce((sum, r) => sum + r.quantity, 0);
  return {
    product,
    atWarehouse: atWarehouse?.quantity ?? 0,
    totalStock: total,
  };
}

export function movementSubTypeLabel(type: string, subType: string) {
  const map: Record<string, Record<string, string>> = {
    entry: { purchase: 'Compra', factory: 'Fábrica', xml: 'NF-e / XML' },
    exit: { sale: 'Venda' },
    transfer: { warehouse: 'Entre depósitos' },
    damage: { handling: 'Manuseio', transport: 'Transporte', other: 'Outro' },
    return: { customer: 'Devolução de cliente' },
  };
  return map[type]?.[subType] ?? subType;
}

export function movementStatusLabel(status: string) {
  const map: Record<string, string> = {
    completed: 'Concluída',
    pending: 'Pendente',
    in_transit: 'Em trânsito',
    cancelled: 'Cancelada',
    review: 'Em revisão',
    triage: 'Triagem',
  };
  return map[status] ?? status;
}

export function movementTabFromType(type: string): 'entry' | 'exit' | 'transfer' | 'damage' {
  if (type === 'exit') return 'exit';
  if (type === 'transfer') return 'transfer';
  if (type === 'damage') return 'damage';
  return 'entry';
}

export function getDemoTransferById(id: string) {
  return DEMO_TRANSFERS.find((t) => t.id === id) ?? null;
}

export function getDemoReturnById(id: string) {
  return DEMO_RETURNS.find((r) => r.id === id) ?? null;
}

export function getDemoImportById(id: string) {
  return DEMO_IMPORTS.find((i) => i.id === id) ?? null;
}

export function getDemoInventoryById(id: string) {
  return DEMO_INVENTORIES.find((i) => i.id === id) ?? null;
}

export function getDemoAlertById(id: string) {
  return DEMO_ALERTS.find((a) => a.id === id) ?? null;
}

export function getDemoIntegrationLogById(id: string) {
  return DEMO_INTEGRATION_LOGS.find((l) => l.id === id) ?? null;
}

export function getDemoPickingByKey(key: string) {
  const [sku, marketplace, store] = decodeURIComponent(key).split('|');
  return DEMO_PICKING.find((p) => p.sku === sku && p.marketplace === marketplace && p.store === store) ?? null;
}

export function pickingDetailKey(row: { sku: string; marketplace?: string | null; store?: string | null }) {
  return encodeURIComponent(`${row.sku}|${row.marketplace ?? ''}|${row.store ?? ''}`);
}

export function getDemoProductTimeline(productId: string): LsStockMovement[] {
  const prod = DEMO_PRODUCTS.find((p) => p.id === productId);
  if (!prod) return [];
  return DEMO_MOVEMENTS.filter((m) => m.sku === prod.sku).map(({ sku, product_name, warehouse_name, ...m }) => m);
}

export function getDemoProductMovementStats(productId: string) {
  const timeline = getDemoProductTimeline(productId);
  const sumType = (type: MovementType) =>
    timeline.filter((m) => m.movement_type === type).reduce((sum, m) => sum + m.total_quantity, 0);
  return {
    entries: sumType('entry'),
    exits: sumType('exit'),
    returns: sumType('return'),
    transfers: sumType('transfer'),
    damage: sumType('damage'),
  };
}

export function getDemoReports(_period: number) {
  return {
    entries: 1840,
    exitsByMp: {
      shopee: 920,
      mercadolivre: 640,
      amazon: 380,
      magalu: 120,
      tiktok: 86,
    } as Record<string, number>,
    topProducts: [
      { sku: 'TEC-CAB-2M', name: 'Cabo USB-C 2m', qty: 412 },
      { sku: 'PLM-FRD-M', name: 'Fralda Pluma M', qty: 328 },
      { sku: 'PLM-FRD-P', name: 'Fralda Pluma P', qty: 290 },
      { sku: 'STK-GAR-500', name: 'Pote Hermético Kit 6', qty: 156 },
      { sku: 'BBR-MAM-300', name: 'Mamadeira 300ml', qty: 142 },
    ],
  };
}

export function movementTypeLabel(t: MovementType | string) {
  const map: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Saída',
    transfer: 'Transferência',
    return: 'Devolução',
    damage: 'Avaria',
    inventory_adjustment: 'Ajuste inventário',
  };
  return map[t] ?? t;
}

export function marketplaceLabel(mp: Marketplace | string | null | undefined) {
  if (!mp) return '—';
  return MARKETPLACE_LABELS[mp as Marketplace] ?? mp;
}
