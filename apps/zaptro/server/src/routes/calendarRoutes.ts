import { Express, Request, Response } from 'express';
import { GoogleApiService } from '../services/GoogleApiService.js';
import { AppConfig } from '../config.js';

export function registerCalendarRoutes(app: Express, cfg: AppConfig) {
  const googleService = new GoogleApiService();

  /**
   * GET /v1/calendar/events
   * Lista eventos do calendário compartilhado
   */
  app.get('/v1/calendar/events', async (req: Request, res: Response) => {
    try {
      const calendarId = req.query.calendarId as string || 'primary';
      const events = await googleService.listEvents(calendarId);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
    }
  });

  /**
   * POST /v1/calendar/meet
   * Cria uma reunião com link do Google Meet
   */
  app.post('/v1/calendar/meet', async (req: Request, res: Response) => {
    try {
      const { title, description, startTime, endTime, attendees } = req.body;
      
      if (!title || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required fields: title, startTime, endTime' });
      }

      const event = await googleService.createMeeting({
        title,
        description,
        startTime,
        endTime,
        attendees
      });

      res.status(201).json({
        message: 'Meeting created successfully',
        meetLink: event.hangoutLink,
        googleEventId: event.id,
        summary: event.summary
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create Google Meet meeting', details: error.message });
    }
  });

  /**
   * GET /v1/calendar/docs
   * Lista documentos recentes do Google Docs
   */
  app.get('/v1/calendar/docs', async (_req: Request, res: Response) => {
    try {
      const docs = await googleService.listRecentDocs();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch Google Docs', details: error.message });
    }
  });
}
