import type { SupabaseClient } from '@supabase/supabase-js';

export interface MovementItemInput {
  sku?: string;
  barcode?: string;
  product_id?: string;
  quantity: number;
  unit_cost?: number;
}

export interface CreateMovementInput {
  companyId: string;
  userId: string;
  movementType: 'entry' | 'exit' | 'transfer' | 'return' | 'damage' | 'inventory_adjustment';
  subType: string;
  warehouseId: string;
  targetWarehouseId?: string;
  supplierId?: string;
  storeId?: string;
  marketplace?: string;
  invoiceNumber?: string;
  invoiceXml?: string;
  referenceCode?: string;
  notes?: string;
  items: MovementItemInput[];
}

async function resolveProduct(
  admin: SupabaseClient,
  companyId: string,
  item: MovementItemInput,
) {
  if (item.product_id) {
    const { data } = await admin
      .from('ls_products')
      .select('id, sku, cost')
      .eq('company_id', companyId)
      .eq('id', item.product_id)
      .maybeSingle();
    if (data) return data;
  }

  if (item.sku) {
    const { data: bySku } = await admin
      .from('ls_products')
      .select('id, sku, cost')
      .eq('company_id', companyId)
      .eq('sku', item.sku)
      .maybeSingle();
    if (bySku) return bySku;

    const { data: byInternal } = await admin
      .from('ls_products')
      .select('id, sku, cost')
      .eq('company_id', companyId)
      .eq('internal_code', item.sku)
      .maybeSingle();
    if (byInternal) return byInternal;
  }

  if (item.barcode) {
    const { data } = await admin
      .from('ls_products')
      .select('id, sku, cost')
      .eq('company_id', companyId)
      .eq('barcode', item.barcode)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

async function applyStockDelta(
  admin: SupabaseClient,
  companyId: string,
  warehouseId: string,
  productId: string,
  delta: number,
) {
  const { error } = await admin.rpc('ls_apply_stock_delta', {
    p_company_id: companyId,
    p_warehouse_id: warehouseId,
    p_product_id: productId,
    p_delta: delta,
  });
  if (error) throw new Error(error.message);
}

async function getDefaultWarehouse(admin: SupabaseClient, companyId: string) {
  const { data } = await admin
    .from('ls_warehouses')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id as string | undefined;
}

export async function createMovementWithStock(
  admin: SupabaseClient,
  input: CreateMovementInput,
) {
  const warehouseId = input.warehouseId || (await getDefaultWarehouse(admin, input.companyId));
  if (!warehouseId) throw new Error('Nenhum depósito configurado para a empresa');

  const resolvedItems: Array<{
    product_id: string;
    sku: string;
    quantity: number;
    unit_cost?: number;
  }> = [];

  for (const item of input.items) {
    const product = await resolveProduct(admin, input.companyId, item);
    if (!product) {
      throw new Error(`Produto não encontrado: ${item.sku || item.barcode || item.product_id || '?'}`);
    }
    if (item.quantity <= 0) continue;
    resolvedItems.push({
      product_id: product.id,
      sku: product.sku,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? Number(product.cost ?? 0),
    });
  }

  if (resolvedItems.length === 0) {
    throw new Error('Nenhum item válido informado');
  }

  const totalQuantity = resolvedItems.reduce((acc, i) => acc + i.quantity, 0);
  const isTransfer = input.movementType === 'transfer';
  const isExit = input.movementType === 'exit' || input.movementType === 'damage';
  const stockMultiplier = isExit ? -1 : isTransfer ? -1 : 1;

  const { data: movement, error: movementError } = await admin
    .from('ls_stock_movements')
    .insert({
      company_id: input.companyId,
      movement_type: input.movementType,
      sub_type: input.subType,
      status: 'completed',
      warehouse_id: warehouseId,
      target_warehouse_id: input.targetWarehouseId,
      supplier_id: input.supplierId,
      store_id: input.storeId,
      marketplace: input.marketplace,
      invoice_number: input.invoiceNumber,
      invoice_xml: input.invoiceXml,
      reference_code: input.referenceCode,
      notes: input.notes,
        created_by: input.userId || null,
      total_items: resolvedItems.length,
      total_quantity: totalQuantity,
    })
    .select('*')
    .single();

  if (movementError || !movement) {
    throw new Error(movementError?.message ?? 'Falha ao criar movimentação');
  }

  const movementItems = resolvedItems.map((item) => ({
    movement_id: movement.id,
    product_id: item.product_id,
    sku: item.sku,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
  }));

  const { error: itemsError } = await admin.from('ls_stock_movement_items').insert(movementItems);
  if (itemsError) throw new Error(itemsError.message);

  for (const item of resolvedItems) {
    if (isTransfer && input.targetWarehouseId) {
      await applyStockDelta(admin, input.companyId, warehouseId, item.product_id, -item.quantity);
      await applyStockDelta(
        admin,
        input.companyId,
        input.targetWarehouseId,
        item.product_id,
        item.quantity,
      );
    } else {
      await applyStockDelta(
        admin,
        input.companyId,
        warehouseId,
        item.product_id,
        item.quantity * stockMultiplier,
      );
    }
  }

  return { movement, items: resolvedItems };
}

export async function checkLowStockAlerts(admin: SupabaseClient, companyId: string) {
  const { data: products } = await admin
    .from('ls_products')
    .select('id, sku, name, min_stock')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!products?.length) return;

  for (const product of products) {
    const { data: stockRows } = await admin
      .from('ls_stock')
      .select('quantity')
      .eq('company_id', companyId)
      .eq('product_id', product.id);

    const total = (stockRows ?? []).reduce((acc, r) => acc + Number(r.quantity ?? 0), 0);
    const min = Number(product.min_stock ?? 0);

    if (total <= 0) {
      await admin.from('ls_alerts').insert({
        company_id: companyId,
        alert_type: 'stock_zero',
        severity: 'critical',
        title: `Estoque zerado: ${product.sku}`,
        message: `${product.name} está sem saldo.`,
        entity_type: 'product',
        entity_id: product.id,
      });
    } else if (total <= min) {
      await admin.from('ls_alerts').insert({
        company_id: companyId,
        alert_type: 'stock_minimum',
        severity: 'warning',
        title: `Abaixo do mínimo: ${product.sku}`,
        message: `${product.name} — saldo ${total}, mínimo ${min}.`,
        entity_type: 'product',
        entity_id: product.id,
      });
    }
  }
}
