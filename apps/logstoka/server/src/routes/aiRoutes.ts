import type { Express } from 'express';
import type { LogstokaConfig } from '../config.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { runOperationalChat, generateDailyBriefing } from '../modules/ai/agents/operationalAgent.js';
import { validateImportRows } from '../modules/ai/documentReader.js';
import { suggestProduct } from '../modules/ai/productSuggestService.js';
import { interpretIntelligentScan } from '../modules/ai/intelligentScanService.js';
import { pingOllama } from '../modules/ai/ollamaService.js';
import { parseExcelBuffer, parsePdfBuffer, extractRowsWithOllama } from '../services/ocrImportService.js';
import { parseReportCsv } from '../services/importParser.js';
import { isDemoCompany } from '../lib/demoAuth.js';

export function registerAiRoutes(app: Express, cfg: LogstokaConfig) {
  const auth = requireAuth(cfg);

  app.get('/v1/ai/health', async (_req, res) => {
    const status = await pingOllama();
    res.json({ ollama: status });
  });

  app.get('/v1/ai/daily-briefing', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });
    try {
      const briefing = await generateDailyBriefing(cfg, admin, req.auth.companyId);
      res.json({ briefing });
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : 'IA indisponível' });
    }
  });

  app.post('/v1/ai/chat', auth, async (req: AuthedRequest, res) => {
    if (!req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { message, history, screen, user_name, company_name } = req.body ?? {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const admin = getSupabaseAdmin(cfg);
    const demo = isDemoCompany(req.auth.companyId);

    if (!admin && !demo) return res.status(503).json({ error: 'Service unavailable' });

    try {
      const result = await runOperationalChat(cfg, admin, req.auth.companyId, {
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
        screen: typeof screen === 'string' ? screen : undefined,
        userName: typeof user_name === 'string' ? user_name : undefined,
        companyName: typeof company_name === 'string' ? company_name : undefined,
      });
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : 'IA indisponível' });
    }
  });

  app.post('/v1/ai/scan-interpret', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const raw = String(req.body?.raw ?? '').trim();
    if (raw.length < 1) {
      return res.status(400).json({ error: 'raw is required' });
    }

    try {
      const result = await interpretIntelligentScan(cfg, admin, req.auth.companyId, {
        raw,
        format: String(req.body?.format ?? 'unknown'),
        extracted: req.body?.extracted,
        movement_type: req.body?.movement_type,
      });
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : 'Interpretação indisponível' });
    }
  });

  app.post('/v1/ai/product-suggest', auth, async (req: AuthedRequest, res) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin || !req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const query = String(req.body?.query ?? '').trim();
    const imageVariant = Math.max(0, Number(req.body?.image_variant ?? 0) || 0);
    if (query.length < 2) {
      return res.status(400).json({ error: 'query must have at least 2 characters' });
    }

    try {
      const result = await suggestProduct(cfg, admin, req.auth.companyId, query, { imageVariant });
      res.json(result);
    } catch (err) {
      res.status(503).json({ error: err instanceof Error ? err.message : 'Sugestão indisponível' });
    }
  });

  app.post('/v1/ai/validate-import', auth, async (req: AuthedRequest, res) => {
    if (!req.auth?.companyId) return res.status(503).json({ error: 'Service unavailable' });

    const { file_type, content, base64 } = req.body ?? {};
    const type = String(file_type ?? 'csv');

    try {
      let rows;
      if (type === 'csv' || type === 'txt') {
        rows = parseReportCsv(String(content ?? ''));
      } else if (type === 'xlsx' && base64) {
        rows = await parseExcelBuffer(Buffer.from(base64, 'base64'));
      } else if (type === 'pdf' && base64) {
        rows = await parsePdfBuffer(Buffer.from(base64, 'base64'));
      } else if (type === 'text' && content) {
        rows = await extractRowsWithOllama(cfg, String(content));
      } else {
        return res.status(400).json({ error: 'file_type + content/base64 required' });
      }

      const validation = await validateImportRows(cfg, rows, type);
      res.json({ ...validation, preview_rows: rows.slice(0, 10) });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Validação falhou' });
    }
  });
}
