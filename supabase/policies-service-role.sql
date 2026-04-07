-- Execute no SQL Editor se RLS bloquear inserts (erro 42501 em tenants).

drop policy if exists "service_role_full_access_tenants" on public.tenants;
create policy "service_role_full_access_tenants" on public.tenants
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access_users" on public.users;
create policy "service_role_full_access_users" on public.users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access_products" on public.products;
create policy "service_role_full_access_products" on public.products
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access_commission_tables" on public.commission_tables;
create policy "service_role_full_access_commission_tables" on public.commission_tables
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_full_access_contents" on public.contents;
create policy "service_role_full_access_contents" on public.contents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
