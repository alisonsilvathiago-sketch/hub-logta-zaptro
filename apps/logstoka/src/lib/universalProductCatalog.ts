import type { Marketplace } from '@/types';

import type { ProductPublicationStatus } from '@/types';

/** Especificação de imagem — alinhada ao menor denominador comum dos marketplaces */
export const UNIVERSAL_PRODUCT_IMAGE = {
  minWidth: 1000,
  minHeight: 1000,
  maxFileSizeMb: 5,
  acceptedMime: ['image/jpeg', 'image/png', 'image/webp'] as const,
  acceptedLabel: 'JPG, PNG ou WEBP',
  hint: 'Mín. 1000×1000 px · fundo branco preferencial · até 5 MB',
} as const;

/** Unidades compatíveis com NF-e e marketplaces BR */
export const PRODUCT_UNITS = ['UN', 'CX', 'PC', 'KG', 'G', 'L', 'ML', 'M', 'CM', 'PAR'] as const;

/** Origem mercadoria (ICMS) — tabela SPED */
export const PRODUCT_ORIGIN_CODES = [
  { value: '0', label: '0 — Nacional' },
  { value: '1', label: '1 — Estrangeira (importação direta)' },
  { value: '2', label: '2 — Estrangeira (mercado interno)' },
] as const;

/**
 * Como ERPs (Bling/Tiny) e hubs (Anymarket) operam:
 * - Um registro mestre com todos os campos abaixo
 * - Adaptadores por marketplace mapeiam categorias/atributos obrigatórios do canal
 * - Estoque e preço saem do mestre; canal pode ter override opcional
 */
export type UniversalProductFields = {
  sku: string;
  internal_code: string;
  barcode: string;
  name: string;
  short_name: string;
  brand: string;
  category_id: string;
  ncm: string;
  origin_code: string;
  unit: string;
  description_short: string;
  description: string;
  description_html: string;
  cost: string;
  sale_price: string;
  promo_price: string;
  min_stock: string;
  max_stock: string;
  weight_kg: string;
  height_cm: string;
  width_cm: string;
  length_cm: string;
  status: 'active' | 'inactive';
  publication_status: ProductPublicationStatus;
};

export const emptyUniversalProductForm = (): UniversalProductFields => ({
  sku: '',
  internal_code: '',
  barcode: '',
  name: '',
  short_name: '',
  brand: '',
  category_id: '',
  ncm: '',
  origin_code: '0',
  unit: 'UN',
  description_short: '',
  description: '',
  description_html: '',
  cost: '0',
  sale_price: '0',
  promo_price: '',
  min_stock: '0',
  max_stock: '',
  weight_kg: '',
  height_cm: '',
  width_cm: '',
  length_cm: '',
  status: 'active',
  publication_status: 'draft',
});

/** Requisitos resumidos por canal — para UI e validação de publicação */
export const MARKETPLACE_PUBLISH_REQUIREMENTS: Record<
  Marketplace,
  { titleMax: number; imagesMin: number; needsBarcode: boolean; needsWeight: boolean }
> = {
  shopee: { titleMax: 120, imagesMin: 1, needsBarcode: false, needsWeight: true },
  mercadolivre: { titleMax: 60, imagesMin: 1, needsBarcode: true, needsWeight: true },
  amazon: { titleMax: 200, imagesMin: 1, needsBarcode: true, needsWeight: true },
  tiktok: { titleMax: 255, imagesMin: 1, needsBarcode: false, needsWeight: true },
  magalu: { titleMax: 150, imagesMin: 1, needsBarcode: true, needsWeight: true },
};

export const EXTENDED_MARKETPLACE_CHANNELS = [
  'shopee',
  'mercadolivre',
  'amazon',
  'tiktok',
  'magalu',
  'shein',
] as const;

export type ExtendedMarketplaceChannel = (typeof EXTENDED_MARKETPLACE_CHANNELS)[number];
