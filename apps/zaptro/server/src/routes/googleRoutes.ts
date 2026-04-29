import type { Express } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config.js';
import { GoogleIntegrationService } from '../services/googleService.js';

const meetingSchema = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

const folderSchema = z.object({
  companyName: z.string().min(1),
});

export function registerGoogleRoutes(app: Express, cfg: AppConfig) {
  const googleService = new GoogleIntegrationService(cfg.supabaseUrl, cfg.supabaseAnonKey);

  // Internal route to create a meeting
  app.post('/v1/google/create-meeting', async (req, res) => {
    const secret = req.headers['x-zaptro-internal-secret'];
    if (!cfg.internalSecret || secret !== cfg.internalSecret) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const parsed = meetingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    try {
      const result = await googleService.createMeeting(
        parsed.data.summary,
        parsed.data.description || '',
        parsed.data.startTime,
        parsed.data.endTime
      );
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'google_api_failed', message: err.message });
    }
  });

  // Internal route to create a company folder
  app.post('/v1/google/create-folder', async (req, res) => {
    const secret = req.headers['x-zaptro-internal-secret'];
    if (!cfg.internalSecret || secret !== cfg.internalSecret) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const parsed = folderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    try {
      const result = await googleService.createCompanyFolder(parsed.data.companyName);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'google_api_failed', message: err.message });
    }
  });
}
