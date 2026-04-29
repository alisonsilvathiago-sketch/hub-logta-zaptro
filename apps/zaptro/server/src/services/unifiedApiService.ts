import type { Express, Request, Response } from 'express';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { unifiedApiAuth } from '../middleware/apiAuthMiddleware.js';
import { EventHub, SystemEvent } from './eventHub.js';

/**
 * UnifiedApiService: The "External Brain" of the Hub.
 * Manages the unified API surface and connects external requests to internal modules.
 */
export class UnifiedApiService {
  private supabase: SupabaseClient;
  private hub: EventHub;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.hub = EventHub.getInstance();
  }

  /**
   * Registers all unified API routes
   */
  registerRoutes(app: Express, supabaseUrl: string, supabaseKey: string) {
    const apiRouter = unifiedApiAuth(supabaseUrl, supabaseKey);

    // --- HUB MODULE ---
    app.post('/v1/api/hub/customers', apiRouter, async (req, res) => {
      await this.handleApiRequest(req, res, 'hub', async (body) => {
        // Logic to create customer in Hub
        return { ok: true, message: 'Customer created via Unified API' };
      });
    });

    // --- ZAPTRO MODULE ---
    app.post('/v1/api/zaptro/send-message', apiRouter, async (req, res) => {
      await this.handleApiRequest(req, res, 'zaptro', async (body) => {
        // Emit event for Zaptro module to pick up
        this.hub.emit(SystemEvent.BEHAVIOR_OBSERVED, {
          action: 'EXTERNAL_MESSAGE_SENT',
          actorId: (req as any).apiContext.companyId,
          metadata: body
        });
        return { ok: true, status: 'queued' };
      });
    });

    // --- LOGTA MODULE ---
    app.get('/v1/api/logta/tracking/:code', apiRouter, async (req, res) => {
      await this.handleApiRequest(req, res, 'logta', async () => {
        // Logic to fetch tracking from Logta
        return { ok: true, code: req.params.code, status: 'in_transit' };
      });
    });
  }

  /**
   * Helper to wrap API requests with logging and error handling
   */
  private async handleApiRequest(
    req: Request, 
    res: Response, 
    module: string, 
    handler: (body: any) => Promise<any>
  ) {
    const context = (req as any).apiContext;
    
    try {
      const result = await handler(req.body);
      
      // Log Success
      await this.logApiUsage(context, res.statusCode || 200, req);
      
      res.json(result);
    } catch (err: any) {
      console.error(`[UnifiedAPI][${module}] Request failed:`, err);
      
      // Log Failure
      await this.logApiUsage(context, err.status || 500, req);
      
      res.status(err.status || 500).json({ 
        error: 'api_request_failed', 
        message: err.message 
      });
    }
  }

  private async logApiUsage(context: any, status: number, req: Request) {
    if (!context) return;
    
    try {
      await this.supabase
        .from('unified_api_logs')
        .insert([{
          api_access_id: context.accessId,
          company_id: context.companyId,
          module: context.module,
          endpoint: req.path,
          method: req.method,
          status_code: status,
          response_time_ms: Date.now() - context.startTime,
          ip_address: req.ip
        }]);
    } catch (err) {
      console.error('[UnifiedAPI] Logging failed:', err);
    }
  }
}
