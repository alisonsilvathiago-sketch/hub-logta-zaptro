-- Telefone do destinatário/cliente na carga (opcional) — usado pela automação WhatsApp para enviar link de rastreio público sem pedir documento.
ALTER TABLE public.whatsapp_shipments
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

COMMENT ON COLUMN public.whatsapp_shipments.customer_phone IS 'Telefone do cliente (E.164 ou dígitos) para casar com o remetente no WhatsApp no fluxo de rastreio.';
