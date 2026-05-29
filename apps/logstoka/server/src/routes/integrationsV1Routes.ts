import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import {
  disconnectIntegrationStore,
  getIntegration,
  isDbIntegrationProvider,
  listIntegrations,
  recordIntegrationSync,
  updateIntegrationConfig,
} from '../services/integrationStoreService.js';

export function registerIntegrationsV1Routes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.get('/v1/integrations', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    try {
      const data = await listIntegrations(admin, req.auth.companyId);
      res.json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao listar integrações';
      res.status(400).json({ error: message });
    }
  });

  app.get('/v1/integrations/:provider', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    const provider = String(req.params.provider);
    if (!isDbIntegrationProvider(provider)) {
      return res.status(400).json({ error: 'Provider inválido' });
    }

    try {
      const data = await getIntegration(admin, req.auth.companyId, provider);
      res.json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar integração';
      res.status(400).json({ error: message });
    }
  });

  app.patch('/v1/integrations/:provider', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    const provider = String(req.params.provider);
    if (!isDbIntegrationProvider(provider)) {
      return res.status(400).json({ error: 'Provider inválido' });
    }

    const { stores, sync } = req.body ?? {};

    try {
      const data = await updateIntegrationConfig(admin, req.auth.companyId, provider, { stores, sync });
      res.json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configuração';
      res.status(400).json({ error: message });
    }
  });

  app.delete('/v1/integrations/:provider', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    const provider = String(req.params.provider);
    if (!isDbIntegrationProvider(provider)) {
      return res.status(400).json({ error: 'Provider inválido' });
    }

    try {
      await disconnectIntegrationStore(admin, req.auth.companyId, provider);
      res.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desconectar';
      res.status(400).json({ error: message });
    }
  });

  app.post('/v1/integrations/:provider/sync', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) {
      return res.status(503).json({ error: 'Supabase não configurado no servidor' });
    }

    const provider = String(req.params.provider);
    if (!isDbIntegrationProvider(provider)) {
      return res.status(400).json({ error: 'Provider inválido' });
    }

    try {
      const data = await recordIntegrationSync(admin, req.auth.companyId, provider);
      res.json({ data });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar';
      res.status(400).json({ error: message });
    }
  });
}
