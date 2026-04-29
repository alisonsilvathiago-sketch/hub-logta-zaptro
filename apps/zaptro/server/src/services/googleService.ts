import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

export class GoogleIntegrationService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetches the service account key from master_settings
   */
  private async getAuth() {
    const { data, error } = await this.supabase
      .from('master_settings')
      .select('value')
      .eq('key', 'GOOGLE_SERVICE_ACCOUNT_KEY')
      .maybeSingle();

    if (error || !data?.value) {
      throw new Error('Google Service Account Key not found in master_settings');
    }

    const key = data.value;
    
    return new google.auth.JWT(
      key.client_email,
      undefined,
      key.private_key,
      [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/meetings.space.created'
      ]
    );
  }

  /**
   * Creates a Google Meet link by creating a calendar event
   */
  async createMeeting(summary: string, description: string, startTime: string, endTime: string) {
    const auth = await this.getAuth();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary,
      description,
      start: { dateTime: startTime, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: endTime, timeZone: 'America/Sao_Paulo' },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      },
      attendees: [],
    };

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
    });

    return {
      id: res.data.id,
      htmlLink: res.data.htmlLink,
      meetLink: res.data.conferenceData?.entryPoints?.[0]?.uri || null,
    };
  }

  /**
   * Creates a folder in Google Drive for a specific company
   */
  async createCompanyFolder(companyName: string) {
    const auth = await this.getAuth();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: `HUB_${companyName}`,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, webViewLink',
    });

    return res.data;
  }
}
