-- Older deployments may have whatsapp_automation_flows from before `options` existed.
-- CREATE TABLE IF NOT EXISTS does not add missing columns; PostgREST then rejects writes.
ALTER TABLE public.whatsapp_automation_flows
  ADD COLUMN IF NOT EXISTS options JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.whatsapp_automation_flows.options IS 'Menu options / flow branches (JSON array).';
