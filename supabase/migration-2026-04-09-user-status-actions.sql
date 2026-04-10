alter table public.users
  add column if not exists status_reason text;

