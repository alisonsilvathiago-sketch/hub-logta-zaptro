-- Tabela de Conversas e Mensagens
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Pode ser nulo para grupos
  room_id TEXT, -- Para grupos ou departamentos (ex: 'RH', 'LOGISTICA')
  content TEXT,
  attachment_url TEXT,
  file_type TEXT, -- 'image', 'document'
  is_read BOOLEAN DEFAULT false,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- RLS: Segurança por Nível
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. Colaboradores: Podem ver mensagens onde são remetentes ou destinatários
CREATE POLICY "Users can see their own messages" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- 2. Admins da Empresa: Podem ver todas as mensagens da sua empresa
CREATE POLICY "Admins can see all company messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'ADMIN' 
      AND profiles.company_id = public.chat_messages.company_id
    )
  );

-- 3. Master Admin: Pode ver TUDO
CREATE POLICY "Master Admins can see everything" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'MASTER_ADMIN'
    )
  );

-- Política de Inserção
CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Política de Update (Marcar como lido)
CREATE POLICY "Receivers can mark as read" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = receiver_id);
