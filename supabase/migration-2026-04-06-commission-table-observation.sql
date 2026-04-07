-- Observação opcional na tabela de comissão

alter table public.commission_tables
add column if not exists observation text;
