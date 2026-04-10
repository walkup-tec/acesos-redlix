create extension if not exists "pgcrypto";

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  system_code text,
  full_name text not null,
  email text not null,
  role text not null,
  status text not null,
  can_manage_users boolean not null default false,
  perm_view_contents boolean not null default true,
  perm_create_managers boolean not null default false,
  perm_create_sellers boolean not null default false,
  perm_commission_tables boolean not null default false,
  perm_contents boolean not null default false,
  password_hash text,
  cpf text,
  rg text,
  birth_date date,
  address text,
  father_name text,
  mother_name text,
  zip_code text,
  street text,
  neighborhood text,
  city text,
  state text,
  address_number text,
  address_complement text,
  identity_document_path text,
  identity_document_back_path text,
  address_proof_path text,
  verification_code text,
  first_access_verified_at timestamptz,
  reset_code text,
  status_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, email),
  unique (tenant_id, system_code)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.commission_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  bank text not null,
  name text not null,
  deadline text not null,
  commission_percent numeric(8,2) not null check (commission_percent > 0),
  observation text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  display_name text,
  type text not null,
  product_id uuid references public.products(id) on delete set null,
  file_path text not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_products_tenant_id on public.products(tenant_id);
create index if not exists idx_banks_tenant_id on public.banks(tenant_id);
create index if not exists idx_commission_tables_tenant_id on public.commission_tables(tenant_id);
create index if not exists idx_contents_tenant_id on public.contents(tenant_id);

alter table public.tenants enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.banks enable row level security;
alter table public.commission_tables enable row level security;
alter table public.contents enable row level security;

-- Acesso total via role `service_role` (chave usada no backend com SUPABASE_SERVICE_ROLE_KEY).
-- Sem policy, o PostgREST pode negar INSERT mesmo com JWT service_role (erro 42501).
-- `anon` continua sem policy = sem acesso às linhas.

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

drop policy if exists "service_role_full_access_banks" on public.banks;
create policy "service_role_full_access_banks" on public.banks
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

-- Frontend / usuários finais: adicionar policies para `authenticated` + tenant_id (próxima fase).
