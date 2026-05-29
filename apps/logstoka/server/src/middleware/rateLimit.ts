import type { Request, Response, NextFunction } from 'express';
import type { LogstokaConfig } from '../config.js';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function globalRateLimit(cfg: LogstokaConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const limit = cfg.rateLimitPerMinute;

    const bucket = buckets.get(key) ?? { count: 0, resetAt: now + windowMs };
    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }
    bucket.count += 1;
    buckets.set(key, bucket);

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));

    if (bucket.count > limit) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }
    next();
  };
}
