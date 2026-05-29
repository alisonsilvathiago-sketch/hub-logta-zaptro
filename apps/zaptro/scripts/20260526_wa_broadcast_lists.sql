CREATE TABLE IF NOT EXISTS public.whatsapp_broadcast_lists (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_broadcast_lists_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_broadcast_list_contacts (
  list_id uuid NOT NULL,
  conversation_id uuid NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_broadcast_list_contacts_pkey PRIMARY KEY (list_id, conversation_id),
  CONSTRAINT whatsapp_broadcast_list_contacts_list_id_fkey FOREIGN KEY (list_id)
      REFERENCES public.whatsapp_broadcast_lists (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT whatsapp_broadcast_list_contacts_conversation_id_fkey FOREIGN KEY (conversation_id)
      REFERENCES public.whatsapp_conversations (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE
);

-- RLS
ALTER TABLE public.whatsapp_broadcast_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_broadcast_list_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS broadcast_lists_company_isolation ON public.whatsapp_broadcast_lists;
CREATE POLICY broadcast_lists_company_isolation
  ON public.whatsapp_broadcast_lists
  FOR ALL
  TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
  ));

DROP POLICY IF EXISTS broadcast_list_contacts_isolation ON public.whatsapp_broadcast_list_contacts;
CREATE POLICY broadcast_list_contacts_isolation
  ON public.whatsapp_broadcast_list_contacts
  FOR ALL
  TO authenticated
  USING (list_id IN (
    SELECT id FROM public.whatsapp_broadcast_lists WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid()
    )
  ));

NOTIFY pgrst, 'reload schema';
