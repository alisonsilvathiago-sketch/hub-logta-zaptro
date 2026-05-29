import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import type { AppConfig } from '../config.js';

export type MeetingSheetRow = {
  createdAt: string;
  summary: string;
  start: string;
  end: string;
  meetLink: string;
  location: string;
  attendees: string;
  googleEmail: string;
  actorName: string;
};

/** Relatório em planilha via conta de serviço (não OAuth do utilizador). */
export class GoogleSheetsReportService {
  private auth: JWT | null = null;

  constructor(private cfg: AppConfig) {
    if (cfg.googleClientEmail && cfg.googlePrivateKey) {
      this.auth = new JWT({
        email: cfg.googleClientEmail,
        key: cfg.googlePrivateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }
  }

  isConfigured(): boolean {
    return Boolean(this.auth && this.cfg.googleSheetsSpreadsheetId);
  }

  async appendMeetingRow(row: MeetingSheetRow): Promise<void> {
    if (!this.auth || !this.cfg.googleSheetsSpreadsheetId) return;

    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const range = this.cfg.googleSheetsRange || 'Agenda!A:H';

    await sheets.spreadsheets.values.append({
      spreadsheetId: this.cfg.googleSheetsSpreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            row.createdAt,
            row.summary,
            row.start,
            row.end,
            row.meetLink,
            row.location,
            row.attendees,
            row.googleEmail,
            row.actorName,
          ],
        ],
      },
    });
  }
}
