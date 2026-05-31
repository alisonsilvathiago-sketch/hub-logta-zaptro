import { getProductLocationByKey } from './productLocation.js';

export type DemoCatalogProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  barcode: string;
  min_stock: number;
  total_stock: number;
  warehouses: Array<{ name: string; quantity: number }>;
};

const DEMO_PRODUCTS: DemoCatalogProduct[] = [
  { id: 'prod-1', sku: 'PLM-FRD-P', name: 'Fralda Pluma Premium P 60un', brand: 'Pluma', barcode: '7891000000001', min_stock: 120, total_stock: 840, warehouses: [{ name: 'CD Principal', quantity: 520 }, { name: 'Full Shopee', quantity: 320 }] },
  { id: 'prod-2', sku: 'PLM-FRD-M', name: 'Fralda Pluma Premium M 54un', brand: 'Pluma', barcode: '7891000000002', min_stock: 150, total_stock: 620, warehouses: [{ name: 'CD Principal', quantity: 400 }, { name: 'Full Mercado Livre', quantity: 220 }] },
  { id: 'prod-3', sku: 'PLM-LEN-80', name: 'Lenço Umedecido Pluma 80un', brand: 'Pluma', barcode: '7891000000003', min_stock: 200, total_stock: 45, warehouses: [{ name: 'CD Principal', quantity: 45 }] },
  { id: 'prod-4', sku: 'STK-ORG-12', name: 'Organizador Modular 12 Gavetas', brand: 'Stock Express', barcode: '7891000000004', min_stock: 30, total_stock: 156, warehouses: [{ name: 'CD Principal', quantity: 156 }] },
  { id: 'prod-5', sku: 'STK-GAR-500', name: 'Pote Hermético 500ml Kit 6', brand: 'Stock Express', barcode: '7891000000005', min_stock: 80, total_stock: 310, warehouses: [{ name: 'CD Principal', quantity: 250 }, { name: 'Full Shopee', quantity: 60 }] },
  { id: 'prod-6', sku: 'BBR-MAM-300', name: 'Mamadeira Anti-Cólica 300ml', brand: 'Baby Bear', barcode: '7891000000006', min_stock: 60, total_stock: 188, warehouses: [{ name: 'Full Mercado Livre', quantity: 188 }] },
  { id: 'prod-7', sku: 'BBR-CHU-A1', name: 'Chupeta Silicone 0-6m', brand: 'Baby Bear', barcode: '7891000000007', min_stock: 100, total_stock: 520, warehouses: [{ name: 'CD Secundário', quantity: 520 }] },
  { id: 'prod-8', sku: 'TEC-CAB-2M', name: 'Cabo USB-C 2m Reforçado', brand: 'TechParts', barcode: '7891000000008', min_stock: 50, total_stock: 890, warehouses: [{ name: 'Full Shopee', quantity: 890 }] },
  { id: 'prod-9', sku: 'TEC-FNT-20W', name: 'Carregador Turbo 20W', brand: 'TechParts', barcode: '7891000000009', min_stock: 40, total_stock: 275, warehouses: [{ name: 'CD Principal', quantity: 275 }] },
  { id: 'prod-10', sku: 'MOD-CAM-M', name: 'Camiseta Básica M Preta', brand: 'ModaStock', barcode: '7891000000010', min_stock: 25, total_stock: 98, warehouses: [{ name: 'CD Principal', quantity: 98 }] },
  { id: 'prod-11', sku: 'PET-RAC-10', name: 'Ração Premium Cães 10kg', brand: 'PetMax', barcode: '7891000000011', min_stock: 20, total_stock: 64, warehouses: [{ name: 'Full Amazon', quantity: 64 }] },
  { id: 'prod-12', sku: 'PET-BOL-500', name: 'Bolsa Transporte Pet P', brand: 'PetMax', barcode: '7891000000012', min_stock: 15, total_stock: 32, warehouses: [{ name: 'CD Principal', quantity: 32 }] },
];

const DEMO_MOVEMENTS = [
  { id: 'mov-1', reference_code: 'NF-45821', sku: 'PLM-FRD-P', product_name: 'Fralda Pluma Premium P', movement_type: 'entry', total_quantity: 240 },
  { id: 'mov-2', reference_code: 'NF-45822', sku: 'STK-ORG-12', product_name: 'Organizador Modular', movement_type: 'entry', total_quantity: 180 },
  { id: 'mov-3', reference_code: 'Stock Express', sku: 'PLM-FRD-M', product_name: 'Fralda Pluma Premium M', movement_type: 'exit', total_quantity: 12 },
];

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function searchDemoCatalog(query: string, limit = 6): DemoCatalogProduct[] {
  const q = norm(query);
  if (q.length < 2) return [];
  return DEMO_PRODUCTS.filter(
    (p) =>
      p.sku.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.barcode.includes(q.replace(/\D/g, '')),
  ).slice(0, limit);
}

export function getDemoProductBySku(sku: string): DemoCatalogProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.sku.toLowerCase() === sku.trim().toLowerCase());
}

export function findDemoMovementByReference(ref: string) {
  const q = norm(ref);
  return DEMO_MOVEMENTS.find((m) => m.reference_code.toLowerCase().includes(q) || m.id.toLowerCase() === q);
}

export function buildDemoProductFacts(product: DemoCatalogProduct) {
  const location = getProductLocationByKey(product.sku);
  const belowMin = product.total_stock <= product.min_stock;
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    total_stock: product.total_stock,
    min_stock: product.min_stock,
    below_minimum: belowMin,
    location: location.label,
    warehouses: product.warehouses,
    product_path: `/app/products/${product.id}`,
  };
}
