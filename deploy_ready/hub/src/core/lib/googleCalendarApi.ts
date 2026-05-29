const API_URL = import.meta.env.VITE_ZAPTRO_MAIL_API_URL || 'http://localhost:8787';

export const googleCalendarApi = {
  /**
   * Busca eventos do Google Calendar via Backend
   */
  async getEvents(calendarId: string = 'primary') {
    try {
      const response = await fetch(`${API_URL}/v1/calendar/events?calendarId=${calendarId}`);
      if (!response.ok) throw new Error('Failed to fetch Google events');
      return await response.json();
    } catch (error) {
      console.error('Google Calendar API Error:', error);
      throw error;
    }
  },

  /**
   * Cria uma reunião com Google Meet via Backend
   */
  async createMeetMeeting(details: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    attendees?: string[];
  }) {
    try {
      const response = await fetch(`${API_URL}/v1/calendar/meet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create Google Meet');
      }

      return await response.json();
    } catch (error) {
      console.error('Google Meet Creation Error:', error);
      throw error;
    }
  },

  /**
   * Busca documentos recentes do Google Docs via Backend
   */
  async getRecentDocs() {
    try {
      const response = await fetch(`${API_URL}/v1/calendar/docs`);
      if (!response.ok) throw new Error('Failed to fetch Google Docs');
      return await response.json();
    } catch (error) {
      console.error('Google Docs API Error:', error);
      throw error;
    }
  }
};
