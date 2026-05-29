import path from 'node:path';

export function loadConfig() {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const port = Number(process.env.PORT || 8787);
  const logDir = process.env.EMAIL_LOG_DIR || path.join(process.cwd(), 'logs');
  return {
    port,
    sendgridApiKey: sendgridKey || '',
    sendgridConfigured: Boolean(sendgridKey && sendgridKey.length > 10),
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@zaptro.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Zaptro',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    internalSecret: process.env.ZAPTRO_INTERNAL_EMAIL_SECRET || '',
    evolutionInstance: process.env.EVOLUTION_INSTANCE?.trim() || 'zaptro',
    waLinkDefaultCompanyId: process.env.WA_LINK_DEFAULT_COMPANY_ID?.trim() || null,
    evolutionWebhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET?.trim() || '',
    redisUrl: process.env.REDIS_URL || '',
    logDir,
    publicResetRpm: Number(process.env.ZAPTRO_PUBLIC_RESET_RPM || 20),
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY || '',
    googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    googleOAuthRedirectUri:
      process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:8787/v1/google/oauth/callback',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    googleSheetsSpreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
    googleSheetsRange: process.env.GOOGLE_SHEETS_RANGE || 'Agenda!A:I',
    zaptroAppUrl: process.env.ZAPTRO_APP_URL || 'http://localhost:5174',
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
