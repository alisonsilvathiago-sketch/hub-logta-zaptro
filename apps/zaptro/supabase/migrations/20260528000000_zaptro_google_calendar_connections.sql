-- Ligação OAuth Google Calendar por utilizador (Agenda Zaptro)
CREATE TABLE IF NOT EXISTS public.zaptro_google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.whatsapp_companies(id) ON DELETE SET NULL,
  google_email text,
  access_token text NOT NULL,
  refresh_token text,
  token_expiry timestamptz,
  scopes text,
  status text NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_zaptro_google_cal_company ON public.zaptro_google_calendar_connections(company_id);

ALTER TABLE public.zaptro_google_calendar_connections ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.zaptro_google_calendar_connections IS 'Tokens OAuth Google Calendar por utilizador; escrita apenas via service role no servidor Zaptro.';
