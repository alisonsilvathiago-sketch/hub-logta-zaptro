-- Evolution GO webhook hardening (mensagens + mídias + raw events)
-- Compatível com colunas já aplicadas pelo assistente Supabase; usa IF NOT EXISTS.

CREATE SCHEMA IF NOT EXISTS zapto;

-- Raw events (nunca descartar payload desconhecido)
CREATE TABLE IF NOT EXISTS zapto.evolution_events_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name text,
  event_type text NOT NULL DEFAULT 'unknown',
  event_hash text,
  processing_status text NOT NULL DEFAULT 'pending',
  error_message text,
  retry_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS evolution_events_raw_event_hash_uidx
  ON zapto.evolution_events_raw (event_hash)
  WHERE event_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS evolution_events_raw_status_retry_idx
  ON zapto.evolution_events_raw (processing_status, next_retry_at);

CREATE INDEX IF NOT EXISTS evolution_events_raw_instance_created_idx
  ON zapto.evolution_events_raw (instance_name, created_at DESC);

-- Mídias normalizadas por mensagem
CREATE TABLE IF NOT EXISTS zapto.whatsapp_message_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_external_id text NOT NULL,
  media_kind text NOT NULL,
  mime_type text,
  file_name text,
  file_ext text,
  file_size_bytes bigint,
  duration_seconds numeric,
  thumbnail_url text,
  source_url text,
  storage_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_message_media_external_id_idx
  ON zapto.whatsapp_message_media (message_external_id);

CREATE INDEX IF NOT EXISTS whatsapp_message_media_kind_idx
  ON zapto.whatsapp_message_media (media_kind);

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_message_media_external_kind_uidx
  ON zapto.whatsapp_message_media (message_external_id, media_kind);

-- Hardening em whatsapp_messages
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS instance_id uuid,
  ADD COLUMN IF NOT EXISTS message_type text,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_mime_type text,
  ADD COLUMN IF NOT EXISTS media_file_name text,
  ADD COLUMN IF NOT EXISTS media_file_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS media_duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS media_thumbnail_url text,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS sender_number text,
  ADD COLUMN IF NOT EXISTS remote_jid text,
  ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_id text,
  ADD COLUMN IF NOT EXISTS participant_jid text,
  ADD COLUMN IF NOT EXISTS participant_name text,
  ADD COLUMN IF NOT EXISTS quoted_message_id text,
  ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reaction text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb,
  ADD COLUMN IF NOT EXISTS quoted_message_payload jsonb,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS contact_vcard text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS message_id text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_name text;

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_messages_external_id_uidx
  ON public.whatsapp_messages (external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS whatsapp_messages_conversation_sent_idx
  ON public.whatsapp_messages (conversation_id, sent_at DESC NULLS LAST, created_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_messages_event_type_idx
  ON public.whatsapp_messages (event_type);

-- Storage privado para mídias baixadas do webhook
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('wa-link-media', 'wa-link-media', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

-- Service role escreve; authenticated lê via signed URL ou policy por company (fase 2)
DROP POLICY IF EXISTS wa_link_media_service_all ON storage.objects;
CREATE POLICY wa_link_media_service_all
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'wa-link-media')
  WITH CHECK (bucket_id = 'wa-link-media');

GRANT USAGE ON SCHEMA zapto TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA zapto TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA zapto TO service_role;

NOTIFY pgrst, 'reload schema';
