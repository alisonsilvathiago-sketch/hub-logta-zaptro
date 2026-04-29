import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export class GoogleApiService {
  private auth: JWT;
  private calendar: any;
  private drive: any;

  constructor() {
    this.auth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.file'
      ],
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
  }

  /**
   * Calendário: Lista eventos
   */
  async listEvents(calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 15,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return response.data.items;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  /**
   * Calendário: Cria reunião com Meet
   */
  async createMeeting(details: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
  }) {
    try {
      const event = {
        summary: details.title,
        description: details.description,
        start: { dateTime: details.startTime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: details.endTime, timeZone: 'America/Sao_Paulo' },
        attendees: details.attendees?.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `logta-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Meet event:', error);
      throw error;
    }
  }

  /**
   * Drive: Lista documentos recentes (Google Docs)
   */
  async listRecentDocs() {
    try {
      const response = await this.drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, webViewLink, iconLink, modifiedTime)',
        q: "mimeType = 'application/vnd.google-apps.document'",
        orderBy: 'modifiedTime desc'
      });
      return response.data.files;
    } catch (error) {
      console.error('Error fetching Google Docs:', error);
      throw error;
    }
  }
}
