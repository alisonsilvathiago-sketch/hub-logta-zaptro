-- Inbox wa-link: colunas do webhook Evolution + leitura autenticada
-- Rode no SQL Editor do projeto rrjnkmgkhbtapumgmhhr (uma vez).

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS connection_id text,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_customer_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS attendance_status text,
  ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS content text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS from_number text,
  ADD COLUMN IF NOT EXISTS to_number text,
  ADD COLUMN IF NOT EXISTS external_id text;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_conversations_authenticated_select ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_authenticated_select
  ON public.whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS whatsapp_messages_authenticated_select ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_authenticated_select
  ON public.whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.whatsapp_conversations TO authenticated;
GRANT SELECT ON public.whatsapp_messages TO authenticated;

NOTIFY pgrst, 'reload schema';
