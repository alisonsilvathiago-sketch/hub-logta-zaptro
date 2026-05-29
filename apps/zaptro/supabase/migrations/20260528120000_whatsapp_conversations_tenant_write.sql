-- Permite cadastro manual de clientes (drawer / CRM) pelo utilizador autenticado da empresa.

DROP POLICY IF EXISTS whatsapp_conversations_tenant_insert ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_tenant_insert
  ON public.whatsapp_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS whatsapp_conversations_tenant_update ON public.whatsapp_conversations;
CREATE POLICY whatsapp_conversations_tenant_update
  ON public.whatsapp_conversations
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id IS NOT NULL
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT p.company_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.company_id IS NOT NULL
    )
  );

GRANT INSERT, UPDATE ON public.whatsapp_conversations TO authenticated;

NOTIFY pgrst, 'reload schema';
