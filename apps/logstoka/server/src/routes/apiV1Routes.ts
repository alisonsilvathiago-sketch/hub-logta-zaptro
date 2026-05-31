import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { registerImportRoutes, registerStockMovementRoutes } from './importRoutes.js';
import { registerOperationsRoutes } from './operationsRoutes.js';
import { registerAiRoutes } from './aiRoutes.js';
import { registerIntegrationsV1Routes } from './integrationsV1Routes.js';
import { registerSalesRoutes } from './salesRoutes.js';

export function registerApiV1Routes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  registerStockMovementRoutes(app, cfg);
  registerImportRoutes(app, cfg);
  registerOperationsRoutes(app, cfg);
  registerAiRoutes(app, cfg);
  registerIntegrationsV1Routes(app, cfg);
  registerSalesRoutes(app, cfg);

  app.get('/v1/products', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await admin
      .from('ls_products')
      .select('*', { count: 'exact' })
      .eq('company_id', req.auth.companyId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data, page, limit, total: count ?? 0 });
  });

  app.get('/v1/stock', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_stock')
      .select('*, ls_products(sku, name), ls_warehouses(name, code)')
      .eq('company_id', req.auth.companyId)
      .limit(500);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.get('/v1/movements', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_stock_movements')
      .select('*, ls_stock_movement_items(*)')
      .eq('company_id', req.auth.companyId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });

  app.post('/v1/transfers', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { origin_warehouse_id, destination_warehouse_id, items, notes } = req.body ?? {};
    const { data: transfer, error: transferError } = await admin
      .from('ls_transfers')
      .insert({
        company_id: req.auth.companyId,
        origin_warehouse_id,
        destination_warehouse_id,
        notes,
        created_by: req.auth.userId,
        status: 'pending',
      })
      .select('*')
      .single();

    if (transferError) return res.status(400).json({ error: transferError.message });

    if (Array.isArray(items) && items.length > 0) {
      try {
        const { createMovementWithStock } = await import('../services/stockService.js');
        await createMovementWithStock(admin, {
          companyId: req.auth.companyId,
          userId: req.auth.userId,
          movementType: 'transfer',
          subType: 'warehouse_transfer',
          warehouseId: origin_warehouse_id,
          targetWarehouseId: destination_warehouse_id,
          notes,
          items,
        });
        await admin.from('ls_transfers').update({ status: 'completed' }).eq('id', transfer.id);
      } catch (err) {
        return res.status(400).json({
          error: err instanceof Error ? err.message : 'Transfer failed',
          transfer,
        });
      }
    }

    res.status(201).json({ data: transfer });
  });

  app.post('/v1/returns', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { store_id, warehouse_id, reason, order_reference, notes, items } = req.body ?? {};
    const { data, error } = await admin
      .from('ls_returns')
      .insert({
        company_id: req.auth.companyId,
        store_id,
        warehouse_id,
        reason,
        order_reference,
        notes,
        created_by: req.auth.userId,
        status: 'received',
      })
      .select('*')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    if (Array.isArray(items) && items.length > 0) {
      for (const raw of items) {
        const item = raw as { sku?: string; product_id?: string; quantity: number };
        let productId = item.product_id;
        if (!productId && item.sku) {
          const { data: p } = await admin
            .from('ls_products')
            .select('id')
            .eq('company_id', req.auth.companyId)
            .eq('sku', item.sku)
            .maybeSingle();
          productId = p?.id;
        }
        if (!productId) continue;
        await admin.from('ls_return_items').insert({
          return_id: data.id,
          product_id: productId,
          quantity: item.quantity,
          condition: 'good',
        });
      }
    }

    res.status(201).json({ data });
  });

  app.post('/v1/damages', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { warehouse_id, product_id, quantity, reason, photo_url, notes, sku } = req.body ?? {};
    try {
      const { createMovementWithStock } = await import('../services/stockService.js');
      const result = await createMovementWithStock(admin, {
        companyId: req.auth.companyId,
        userId: req.auth.userId,
        movementType: 'damage',
        subType: reason ?? 'other',
        warehouseId: warehouse_id ?? '',
        notes: photo_url ? `${notes ?? ''} [foto: ${photo_url}]` : notes,
        items: [{ product_id, sku, quantity: Number(quantity ?? 1) }],
      });

      await admin.from('ls_damages').insert({
        company_id: req.auth.companyId,
        movement_id: result.movement.id,
        warehouse_id,
        product_id: result.items[0]?.product_id,
        quantity: Number(quantity ?? 1),
        reason: reason ?? 'other',
        photo_url,
        notes,
        created_by: req.auth.userId,
      });

      res.status(201).json({ data: result.movement });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Damage failed' });
    }
  });

  app.get('/v1/reports/summary', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data } = await admin
      .from('ls_stock_movements')
      .select('movement_type')
      .eq('company_id', req.auth.companyId)
      .gte('created_at', start.toISOString());

    const summary = { entries: 0, exits: 0, transfers: 0, returns: 0, damages: 0 };
    for (const row of data ?? []) {
      if (row.movement_type === 'entry') summary.entries += 1;
      if (row.movement_type === 'exit') summary.exits += 1;
      if (row.movement_type === 'transfer') summary.transfers += 1;
      if (row.movement_type === 'return') summary.returns += 1;
      if (row.movement_type === 'damage') summary.damages += 1;
    }

    res.json({ period: req.query.period ?? 'today', ...summary });
  });

  app.get('/v1/imports', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { data, error } = await admin
      .from('ls_reports_imports')
      .select('*')
      .eq('company_id', req.auth.companyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  });
}
