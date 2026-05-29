-- Grant write permissions for service_role on WhatsApp tables
GRANT INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.whatsapp_messages TO service_role;
