export interface LogstokaConfig {
  port: number;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  internalSecret: string;
  redisUrl: string | null;
  rateLimitPerMinute: number;
  mercadolivreAppId: string;
  mercadolivreAppSecret: string;
}

export function loadConfig(): LogstokaConfig {
  const port = Number(process.env.PORT || 8788);
  const supabaseUrl = process.env.LOGSTOKA_SUPABASE_URL?.trim() || '';
  const supabaseServiceRoleKey = process.env.LOGSTOKA_SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
  const internalSecret = process.env.LOGSTOKA_INTERNAL_SECRET?.trim() || 'dev-internal-secret';
  const redisUrl = process.env.REDIS_URL?.trim() || null;
  const rateLimitPerMinute = Number(process.env.LOGSTOKA_API_RATE_LIMIT || 120);
  const mercadolivreAppId = process.env.MERCADOLIVRE_APP_ID?.trim() || process.env.LOGSTOKA_ML_APP_ID?.trim() || '';
  const mercadolivreAppSecret = process.env.MERCADOLIVRE_APP_SECRET?.trim() || process.env.LOGSTOKA_ML_APP_SECRET?.trim() || '';

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[logstoka-api] Supabase service credentials missing — API will run in degraded mode.');
  }

  if (!mercadolivreAppId || !mercadolivreAppSecret) {
    console.warn('[logstoka-api] Mercado Livre OAuth não configurado — defina MERCADOLIVRE_APP_ID e MERCADOLIVRE_APP_SECRET.');
  }

  return {
    port,
    supabaseUrl,
    supabaseServiceRoleKey,
    internalSecret,
    redisUrl,
    rateLimitPerMinute,
    mercadolivreAppId,
    mercadolivreAppSecret,
  };
}
