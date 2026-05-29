import type { Request, Response, NextFunction } from 'express';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

function clientKey(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.socket.remoteAddress;
  return ip ?? 'unknown';
}

/** Rate limit global leve — complementa limites por rota (ex.: password reset). */
export function globalRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - bucket.count)));
  next();
}
