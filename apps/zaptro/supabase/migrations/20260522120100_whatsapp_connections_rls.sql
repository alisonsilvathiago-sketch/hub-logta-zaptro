-- RLS: cada utilizador só vê a própria linha em whatsapp_connections.

drop policy if exists whatsapp_connections_select_own on public.whatsapp_connections;
create policy whatsapp_connections_select_own
  on public.whatsapp_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists whatsapp_connections_insert_own on public.whatsapp_connections;
create policy whatsapp_connections_insert_own
  on public.whatsapp_connections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists whatsapp_connections_update_own on public.whatsapp_connections;
create policy whatsapp_connections_update_own
  on public.whatsapp_connections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists whatsapp_connections_delete_own on public.whatsapp_connections;
create policy whatsapp_connections_delete_own
  on public.whatsapp_connections
  for delete
  to authenticated
  using (auth.uid() = user_id);
