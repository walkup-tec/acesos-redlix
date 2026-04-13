-- Adiciona observação nas tabelas de comissão (se não existir)
alter table public.commission_tables
add column if not exists observation text;

