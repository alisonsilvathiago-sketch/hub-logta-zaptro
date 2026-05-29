-- Estado da ligação WhatsApp por utilizador (Evolution GO via Edge Function).
-- Executado no projeto Supabase rrjnkmgkhbtapumgmhhr.

create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  instance_name text not null,
  phone text,
  status text not null default 'disconnected',
  connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, instance_name)
);

create index if not exists whatsapp_connections_user_id_idx
  on public.whatsapp_connections (user_id);

create index if not exists whatsapp_connections_instance_name_idx
  on public.whatsapp_connections (instance_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_whatsapp_connections_updated_at on public.whatsapp_connections;
create trigger trg_whatsapp_connections_updated_at
before update on public.whatsapp_connections
for each row
execute function public.set_updated_at();

alter table public.whatsapp_connections enable row level security;

grant select, insert, update, delete on public.whatsapp_connections to authenticated;
grant all on public.whatsapp_connections to service_role;
