-- Criar a empresa padrão de testes para o Edge Function não falhar
INSERT INTO public.companies (id, name, created_at, updated_at) 
VALUES ('b1111111-1111-4111-8111-111111111111', 'Empresa Teste Zaptro', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Permitir leitura anónima para não precisar de login no ambiente de testes
DROP POLICY IF EXISTS whatsapp_conversations_anon_select ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_anon_select
  ON public.whatsapp_conversations
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS whatsapp_messages_anon_select ON public.whatsapp_messages;
CREATE POLICY whatsapp_messages_anon_select
  ON public.whatsapp_messages
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.whatsapp_conversations TO anon;
GRANT SELECT ON public.whatsapp_messages TO anon;
NOTIFY pgrst, 'reload schema';
