-- Fila de atendimento WhatsApp (wa-link / conversas)
-- Rode no SQL Editor do Supabase se claim/transfer falhar por coluna inexistente.

ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS crm_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX IF NOT EXISTS whatsapp_conversations_assigned_to_idx
  ON public.whatsapp_conversations (assigned_to);

CREATE INDEX IF NOT EXISTS whatsapp_conversations_attendance_status_idx
  ON public.whatsapp_conversations (attendance_status);

NOTIFY pgrst, 'reload schema';
