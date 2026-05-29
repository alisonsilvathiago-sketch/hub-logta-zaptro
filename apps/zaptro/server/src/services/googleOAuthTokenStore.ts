import { createClient } from '@supabase/supabase-js';

export type GoogleCalendarConnectionRow = {
  user_id: string;
  company_id: string | null;
  google_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expiry: string | null;
  scopes: string | null;
  status: string;
};

export class GoogleOAuthTokenStore {
  private sb;

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.sb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getByUserId(userId: string): Promise<GoogleCalendarConnectionRow | null> {
    const { data, error } = await this.sb
      .from('zaptro_google_calendar_connections')
      .select('user_id, company_id, google_email, access_token, refresh_token, token_expiry, scopes, status')
      .eq('user_id', userId)
      .eq('status', 'connected')
      .maybeSingle();
    if (error || !data) return null;
    return data as GoogleCalendarConnectionRow;
  }

  async upsertConnection(row: {
    userId: string;
    companyId: string | null;
    googleEmail: string | null;
    accessToken: string;
    refreshToken: string | null;
    tokenExpiry: Date | null;
    scopes: string;
  }): Promise<void> {
    const { error } = await this.sb.from('zaptro_google_calendar_connections').upsert(
      {
        user_id: row.userId,
        company_id: row.companyId,
        google_email: row.googleEmail,
        access_token: row.accessToken,
        refresh_token: row.refreshToken,
        token_expiry: row.tokenExpiry?.toISOString() ?? null,
        scopes: row.scopes,
        status: 'connected',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
    if (error) throw error;
  }

  async disconnect(userId: string): Promise<void> {
    const { error } = await this.sb
      .from('zaptro_google_calendar_connections')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  }
}
