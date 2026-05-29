export interface LogstokaConfig {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  internalSecret: string;
  redisUrl: string | null;
  rateLimitPerMinute: number;
}

export function loadConfig(): LogstokaConfig {
  const port = Number(process.env.PORT || 8788);
  const supabaseUrl = process.env.LOGSTOKA_SUPABASE_URL?.trim() || '';
  const supabaseServiceRoleKey = process.env.LOGSTOKA_SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const internalSecret = process.env.LOGSTOKA_INTERNAL_SECRET?.trim() || 'dev-internal-secret';
  const redisUrl = process.env.REDIS_URL?.trim() || null;
  const rateLimitPerMinute = Number(process.env.LOGSTOKA_API_RATE_LIMIT || 120);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[logstoka-api] Supabase service credentials missing — API will run in degraded mode.');
  }

  return {
    port,
    supabaseUrl,
    supabaseServiceRoleKey,
    internalSecret,
    redisUrl,
    rateLimitPerMinute,
  };
}
