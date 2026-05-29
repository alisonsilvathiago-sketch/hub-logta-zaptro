import type { Request, Response, NextFunction } from 'express';
import type { User } from '@supabase/supabase-js';
import type { AppConfig } from '../config.js';
import { fetchProfileForUser, verifySupabaseJwt, type ZaptroProfileRow } from '../auth/supabaseProfile.js';

export type AuthedRequest = Request & {
  zaptroUser?: User;
  zaptroProfile?: ZaptroProfileRow | null;
  zaptroAccessToken?: string;
};

function readBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  return token || null;
}

export function requireSupabaseAuth(cfg: AppConfig) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = readBearer(req);
    if (!token) {
      res.status(401).json({ error: 'missing_authorization' });
      return;
    }
    const { data, error } = await verifySupabaseJwt(cfg.supabaseUrl, cfg.supabaseAnonKey, token);
    if (error || !data.user) {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }
    const profile = await fetchProfileForUser(cfg.supabaseUrl, cfg.supabaseAnonKey, token);
    req.zaptroUser = data.user;
    req.zaptroProfile = profile;
    req.zaptroAccessToken = token;
    next();
  };
}
