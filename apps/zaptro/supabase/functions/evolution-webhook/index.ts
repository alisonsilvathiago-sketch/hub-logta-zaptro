/**
 * Webhook público Evolution GO → whatsapp_conversations / whatsapp_messages / zapto.*
 * Modo compatível: raw events sempre persistidos; mensagens normalizadas com idempotência.
 */
import { createClient } from 'npm:@supabase/supabase-js@2.49.8';
import { runWaAutoReply } from '../_shared/zaptroWaAutoReply.ts';
import { collectWebhookMessages } from '../_shared/evolutionGoParser.ts';
import { processWebhookPayload } from '../_shared/evolutionWebhookPersist.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-zaptro-webhook-secret, x-webhook-secret',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function serviceSupabase() {
  const url = Deno.env.get('SUPABASE_URL')?.trim();
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

function isWebhookPost(req: Request, path: string): boolean {
  if (req.method !== 'POST') return false;
  return (
    path.endsWith('/webhook') ||
    path.endsWith('/evolution-webhook') ||
    path.endsWith('/evolution-webhook/webhook')
  );
}

function isHealthGet(req: Request, path: string): boolean {
  if (req.method !== 'GET') return false;
  return path.endsWith('/health') || path.endsWith('/evolution-webhook/health');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const path = new URL(req.url).pathname;
    const defaultInstance = Deno.env.get('EVOLUTION_INSTANCE')?.trim() || 'zaptro';

    if (isHealthGet(req, path)) {
      return json({
        ok: true,
        service: 'evolution-webhook',
        version: '2-media',
        verifyJwtExpected: false,
        ts: new Date().toISOString(),
      });
    }

    if (req.method === 'GET' && !isHealthGet(req, path)) {
      return json({
        ok: true,
        service: 'evolution-webhook',
        hint: 'Use POST com payload Evolution GO. GET /health para diagnóstico.',
        path,
      });
    }

    if (!isWebhookPost(req, path)) {
      return json({ ok: false, error: 'Route not found', path }, 404);
    }

    const expectedSecret = Deno.env.get('EVOLUTION_WEBHOOK_SECRET')?.trim();
    if (expectedSecret) {
      const got =
        req.headers.get('x-zaptro-webhook-secret') ??
        req.headers.get('x-webhook-secret') ??
        '';
      if (got !== expectedSecret) {
        return json({ ok: false, error: 'Invalid secret', path }, 401);
      }
    }

    const body = await req.json();
    const parsed = collectWebhookMessages(body, defaultInstance);
    const db = serviceSupabase();

    const { processed, skipped, errors, autoReplyJobs } = await processWebhookPayload(db, parsed);

    let aiQueued = 0;
    for (const job of autoReplyJobs) {
      aiQueued += 1;
      const work = runWaAutoReply({
        db,
        companyId: job.companyId,
        conversationId: job.conversationId,
        phone: job.phone,
        instanceName: job.instanceName,
        pushName: job.pushName,
      }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        console.error(JSON.stringify({ service: 'evolution-webhook', step: 'auto_reply', error: message }));
      });

      const edge = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime;
      if (edge?.waitUntil) edge.waitUntil(work);
      else void work;
    }

    return json({
      ok: true,
      processed,
      skipped,
      aiQueued: aiQueued || undefined,
      event: parsed.eventType,
      messageCount: parsed.messages.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ service: 'evolution-webhook', level: 'error', error: message }));
    return json({ ok: false, error: message }, 500);
  }
});
