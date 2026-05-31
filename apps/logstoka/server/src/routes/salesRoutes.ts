import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { fetchSalesDashboard } from '../services/salesDashboardService.js';

export function registerSalesRoutes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.get('/v1/sales/dashboard', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const days = Math.min(365, Math.max(1, Number(req.query.days ?? 30)));

    try {
      const data = await fetchSalesDashboard(admin, req.auth.companyId, days);
      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Erro ao carregar vendas' });
    }
  });
}
