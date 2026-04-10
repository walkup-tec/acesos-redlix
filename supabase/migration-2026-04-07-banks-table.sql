create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_banks_tenant_id on public.banks(tenant_id);

alter table public.banks enable row level security;

drop policy if exists "service_role_full_access_banks" on public.banks;
create policy "service_role_full_access_banks" on public.banks
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
