-- Isolamento por empresa (tenant): utilizadores autenticados só veem a sua company_id.
-- Rode no SQL Editor do projeto Supabase (rrjnkmgkhbtapumgmhhr).

-- Remover leitura anónima aberta (dev antigo)
DROP POLICY IF EXISTS whatsapp_conversations_anon_select ON public.whatsapp_conversations;
DROP POLICY IF EXISTS whatsapp_messages_anon_select ON public.whatsapp_messages;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_conversations_tenant_select ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_tenant_select
  ON public.whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS whatsapp_messages_tenant_select ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_tenant_select
  ON public.whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT c.id FROM public.whatsapp_conversations c
      WHERE c.company_id IN (
        SELECT p.company_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.company_id IS NOT NULL
      )
    )
  );

GRANT SELECT ON public.whatsapp_conversations TO authenticated;
GRANT SELECT ON public.whatsapp_messages TO authenticated;

NOTIFY pgrst, 'reload schema';
