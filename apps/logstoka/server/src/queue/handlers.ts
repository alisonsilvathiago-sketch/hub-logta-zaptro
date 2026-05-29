import type { LogstokaConfig } from '../config.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';
import { logstokaQueue } from '../queue/inMemoryQueue.js';
import {
  processNfeXmlImport,
  processOrderWebhook,
  processReportImport,
} from '../services/orderImportService.js';
import { persistMercadoLivreOAuth } from '../services/integrationStoreService.js';

export function registerQueueHandlers(cfg: LogstokaConfig) {
  logstokaQueue.register('webhook.inbound', async (job) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin) return;

    const payload = job.payload as Record<string, unknown>;
    const companyId = String(payload.companyId ?? '');
    const eventType = String(payload.eventType ?? 'unknown');
    const source = String(payload.source ?? 'api');
    const body = (payload.payload ?? {}) as Record<string, unknown>;

    const { data: eventRow } = await admin
      .from('ls_webhook_events')
      .insert({
        company_id: companyId,
        direction: 'inbound',
        event_type: eventType,
        source,
        payload: body,
        status: 'processing',
      })
      .select('id')
      .single();

    try {
      let result: unknown = null;
      if (source === 'orders' || eventType.startsWith('order.')) {
        result = await processOrderWebhook(admin, companyId, { ...body, event: eventType });
      }

      await admin
        .from('ls_webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', eventRow?.id);

      if (result) {
        await admin.from('ls_integration_logs').insert({
          company_id: companyId,
          direction: 'inbound',
          endpoint: `/webhooks/${source}`,
          request_payload: body,
          response_payload: result,
          status: 'success',
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'processing failed';
      await admin
        .from('ls_webhook_events')
        .update({ status: 'failed', error_message: message })
        .eq('id', eventRow?.id);
      throw err;
    }
  });

  logstokaQueue.register('import.process', async (job) => {
    const admin = getSupabaseAdmin(cfg);
    if (!admin) return;

    const { importId, companyId, userId, fileType, content, warehouseId } = job.payload as {
      importId: string;
      companyId: string;
      userId: string;
      fileType: string;
      content: string;
      warehouseId?: string;
    };

    try {
      if (fileType === 'xml') {
        await processNfeXmlImport(admin, {
          companyId,
          userId,
          warehouseId,
          xml: content,
          importId,
        });
      } else {
        await processReportImport(admin, {
          companyId,
          userId,
          warehouseId,
          content,
          fileType: 'csv',
          importId,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'import failed';
      await admin
        .from('ls_reports_imports')
        .update({ status: 'failed', error_message: message })
        .eq('id', importId);
      throw err;
    }
  });

  logstokaQueue.register('ocr.process', async (job) => {
    console.info('[logstoka-ocr] queued', job.payload);
  });

  logstokaQueue.register('integration.sync', async (job) => {
    console.info('[logstoka-integration] sync queued', job.payload);
  });

  logstokaQueue.register('integration.oauth', async (job) => {
    const payload = job.payload as {
      marketplace?: string;
      companyId?: string;
      tokens?: {
        access_token: string;
        refresh_token: string;
        user_id: number;
        seller_id: string;
      };
      user?: { nickname?: string };
    };

    if (payload.marketplace === 'mercadolivre' && payload.companyId && payload.tokens) {
      const admin = getSupabaseAdmin(cfg);
      if (admin) {
        await persistMercadoLivreOAuth(admin, payload.companyId, {
          access_token: payload.tokens.access_token,
          refresh_token: payload.tokens.refresh_token,
          user_id: payload.tokens.user_id,
          seller_id: payload.tokens.seller_id,
          nickname: payload.user?.nickname ?? 'Mercado Livre',
        });
      }
    }

    console.info('[logstoka-integration] oauth processed', {
      marketplace: payload.marketplace,
      companyId: payload.companyId,
    });
  });

  logstokaQueue.register('webhook.outbound', async (job) => {
    const { url, payload, secret } = job.payload as {
      url: string;
      payload: unknown;
      secret?: string;
    };
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-LogStoka-Signature': secret } : {}),
      },
      body: JSON.stringify(payload),
    });
  });
}
