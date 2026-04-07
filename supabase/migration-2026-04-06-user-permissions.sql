-- Permissões granulares por usuário (além de role e can_manage_users).
-- Rode no SQL Editor do Supabase após o schema base.

alter table public.users add column if not exists perm_create_managers boolean not null default false;
alter table public.users add column if not exists perm_create_sellers boolean not null default false;
alter table public.users add column if not exists perm_commission_tables boolean not null default false;
alter table public.users add column if not exists perm_contents boolean not null default false;
alter table public.users add column if not exists perm_view_contents boolean not null default true;

update public.users
set
  perm_create_managers = true,
  perm_create_sellers = true,
  perm_commission_tables = true,
  perm_contents = true,
  perm_view_contents = true
where role = 'MASTER';

-- Gestores com can_manage_users legado: permissões de convite
update public.users
set
  perm_create_managers = true,
  perm_create_sellers = true
where can_manage_users = true and role <> 'MASTER';

-- Líderes: manter acesso típico a tabelas e conteúdos (comportamento anterior do painel)
update public.users
set
  perm_commission_tables = true,
  perm_contents = true,
  perm_view_contents = true
where role = 'LIDER';

-- Vendedores: acesso de leitura a conteúdos
update public.users
set perm_view_contents = true
where role = 'VENDEDOR';
