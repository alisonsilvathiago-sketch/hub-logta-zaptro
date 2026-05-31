import type { Request, Response, NextFunction } from 'express';
import type { LogstokaConfig } from '../config.js';
import { parseDemoBearer } from '../lib/demoAuth.js';
import { verifySupabaseJwt } from '../lib/supabaseAdmin.js';

export interface AuthedRequest extends Request {
  auth?: { userId: string; companyId?: string };
}

export function requireAuth(cfg: LogstokaConfig) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const demo = parseDemoBearer(req.headers.authorization);
    if (demo) {
      req.auth = demo;
      next();
      return;
    }

    const auth = await verifySupabaseJwt(cfg, req.headers.authorization);
    if (!auth) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.auth = auth;
    next();
  };
}

export function requireInternalSecret(cfg: LogstokaConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['x-logstoka-internal-secret'];
    if (secret !== cfg.internalSecret) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}
