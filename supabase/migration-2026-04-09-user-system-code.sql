alter table public.users
  add column if not exists system_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_tenant_id_system_code_key'
  ) then
    alter table public.users
      add constraint users_tenant_id_system_code_key unique (tenant_id, system_code);
  end if;
end $$;

