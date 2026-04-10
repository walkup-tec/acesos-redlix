alter table if exists public.contents
  add column if not exists display_name text;
