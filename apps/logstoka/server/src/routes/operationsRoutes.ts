import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { createMovementWithStock } from '../services/stockService.js';

export function registerOperationsRoutes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.post('/v1/returns/:id/triage', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_returns')
      .update({ status: 'triage', triaged_by: req.auth.userId, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.post('/v1/returns/:id/approve', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data: ret } = await admin
      .from('ls_returns')
      .select('*, ls_return_items(*)')
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .single();

    if (!ret) return res.status(404).json({ error: 'Devolução não encontrada' });

    const warehouseId = ret.warehouse_id || req.body?.warehouse_id;
    if (!warehouseId) return res.status(400).json({ error: 'warehouse_id required' });

    const items = (ret.ls_return_items ?? [])
      .filter((i: { condition?: string }) => i.condition !== 'damaged' && i.condition !== 'missing')
      .map((i: { product_id: string; quantity: number }) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
      }));

    if (items.length > 0) {
      await createMovementWithStock(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        movementType: 'return',
        subType: 'customer_return_approved',
        warehouseId,
        referenceCode: ret.order_reference,
        notes: ret.notes,
        items,
      });
    }

    const { data, error } = await admin
      .from('ls_returns')
      .update({
        status: 'approved',
        approved_by: req.auth.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.post('/v1/returns/:id/reject', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { reason, warehouse_id } = req.body ?? {};
    const { data: ret } = await admin
      .from('ls_returns')
      .select('*, ls_return_items(*)')
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .single();

    if (!ret) return res.status(404).json({ error: 'Devolução não encontrada' });

    const warehouseId = warehouse_id || ret.warehouse_id;
    for (const item of ret.ls_return_items ?? []) {
      if (warehouseId) {
        await createMovementWithStock(admin, {
          companyId: req.auth.companyId,
          userId: req.auth.userId,
          movementType: 'damage',
          subType: 'return_rejected',
          warehouseId,
          notes: reason || ret.reason,
          items: [{ product_id: item.product_id, quantity: Number(item.quantity) }],
        });
      }
    }

    const { data, error } = await admin
      .from('ls_returns')
      .update({ status: 'rejected', notes: reason || ret.notes })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.post('/v1/inventories', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { warehouse_id, inventory_type, notes } = req.body ?? {};
    const { data: inv, error } = await admin
      .from('ls_inventories')
      .insert({
        company_id: req.auth.companyId,
        warehouse_id,
        inventory_type: inventory_type ?? 'rotating',
        status: 'counting',
        notes,
        started_by: req.auth.userId,
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const { data: stockRows } = await admin
      .from('ls_stock')
      .select('product_id, quantity')
      .eq('company_id', req.auth.companyId)
      .eq('warehouse_id', warehouse_id);

    if (stockRows?.length) {
      await admin.from('ls_inventory_items').insert(
        stockRows.map((r) => ({
          inventory_id: inv.id,
          product_id: r.product_id,
          system_quantity: r.quantity,
        })),
      );
    }

    res.status(201).json({ data: inv });
  });

  app.post('/v1/inventories/:id/count', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { product_id, sku, counted_quantity } = req.body ?? {};
    let pid = product_id;
    if (!pid && sku) {
      const { data: p } = await admin
        .from('ls_products')
        .select('id')
        .eq('company_id', req.auth.companyId)
        .eq('sku', sku)
        .maybeSingle();
      pid = p?.id;
    }
    if (!pid) return res.status(400).json({ error: 'Produto não encontrado' });

    const { data, error } = await admin
      .from('ls_inventory_items')
      .update({
        counted_quantity,
        counted_by: req.auth.userId,
        counted_at: new Date().toISOString(),
      })
      .eq('inventory_id', req.params.id)
      .eq('product_id', pid)
      .select('*')
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) {
      await admin.from('ls_inventory_items').insert({
        inventory_id: req.params.id,
        product_id: pid,
        system_quantity: 0,
        counted_quantity,
        counted_by: req.auth.userId,
        counted_at: new Date().toISOString(),
      });
    }

    await admin.from('ls_inventories').update({ status: 'review' }).eq('id', req.params.id);
    res.json({ ok: true });
  });

  app.post('/v1/inventories/:id/approve', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data: inv } = await admin
      .from('ls_inventories')
      .select('*')
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .single();

    if (!inv) return res.status(404).json({ error: 'Inventário não encontrado' });

    const { data: items } = await admin
      .from('ls_inventory_items')
      .select('*')
      .eq('inventory_id', inv.id);

    const adjustments: Array<{ product_id: string; delta: number }> = [];
    for (const item of items ?? []) {
      if (item.counted_quantity == null) continue;
      const diff = Number(item.counted_quantity) - Number(item.system_quantity);
      if (diff !== 0) adjustments.push({ product_id: item.product_id, delta: diff });
    }

    for (const adj of adjustments) {
      const movementType = adj.delta > 0 ? 'entry' : 'exit';
      await createMovementWithStock(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        movementType: movementType === 'entry' ? 'entry' : 'exit',
        subType: 'inventory_adjustment',
        warehouseId: inv.warehouse_id,
        notes: `Ajuste inventário ${inv.id}`,
        items: [{ product_id: adj.product_id, quantity: Math.abs(adj.delta) }],
      });
    }

    await admin
      .from('ls_inventories')
      .update({
        status: 'adjusted',
        approved_by: req.auth.userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', inv.id);

    res.json({ adjusted: adjustments.length });
  });

  app.patch('/v1/transfers/:id/ship', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_transfers')
      .update({ status: 'in_transit', shipped_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.patch('/v1/transfers/:id/receive', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_transfers')
      .update({ status: 'completed', received_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('company_id', req.auth.companyId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.get('/v1/products/:id/timeline', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const productId = req.params.id;
    const { data: itemRows } = await admin
      .from('ls_stock_movement_items')
      .select('movement_id, quantity, sku')
      .eq('product_id', productId);

    const movementIds = [...new Set((itemRows ?? []).map((r) => r.movement_id))];
    if (movementIds.length === 0) return res.json({ data: [] });

    const { data: movements } = await admin
      .from('ls_stock_movements')
      .select('*')
      .eq('company_id', req.auth.companyId)
      .in('id', movementIds)
      .order('created_at', { ascending: false })
      .limit(100);

    res.json({ data: movements ?? [] });
  });

  app.get('/v1/replenishment', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: products } = await admin
      .from('ls_products')
      .select('id, sku, name, min_stock')
      .eq('company_id', req.auth.companyId)
      .eq('status', 'active');

    const suggestions = [];
    for (const p of products ?? []) {
      const { data: exits } = await admin
        .from('ls_stock_movement_items')
        .select('quantity, ls_stock_movements!inner(movement_type, created_at, company_id)')
        .eq('product_id', p.id)
        .eq('ls_stock_movements.movement_type', 'exit')
        .eq('ls_stock_movements.company_id', req.auth.companyId)
        .gte('ls_stock_movements.created_at', since.toISOString());

      const sold30 = (exits ?? []).reduce((a, r) => a + Number(r.quantity ?? 0), 0);
      const avgDaily = sold30 / 30;
      const suggestedMin = Math.ceil(avgDaily * 14);

      const { data: stockRows } = await admin
        .from('ls_stock')
        .select('quantity')
        .eq('product_id', p.id)
        .eq('company_id', req.auth.companyId);

      const current = (stockRows ?? []).reduce((a, r) => a + Number(r.quantity ?? 0), 0);
      const min = Number(p.min_stock ?? 0);
      const reorderPoint = Math.max(min, suggestedMin);

      if (current <= reorderPoint) {
        suggestions.push({
          sku: p.sku,
          name: p.name,
          current,
          min_stock: min,
          suggested_min: suggestedMin,
          suggested_purchase: Math.max(reorderPoint - current, Math.ceil(avgDaily * 7)),
          avg_daily_sales: Number(avgDaily.toFixed(2)),
        });
      }
    }

    res.json({ data: suggestions });
  });
}
